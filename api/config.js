// Hands the browser a short-lived ArcGIS token at runtime.
// Path 1: an API key (ARCGIS_API_KEY). Path 2: OAuth app credentials, exchanged here on the server
// (client_credentials), so the client secret never reaches the page. The Claude key never leaves the server.
let cached = { token: null, expires: 0 };

async function oauthToken() {
  const id = process.env.ARCGIS_CLIENT_ID;
  const secret = process.env.ARCGIS_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (cached.token && Date.now() < cached.expires - 60_000) return cached.token;
  const portal = process.env.ARCGIS_PORTAL || 'https://mthld.maps.arcgis.com';
  const r = await fetch(`${portal}/sharing/rest/oauth2/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: id, client_secret: secret, grant_type: 'client_credentials', expiration: '120', f: 'json' }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error(j.error?.message || 'ArcGIS token refused');
  cached = { token: j.access_token, expires: Date.now() + (j.expires_in || 7200) * 1000 };
  return cached.token;
}

export default async function handler(req, res) {
  res.setHeader('cache-control', 'no-store');
  try {
    const key = process.env.ARCGIS_API_KEY || (await oauthToken());
    res.status(200).json({ arcgisKey: key || null });
  } catch (e) {
    res.status(200).json({ arcgisKey: null, error: e.message });
  }
}
