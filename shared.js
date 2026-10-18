// Shared anchor store: one locked design per space, readable by everyone, lockable only with the admin PIN.
// The publishable key is a client key by design; row security keeps the PIN table unreadable.
export const SUPABASE_URL = 'https://ohautgmwyakhonqxjktr.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_s6k6p_AhcTZcRoVzTTeh0w_0uN0-OGi';
export const SPACE_ID = 'xtribe-floor2';
const H = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'content-type': 'application/json' };

export async function readLock(id = SPACE_ID) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/anchors?id=eq.${encodeURIComponent(id)}&select=*`, { headers: H });
  const rows = await r.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function lockLayout({ pin, by, layout, id = SPACE_ID }) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/lock_layout`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ p_id: id, p_pin: pin, p_by: by, p_layout: layout }),
  });
  return r.json();
}
