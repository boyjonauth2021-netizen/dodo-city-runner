// New obstacle factories (Moris Tour + extras for Port Louis). Each returns
// { mesh, hx, hz, y0, y1, kind: 'stumble'|'crash'|'slow', name, ...flags }
//   slide:true  -> pass by sliding under it (y0 > slide height)       avoid:true -> too tall to jump, change lane
//   vz          -> own speed along z (+ = oncoming, - = same direction as the player)
//   vx / cross  -> animals that dash across the road once the player is close ({ speed, toLane })
//   platform    -> walkable top (ramp up)       update(dt)/mixer -> animation
import * as THREE from 'three';
import { assets, mat, std, basic, geo, box, cyl, ownGeo, rand, pick } from './world.js';
import * as T from './textures.js';
import { makeAnimal } from './characters.js';
import { LANE_W } from './config.js';

// ---- helpers
const propCache = {};
function fitProp(key, { len, height, width }) { // clone a static GLB prop scaled to a target size, base at y=0, centred on x/z
  const a = assets['m_' + key];
  if (!propCache[key]) { a.scene.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(a.scene); propCache[key] = { b, s: b.getSize(new THREE.Vector3()), c: b.getCenter(new THREE.Vector3()) }; }
  const { b, s, c } = propCache[key];
  const k = len ? len / s.z : width ? width / s.x : height / s.y;
  const o = a.scene.clone(true); o.traverse((m) => { if (m.isMesh) m.castShadow = true; });
  o.scale.setScalar(k); o.position.set(-c.x * k, -b.min.y * k, -c.z * k);
  const g = new THREE.Group(); g.add(o); return { g, w: s.x * k, h: s.y * k, l: s.z * k };
}
const sphere = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, seg = 10) => { const s = new THREE.Mesh(geo(`s${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(6, seg - 2))), m); s.position.set(x, y, z); s.scale.set(sx, sy, sz); s.castShadow = true; return s; };
const COL = (hex) => mat('c' + hex, () => std({ color: hex }));
const skinM = () => mat('skin', () => std({ color: 0xc58a5a }));
function riderFigure(shirt, helmet = 0xf2c400, lean = 0.25) {
  const g = new THREE.Group();
  g.add(box(0.36, 0.55, 0.24, COL(shirt), 0, 0.28, 0, true));
  const head = sphere(0.14, skinM(), 0, 0.72, 0.03); g.add(head);
  const h = new THREE.Mesh(geo('helm', () => new THREE.SphereGeometry(0.16, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), COL(helmet)); h.position.set(0, 0.74, 0.03); h.castShadow = true; g.add(h);
  g.add(box(0.1, 0.4, 0.1, COL(0x24344a), -0.12, -0.2, 0.08, true)); g.add(box(0.1, 0.4, 0.1, COL(0x24344a), 0.12, -0.2, 0.08, true));
  for (const s of [-1, 1]) { const a = box(0.08, 0.45, 0.08, COL(shirt), s * 0.24, 0.28, 0.15, true); a.rotation.x = -0.9; g.add(a); }
  g.rotation.x = lean; return g;
}
const def = (mesh, o) => Object.assign({ mesh, y0: 0, kind: 'stumble' }, o);

// ---- vehicles on two wheels
export function makeScooter(oncoming = true) {
  const p = fitProp('motorcycle', { len: 1.9 });
  const g = new THREE.Group(); g.add(p.g);
  const tints = [0xd8322a, 0x2a6fc0, 0x2a9a5a, 0xf0a020]; const sh = pick(tints);
  p.g.traverse((m) => { if (m.isMesh && m.material.name === 'DarkPurple') { m.material = mat('scoot' + sh, () => std({ color: sh, roughness: 0.5 })); } });
  const r = riderFigure(pick([0xf2f2f2, 0xd8322a, 0x2a6fc0, 0xf0c030, 0x3a9a5a])); r.position.set(0, 0.62, -0.05); g.add(r);
  g.rotation.y = oncoming ? 0 : Math.PI; const wrap = new THREE.Group(); wrap.add(g);
  return def(wrap, { hx: 0.5, hz: 1.0, y1: 1.5, name: 'scooter', vehicle: 'car', vz: oncoming ? 13 : -5.5 });
}
export function makeBicycle() {
  const g = new THREE.Group(); const tireM = COL(0x151515), frameM = COL(pick([0xd8322a, 0x2a6fc0, 0x2a9a5a]));
  for (const z of [-0.5, 0.5]) { const w = new THREE.Mesh(geo('bikewheel', () => new THREE.TorusGeometry(0.34, 0.035, 6, 16)), tireM); w.rotation.y = Math.PI / 2; w.position.set(0, 0.36, z); g.add(w); w.castShadow = true; }
  const bar = (len, rx, y, z) => { const b = box(0.05, 0.05, len, frameM, 0, y, z, true); b.rotation.x = rx; return b; };
  g.add(bar(0.9, 0, 0.55, 0)); g.add(bar(0.7, 0.9, 0.55, -0.3)); g.add(bar(0.6, -0.9, 0.5, 0.25)); g.add(box(0.5, 0.04, 0.04, COL(0x222222), 0, 0.98, 0.5)); g.add(box(0.1, 0.05, 0.25, COL(0x222222), 0, 0.88, -0.35));
  const r = riderFigure(pick([0xf0c030, 0x2a6fc0, 0xd8322a]), 0xffffff, -0.35); r.position.set(0, 0.95, -0.12); g.add(r);
  g.rotation.y = Math.PI; const wrap = new THREE.Group(); wrap.add(g);
  return def(wrap, { hx: 0.4, hz: 0.85, y1: 1.7, name: 'bicycle', vehicle: 'car', vz: -4.2 });
}
// ---- street carts / stalls / crates
const CART_NAMES = [['DHOLL PURI', '#e0a020'], ['GATO PIMENT', '#2a9a5a'], ['ALOUDA FRAIS', '#d8559a'], ['MINE FRIT', '#d8322a']];
export function makeDholl() {
  const [nm, col] = pick(CART_NAMES); const g = new THREE.Group();
  g.add(box(1.5, 0.8, 1.0, COL(0x1aa29a), 0, 0.75, 0, true)); g.add(box(1.56, 0.08, 1.06, COL(0xf2f2f0), 0, 1.18, 0));
  const glass = new THREE.Mesh(geo('cartglass', () => new THREE.BoxGeometry(1.3, 0.38, 0.8)), mat('cartglass', () => std({ color: 0xcfe9ff, transparent: true, opacity: 0.45 }))); glass.position.set(0, 1.42, 0); g.add(glass);
  g.add(cyl(0.04, 0.04, 1.9, 6, COL(0x555a63), 0, 1.6, 0.35)); 
  const um = new THREE.Mesh(geo('umb', () => new THREE.ConeGeometry(1.05, 0.45, 10)), mat('umb', () => std({ map: T.stripeTex('#e8302a', '#fff4d6'), side: THREE.DoubleSide }))); um.position.set(0, 2.5, 0.35); um.castShadow = true; g.add(um);
  for (const s of [-1, 1]) { const w = cyl(0.34, 0.34, 0.1, 12, COL(0x1a1a1a), s * 0.78, 0.34, 0.1); w.rotation.z = Math.PI / 2; g.add(w); }
  for (const z of [0.55, -0.55]) { const sg = new THREE.Mesh(geo('cartsign', () => new THREE.PlaneGeometry(1.3, 0.36)), new THREE.MeshBasicMaterial({ map: T.signTex(nm, { bg: col, fg: '#fff', w: 256, h: 72 }), side: THREE.DoubleSide })); sg.position.set(0, 0.75, z * 0.97); if (z < 0) sg.rotation.y = Math.PI; g.add(sg); }
  g.add(sphere(0.14, skinM(), -0.5, 1.8, -0.3)); g.add(box(0.32, 0.5, 0.2, COL(0xf4f4f0), -0.5, 1.45, -0.3, true));
  return def(g, { hx: 0.82, hz: 0.65, y1: 1.4, name: 'dholl', walkable: true, roof: true });
}
export function makeStall() {
  const p = fitProp('stall', { width: 2.25 }); const g = new THREE.Group(); g.add(p.g);
  return def(g, { hx: 1.1, hz: Math.max(0.9, p.l / 2), y1: p.h * 0.95, name: 'stall', avoid: true, walkable: true, roof: true });
}
export function makeCrates() {
  const g = new THREE.Group(); const w = 1.15;
  const mk = () => fitProp('fruitcrate', { width: w }).g;
  const layout = [[-0.58, 0, 0], [0.58, 0, 0], [0, 0.42, 0], [-0.58, 0, 0.7], [0.58, 0, 0.7]];
  for (const [x, y, z] of layout) { const c = mk(); c.position.set(x, y, z); c.rotation.y = rand(-0.15, 0.15); g.add(c); }
  return def(g, { hx: 1.15, hz: 0.7, y1: 0.95, name: 'crates' });
}
// ---- farm / road vehicles
export function makeCaneTruck() {
  const g = new THREE.Group(); const red = COL(0xc8402a), dark = COL(0x24272c);
  g.add(box(2.0, 0.4, 5.6, dark, 0, 0.75, 0, true));
  g.add(box(1.9, 1.5, 1.4, red, 0, 1.7, 2.2, true)); g.add(box(1.7, 0.5, 0.06, mat('cabglass', () => std({ color: 0x9fd0ee })), 0, 2.15, 2.92));
  const load = new THREE.Mesh(geo('caneload', () => new THREE.BoxGeometry(1.95, 1.7, 3.6)), mat('caneload', () => { const t = T.caneTex().clone(); t.needsUpdate = true; t.repeat.set(2, 1); return std({ map: t }); }));
  load.position.set(0, 1.9, -0.9); load.castShadow = true; g.add(load);
  for (let i = 0; i < 7; i++) { const s = cyl(0.04, 0.04, 1.4, 5, COL(0x9cc84a), rand(-0.8, 0.8), 3.1, rand(-2.4, 0.5), true); s.rotation.set(rand(-0.4, 0.4), 0, rand(-0.5, 0.5)); g.add(s); }
  for (const z of [-2.0, -0.9, 2.1]) for (const s of [-1, 1]) { const w = cyl(0.46, 0.46, 0.34, 12, COL(0x151515), s * 1.0, 0.46, z); w.rotation.z = Math.PI / 2; g.add(w); }
  return def(g, { hx: 1.05, hz: 2.9, y1: 3.0, kind: 'crash', name: 'canetruck', vehicle: 'bus', walkable: true, roof: true });
}
export function makeCaneTrailer() { // flat, walkable bed (ramp up with makeRamp(1.6))
  const g = new THREE.Group(); const bedM = COL(0x6a4a2c);
  g.add(box(2.0, 0.22, 6.4, bedM, 0, 1.5, 0, true)); g.add(box(1.7, 0.4, 6.0, COL(0x24272c), 0, 1.15, 0));
  for (const z of [-2.0, -1.0, 2.2]) for (const s of [-1, 1]) { const w = cyl(0.55, 0.55, 0.34, 12, COL(0x151515), s * 1.0, 0.55, z); w.rotation.z = Math.PI / 2; g.add(w); }
  for (const s of [-1, 1]) g.add(box(0.1, 0.35, 6.4, COL(0xc8402a), s * 1.0, 1.75, 0));
  return def(g, { hx: 1.05, hz: 3.2, y1: 1.62, kind: 'crash', name: 'trailer', platform: true, walkable: true, vehicle: 'bus' });
}
export function makeTractor() {
  const g = new THREE.Group(); const body = COL(0x2e8a3a), dark = COL(0x151515);
  g.add(box(1.0, 0.9, 1.9, body, 0, 1.0, 0.5, true)); g.add(box(1.2, 1.2, 1.0, body, 0, 1.9, -0.6, true)); g.add(box(1.26, 0.1, 1.1, COL(0xdddddd), 0, 2.55, -0.6)); g.add(box(1.0, 0.6, 0.06, mat('cabglass', () => std({ color: 0x9fd0ee })), 0, 1.95, 0.0));
  g.add(cyl(0.07, 0.07, 0.8, 6, dark, 0.2, 2.0, 1.4));
  for (const s of [-1, 1]) { const w = cyl(0.8, 0.8, 0.42, 16, dark, s * 0.78, 0.8, -0.7); w.rotation.z = Math.PI / 2; g.add(w); const f = cyl(0.4, 0.4, 0.3, 12, dark, s * 0.62, 0.4, 1.3); f.rotation.z = Math.PI / 2; g.add(f); }
  g.rotation.y = Math.PI; const wrap = new THREE.Group(); wrap.add(g);
  return def(wrap, { hx: 1.05, hz: 1.4, y1: 2.5, name: 'tractor', avoid: true, vehicle: 'car', vz: -4.5, walkable: true, roof: true });
}
// ---- road surface hazards
export function makePothole() {
  const g = new THREE.Group();
  const hole = new THREE.Mesh(geo('pothole', () => new THREE.CircleGeometry(0.95, 14)), mat('pothole', () => std({ color: 0x1a1512, roughness: 1 }))); hole.rotation.x = -Math.PI / 2; hole.position.y = 0.035; hole.scale.set(1.0, 1.0, 0.8); g.add(hole);
  const rim = new THREE.Mesh(geo('potrim', () => new THREE.RingGeometry(0.92, 1.12, 14)), mat('potrim', () => std({ color: 0x777067, roughness: 1 }))); rim.rotation.x = -Math.PI / 2; rim.position.y = 0.032; rim.scale.set(1, 1, 0.8); g.add(rim);
  return def(g, { hx: 0.95, hz: 0.7, y1: 0.45, name: 'pothole' });
}
export function makePuddle() {
  const g = new THREE.Group();
  const p = new THREE.Mesh(geo('puddle', () => new THREE.CircleGeometry(1.15, 18)), mat('puddle', () => new THREE.MeshStandardMaterial({ color: 0x5aa8d8, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.75 }))); p.rotation.x = -Math.PI / 2; p.position.y = 0.04; p.scale.set(1.0, 1.0, 1.3); g.add(p);
  return def(g, { hx: 1.1, hz: 1.3, y1: 0.4, kind: 'slow', name: 'puddle' });
}
// ---- nature
export function makeLog(width = 2.4) {
  const g = new THREE.Group(); const bark = mat('bark', () => std({ color: 0x7a5a3a })), rings = mat('rings', () => std({ map: T.woodRingTex() }));
  const log = new THREE.Mesh(geo(`log${width}`, () => new THREE.CylinderGeometry(0.4, 0.42, width, 10)), [bark, rings, rings]); log.rotation.z = Math.PI / 2; log.position.y = 0.42; log.castShadow = true; g.add(log);
  for (const s of [-1, 1]) { const f = new THREE.Mesh(geo('logfrond', () => new THREE.PlaneGeometry(0.6, 1.3)), mat('leafd', () => std({ color: 0x2f8f3a, side: THREE.DoubleSide }))); f.position.set(s * width / 2, 0.7, 0); f.rotation.set(0.3, 0, s * 1.2); if (width < 3) { g.add(f); } }
  if (width < 3) for (const x of [-0.4, 0.3]) g.add(sphere(0.16, COL(0x5a3d1c), x, 0.2, 0.5));
  return def(g, { hx: width / 2, hz: 0.45, y1: 0.85, name: 'log' });
}
export function makeBranch() {
  const g = new THREE.Group(); const bark = mat('bark', () => std({ color: 0x7a5a3a })), leaf = mat('leafd2', () => std({ color: 0x2f8f3a }));
  for (const s of [-1, 1]) g.add(cyl(0.2, 0.26, 1.5, 7, bark, s * 1.25, 0.75, 0, true));
  const br = cyl(0.16, 0.2, 2.9, 7, bark, 0, 1.7, 0, true); br.rotation.z = Math.PI / 2; g.add(br);
  for (const [x, y, z, r] of [[-0.9, 1.45, 0.1, 0.38], [-0.2, 1.35, -0.1, 0.45], [0.6, 1.5, 0.1, 0.4], [0.2, 1.8, 0, 0.35], [-1.2, 1.85, 0, 0.32]]) g.add(sphere(r, leaf, x, y, z, 1.3, 0.8, 1, 8));
  return def(g, { hx: 1.35, hz: 0.4, y0: 1.05, y1: 2.2, name: 'branch', slide: true });
}
export function makeRock() {
  const k = pick(['rock1', 'rock3']); const p = fitProp(k, { width: 1.5 });
  const g = new THREE.Group(); g.add(p.g); p.g.rotation.y = rand(0, 6);
  return def(g, { hx: 0.8, hz: 0.8, y1: Math.min(1.0, p.h * 0.9), name: 'rock' });
}
export function makeLavaRock() {
  const g = new THREE.Group(); const m = mat('lavarock', () => { const t = T.lavaTex().clone(); t.needsUpdate = true; t.repeat.set(2, 2); return std({ map: t, flatShading: true }); });
  for (const [x, z, r, sy] of [[-0.35, 0, 1.0, 1.3], [0.55, 0.3, 0.7, 1.0], [0.1, -0.5, 0.6, 0.9]]) { const s = new THREE.Mesh(geo('lavaico', () => new THREE.IcosahedronGeometry(1, 1)), m); s.scale.set(r * 1.1, r * sy, r); s.position.set(x, r * sy * 0.8, z); s.rotation.y = rand(0, 6); s.castShadow = true; g.add(s); }
  return def(g, { hx: 1.15, hz: 0.9, y1: 2.0, name: 'lavarock', avoid: true });
}
export function makeBench() {
  const g = new THREE.Group(); const wood = COL(0x8a5a30), iron = COL(0x24272c);
  g.add(box(1.8, 0.1, 0.45, wood, 0, 0.55, 0, true)); const back = box(1.8, 0.4, 0.08, wood, 0, 0.9, -0.22, true); back.rotation.x = 0.2; g.add(back);
  for (const s of [-1, 1]) { g.add(box(0.08, 0.55, 0.45, iron, s * 0.8, 0.28, 0, true)); }
  return def(g, { hx: 0.95, hz: 0.3, y1: 1.1, name: 'bench' });
}
export function makeWheelbarrow() {
  const g = new THREE.Group();
  const tray = box(0.8, 0.35, 1.0, COL(0x2e8a3a), 0, 0.65, 0.1, true); g.add(tray);
  const w = cyl(0.28, 0.28, 0.1, 12, COL(0x151515), 0, 0.28, 0.75); w.rotation.z = Math.PI / 2; g.add(w);
  for (const s of [-1, 1]) { const h = box(0.06, 0.06, 0.9, COL(0x8a5a30), s * 0.3, 0.7, -0.75, true); h.rotation.x = -0.25; g.add(h); g.add(box(0.06, 0.6, 0.06, COL(0x8a5a30), s * 0.3, 0.3, -0.25)); }
  for (const [x, z, c] of [[-0.2, 0.2, 0xc88a2a], [0.15, 0.3, 0xd8322a], [0.1, -0.1, 0xf0c030]]) g.add(sphere(0.17, COL(c), x, 0.95, z, 1, 1, 1, 7));
  return def(g, { hx: 0.55, hz: 0.95, y1: 1.0, name: 'wheelbarrow' });
}
export function makeTortoise() {
  const g = new THREE.Group(); const shell = mat('shell', () => std({ color: 0x6b5a34, roughness: 0.9 })), skin = COL(0x7a7a5a);
  g.add(sphere(0.62, shell, 0, 0.48, 0, 1.0, 0.65, 1.3, 12));
  g.add(sphere(0.17, skin, 0, 0.55, -0.95, 0.9, 0.9, 1.3, 8)); g.children[1].rotation.x = 0.0;
  for (const [x, z] of [[-0.45, -0.5], [0.45, -0.5], [-0.45, 0.5], [0.45, 0.5]]) g.add(box(0.2, 0.3, 0.25, skin, x, 0.15, z, true));
  g.rotation.y = 0; return def(g, { hx: 0.65, hz: 0.85, y1: 0.95, name: 'tortoise', vz: -1.4 });
}
export function makeCrab() {
  const g = new THREE.Group(); const red = mat('crab', () => std({ color: 0xd8442a, roughness: 0.6 }));
  g.add(sphere(0.34, red, 0, 0.3, 0, 1.4, 0.55, 1, 10));
  for (const s of [-1, 1]) { g.add(sphere(0.14, red, s * 0.65, 0.34, 0.25, 1, 0.8, 1, 6)); g.add(box(0.05, 0.05, 0.4, red, s * 0.7, 0.35, 0.14)); for (let i = 0; i < 3; i++) { const l = box(0.4, 0.04, 0.04, red, s * 0.55, 0.18, -0.12 + i * 0.12); l.rotation.z = s * 0.6; g.add(l); } g.add(sphere(0.045, COL(0x111111), s * 0.14, 0.52, 0.28, 1, 1, 1, 6)); }
  const wrap = new THREE.Group(); wrap.add(g); wrap.scale.setScalar(1.25);
  return def(wrap, { hx: 0.6, hz: 0.4, y1: 0.6, name: 'crab', cross: { speed: 3.4, lowAnim: true } });
}
export function makePirogue() {
  const p = fitProp('boat', { len: 4.2 }); const g = new THREE.Group(); g.add(p.g);
  const stripe = box(0.1, 0.2, p.l * 0.9, COL(0x2a9ad8), 0, p.h * 0.55, 0); p.g.add(stripe);
  return def(g, { hx: Math.min(1.1, p.w / 2), hz: p.l / 2, y1: Math.min(0.95, p.h * 0.95), name: 'pirogue' });
}
// ---- animals that dash across the road when the player gets close
function animalObs(kind, h, clip, { len = 1.2, y1 = 1.0, name, speed = 5, rotY, idleClip = /^Idle$/, tint } = {}) {
  const a = makeAnimal(kind, h, idleClip, { rotY: Math.PI / 2, tint }); const run = makeAnimal(kind, h, clip, { rotY: Math.PI / 2, tint });
  const g = new THREE.Group(); g.add(a.group); g.add(run.group); run.group.visible = false;
  const o = def(g, { hx: len / 2, hz: 0.45, y1, name, cross: { speed, idle: a, run }, mixers: [a.mixer, run.mixer] });
  return o;
}
export const makeDog = () => animalObs('shiba', 0.85, /^Gallop$/, { len: 1.2, y1: 0.85, name: 'dog', speed: 6 });
export const makeDeer = () => animalObs('deer', 1.6, /^Gallop$/, { len: 1.9, y1: 1.5, name: 'deer', speed: 8 });
export const makeBoar = () => animalObs('pig', 0.85, /Run$/, { len: 1.3, y1: 0.85, name: 'boar', speed: 6.5 });
export function makeGoat() {
  const a = makeAnimal('sheep', 0.95, /Idle/, { rotY: Math.PI / 2, tint: { White: 0xcfae86, Black: 0x4a3626 } }); const g = new THREE.Group(); g.add(a.group);
  return def(g, { hx: 0.55, hz: 0.7, y1: 1.0, name: 'goat', mixers: [a.mixer] });
}
export function makeCow() {
  const a = makeAnimal('cow', 1.45, /^Idle$/, { rotY: Math.PI }); const g = new THREE.Group(); g.add(a.group);
  return def(g, { hx: 0.65, hz: 1.2, y1: 1.5, name: 'cow', avoid: true, mixers: [a.mixer] });
}
export function makeChickens() {
  const g = new THREE.Group(); const mixers = [];
  for (const [x, z] of [[-0.55, 0], [0.1, 0.35], [0.7, -0.2]]) { const a = makeAnimal('chicken', 0.5, /Walk/, { rotY: Math.PI / 2 }); a.group.position.set(x, 0, z); g.add(a.group); mixers.push(a.mixer); }
  return def(g, { hx: 1.1, hz: 0.5, y1: 0.55, name: 'chickens', mixers, cross: { speed: 2.6 } });
}

// A creole cottage sitting in a lane — jump or ramp onto the roof and run across it.
export function makeHouse() {
  const g = new THREE.Group();
  const wall = COL(pick([0xf4e6c8, 0xf0b0a0, 0x9fd8d0, 0xf2d070, 0xfaf4ea]));
  const roofC = COL(pick([0xb4442a, 0x3a7a5a, 0x555a63, 0x9a3a2a]));
  g.add(box(2.0, 2.2, 3.4, wall, 0, 1.1, 0, true));
  const r = new THREE.Mesh(geo('hroof', () => new THREE.ConeGeometry(1, 1, 4)), roofC);
  r.scale.set(1.55, 1.2, 2.2); r.position.set(0, 2.8, 0); r.rotation.y = Math.PI / 4; r.castShadow = true; g.add(r);
  g.add(box(0.08, 0.8, 0.8, COL(0x2a3a4a), 1.02, 1.4, -0.6)); g.add(box(0.08, 1.4, 0.6, COL(0x6a3a22), 1.02, 0.7, 0.5));
  return def(g, { hx: 1.05, hz: 1.8, y1: 2.35, kind: 'stumble', name: 'house', walkable: true, roof: true, avoid: true });
}


function wheel(g, xOff, z, r = 0.42) {
  for (const s of [-1, 1]) { const w = cyl(r, r, 0.32, 12, COL(0x151515), s * xOff, r, z); w.rotation.z = Math.PI / 2; g.add(w); }
}

// ---- extra vehicles (same API as makeCar / makeScooter; rooftop-runnable when not oncoming)
function blinkers(g, y, z0, z1) {
  const off = COL(0x331800), on = new THREE.MeshBasicMaterial({ color: 0xffae00 });
  const L = box(0.12, 0.1, 0.18, off, -0.85, y, z0); const R = box(0.12, 0.1, 0.18, off, 0.85, y, z0);
  const L2 = box(0.12, 0.1, 0.18, off, -0.85, y, z1); const R2 = box(0.12, 0.1, 0.18, off, 0.85, y, z1);
  g.add(L, R, L2, R2);
  g.userData.indicators = { L: [L, L2], R: [R, R2], on, off: L.material };
}

export function makeVan() {
  const g = new THREE.Group();
  const body = COL(pick([0xf2f2f0, 0x2a6fc0, 0xe8d8a0, 0x4a4a4a]));
  g.add(box(1.9, 1.8, 3.6, body, 0, 1.15, 0, true));
  g.add(box(1.86, 0.7, 1.2, COL(0x223040), 0, 1.55, 1.15));
  wheel(g, 0.9, -1.1); wheel(g, 0.9, 1.15);
  blinkers(g, 0.45, 1.85, -1.85);
  return def(g, { hx: 1.0, hz: 1.9, y1: 2.05, kind: 'crash', name: 'van', walkable: true, roof: true, vehicle: 'car' });
}
export function makeSuv() {
  const g = new THREE.Group();
  const body = COL(pick([0x2a3a2a, 0x6a4a2a, 0xc8c8c4, 0x1a1a1a, 0xe8e0d0]));
  g.add(box(2.0, 1.35, 3.8, body, 0, 0.95, 0, true));
  g.add(box(1.9, 0.7, 1.5, COL(0x223040), 0, 1.55, 0.4));
  wheel(g, 1.0, -1.2); wheel(g, 1.0, 1.2);
  blinkers(g, 0.4, 1.95, -1.95);
  return def(g, { hx: 1.05, hz: 2.0, y1: 1.7, kind: 'crash', name: 'suv', walkable: true, roof: true, vehicle: 'car' });
}
export function makeTaxi() {
  const g = new THREE.Group();
  g.add(box(1.85, 1.15, 3.7, COL(0xf2c400), 0, 0.85, 0, true));
  g.add(box(1.8, 0.65, 1.4, COL(0x223040), 0, 1.45, 0.2));
  g.add(box(0.4, 0.12, 0.5, COL(0x111111), 0, 1.55, 0.1)); // roof sign
  wheel(g, 0.9, -1.15); wheel(g, 0.9, 1.15);
  blinkers(g, 0.4, 1.9, -1.9);
  return def(g, { hx: 0.98, hz: 1.95, kind: 'crash', name: 'taxi', y1: 1.5, walkable: true, roof: true, vehicle: 'car' });
}
export function makeTaptap() {
  const g = new THREE.Group();
  const body = COL(pick([0xd8322a, 0x2a6fc0, 0xe0a020, 0x1e7a46, 0xb0286a]));
  g.add(box(2.05, 2.15, 5.2, body, 0, 1.25, 0, true));
  g.add(box(2.0, 0.7, 1.4, COL(0x223040), 0, 1.7, 1.7));
  // colourful trim
  g.add(box(2.08, 0.12, 5.22, COL(0xf2c400), 0, 2.25, 0));
  wheel(g, 1.05, -1.7); wheel(g, 1.05, 1.7);
  blinkers(g, 0.45, 2.65, -2.65);
  return def(g, { hx: 1.08, hz: 2.7, y1: 2.35, kind: 'crash', name: 'taptap', walkable: true, roof: true, vehicle: 'bus' });
}
export function makeLorry() {
  const g = new THREE.Group();
  g.add(box(2.1, 1.5, 2.2, COL(0xc8c4b8), 0, 1.1, 2.0, true));
  g.add(box(2.05, 0.7, 1.4, COL(0x223040), 0, 1.7, 2.15));
  g.add(box(2.15, 1.8, 4.4, COL(pick([0x4a4a4a, 0x2a5a8a, 0x8a6a3a])), 0, 1.7, -1.0, true));
  wheel(g, 1.1, 2.1); wheel(g, 1.1, -0.4); wheel(g, 1.1, -2.2);
  blinkers(g, 0.5, 3.1, -3.2);
  return def(g, { hx: 1.12, hz: 3.3, y1: 2.6, kind: 'crash', name: 'lorry', walkable: true, roof: true, vehicle: 'bus' });
}
export function makeParkedCar() {
  const o = (Math.random() < 0.5 ? makeTaxi : makeSuv)();
  o.vz = 0; o.name = 'parked'; return o;
}
export function makeCoconuts() {
  const g = new THREE.Group();
  const husk = COL(0x6a4a22), green = COL(0x3a7a32);
  for (let i = 0; i < 7; i++) {
    const s = new THREE.Mesh(geo('coco', () => new THREE.SphereGeometry(0.22, 8, 6)), i % 2 ? husk : green);
    s.position.set((i % 3 - 1) * 0.4, 0.22 + (i % 2) * 0.15, (Math.floor(i / 3) - 0.5) * 0.4);
    g.add(s);
  }
  return def(g, { hx: 0.8, hz: 0.7, y1: 0.7, kind: 'stumble', name: 'coconuts' });
}
export function makeNets() {
  const g = new THREE.Group();
  const m = new THREE.Mesh(geo('nets', () => new THREE.PlaneGeometry(1.8, 1.1, 4, 3)), new THREE.MeshStandardMaterial({ color: 0xd8d0b8, transparent: true, opacity: 0.75, side: THREE.DoubleSide, wireframe: true }));
  m.rotation.x = -0.9; m.position.set(0, 0.3, 0); g.add(m);
  g.add(box(1.6, 0.2, 0.8, COL(0x6a4a2a), 0, 0.12, 0));
  return def(g, { hx: 0.95, hz: 0.7, y1: 0.55, kind: 'stumble', name: 'nets', slide: true });
}
export function makeMonkey() {
  // procedural vervet-ish: small, dashes across like a dog
  const g = new THREE.Group();
  const fur = COL(0x7a5a3a);
  g.add(box(0.28, 0.4, 0.45, fur, 0, 0.5, 0));
  g.add(box(0.22, 0.22, 0.22, COL(0xc8b090), 0, 0.85, 0.15));
  g.add(box(0.08, 0.28, 0.08, fur, -0.12, 0.22, 0.1));
  g.add(box(0.08, 0.28, 0.08, fur, 0.12, 0.22, 0.1));
  const o = def(g, { hx: 0.4, hz: 0.4, y1: 0.9, name: 'monkey', cross: { speed: 7.2 } });
  return o;
}
