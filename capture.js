// Guided room capture: prompts for one photo per wall plus the ceiling, shrinks each on the phone,
// sends them to /api/room, fills the room fields and re-plans.
const SHOTS = [
  'Stand on your tape X. Photo the wall behind where the stage goes.',
  'Turn around. Photo the back wall, where the audience ends.',
  'Photo the left wall, including any doors.',
  'Photo the right wall, including any windows.',
  'Tilt up. Photo the ceiling above the stage spot.',
];
const $ = (id) => document.getElementById(id);
let taken = [];

function shrink(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1024 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.7).split(',')[1]);
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function prompt() {
  const n = taken.length;
  $('capStep').textContent = n < SHOTS.length ? `Shot ${n + 1} of ${SHOTS.length}: ${SHOTS[n]}` : 'All shots taken.';
  $('capShoot').hidden = n >= SHOTS.length;
  $('capSend').hidden = n === 0;
}

$('capStart').onclick = () => { taken = []; $('capture').hidden = false; $('capOut').textContent = ''; prompt(); };
$('capShoot').onclick = () => $('capFile').click();
$('capFile').onchange = async (e) => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  taken.push({ label: SHOTS[taken.length], data: await shrink(f) });
  prompt();
};
$('capSend').onclick = async () => {
  $('capOut').textContent = 'Reading the room...';
  let j;
  try {
    j = await (await fetch('/api/room', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ shots: taken }) })).json();
  } catch (err) { j = { error: err.message }; }
  if (j.error) { $('capOut').textContent = 'Room read failed: ' + j.error; return; }
  for (const k of ['widthM', 'frontDepthM', 'backDepthM', 'ceilingM']) if (Number.isFinite(j[k]) && j[k] > 0) $(k).value = Math.round(j[k] * 10) / 10;
  const lines = [
    `Estimate (${j.confidence || 'unknown confidence'}): ${j.widthM} m wide, ${j.frontDepthM} m to the back wall, ${j.backDepthM} m behind the stage spot, ${j.ceilingM} m ceiling. Confirm with a tape.`,
    j.exits?.length ? `Exits: ${j.exits.join('; ')}` : '',
    j.windows ? `Windows and blackout: ${j.windows}` : '',
    j.obstacles?.length ? `Obstacles: ${j.obstacles.join('; ')}` : '',
    j.fohSuggestion ? `Tech booth: ${j.fohSuggestion}` : '',
  ].filter(Boolean);
  $('capOut').innerHTML = lines.map((l) => `<div>${l.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]))}</div>`).join('');
  window.planShow($('concept').value);
};
