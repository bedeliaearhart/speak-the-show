// Smoke test: proves the Claude key works server-side and reports which keys exist.
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY || process.env.Molton_Hackathon_Claude_Key;
// User-scoped keys must name a workspace. The workspace ID is not a secret.
const WORKSPACE = process.env.ANTHROPIC_WORKSPACE_ID || 'wrkspc_016hBkfHDyJoWCTFBYPhAfup';
export default async function handler(req, res) {
  const out = {
    anthropicKey: Boolean(CLAUDE_KEY),
    arcgisKey: Boolean(process.env.ARCGIS_API_KEY || process.env.ARCGIS_CLIENT_ID),
    claude: 'skipped',
  };
  if (out.anthropicKey) {
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
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Reply with the word OK.' }],
        }),
      });
      const j = await r.json();
      out.claude = r.ok ? 'ok' : `error ${r.status}: ${j?.error?.message || ''}`;
    } catch (e) {
      out.claude = `error: ${e.message}`;
    }
  }
  res.status(200).json(out);
}
