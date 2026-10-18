// Reads phone photos of the room (one per wall plus the ceiling) and returns size estimates and site notes.
// Vision estimates are rough: the page labels them as estimates to confirm with a tape measure.
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY || process.env.Molton_Hackathon_Claude_Key;
const WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID || 'wrkspc_016hBkfHDyJoWCTFBYPhAfup';

const ROOM_TOOL = {
  name: 'room_survey',
  description: 'Return room size estimates and production notes from the photos.',
  input_schema: {
    type: 'object',
    properties: {
      widthM: { type: 'number', description: 'room width across the stage wall, meters' },
      frontDepthM: { type: 'number', description: 'distance from the stage spot to the back wall, meters' },
      backDepthM: { type: 'number', description: 'space behind the stage spot to the wall behind it, meters' },
      ceilingM: { type: 'number', description: 'ceiling height, meters' },
      exits: { type: 'array', items: { type: 'string' } },
      windows: { type: 'string', description: 'windows and how hard blackout will be' },
      obstacles: { type: 'array', items: { type: 'string' }, description: 'columns, low beams, sprinklers, outlets, doors' },
      fohSuggestion: { type: 'string', description: 'where the tech booth should go and why' },
      confidence: { type: 'string', description: 'low, medium or high, with the reason' },
    },
    required: ['widthM', 'frontDepthM', 'backDepthM', 'ceilingM', 'confidence'],
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  if (!CLAUDE_KEY) return res.status(200).json({ error: 'no key' });
  const shots = Array.isArray(req.body?.shots) ? req.body.shots.slice(0, 6) : [];
  if (!shots.length) return res.status(400).json({ error: 'no photos' });
  const content = [];
  for (const s of shots) {
    content.push({ type: 'text', text: `Photo: ${String(s.label).slice(0, 80)}` });
    content.push({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: String(s.data) } });
  }
  content.push({ type: 'text', text: 'The photos were taken standing on the planned stage spot (downstage center). Estimate the room for a small scrim-hologram stage. Use doors (about 2.1 m tall) and ceiling tiles (about 0.6 m) as scale references. Call room_survey once.' });
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
        max_tokens: 1000,
        tools: [ROOM_TOOL],
        tool_choice: { type: 'tool', name: 'room_survey' },
        messages: [{ role: 'user', content }],
      }),
    });
    const j = await r.json();
    if (!r.ok) return res.status(200).json({ error: j?.error?.message || `HTTP ${r.status}` });
    return res.status(200).json((j.content || []).find((c) => c.type === 'tool_use')?.input || { error: 'no survey' });
  } catch (e) {
    return res.status(200).json({ error: e.message });
  }
}
