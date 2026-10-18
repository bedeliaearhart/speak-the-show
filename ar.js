// Builds the stage at true scale as a GLB for model-viewer (3D on any device, AR on phones).
// glTF axes: X = stage right, Y = up, Z = toward the audience. Origin = the spike mark.
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

const MATS = {
  deck: { color: 0x1c1c1c, roughness: 0.95, metalness: 0 },        // black carpet deck top
  truss: { color: 0xd8dadc, roughness: 0.3, metalness: 0.9 },       // aluminum
  scrim: { color: 0xffffff, roughness: 1, metalness: 0, transparent: true, opacity: 0.18 },
  backdrop: { color: 0x050505, roughness: 1, metalness: 0 },        // black velour
  projector: { color: 0xe8e8e8, roughness: 0.5, metalness: 0.1 },
  foh: { color: 0x2b2b2b, roughness: 0.8, metalness: 0.1 },
  speaker: { color: 0x151515, roughness: 0.75, metalness: 0.05 },
  wash: { color: 0x202020, roughness: 0.4, metalness: 0.6 },
  stand: { color: 0x2a2a2a, roughness: 0.5, metalness: 0.7 },
};

function box(it, opts = {}) {
  const mat = new THREE.MeshStandardMaterial(opts);
  const m = new THREE.Mesh(new THREE.BoxGeometry(it.w, it.h, it.d), mat);
  m.position.set(it.x, it.z + it.h / 2, -it.y);
  m.name = it.label;
  return m;
}

// F34-style box truss: four aluminum chords with diagonal webbing every 0.5 m.
function truss(it) {
  const g = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial(MATS.truss);
  const vertical = it.h > it.w;
  const len = vertical ? it.h : it.w;
  const side = 0.29, r = 0.024;
  const chord = new THREE.CylinderGeometry(r, r, len, 10);
  for (const a of [-1, 1]) for (const b of [-1, 1]) {
    const c = new THREE.Mesh(chord, mat);
    if (vertical) c.position.set(a * side / 2, 0, b * side / 2);
    else { c.rotation.z = Math.PI / 2; c.position.set(0, a * side / 2, b * side / 2); }
    g.add(c);
  }
  const step = 0.5, diag = Math.hypot(step, side);
  const web = new THREE.CylinderGeometry(0.008, 0.008, diag, 6);
  for (let t = -len / 2; t < len / 2 - 0.01; t += step) {
    for (const b of [-1, 1]) {
      const w = new THREE.Mesh(web, mat);
      const ang = Math.atan2(side, step);
      if (vertical) { w.position.set(0, t + step / 2, b * side / 2); w.rotation.z = ang; }
      else { w.position.set(t + step / 2, 0, b * side / 2); w.rotation.z = Math.PI / 2 - ang; }
      g.add(w);
    }
  }
  g.position.set(it.x, it.z + it.h / 2, -it.y);
  g.name = it.label;
  return g;
}


// Detailed procedural models at true size. Each returns a Group centered on the item's footprint, base at its z.
const M = (o) => new THREE.MeshStandardMaterial(o);
function part(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
function place(g, it) { g.position.set(it.x, it.z, -it.y); g.name = it.label; return g; }

function deckModel(it) {
  const g = new THREE.Group();
  const top = M(MATS.deck), leg = M({ color: 0x777777, roughness: 0.4, metalness: 0.8 });
  g.add(part(new THREE.BoxGeometry(it.w, 0.05, it.d), top, 0, it.h - 0.025, 0));
  const legGeo = new THREE.CylinderGeometry(0.025, 0.025, it.h - 0.05, 8);
  for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(part(legGeo, leg, a * (it.w / 2 - 0.1), (it.h - 0.05) / 2, b * (it.d / 2 - 0.1)));
  // Black skirt on the audience side.
  g.add(part(new THREE.BoxGeometry(it.w, it.h - 0.05, 0.01), M({ color: 0x080808, roughness: 1 }), 0, (it.h - 0.05) / 2, it.d / 2));
  return place(g, it);
}

function speakerModel(it) {
  const g = new THREE.Group();
  const body = M(MATS.speaker);
  g.add(part(new THREE.BoxGeometry(it.w, it.h, it.d), body, 0, it.h / 2, 0));
  g.add(part(new THREE.PlaneGeometry(it.w * 0.86, it.h * 0.86), M({ color: 0x3a3a3a, roughness: 0.9, metalness: 0.3 }), 0, it.h / 2, it.d / 2 + 0.002));
  const woofer = part(new THREE.CircleGeometry(0.13, 32), M({ color: 0x0a0a0a, roughness: 0.6 }), 0, it.h * 0.38, it.d / 2 + 0.004);
  const horn = part(new THREE.PlaneGeometry(0.16, 0.08), M({ color: 0x0a0a0a, roughness: 0.6 }), 0, it.h * 0.78, it.d / 2 + 0.004);
  g.add(woofer, horn);
  g.add(part(new THREE.BoxGeometry(0.12, 0.03, 0.04), M({ color: 0x111111 }), 0, it.h + 0.015, 0));
  return place(g, it);
}

function standModel(it) {
  const g = new THREE.Group();
  const metal = M(MATS.stand);
  if (it.label === 'Projector table') {
    g.add(part(new THREE.BoxGeometry(it.w, 0.04, it.d), M({ color: 0x1a1a1a, roughness: 0.7 }), 0, it.h - 0.02, 0));
    const legGeo = new THREE.CylinderGeometry(0.02, 0.02, it.h - 0.04, 8);
    for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(part(legGeo, metal, a * (it.w / 2 - 0.05), (it.h - 0.04) / 2, b * (it.d / 2 - 0.05)));
    return place(g, it);
  }
  // Tripod speaker stand: pole plus three splayed legs.
  g.add(part(new THREE.CylinderGeometry(0.018, 0.018, it.h, 10), metal, 0, it.h / 2, 0));
  const legLen = 0.75, legGeo = new THREE.CylinderGeometry(0.012, 0.012, legLen, 8);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    const l = new THREE.Mesh(legGeo, metal);
    l.position.set(Math.cos(a) * 0.25, 0.3, Math.sin(a) * 0.25);
    l.lookAt(Math.cos(a) * 0.5, 0, Math.sin(a) * 0.5);
    l.rotateX(Math.PI / 2);
    g.add(l);
  }
  return place(g, it);
}

function washModel(it) {
  const g = new THREE.Group();
  const black = M(MATS.wash);
  g.add(part(new THREE.BoxGeometry(it.w, 0.06, it.d), black, 0, 0.03, 0));
  for (const a of [-1, 1]) g.add(part(new THREE.BoxGeometry(0.015, 0.2, 0.06), black, a * 0.11, 0.15, 0));
  const head = part(new THREE.CylinderGeometry(0.09, 0.09, 0.14, 20), black, 0, 0.2, 0);
  head.rotation.x = Math.PI / 2.5;
  head.rotation.z = it.x > 0 ? 0.6 : -0.6;
  const lens = part(new THREE.CircleGeometry(0.075, 24), M({ color: 0xff9a3c, emissive: 0xff7a00, emissiveIntensity: 0.8 }), 0, -0.071, 0);
  lens.rotation.x = Math.PI / 2;
  head.add(lens);
  g.add(head);
  return place(g, it);
}

function projectorModel(it) {
  const g = new THREE.Group();
  g.add(part(new THREE.BoxGeometry(it.w, it.h, it.d), M(MATS.projector), 0, it.h / 2, 0));
  const dir = it.facing === 'audience' ? 1 : -1;
  const lens = part(new THREE.CylinderGeometry(0.06, 0.07, 0.08, 24), M({ color: 0x111111, roughness: 0.2, metalness: 0.8 }), 0, it.h / 2, dir * (it.d / 2 + 0.04));
  lens.rotation.x = Math.PI / 2;
  g.add(lens);
  for (let k = -2; k <= 2; k++) g.add(part(new THREE.BoxGeometry(0.01, it.h * 0.6, 0.12), M({ color: 0x555555 }), it.w / 2 + 0.003, it.h / 2, k * 0.1));
  return place(g, it);
}

function drapeModel(it) {
  const g = new THREE.Group();
  const velour = M(MATS.backdrop), pipe = M(MATS.truss);
  const folds = Math.max(6, Math.round(it.w / 0.3));
  const fw = it.w / folds;
  for (let k = 0; k < folds; k++) g.add(part(new THREE.BoxGeometry(fw, it.h, 0.02), velour, -it.w / 2 + fw * (k + 0.5), it.h / 2, k % 2 ? 0.04 : -0.04));
  const top = part(new THREE.CylinderGeometry(0.02, 0.02, it.w, 10), pipe, 0, it.h, 0);
  top.rotation.z = Math.PI / 2;
  g.add(top);
  for (const a of [-1, 1]) {
    g.add(part(new THREE.CylinderGeometry(0.025, 0.025, it.h, 10), pipe, a * it.w / 2, it.h / 2, 0));
    g.add(part(new THREE.BoxGeometry(0.45, 0.02, 0.45), pipe, a * it.w / 2, 0.01, 0));
  }
  return place(g, it);
}

function scrimModel(it) {
  const g = new THREE.Group();
  g.add(part(new THREE.BoxGeometry(it.w, it.h, 0.005), M(MATS.scrim), 0, it.h / 2, 0));
  const pipe = M(MATS.truss);
  for (const y of [0, it.h]) {
    const p = part(new THREE.CylinderGeometry(0.02, 0.02, it.w, 10), pipe, 0, y, 0);
    p.rotation.z = Math.PI / 2;
    g.add(p);
  }
  return place(g, it);
}

function fohModel(it) {
  const g = new THREE.Group();
  const dark = M(MATS.foh);
  g.add(part(new THREE.BoxGeometry(it.w, 0.04, it.d), dark, 0, it.h - 0.02, 0));
  const legGeo = new THREE.CylinderGeometry(0.02, 0.02, it.h - 0.04, 8);
  for (const a of [-1, 1]) for (const b of [-1, 1]) g.add(part(legGeo, M(MATS.stand), a * (it.w / 2 - 0.05), (it.h - 0.04) / 2, b * (it.d / 2 - 0.05)));
  g.add(part(new THREE.BoxGeometry(0.34, 0.02, 0.24), M({ color: 0x9a9a9a, metalness: 0.7, roughness: 0.3 }), -0.4, it.h + 0.01, 0));
  const screen = part(new THREE.BoxGeometry(0.34, 0.22, 0.01), M({ color: 0x00e5ff, emissive: 0x0a3a40 }), -0.4, it.h + 0.12, -0.12);
  g.add(screen);
  g.add(part(new THREE.BoxGeometry(0.5, 0.08, 0.4), M({ color: 0x222222, roughness: 0.6 }), 0.35, it.h + 0.04, 0));
  return place(g, it);
}

const MODELS = { deck: deckModel, speaker: speakerModel, stand: standModel, wash: washModel, projector: projectorModel, backdrop: drapeModel, scrim: scrimModel, foh: fohModel };

export function buildScene(show) {
  const scene = new THREE.Scene();
  for (const it of show.items) {
    if (it.id === 'truss') scene.add(truss(it));
    else if (MODELS[it.id]) scene.add(MODELS[it.id](it));
    else scene.add(box(it, MATS[it.id] ?? { color: 0x888888 }));
  }
  // The hologram: a glowing figure just upstage of the scrim.
  const scrim = show.items.find((i) => i.id === 'scrim');
  if (scrim) {
    const glow = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 1 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 1.1, 16), glow);
    body.position.set(0, scrim.z + 0.75, -(scrim.y + 0.4));
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 12), glow);
    head.position.set(0, scrim.z + 1.45, -(scrim.y + 0.4));
    body.name = 'Hologram figure'; head.name = 'Hologram head';
    scene.add(body, head);
    const proj = show.items.find((i) => i.id === 'projector');
    if (proj) {
      // Projector beam as a thin translucent wedge from lens to scrim.
      const from = new THREE.Vector3(proj.x, proj.z + proj.h / 2, -proj.y);
      const to = new THREE.Vector3(0, scrim.z + scrim.h / 2, -scrim.y);
      const len = from.distanceTo(to);
      const beam = new THREE.Mesh(new THREE.ConeGeometry(scrim.w / 2, len, 4, 1, true),
        new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.12, side: THREE.DoubleSide }));
      beam.position.copy(from.clone().add(to).multiplyScalar(0.5));
      beam.lookAt(to);
      beam.rotateX(-Math.PI / 2);
      beam.name = 'Projector beam';
      scene.add(beam);
    }
  }
  // Spike mark: red disc at the origin, arrow pointing upstage along the reference edge.
  const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 24),
    new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0x550000 }));
  spike.position.set(0, 0.005, 0.15);
  spike.name = 'Spike mark';
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.4, 3),
    new THREE.MeshStandardMaterial({ color: 0xff0033, emissive: 0x550000 }));
  arrow.rotation.x = -Math.PI / 2;
  arrow.position.set(0, 0.13, 0.5);
  arrow.name = 'Upstage arrow';
  scene.add(spike, arrow);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.6));
  return scene;
}

export function toGlbUrl(show) {
  return new Promise((resolve, reject) => {
    new GLTFExporter().parse(buildScene(show), (glb) => {
      resolve(URL.createObjectURL(new Blob([glb], { type: 'model/gltf-binary' })));
    }, reject, { binary: true });
  });
}
