// Real gear, hand-entered from manufacturer and rental sources (see `source`).
// Prices: `low`/`high` per `period`. null = quote only. Never invent a number here.
export const CATALOG = {
  deck: {
    name: '4x8 ft stage deck', category: 'Staging',
    w: 2.44, d: 1.22, h: 0.61, kg: null, watts: 0,
    spec: 'Heights 12 to 42 in, rated 7.5 kN/m2 (about 157 psf)',
    price: { low: 197, high: 297, period: 'listing, period not stated' },
    source: 'rentforevent.com/la',
  },
  truss: {
    name: 'Global Truss F34 box truss (goalpost for the scrim)', category: 'Rigging',
    w: 0.29, d: 0.29, h: 0.29, kg: null, watts: 0,
    spec: 'Center point load 1,477 lb at 6 m span',
    price: null, source: 'Global Truss America load table',
  },
  scrim: {
    name: 'White scrim, 15 ft H x 30 ft W (generic stand-in for holo gauze)', category: 'Scenic',
    w: 9.14, d: 0.02, h: 4.57, kg: null, watts: 0,
    spec: 'Front-projected gauze. HOLOGAUZE (Gerriets) is quote only.',
    price: { low: 60, high: 60, period: 'per 2 days' },
    source: 'musson.com rentals; gerriets.com HOLOGAUZE sheet',
  },
  backdrop: {
    name: 'Black backdrop upstage of performers', category: 'Scenic',
    w: 6, d: 0.02, h: 3.5, kg: null, watts: 0,
    spec: 'Dark field behind the scrim so the image reads as floating',
    price: null, source: 'not priced in catalog',
  },
  projector: {
    name: 'Epson Pro L1505U laser projector', category: 'Video',
    w: 0.59, d: 0.65, h: 0.2, kg: 21.7, watts: 955, lumens: 12000,
    throwMin: 1.57, throwMax: 2.56,
    spec: '12,000 lm, 955 W, throw 1.57 to 2.56 (standard lens unconfirmed)',
    price: null, compare: 'Panasonic PT-RZ12KU listed at $2,197, period not stated',
    source: 'projectorcentral.com, rentforevent.com/la',
  },
  lensUST: {
    name: 'Epson ELPLX02S ultra short-throw lens', category: 'Video',
    throwRatio: 0.35, watts: 0,
    spec: '0.35:1 throw ratio, 8 mm, f/1.9, lists the Pro L1505U as compatible',
    price: null, source: 'shop.avispl.com; alloys.com.au',
  },
  speaker: {
    name: 'QSC K12.2 powered speaker', category: 'Audio',
    w: 0.36, d: 0.35, h: 0.6, kg: 17.7, watts: 228, amps: 1.9, coverage: 75,
    spec: '75 deg coverage, 1.9 A at 120 V (1/8 power)',
    price: { low: 345, high: 345, period: 'per week' },
    source: 'rentals.magicsnow.com',
  },
  wash: {
    name: 'Chauvet COLORado 1 Solo LED wash', category: 'Lighting',
    w: 0.25, d: 0.2, h: 0.3, kg: 5.4, watts: 65,
    spec: '65 W, beam 4 to 40 deg',
    price: null, source: 'fullcompass.com',
  },
  operator: {
    name: 'Sound operator', category: 'Labor',
    price: { low: 59, high: 59, period: 'per hour' },
    spec: 'UW HUB FY20 rate sheet', source: 'hub.washington.edu',
  },
};

// Media server software choices. Prices are not in the catalog today.
export const SOFTWARE = [
  { name: 'Resolume Arena', use: 'Live VJ playback and projection mapping' },
  { name: 'QLab', use: 'Cue-based playback for theater (Mac only)' },
  { name: 'TouchDesigner', use: 'Generative and interactive visuals' },
  { name: 'MadMapper', use: 'Projection mapping and LED' },
  { name: 'disguise Designer', use: 'Show-grade previsualization and playback' },
];
