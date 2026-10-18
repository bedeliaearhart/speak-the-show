import { buildShow, runChecks, cables, budget } from './checks.js';
import { CATALOG, SOFTWARE } from './catalog.js';
import { SITE } from './site.js';
import { toGlbUrl } from './ar.js';
import { initMap, drawShow } from './map.js';

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = (n) => (n === null ? 'quote' : '$' + Math.round(n).toLocaleString('en-US'));

$('address').textContent = `${SITE.site.name}, ${SITE.site.address} · ${SITE.building.name} · ${SITE.floor.name} · ${SITE.space.name} · ${SITE.spike.name}`;

let mapReady = initMap($('map'), $('mapStatus')).then(() => true).catch((e) => { $('mapStatus').textContent = 'Map: ' + e.message; return null; });

function room() {
  const out = {};
  for (const id of ['widthM', 'frontDepthM', 'ceilingM', 'floorElevationM']) {
    const v = parseFloat($(id).value);
    if (Number.isFinite(v) && v > 0) out[id] = v;
  }
  return out;
}

function renderChecks(show) {
  $('checks').innerHTML = show.checks.map((c) =>
    `<div class="check"><span class="dot ${c.status}"></span><div><b>${esc(c.name)}</b><br><span class="sub">${esc(c.reason)}</span></div></div>`).join('');
}

function renderBudget(show) {
  const b = show.budget;
  $('total').textContent = `${money(b.low)} to ${money(b.high)} priced, plus ${b.quoteOnly} quote-only line(s)`;
  $('budget').innerHTML = '<tr><th>Item</th><th>Qty</th><th>Low</th><th>High</th><th>Basis</th><th>Source</th></tr>' +
    b.lines.map((l) => `<tr><td>${esc(l.item)}</td><td>${l.qty}</td><td>${money(l.low)}</td><td>${money(l.high)}</td><td>${esc(l.note)}</td><td class="sub">${esc(l.source)}</td></tr>`).join('');
}

function renderCables(show) {
  $('cables').innerHTML = '<tr><th>From</th><th>To</th><th>Type</th><th>Length</th></tr>' +
    show.cables.map((c) => `<tr><td>${esc(c.from)}</td><td>${esc(c.to)}</td><td>${esc(c.type)}</td><td>${c.ft ? c.ft + ' ft' : ''}</td></tr>`).join('');
}

function renderFlow(show) {
  const n = (id) => show.items.filter((i) => i.id === id).length;
  const box = (x, y, w, t, c = '#2a2d36') => `<rect x="${x}" y="${y}" width="${w}" height="34" rx="6" fill="${c}"/><text x="${x + 8}" y="${y + 21}">${esc(t)}</text>`;
  const arrow = (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#00e5ff" stroke-width="2" marker-end="url(#a)"/>`;
  $('flow').innerHTML = `<svg viewBox="0 0 520 230" width="100%" style="min-width:420px">
    <defs><marker id="a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0L10,5L0,10z" fill="#00e5ff"/></marker></defs>
    ${box(10, 20, 150, 'Media server laptop')}${box(200, 20, 120, 'Projector')}${box(360, 20, 150, 'Scrim (hologram)', '#0b4f57')}
    ${arrow(160, 37, 198, 37)}${arrow(320, 37, 358, 37)}
    ${box(10, 95, 150, 'Mixer / audio out')}${box(200, 95, 150, `${n('speaker')} x K12.2 speakers`)}
    ${arrow(160, 112, 198, 112)}
    ${box(10, 170, 150, 'DMX interface')}${box(200, 170, 150, `${n('wash')} x LED washes`)}
    ${arrow(160, 187, 198, 187)}
    <text x="360" y="117" class="sub">XLR, line level</text><text x="360" y="192">5-pin DMX chain</text>
    <text x="200" y="12">HDMI / SDI</text></svg>`;
}

function renderPlan2d(show) {
  const s = 26; // px per meter
  const xs = show.items.map((i) => [i.x - i.w / 2, i.x + i.w / 2]).flat();
  const ys = show.items.map((i) => [i.y - i.d / 2, i.y + i.d / 2]).flat();
  const minX = Math.min(...xs) - 1, maxX = Math.max(...xs) + 1, minY = Math.min(...ys) - 1, maxY = Math.max(...ys) + 1;
  const W = (maxX - minX) * s, H = (maxY - minY) * s;
  const px = (x) => (x - minX) * s, py = (y) => (maxY - y) * s;
  const col = { deck: '#444', truss: '#bbb', scrim: '#fff', backdrop: '#111', projector: '#2266ff', foh: '#664422', speaker: '#222', wash: '#ff8800' };
  planGeom = { s, minX, maxY };
  const rects = show.items.map((i, n) => `<rect data-i="${n}" class="${MOVABLE.has(i.id) ? 'movable' : ''}" x="${px(i.x - i.w / 2)}" y="${py(i.y + i.d / 2)}" width="${Math.max(2, i.w * s)}" height="${Math.max(2, i.d * s)}" fill="${col[i.id] || '#888'}" stroke="#555"><title>${esc(i.label)} · z ${i.z} m · top ${Math.round((i.z + i.h) * 100) / 100} m</title></rect>`).join('');
  const proj = show.items.find((i) => i.id === 'projector');
  const beam = proj ? `<polygon points="${px(proj.x)},${py(proj.y)} ${px(-show.imageW / 2)},${py(0.3)} ${px(show.imageW / 2)},${py(0.3)}" fill="#88ccff" opacity="0.15"/>` : '';
  $('plan2d').innerHTML = `<svg viewBox="0 0 ${W} ${H + 20}" width="100%" style="min-width:300px;max-height:420px">
    ${beam}${rects}<circle cx="${px(0)}" cy="${py(0)}" r="5" fill="#ff0033"/>
    <text x="${px(0) + 8}" y="${py(0) + 4}">spike</text>
    <text x="4" y="${H + 14}">Stage ${show.W.toFixed(2)} m x ${show.D.toFixed(2)} m · image ${show.imageW} x ${show.imageH} m · projector ${show.throwLo} m from spike · audience is down</text></svg>`;
}

// Touch gesture: drag speakers, washes, the projector or FOH on the plan; everything recomputes live.
const MOVABLE = new Set(['speaker', 'wash', 'projector', 'foh']);
let planGeom = null;
let current = null;
function refresh(show) {
  show.checks = runChecks(show); show.cables = cables(show); show.budget = budget(show);
  renderChecks(show); renderBudget(show); renderCables(show); renderPlan2d(show);
}
let drag = null;
$('plan2d').addEventListener('pointerdown', (e) => {
  const r = e.target.closest('rect.movable');
  if (!r || !current) return;
  const it = current.items[+r.dataset.i];
  // Move the item's stand with it.
  const twins = current.items.filter((o) => o !== it && o.id === 'stand' && o.x === it.x && o.y === it.y);
  const svg = $('plan2d').querySelector('svg');
  drag = { it, twins, k: svg.viewBox.baseVal.width / svg.getBoundingClientRect().width, box: svg.getBoundingClientRect(), g: { ...planGeom } };
  e.preventDefault();
});
window.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const x = (e.clientX - drag.box.left) * drag.k / drag.g.s + drag.g.minX;
  const y = drag.g.maxY - (e.clientY - drag.box.top) * drag.k / drag.g.s;
  for (const o of [drag.it, ...drag.twins]) { o.x = Math.round(x * 100) / 100; o.y = Math.round(y * 100) / 100; }
  refresh(current);
});
window.addEventListener('pointerup', async () => {
  if (!drag) return;
  drag = null;
  const oldSrc = $('mv').src;
  $('mv').src = await toGlbUrl(current);
  if (oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
  renderHotspots(current);
  mapReady.then((ok) => ok && drawShow(current));
  $('status').textContent = 'Moved. Checks, cables, budget and the 3D model updated.';
});

function renderSoftware(pick) {
  $('software').innerHTML = '<table>' + SOFTWARE.map((s) =>
    `<tr><td>${pick && pick.pick === s.name ? '<b>' + esc(s.name) + ' (suggested)</b>' : esc(s.name)}</td><td class="sub">${esc(s.use)}</td></tr>`).join('') +
    '</table>' + (pick?.why ? `<p class="sub">${esc(pick.why)}</p>` : '') + '<p class="sub">License prices are not in the catalog yet.</p>';
}


// Spec labels on the 3D model: one per gear type, toggled by the Specs button.
let specsOn = false;
const SHORT = { deck: 'Deck 4x8', truss: 'Truss F34', scrim: 'Scrim', backdrop: 'Black drape', projector: 'Epson L1505U', foh: 'FOH table', speaker: 'QSC K12.2', wash: 'LED wash' };
$('specs').textContent = 'Specs: off';
$('mv').style.background = 'radial-gradient(circle at 50% 40%, #4a4f5a, #15171c)';
function renderHotspots(show) {
  const mv = $('mv');
  mv.querySelectorAll('.hotspot').forEach((h) => h.remove());
  const seen = new Set();
  for (const it of show.items) {
    if (seen.has(it.id) || !CATALOG[it.id]) continue;
    seen.add(it.id);
    const c = CATALOG[it.id];
    const count = show.items.filter((i) => i.id === it.id).length;
    const size = `${it.w.toFixed(2)} x ${it.d.toFixed(2)} x ${it.h.toFixed(2)} m`;
    const bits = [`${count} x ${SHORT[it.id] || c.name}`, `${size}${c.kg ? ' · ' + c.kg + ' kg' : ''}${c.watts ? ' · ' + c.watts + ' W' : ''}`];
    const b = document.createElement('button');
    b.className = 'hotspot';
    b.slot = `hotspot-${it.id}`;
    b.dataset.position = `${it.x} ${it.z + it.h} ${-it.y}`;
    b.dataset.normal = '0 1 0';
    b.innerHTML = bits.map(esc).join('<br>');
    b.hidden = !specsOn;
    mv.appendChild(b);
  }
}
$('specs').onclick = () => {
  specsOn = !specsOn;
  $('specs').textContent = specsOn ? 'Specs: on' : 'Specs: off';
  $('mv').querySelectorAll('.hotspot').forEach((h) => { h.hidden = !specsOn; });
};

export async function planShow(text) {
  $('status').textContent = 'Planning...';
  let plan = {};
  try {
    plan = await (await fetch('/api/plan', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text }) })).json();
  } catch (e) { plan = { fallback: true, reason: e.message }; }
  const lux = parseFloat($('ambientLux').value);
  const show = buildShow({ ...plan.params, ...(Number.isFinite(lux) ? { ambientLux: lux } : {}) }, room());
  current = show;
  renderChecks(show); renderBudget(show); renderCables(show); renderFlow(show); renderPlan2d(show); renderSoftware(plan.software);
  $('summary').textContent = plan.summary || (plan.fallback ? `Default stage shown (${plan.reason}).` : '');
  $('steps').innerHTML = (plan.steps || []).map((s) => `<li><b>${esc(s.title)}:</b> ${esc(s.text)}</li>`).join('');
  const oldSrc = $('mv').src;
  $('mv').src = await toGlbUrl(show);
  if (oldSrc && oldSrc.startsWith('blob:')) URL.revokeObjectURL(oldSrc);
  renderHotspots(show);
  mapReady.then((ok) => ok && drawShow(show));
  $('status').textContent = `Planned: ${show.items.length} pieces, ${money(show.budget.low)} to ${money(show.budget.high)} plus quotes.`;
  const reds = show.checks.filter((c) => c.status === 'red').map((c) => c.name);
  return `Planned a ${show.W.toFixed(1)} by ${show.D.toFixed(1)} meter stage. Budget ${money(show.budget.low)} to ${money(show.budget.high)} plus ${show.budget.quoteOnly} quotes. ` +
    (reds.length ? `Red checks: ${reds.join(', ')}.` : 'All checks pass or amber.');
}
window.planShow = planShow;

$('plan').onclick = () => planShow($('concept').value);
$('talk').onclick = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) { $('status').textContent = 'No speech recognition in this browser. Type the show and tap Plan it.'; return; }
  const sr = new SR();
  sr.lang = 'en-US';
  sr.onresult = (e) => { $('concept').value = e.results[0][0].transcript; planShow($('concept').value); };
  sr.onerror = (e) => { $('status').textContent = 'Mic error: ' + e.error; };
  $('status').textContent = 'Listening...';
  sr.start();
};

planShow($('concept').value);
