// Shared AR view: reads the admin-locked design and pins it to the printed spike marker with 8th Wall
// image targets plus SLAM, so the design stays put after the marker leaves the camera view.
import { buildShow } from './checks.js';
import { toGlbUrl } from './ar.js';
import { readLock, SUPABASE_URL, SUPABASE_KEY, SPACE_ID } from './shared.js';

const $ = (id) => document.getElementById(id);
let lock = null;
let glbUrl = null;
let model = null;          // three r147 object from the GLB
const anchor = new window.THREE.Group();   // follows the marker
const content = new window.THREE.Group();  // stage, rotated so model "up" is the marker normal
anchor.add(content);
let turn = 0;

function badge() {
  if (!lock) { $('badge').textContent = 'No design is locked yet. The admin locks it from the planner.'; return; }
  const t = new Date(lock.locked_at).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  $('badge').textContent = `Locked by ${lock.locked_by} at ${t}. Everyone sees this placement.`;
}

async function loadDesign() {
  lock = await readLock();
  badge();
  if (!lock) return;
  const L = lock.layout;
  const show = L.items ? { ...buildShow(L.params || {}, L.room || {}), items: L.items } : buildShow(L.params || {}, L.room || {});
  if (glbUrl) URL.revokeObjectURL(glbUrl);
  glbUrl = await toGlbUrl(show);
  await new Promise((resolve, reject) => new window.THREE.GLTFLoader().load(glbUrl, (g) => {
    if (model) content.remove(model);
    model = g.scene;
    content.add(model);
    resolve();
  }, undefined, reject));
}

// Live updates: poll the lock every 5 s (light, and works on any network).
setInterval(async () => {
  const next = await readLock().catch(() => null);
  if (next && (!lock || next.locked_at !== lock.locked_at)) { await loadDesign(); $('status').textContent = 'The admin moved the design. Updated.'; }
}, 5000);

function orient() {
  // Model: +Y up, -Z upstage. Marker: flat on the floor, red bar (image top) upstage.
  content.rotation.set(Math.PI / 2, 0, 0);
  content.rotateY(turn * Math.PI / 2);
}

function place({ detail }) {
  anchor.position.copy(detail.position);
  anchor.quaternion.copy(detail.rotation);
  const meters = parseFloat($('markerCm').value) / 100 || 0.254;
  const k = (detail.scaledHeight || detail.scale) / meters;   // scene units per meter
  anchor.scale.setScalar(k);
  anchor.visible = true;
  $('status').textContent = 'Marker found. The design is pinned. You can walk away from the marker.';
}

async function startAR() {
  $('start').disabled = true;
  $('status').textContent = 'Starting the camera...';
  const XR8 = window.XR8 || await new Promise((r) => window.addEventListener('xrloaded', () => r(window.XR8), { once: true }));
  const target = await (await fetch('/image-targets/spike.json')).json();
  XR8.XrController.configure({ imageTargetData: [target] });
  XR8.addCameraPipelineModules([
    XR8.GlTextureRenderer.pipelineModule(),
    XR8.Threejs.pipelineModule(),
    XR8.XrController.pipelineModule(),
    {
      name: 'downbeat',
      onStart: () => {
        const { scene, camera } = XR8.Threejs.xrScene();
        scene.add(new window.THREE.HemisphereLight(0xffffff, 0x444444, 1));
        scene.add(new window.THREE.DirectionalLight(0xffffff, 0.6));
        anchor.visible = false;
        scene.add(anchor);
        camera.position.set(0, 1.6, 0);
        XR8.XrController.updateCameraProjectionMatrix({ origin: camera.position, facing: camera.quaternion });
        $('status').textContent = 'Point the camera at the printed marker on the floor.';
        $('flip').hidden = false;
      },
      onException: (e) => { $('status').textContent = 'AR error: ' + (e?.message || e); },
      listeners: [
        { event: 'reality.imagefound', process: place },
        { event: 'reality.imageupdated', process: place },
      ],
    },
  ]);
  XR8.run({ canvas: $('camerafeed') });
}

$('start').onclick = () => startAR().catch((e) => { $('status').textContent = 'Could not start AR: ' + e.message; $('start').disabled = false; });
$('flip').onclick = () => { turn = (turn + 1) % 4; orient(); };
orient();
loadDesign().catch((e) => { $('badge').textContent = 'Could not load the design: ' + e.message; });
