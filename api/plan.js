// Turns a spoken show concept into stage parameters plus a short walkthrough.
import { knowledgeText } from '../knowledge.js';
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY || process.env.Molton_Hackathon_Claude_Key;
// User-scoped keys must name a workspace. The workspace ID is not a secret.
const WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID || 'wrkspc_016hBkfHDyJoWCTFBYPhAfup';
// The numbers (layout, checks, cables, budget) are computed in checks.js from the catalog,
// so Claude chooses quantities and explains, never prices or specs.
const SYSTEM = `You are an A2 and technical director helping plan a small indoor festival stage
with a scrim hologram effect (front projection onto a gauze, performers behind it, black backdrop).
Call the plan_show tool once. Its input follows this example:
{"params":{"decksWide":2,"decksDeep":2,"deckHeightM":0.61,"speakers":2,"washes":4,"scrim":true,"projector":true,"days":2,"operatorHours":8},
 "summary":"one sentence",
 "steps":[{"title":"Concept","text":"..."},{"title":"What you need","text":"..."},{"title":"Size and time","text":"..."},{"title":"Cables","text":"..."},{"title":"How it connects","text":"..."},{"title":"Cable paths","text":"..."},{"title":"Ingress and egress","text":"..."},{"title":"Queues","text":"..."},{"title":"Tech booth","text":"..."},{"title":"Software","text":"..."}],
 "software":{"pick":"one of: Resolume Arena, QLab, TouchDesigner, MadMapper, disguise Designer","why":"one sentence"}}
Rules: decksWide 1-4 (each deck 8 ft wide), decksDeep 1-3 (each 4 ft deep), deckHeightM 0.3-1.07,
speakers 0-4 (QSC K12.2 powered), washes 0-8 (Chauvet COLORado LED wash), days 1-7, operatorHours 0-24.
Each step text is at most two short sentences in plain production language. Never state prices or specs.
Apply these event design principles to the room and crowd you are given:
` + knowledgeText();


// Forced tool output: the API validates the shape, so stray quotes in the prose cannot break parsing.
const PLAN_TOOL = {
  name: 'plan_show',
  description: 'Return the stage quantities and the walkthrough for this show.',
  input_schema: {
    type: 'object',
    properties: {
      params: {
        type: 'object',
        properties: {
          decksWide: { type: 'integer' }, decksDeep: { type: 'integer' }, deckHeightM: { type: 'number' },
          speakers: { type: 'integer' }, washes: { type: 'integer' }, scrim: { type: 'boolean' }, projector: { type: 'boolean' },
          days: { type: 'integer' }, operatorHours: { type: 'integer' },
        },
      },
      summary: { type: 'string' },
      steps: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, text: { type: 'string' } }, required: ['title', 'text'] } },
      software: { type: 'object', properties: { pick: { type: 'string' }, why: { type: 'string' } } },
    },
    required: ['params', 'summary', 'steps'],
  },
};

const clamp = (v, lo, hi, d) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : d);

export function cleanParams(raw = {}) {
  return {
    decksWide: Math.round(clamp(raw.decksWide, 1, 4, 2)),
    decksDeep: Math.round(clamp(raw.decksDeep, 1, 3, 2)),
    deckHeightM: clamp(raw.deckHeightM, 0.3, 1.07, 0.61),
    speakers: Math.round(clamp(raw.speakers, 0, 4, 2)),
    washes: Math.round(clamp(raw.washes, 0, 8, 4)),
    scrim: raw.scrim !== false,
    projector: raw.projector !== false,
    days: Math.round(clamp(raw.days, 1, 7, 2)),
    operatorHours: Math.round(clamp(raw.operatorHours, 0, 24, 8)),
  };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const text = String(req.body?.text || '').slice(0, 2000);
  const roomInfo = req.body?.room ? `\nRoom: ${JSON.stringify(req.body.room).slice(0, 500)}` : '';
  if (!CLAUDE_KEY) return res.status(200).json({ fallback: true, reason: 'no key', params: cleanParams({}) });
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_KEY,
        ...(WORKSPACE ? { 'anthropic-workspace-id': WORKSPACE } : {}),
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.CLAUDE_MODEL || 'claude-haiku-5-5',
        max_tokens: 1600,
        system: SYSTEM,
        tools: [PLAN_TOOL],
        tool_choice: { type: 'tool', name: 'plan_show' },
        messages: [{ role: 'user', content: (text || 'A small festival stage with a scrim hologram effect.') + roomInfo }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(200).json({ fallback: true, reason: j?.error?.message || `HTTP ${r.status}`, params: cleanParams({}) });
    const parsed = (j.content || []).find((c) => c.type === 'tool_use')?.input || {};
    return res.status(200).json({
      params: cleanParams(parsed.params),
      summary: String(parsed.summary || ''),
      steps: Array.isArray(parsed.steps) ? parsed.steps.slice(0, 12).map((s) => ({ title: String(s.title || ''), text: String(s.text || '') })) : [],
      software: parsed.software || null,
    });
  } catch (e) {
    return res.status(200).json({ fallback: true, reason: e.message, params: cleanParams({}) });
  }
}
