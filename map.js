// ArcGIS 3D SceneView: the stage at its real address, lifted to its floor elevation.
// Loads the ArcGIS JS SDK (AMD build) on demand with the key from /api/config.
import { SITE } from './site.js';

const SDK = 'https://js.arcgis.com/4.30/';
let view = null;
let layer = null;
let modules = null;

function loadSdk() {
  if (window.require && window.require.on) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = SDK + 'esri/themes/dark/main.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = SDK;
    s.onload = resolve;
    s.onerror = () => reject(new Error('ArcGIS SDK failed to load'));
    document.head.appendChild(s);
  });
}

// Meters off the spike to longitude/latitude, rotated by the spike heading.
function toLonLat(x, y) {
  const h = (SITE.spike.headingDeg * Math.PI) / 180;
  const east = x * Math.cos(h) + y * Math.sin(h);
  const north = -x * Math.sin(h) + y * Math.cos(h);
  const lat = SITE.site.lat + north / 111320;
  const lon = SITE.site.lon + east / (111320 * Math.cos((SITE.site.lat * Math.PI) / 180));
  return [lon, lat];
}

function ring(it) {
  const hw = it.w / 2, hd = it.d / 2;
  return [[-hw, -hd], [hw, -hd], [hw, hd], [-hw, hd], [-hw, -hd]].map(([dx, dy]) => toLonLat(it.x + dx, it.y + dy));
}

const COLORS = {
  deck: [70, 70, 70], truss: [190, 190, 190], scrim: [255, 255, 255, 0.35], backdrop: [10, 10, 10],
  projector: [40, 110, 255], foh: [120, 80, 40], speaker: [20, 20, 20], wash: [255, 140, 0], floor: [0, 229, 255, 0.15],
};

async function initArcgis(container, statusEl, cfg) {
  await loadSdk();
  modules = await new Promise((resolve) => window.require([
    'esri/config', 'esri/Map', 'esri/views/SceneView', 'esri/layers/GraphicsLayer', 'esri/Graphic',
  ], (...m) => resolve(m)));
  const [esriConfig, Map, SceneView, GraphicsLayer] = modules;
  esriConfig.apiKey = cfg.arcgisKey;
  layer = new GraphicsLayer({ elevationInfo: { mode: 'relative-to-ground' } });
  const map = new Map({ basemap: 'satellite', ground: 'world-elevation', layers: [layer] });
  view = new SceneView({
    container, map,
    camera: { position: { longitude: SITE.site.lon, latitude: SITE.site.lat - 0.0006, z: 70 }, tilt: 60, heading: 0 },
  });
  await view.when();
  statusEl.textContent = `ArcGIS: ${SITE.site.address}, ${SITE.floor.name} at ${SITE.floor.elevationM} m`;
  return view;
}

function drawArcgis(show) {
  if (!view || !modules) return;
  const Graphic = modules[4];
  layer.removeAll();
  const floorZ = show.room.floorElevationM;
  const items = [
    { id: 'floor', x: 0, y: -show.room.frontDepthM / 2 + show.D / 2, z: -0.05, w: show.room.widthM, d: show.room.frontDepthM + show.D, h: 0.05 },
    ...show.items,
  ];
  for (const it of items) {
    const z = floorZ + it.z;
    layer.add(new Graphic({
      geometry: { type: 'polygon', hasZ: true, rings: [ring(it).map(([lon, lat]) => [lon, lat, z])], spatialReference: { wkid: 4326 } },
      symbol: { type: 'polygon-3d', symbolLayers: [{ type: 'extrude', size: Math.max(it.h, 0.02), material: { color: COLORS[it.id] || [150, 150, 150] } }] },
      attributes: { label: it.label || 'Floor 2 slab' },
    }));
  }
  view.goTo({ target: layer.graphics.toArray(), tilt: 65, heading: 20 }).catch(() => {});
}

// MapLibre fallback (no key): OpenFreeMap 3D buildings, items as extrusions at true height.
const ML = 'https://unpkg.com/maplibre-gl@4.7.1/dist/';
let ml = null;
const hex = (c) => '#' + c.slice(0, 3).map((v) => v.toString(16).padStart(2, '0')).join('');

function loadMapLibre() {
  if (window.maplibregl) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = ML + 'maplibre-gl.css';
    document.head.appendChild(css);
    const s = document.createElement('script');
    s.src = ML + 'maplibre-gl.js'; s.onload = resolve;
    s.onerror = () => reject(new Error('MapLibre failed to load'));
    document.head.appendChild(s);
  });
}

async function initMapLibre(container, statusEl) {
  await loadMapLibre();
  ml = new window.maplibregl.Map({
    container, style: 'https://tiles.openfreemap.org/styles/liberty',
    center: [SITE.site.lon, SITE.site.lat], zoom: 19, pitch: 60, bearing: -20,
  });
  await new Promise((r) => ml.on('load', r));
  ml.addSource('rig', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
  ml.addLayer({ id: 'rig', type: 'fill-extrusion', source: 'rig', paint: {
    'fill-extrusion-color': ['get', 'color'], 'fill-extrusion-base': ['get', 'base'],
    'fill-extrusion-height': ['get', 'top'], 'fill-extrusion-opacity': 0.9 } });
  statusEl.textContent = `MapLibre with OpenFreeMap 3D buildings: ${SITE.site.address}, ${SITE.floor.name} at ${SITE.floor.elevationM} m`;
  return ml;
}

function drawMapLibre(show) {
  if (!ml) return;
  const floorZ = show.room.floorElevationM;
  const items = [
    { id: 'floor', x: 0, y: -show.room.frontDepthM / 2 + show.D / 2, z: -0.05, w: show.room.widthM, d: show.room.frontDepthM + show.D, h: 0.05 },
    ...show.items,
  ];
  const features = items.map((it) => ({
    type: 'Feature',
    properties: { color: hex(COLORS[it.id] || [150, 150, 150]), base: floorZ + it.z, top: floorZ + it.z + Math.max(it.h, 0.02) },
    geometry: { type: 'Polygon', coordinates: [ring(it)] },
  }));
  ml.getSource('rig').setData({ type: 'FeatureCollection', features });
  ml.easeTo({ center: [SITE.site.lon, SITE.site.lat], zoom: 19.5, pitch: 65 });
}

let engine = null;
export async function initMap(container, statusEl) {
  let cfg = {};
  try { cfg = await (await fetch('/api/config')).json(); } catch { /* fall through */ }
  if (cfg.arcgisKey) {
    try { await initArcgis(container, statusEl, cfg); engine = 'arcgis'; return; } catch (e) { container.innerHTML = ''; }
  }
  await initMapLibre(container, statusEl);
  engine = 'maplibre';
}

export function drawShow(show) {
  if (engine === 'arcgis') drawArcgis(show);
  else if (engine === 'maplibre') drawMapLibre(show);
}
