// Layout, checks, cables and budget for a small scrim-hologram stage.
// Coordinates: meters from the spike mark (front center of the stage).
// x = stage right positive, y = upstage positive (audience is negative y), z = up from the floor.
import { CATALOG } from './catalog.js';

export const SQFT_M2 = 0.092903;
export const STANDING_SQFT = 5; // IBC 2021 Table 1004.5, standing
export const CIRCUIT_A = 20;
export const CIRCUIT_USABLE = 0.8; // continuous-load rule of thumb
export const VOLTS = 120;
export const CABLE_FT = [10, 15, 25, 50, 75, 100];
export const M_PER_FT = 0.3048;

export const DEFAULT_PARAMS = {
  decksWide: 2, decksDeep: 2, deckHeightM: 0.61,
  speakers: 2, washes: 4, scrim: true, projector: true,
  days: 2, operatorHours: 8, ambientLux: 50,
};

export const DEFAULT_ROOM = {
  widthM: 12, frontDepthM: 12, ceilingM: 4.5, floorElevationM: 4.5,
};

const status = (s, value, reason) => ({ status: s, value, reason });

// True height above ground: floor elevation plus the item's z.
export function trueHeight(floorElevationM, zM) {
  return Math.round((floorElevationM + zM) * 100) / 100;
}

// Hang vs stack: summed weight against one rated point load.
export function hangCheck(boxes, boxKg, bumperKg, ratingKg) {
  const total = Math.round((boxes * boxKg + bumperKg) * 10) / 10;
  const pct = total / ratingKg;
  const s = pct > 1 ? 'red' : pct >= 0.9 ? 'amber' : 'green';
  return status(s, total, `${total} kg is ${Math.round(pct * 100)} percent of ${ratingKg} kg`
    + (s === 'red' ? '. Ground stack instead, up to 9 boxes on the bumper.' : ''));
}

// Trim height against a lift's maximum height.
export function trimCheck(trimM, maxM) {
  const s = trimM > maxM ? 'red' : trimM >= 0.9 * maxM ? 'amber' : 'green';
  return status(s, trimM, `trim ${trimM} m against a ${maxM} m maximum`);
}

// Top of the tallest item against the ceiling.
export function ceilingCheck(topM, ceilingM) {
  const clear = Math.round((ceilingM - topM) * 100) / 100;
  const s = clear < 0 ? 'red' : clear < 0.3 ? 'amber' : 'green';
  return status(s, clear, `top at ${topM} m, ceiling ${ceilingM} m, clearance ${clear} m`);
}

// Throw distance range for an image width.
export function throwRange(imageWidthM, minRatio, maxRatio) {
  return [Math.round(imageWidthM * minRatio * 10) / 10, Math.round(imageWidthM * maxRatio * 10) / 10];
}

export function throwCheck(imageWidthM, roomDepthM, p = CATALOG.projector) {
  const [lo, hi] = throwRange(imageWidthM, p.throwMin, p.throwMax);
  const s = roomDepthM < lo ? 'red' : 'green';
  return status(s, lo, `${imageWidthM} m image needs ${lo} to ${hi} m of throw, room gives ${roomDepthM} m`
    + (s === 'red' ? '. Use a short-throw lens or a narrower image.' : ''));
}

// Lumens over image area, before screen gain.
export function luxOnImage(lumens, wM, hM) {
  return Math.round(lumens / (wM * hM));
}

export function washoutCheck(lumens, wM, hM, ambientLux) {
  const lux = luxOnImage(lumens, wM, hM);
  const ratio = lux / Math.max(ambientLux, 1);
  const s = ratio >= 10 ? 'green' : ratio >= 5 ? 'amber' : 'red';
  return status(s, lux, `about ${lux} lux on the image against ${ambientLux} lux ambient (${Math.round(ratio)}:1)`);
}

export function wattsToAmps(watts, volts = VOLTS) {
  return Math.round((watts / volts) * 10) / 10;
}

export function powerCheck(totalAmps) {
  const usable = CIRCUIT_A * CIRCUIT_USABLE;
  const circuits = Math.max(1, Math.ceil(totalAmps / usable));
  const s = circuits > 2 ? 'amber' : 'green';
  return status(s, circuits, `${totalAmps} A total, ${circuits} x ${CIRCUIT_A} A circuit(s) at ${usable} A usable each`);
}

export function capacity(areaM2, sqftPerPerson = STANDING_SQFT) {
  return Math.floor(areaM2 / (sqftPerPerson * SQFT_M2));
}

export function cableLengthFt(meters) {
  const ft = (meters * 1.2) / M_PER_FT; // 20 percent slack
  return CABLE_FT.find((c) => c >= ft) ?? Math.ceil(ft / 25) * 25;
}

// Place every item. Returns items with x, y, z (base), w, d, h and catalog id.
export function layout(params = DEFAULT_PARAMS, room = DEFAULT_ROOM) {
  const p = { ...DEFAULT_PARAMS, ...params };
  const deck = CATALOG.deck;
  const W = p.decksWide * deck.w;
  const D = p.decksDeep * deck.d;
  const H0 = p.deckHeightM;
  const items = [];
  for (let i = 0; i < p.decksWide; i++) {
    for (let j = 0; j < p.decksDeep; j++) {
      items.push({ id: 'deck', label: 'Deck', x: -W / 2 + deck.w * (i + 0.5), y: deck.d * (j + 0.5), z: 0, w: deck.w, d: deck.d, h: H0 });
    }
  }
  const imageW = Math.round(W * 100) / 100;
  const imageH = Math.round(Math.min(imageW * 9 / 16, room.ceilingM - H0 - 0.6) * 100) / 100;
  const scrimY = 0.3;
  const top = Math.round((H0 + imageH + 0.3) * 100) / 100;
  if (p.scrim) {
    items.push({ id: 'scrim', label: 'Scrim', x: 0, y: scrimY, z: H0, w: imageW, d: 0.02, h: imageH });
    const t = CATALOG.truss.w;
    for (const sx of [-1, 1]) {
      items.push({ id: 'truss', label: 'Truss upright', x: sx * (W / 2 + 0.2), y: scrimY, z: 0, w: t, d: t, h: top });
    }
    items.push({ id: 'truss', label: 'Truss header', x: 0, y: scrimY, z: top - t, w: W + 0.4 + t, d: t, h: t });
    items.push({ id: 'backdrop', label: 'Black backdrop', x: 0, y: D - 0.05, z: 0, w: W, d: 0.02, h: top });
  }
  const proj = CATALOG.projector;
  const [throwLo] = throwRange(imageW, proj.throwMin, proj.throwMax);
  if (p.projector) {
    items.push({ id: 'projector', label: 'Projector', x: 0, y: -throwLo, z: 1.0, w: proj.w, d: proj.d, h: proj.h });
    items.push({ id: 'foh', label: 'FOH table (media server, mixer)', x: 1.2, y: -throwLo, z: 0, w: 1.8, d: 0.75, h: 0.75 });
  }
  for (let i = 0; i < p.speakers; i++) {
    const sx = i % 2 === 0 ? -1 : 1;
    items.push({ id: 'speaker', label: 'Speaker', x: sx * (W / 2 + 0.8), y: 0.2, z: 1.2, w: 0.36, d: 0.35, h: 0.6 });
  }
  for (let i = 0; i < p.washes; i++) {
    const sx = i % 2 === 0 ? -1 : 1;
    const yy = D * (0.5 + 0.3 * Math.floor(i / 2));
    items.push({ id: 'wash', label: 'LED wash', x: sx * (W / 2 + 0.3), y: Math.min(yy, D - 0.3), z: H0, w: 0.25, d: 0.2, h: 0.3 });
  }
  return { items, W, D, H0, imageW, imageH, top, throwLo, params: p, room };
}

export function cables(show) {
  const foh = show.items.find((i) => i.id === 'foh');
  const proj = show.items.find((i) => i.id === 'projector');
  const out = [];
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y) + Math.abs(a.z - b.z);
  if (foh && proj) out.push({ from: 'Media server', to: 'Projector', type: 'HDMI 2.0 (SDI or HDBaseT past 15 m)', ft: cableLengthFt(dist(foh, proj)) });
  if (foh) {
    show.items.filter((i) => i.id === 'speaker').forEach((s, n) => {
      out.push({ from: 'Mixer', to: `Speaker ${n + 1}`, type: 'XLR mic cable (line level)', ft: cableLengthFt(dist(foh, s)) });
    });
    const washes = show.items.filter((i) => i.id === 'wash');
    let prev = foh;
    washes.forEach((w, n) => {
      out.push({ from: n === 0 ? 'DMX interface' : `Wash ${n}`, to: `Wash ${n + 1}`, type: '5-pin DMX', ft: cableLengthFt(dist(prev, w)) });
      prev = w;
    });
    if (washes.length) out.push({ from: `Wash ${washes.length}`, to: 'end of line', type: 'DMX terminator', ft: 0 });
  }
  const halfW = show.room.widthM / 2;
  show.items.filter((i) => ['projector', 'speaker', 'wash', 'foh'].includes(i.id)).forEach((i) => {
    out.push({ from: 'Wall circuit', to: i.label, type: 'Edison AC extension, 12 AWG', ft: cableLengthFt(Math.max(1, halfW - Math.abs(i.x)) + i.z) });
  });
  return out;
}

export function budget(show) {
  const p = show.params;
  const counts = {};
  show.items.forEach((i) => { counts[i.id] = (counts[i.id] || 0) + 1; });
  const weeks = Math.max(1, Math.ceil(p.days / 7));
  const lines = [];
  const add = (id, qty, units, unitLabel) => {
    const c = CATALOG[id];
    if (!c || !qty) return;
    if (!c.price) { lines.push({ item: c.name, qty, low: null, high: null, note: 'quote only', source: c.source }); return; }
    lines.push({ item: c.name, qty, low: c.price.low * qty * units, high: c.price.high * qty * units, note: `${c.price.period}${unitLabel ? ', ' + unitLabel : ''}`, source: c.source });
  };
  add('deck', counts.deck, 1, '');
  add('scrim', counts.scrim, Math.ceil(p.days / 2), `${Math.ceil(p.days / 2)} x 2-day`);
  add('truss', counts.truss, 1, '');
  add('backdrop', counts.backdrop, 1, '');
  if (counts.projector) {
    lines.push({ item: CATALOG.projector.name, qty: 1, low: 160.5 * p.days, high: 160.5 * p.days, note: `estimate from campus projection rate $160.50 per screen per day, x ${p.days} days. Show-grade unit is quote only`, source: 'hub.washington.edu (FY20)' });
  }
  add('speaker', counts.speaker, weeks, `${weeks} week(s)`);
  add('wash', counts.wash, 1, '');
  add('operator', 1, p.operatorHours, `${p.operatorHours} h`);
  const low = lines.reduce((s, l) => s + (l.low || 0), 0);
  const high = lines.reduce((s, l) => s + (l.high || 0), 0);
  return { lines, low: Math.round(low), high: Math.round(high), quoteOnly: lines.filter((l) => l.low === null).length };
}

export function runChecks(show) {
  const { room, params: p } = show;
  const out = [];
  if (p.projector) {
    out.push({ name: 'Projector throw', ...throwCheck(show.imageW, room.frontDepthM) });
    out.push({ name: 'Image brightness', ...washoutCheck(CATALOG.projector.lumens, show.imageW, show.imageH, p.ambientLux) });
  }
  const tallest = Math.max(...show.items.map((i) => i.z + i.h));
  out.push({ name: 'Ceiling clearance', ...ceilingCheck(Math.round(tallest * 100) / 100, room.ceilingM) });
  const watts = show.items.reduce((s, i) => s + (CATALOG[i.id]?.watts || 0), 0) + (show.items.some((i) => i.id === 'foh') ? 300 : 0);
  out.push({ name: 'Power', ...powerCheck(wattsToAmps(watts)) });
  const audienceDepth = Math.max(0, room.frontDepthM - 1.5 - (p.projector ? 1 : 0));
  out.push({ name: 'Standing capacity', status: 'green', value: capacity(room.widthM * audienceDepth), reason: `${capacity(room.widthM * audienceDepth)} people at 5 sq ft each on ${Math.round(room.widthM * audienceDepth)} m2. The fire marshal sets the real number.` });
  out.push({ name: 'Height above ground', status: 'green', value: trueHeight(room.floorElevationM, show.top), reason: `scrim header at ${trueHeight(room.floorElevationM, show.top)} m above ground (floor at ${room.floorElevationM} m)` });
  return out;
}

export function buildShow(params, room) {
  const show = layout(params, { ...DEFAULT_ROOM, ...room });
  return { ...show, checks: runChecks(show), cables: cables(show), budget: budget(show) };
}
