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

export function buildScene(show) {
  const scene = new THREE.Scene();
  for (const it of show.items) {
    if (it.id === 'truss') scene.add(truss(it));
    else scene.add(box(it, MATS[it.id] ?? { color: 0x888888 }));
    if (it.id === 'speaker') {
      // Grille face toward the audience.
      const g = new THREE.Mesh(new THREE.PlaneGeometry(it.w * 0.85, it.h * 0.85),
        new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9, metalness: 0.2 }));
      g.position.set(it.x, it.z + it.h / 2, -it.y + it.d / 2 + 0.002);
      scene.add(g);
    }
    if (it.id === 'projector') {
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 20),
        new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.8 }));
      lens.rotation.x = Math.PI / 2;
      lens.position.set(it.x, it.z + it.h / 2, -it.y - it.d / 2 - 0.02);
      scene.add(lens);
    }
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
