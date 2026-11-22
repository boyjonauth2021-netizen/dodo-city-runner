import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { LANE_W, CHUNK_LEN } from './config.js';
import * as T from './textures.js';
import { sectionAt } from './routes.js';

export const assets = {};
export const MORIS_MODELS = ['man', 'woman_casual', 'woman_dress', 'woman_tank', 'adventurer', 'farmer', 'worker', 'officer', 'shiba', 'chicken', 'cow', 'pig', 'deer', 'sheep', 'boat', 'truck', 'motorcycle', 'stall', 'rock1', 'rock2', 'rock3', 'fruitcrate', 'palm', 'sailboat'];
const loader = new GLTFLoader();
const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));

export async function loadAssets(onProgress) {
  const list = {
    dodo: 'assets/models/dodo-extinct-bird.glb', chef: 'assets/models/Chef_Male.glb',
    cone: 'assets/models/city/TrafficCone.glb', car1: 'assets/models/city/NormalCar1.glb', car2: 'assets/models/city/NormalCar2.glb',
    suv: 'assets/models/city/SUV.glb', taxi: 'assets/models/city/Taxi.glb', cop: 'assets/models/city/Cop.glb', suit: 'assets/models/Suit_Male.glb',
  };
  for (const k of MORIS_MODELS) list['m_' + k] = `assets/models/moris/${k}.glb`;
  const keys = Object.keys(list); let n = 0;
  await Promise.all(keys.map(async (k) => { assets[k] = await load(list[k]); onProgress && onProgress(++n / keys.length); }));
  prepDodo(); prepChef(); prepProps();
}

function normalize(obj, { height, length }) {
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3());
  const k = height ? height / s.y : length / s.z;
  obj.scale.multiplyScalar(k);
  const b2 = new THREE.Box3().setFromObject(obj), c = b2.getCenter(new THREE.Vector3());
  obj.position.set(-c.x, -b2.min.y, -c.z);
  const g = new THREE.Group(); g.add(obj); return g;
}


// ---- Dodo: "Dodo [ Extinct Bird ]" by BlueMesh (CC BY 4.0). Skinned model with a 21-bone skeleton and ONE idle clip
// (6 s breathing / beak / foot-shift loop). There is no run clip, so the idle clip plays as the "life" layer
// (neck, beak, breathing) and game.js drives the feet / spine / neck bones procedurally for the run, jump and slide.
// Scene space of the GLB: +Y up, +Z = the dodo's forward (beak). Units are model units (~9.7 tall).
const FOOT_BONES = ['Bone006_Armature002', 'Bone007_Armature002'];     // left (-x) / right (+x) foot (single bone per leg)
const RIG_BONES = { hip: 'Bone_Armature002', spine: 'Bone001_Armature002', chest: 'Bone002_Armature002', neck1: 'Bone003_Armature002', neck2: 'Bone004_Armature002', neck3: 'Bone005_Armature002', head: 'Bone009_Armature002' };
function prepDodo() {
  const scene = assets.dodo.scene;
  scene.updateMatrixWorld(true);
  const bones = {}; scene.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  // The exported eye mesh (Sphere.001_0) lost its node transform (sits ~60 units off the head), so hide it and
  // build two small glossy eyes that are attached to the head bone instead.
  scene.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    o.frustumCulled = false; o.castShadow = true;
    if (o.name.startsWith('Sphere001')) { o.visible = false; return; }
    if (o.material) { o.material.side = THREE.FrontSide; if (o.material.metalness > 0.2) o.material.metalness = 0.05; }
  });
  const head = bones[RIG_BONES.head];
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 0.15, metalness: 0.1 });
  const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), eyeMat); eye.name = 'dodoEye';
    const glint = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), glintMat); glint.position.set(sx * 0.03, 0.06, 0.1); eye.add(glint);
    eye.position.set(sx * 0.47, 3.46, 2.62); scene.add(eye); head.attach(eye); eye.castShadow = false;
  }
  scene.updateMatrixWorld(true);
  // Size from the bind pose of the body + claws (skinned bounding box). Feet soles sit at the bottom.
  const box = new THREE.Box3();
  scene.traverse((o) => { if (o.isSkinnedMesh && o.visible) { o.computeBoundingBox(); const b = o.boundingBox.clone().applyMatrix4(o.matrixWorld); box.union(b); } });
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const h = 1.7, k = h / size.y;
  // Rig helper data: how to express "scene-space" offsets (forward / up / side) in the parent space of the foot bones.
  const par = bones[FOOT_BONES[0]].parent; par.updateWorldMatrix(true, false);
  const pm = new THREE.Matrix4().extractRotation(par.matrixWorld); // rotation only
  const ps = new THREE.Vector3().setFromMatrixScale(par.matrixWorld).x;
  const inv = pm.clone().invert();
  const pq = new THREE.Quaternion().setFromRotationMatrix(pm);
  const rest = {}; for (const n of [...FOOT_BONES, ...Object.values(RIG_BONES)]) rest[n] = { p: bones[n].position.clone(), q: bones[n].quaternion.clone() };
  assets.dodoRig = { inv, pq, ps, rest };
  assets.dodoInfo = { size: size.toArray(), k, bones: Object.keys(bones).length, clips: assets.dodo.animations.map((a) => a.name + ':' + a.duration) };
  const inner = new THREE.Group(); inner.add(scene);
  scene.position.set(-c.x, -box.min.y, -c.z);
  inner.scale.setScalar(k);
  inner.rotation.y = Math.PI; // model faces +Z -> run toward -Z
  assets.dodoTemplate = inner;
}
function prepChef() {
  const s = assets.chef.scene; s.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false; } });
  const b = new THREE.Box3().setFromObject(s); assets.chefScale = 1.9 / b.getSize(new THREE.Vector3()).y;
}
function prepProps() {
  const mk = (key, len) => { const o = SkeletonUtils.clone(assets[key].scene); o.traverse((m) => { if (m.isMesh) { m.castShadow = true; } }); return normalize(o, { length: len }); };
  assets.carFactory = {
    car1: () => mk('car1', 4.2), car2: () => mk('car2', 4.2), suv: () => mk('suv', 4.4), taxi: () => mk('taxi', 4.3), cop: () => mk('cop', 4.0),
  };
  assets.coneFactory = () => { const o = SkeletonUtils.clone(assets.cone.scene); o.traverse((m) => { if (m.isMesh) m.castShadow = true; }); return normalize(o, { height: 0.95 }); };
}
// Returns a Group with .userData.rig (skeleton cloned so every instance animates independently).
// The single idle clip is sampled by hand (no AnimationMixer) so game.js can layer extra bone offsets on top of it
// deterministically every frame: rig.sample(t) writes the clip's bone rotations, then game.js adds its offsets.
export function makeDodo(tint) {
  const g = SkeletonUtils.clone(assets.dodoTemplate);
  if (tint !== undefined) g.traverse((o) => { if (o.isSkinnedMesh && o.visible && o.material && o.material.map) { o.material = o.material.clone(); o.material.color.set(tint); } }); // colour variant: multiply the texture
  const bones = {}; g.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  const clip = assets.dodo.animations[0], tracks = [];
  for (const t of clip.tracks) {
    const [node, prop] = t.name.split('.'); if (prop !== 'quaternion' || !bones[node] || t.times.length < 2) continue; // foot position/rotation is driven procedurally
    tracks.push({ bone: bones[node], interp: t.createInterpolant() });
  }
  const sample = (time) => { const tt = time % clip.duration; for (const k of tracks) { const r = k.interp.evaluate(tt); k.bone.quaternion.set(r[0], r[1], r[2], r[3]); } };
  g.userData.rig = { bones, sample, duration: clip.duration, ...assets.dodoRig };
  return g;
}
export function makeChef() {
  const o = SkeletonUtils.clone(assets.chef.scene); o.scale.setScalar(assets.chefScale);
  const g = new THREE.Group(); g.add(o);
  const mixer = new THREE.AnimationMixer(o);
  const acts = {}; for (const clip of assets.chef.animations) acts[clip.name] = mixer.clipAction(clip);
  return { group: g, mixer, acts };
}

// ---------------- shared materials/geometry
const M = {};
export function mat(key, fn) { return M[key] || (M[key] = fn()); }
export const std = (p) => new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0.05, ...p });
export const basic = (p) => new THREE.MeshBasicMaterial(p);
export function ownGeo(g) { g.userData.own = true; return g; }
export function disposeTree(o) { o.traverse((m) => { if (m.isMesh && m.geometry.userData.own) m.geometry.dispose(); }); }
const G = {};
export function geo(key, fn) { return G[key] || (G[key] = fn()); }

export function box(w, h, d, material, x = 0, y = 0, z = 0, cast = false) {
  const m = new THREE.Mesh(geo(`b${w}|${h}|${d}`, () => new THREE.BoxGeometry(w, h, d)), material);
  m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = true; return m;
}
export function cyl(rt, rb, h, seg, material, x, y, z, cast = false) {
  const m = new THREE.Mesh(geo(`c${rt}|${rb}|${h}|${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg)), material);
  m.position.set(x, y, z); m.castShadow = cast; return m;
}

// ---------------- obstacle factories. Each returns {mesh, hx, hz, y0, y1, kind, walkable?, ramp?}
export const rand = (a, b) => a + Math.random() * (b - a);
export const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function makeBarrier() {
  const g = new THREE.Group();
  const stripe = mat('barrierStripe', () => std({ map: T.stripeTex('#e8302a', '#f4f4f4') }));
  const grey = mat('concrete', () => std({ color: 0xb4b6b8 }));
  g.add(box(2.0, 0.55, 0.5, stripe, 0, 0.62, 0, true)); g.add(box(0.12, 0.35, 0.5, grey, -0.8, 0.17, 0, true)); g.add(box(0.12, 0.35, 0.5, grey, 0.8, 0.17, 0, true));
  const lamp = box(0.18, 0.18, 0.18, mat('amber', () => basic({ color: 0xffa000 })), 0.8, 1.0, 0); g.add(lamp);
  const lamp2 = lamp.clone(); lamp2.position.x = -0.8; g.add(lamp2);
  return { mesh: g, hx: 1.0, hz: 0.35, y0: 0, y1: 0.92, kind: 'stumble', name: 'barrier' };
}
export function makeCones() {
  const g = new THREE.Group();
  for (const x of [-0.7, 0, 0.7]) { const c = assets.coneFactory(); c.position.set(x, 0, rand(-0.15, 0.15)); g.add(c); }
  return { mesh: g, hx: 1.05, hz: 0.45, y0: 0, y1: 0.8, kind: 'stumble', name: 'cones' };
}
export function makeBar() {
  const g = new THREE.Group();
  const metal = mat('metal', () => std({ color: 0x6e7783, metalness: 0.4, roughness: 0.5 }));
  const hz = mat('hazard', () => std({ map: T.hazardTex() }));
  g.add(box(0.25, 2.9, 0.3, metal, -1.1, 1.45, 0, true)); g.add(box(0.25, 2.9, 0.3, metal, 1.1, 1.45, 0, true));
  g.add(box(2.25, 0.5, 0.35, hz, 0, 1.2, 0, true));
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.75), new THREE.MeshBasicMaterial({ map: T.signTex('LOW BRIDGE', { bg: '#f2c400', fg: '#111', w: 512, h: 200 }) }));
  sign.position.set(0, 1.95, 0.19); g.add(sign);
  const s2 = sign.clone(); s2.position.z = -0.19; s2.rotation.y = Math.PI; g.add(s2);
  g.add(box(2.25, 0.9, 0.3, metal, 0, 2.15, 0, true));
  return { mesh: g, hx: 1.1, hz: 0.3, y0: 1.0, y1: 2.6, kind: 'stumble', name: 'bar' };
}
export function makeCar(oncoming) {
  const key = pick(['car1', 'car2', 'suv', 'taxi', 'cop']);
  const car = assets.carFactory[key]();
  const wrap = new THREE.Group(); wrap.add(car);
  const b = new THREE.Box3().setFromObject(wrap), s = b.getSize(new THREE.Vector3());
  wrap.rotation.y = oncoming ? 0 : Math.PI;
  return { mesh: wrap, hx: s.x / 2 + 0.05, hz: s.z / 2 - 0.1, y0: 0, y1: s.y * 0.95, kind: 'stumble', name: 'car', vehicle: 'car', walkable: true, roof: true };
}
export function makeBus(styleIdx = Math.floor(Math.random() * T.busStyles())) {
  const tx = T.busTextures(styleIdx);
  const L = 9, W = 2.3, H = 2.7, y = 0.45;
  const k = 'bus' + styleIdx; const side = mat(k + 's', () => std({ map: tx.side })), front = mat(k + 'f', () => std({ map: tx.front, emissive: 0x111111 })), back = mat(k + 'b', () => std({ map: tx.back })), roof = mat(k + 'r', () => std({ map: tx.roof })), dark = mat('busDark', () => std({ color: 0x222222 }));
  const body = new THREE.Mesh(ownGeo(new THREE.BoxGeometry(W, H, L)), [side, side, roof, dark, front, back]);
  body.position.y = y + H / 2; body.castShadow = true; body.receiveShadow = true;
  const g = new THREE.Group(); g.add(body);
  const wheelM = mat('wheel', () => std({ color: 0x151515 }));
  for (const [x, z] of [[-1.1, 2.9], [1.1, 2.9], [-1.1, -2.9], [1.1, -2.9]]) { const w = cyl(0.45, 0.45, 0.3, 14, wheelM, x, 0.45, z); w.rotation.z = Math.PI / 2; g.add(w); }
  g.add(box(1.0, 0.25, 1.6, mat('ac', () => std({ color: 0xbfc4c9 })), 0, y + H + 0.12, -1.5));
  return { mesh: g, hx: W / 2, hz: L / 2, y0: 0, y1: y + H, kind: 'crash', name: 'bus', vehicle: 'bus', style: styleIdx, walkable: true, roof: true };
}
export function makeTrain() {
  const tx = T.trainTextures();
  const L = 14, W = 2.25, H = 3.0, y = 0.5;
  const side = mat('trainSide', () => std({ map: tx.side, metalness: 0.2, roughness: 0.45 })), front = mat('trainFront', () => std({ map: tx.front, emissive: 0x151515 })), back = mat('trainBack', () => std({ map: tx.back })), roof = mat('trainRoof', () => std({ map: tx.roof }));
  const body = new THREE.Mesh(ownGeo(new THREE.BoxGeometry(W, H, L)), [side, side, roof, mat('trainDark', () => std({ color: 0x222222 })), front, back]);
  body.position.y = y + H / 2; body.castShadow = true; body.receiveShadow = true;
  const g = new THREE.Group(); g.add(body);
  const dark = mat('bogie', () => std({ color: 0x1c1d20 }));
  g.add(box(1.7, 0.5, L - 1.0, dark, 0, 0.27, 0));
  for (const z of [-4.5, 4.5]) g.add(box(2.0, 0.5, 2.2, dark, 0, 0.3, z));
  g.add(box(1.4, 0.22, 2.2, mat('trainAC', () => std({ color: 0xaab1b9 })), 0, y + H + 0.1, -2.5));
  g.add(box(1.4, 0.22, 2.2, mat('trainAC', () => std({ color: 0xaab1b9 })), 0, y + H + 0.1, 2.5));
  return { mesh: g, hx: W / 2, hz: L / 2, y0: 0, y1: y + H, kind: 'crash', name: 'train', vehicle: 'train', walkable: true, roof: true };
}
export function makeRamp(top) {
  const L = 6.4, g = new THREE.Group();
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(L, 0); shape.lineTo(0, top); shape.closePath();
  const eg = ownGeo(new THREE.ExtrudeGeometry(shape, { depth: 2.0, bevelEnabled: false }));
  eg.rotateY(-Math.PI / 2); eg.translate(1.0, 0, -L / 2);
  const m = new THREE.Mesh(eg, mat('ramp', () => std({ color: 0x8a919b, metalness: 0.3, roughness: 0.55 })));
  m.castShadow = true; m.receiveShadow = true; g.add(m);
  // hazard rails along the sloping edges
  const hz = mat('hazard', () => std({ map: T.hazardTex() }));
  const ang = Math.atan2(top, L), len = Math.hypot(L, top);
  for (const x of [-1.0, 1.0]) { const r = box(0.12, 0.18, len, hz, x, top / 2 + 0.05, 0); r.rotation.x = Math.atan2(top, L); r.rotation.x = -(-ang); g.add(r); }
  return { mesh: g, hx: 1.0, hz: L / 2, y0: 0, y1: top, kind: 'crash', name: 'ramp', ramp: true, walkable: true };
}

// ---------------- coin
export function makeCoin() {
  const m = new THREE.Mesh(geo('coin', () => { const g = new THREE.CylinderGeometry(0.34, 0.34, 0.09, 20); g.rotateX(Math.PI / 2); return g; }),
    mat('coin', () => new THREE.MeshStandardMaterial({ color: 0xffc928, emissive: 0xb07a00, emissiveIntensity: 0.55, metalness: 0.8, roughness: 0.25 })));
  m.castShadow = false; return m;
}

// ---------------- scenery
const STORE_NAMES = ['Boulangerie', 'Dholl Puri', 'Gâteau Piment', 'Caudan Waterfront', 'Bazar Central', 'Pharmacie', 'Alouda Frais', 'Café Port Louis', 'Chinatown', 'Epicerie', 'Mine Frire', 'Bus Terminus'];
const STORE_COLORS = [['#d8322a', '#fff'], ['#1e7a46', '#fff'], ['#f2c400', '#222'], ['#1e4fa0', '#fff'], ['#b0286a', '#fff'], ['#e07a10', '#fff']];

export function facadeMat(variant, rx, ry) {
  return mat(`f${variant}|${rx}|${ry}`, () => { const t = T.facadeTex(variant).clone(); t.needsUpdate = true; t.repeat.set(rx, ry); t.wrapS = t.wrapT = THREE.RepeatWrapping; return std({ map: t, roughness: 0.9 }); });
}
export function building(side, zc, L, D, H, variant, xNear, withShop) {
  const rx = L / 8, rz = D / 8, ry = H / 12;
  const roofM = mat('roofGrey', () => std({ color: 0x7c8087 }));
  const road = facadeMat(variant, rx, ry), sideM = facadeMat(variant, rz, ry);
  // faces order: +x,-x,+y,-y,+z,-z ; for left (side<0) road face is +x; texture on box faces maps u along z for ±x faces
  const faces = side < 0 ? [road, sideM, roofM, roofM, sideM, sideM] : [sideM, road, roofM, roofM, sideM, sideM];
  const m = new THREE.Mesh(geo(`bld${L}|${D}|${H}`, () => new THREE.BoxGeometry(D, H, L)), faces);
  const x = side * (xNear + D / 2);
  m.position.set(x, H / 2, zc);
  const g = new THREE.Group(); g.add(m);
  if (withShop) {
    const name = pick(STORE_NAMES), [bg, fg] = pick(STORE_COLORS);
    const sg = new THREE.Mesh(geo('shopSign', () => new THREE.PlaneGeometry(5, 1.25)), new THREE.MeshBasicMaterial({ map: T.signTex(name, { bg, fg, w: 512, h: 128 }) }));
    sg.position.set(side * (xNear - 0.05), 3.4, zc + rand(-1, 1)); sg.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sg);
    const aw = box(1.0, 0.25, L * 0.8, mat('awn' + bg, () => std({ color: new THREE.Color(bg) })), side * (xNear - 0.5), 2.7, zc);
    aw.rotation.z = side * 0.25; g.add(aw);
  }
  return g;
}
export function palm(x, z) {
  const g = new THREE.Group();
  const trunkM = mat('trunk', () => std({ color: 0x8a6a45 })), leafM = mat('leaf', () => std({ color: 0x2f8f3a, side: THREE.DoubleSide }));
  let y = 0, bend = 0;
  for (let i = 0; i < 4; i++) { const s = cyl(0.17 - i * 0.015, 0.2 - i * 0.015, 1.25, 7, trunkM, bend, y + 0.62, 0, true); s.rotation.z = -0.08; g.add(s); y += 1.2; bend += 0.1 * (x > 0 ? 1 : -1); }
  for (let i = 0; i < 8; i++) {
    const l = new THREE.Mesh(geo('frond', () => { const gg = new THREE.PlaneGeometry(0.55, 2.4, 1, 3); gg.translate(0, 1.2, 0); const p = gg.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k); p.setZ(k, -yy * yy * 0.12); p.setX(k, p.getX(k) * (1 - yy / 3.2)); } gg.computeVertexNormals(); return gg; }), leafM);
    l.position.set(bend, y + 0.2, 0); l.rotation.set(0, (i / 8) * Math.PI * 2, 0); l.rotateX(-1.15 + (i % 2) * 0.35); l.castShadow = true; g.add(l);
  }
  g.position.set(x, 0, z); return g;
}
export function streetLamp(side, z) {
  const g = new THREE.Group(), metal = mat('lampPole', () => std({ color: 0x3b4048, metalness: 0.5 }));
  g.add(cyl(0.08, 0.12, 6.6, 8, metal, 0, 3.3, 0, true));
  const arm = box(1.7, 0.1, 0.1, metal, -side * 0.85, 6.5, 0); g.add(arm);
  g.add(box(0.6, 0.14, 0.3, mat('lampHead', () => basic({ color: 0xfff1c4 })), -side * 1.6, 6.42, 0));
  g.position.set(side * 4.35, 0, z); return g;
}
export function gantrySign(z, text, sub) {
  const g = new THREE.Group(), metal = mat('lampPole', () => std({ color: 0x3b4048, metalness: 0.5 }));
  g.add(box(0.3, 7.6, 0.3, metal, -5.2, 3.8, 0)); g.add(box(0.3, 7.6, 0.3, metal, 5.2, 3.8, 0)); g.add(box(10.7, 0.3, 0.3, metal, 0, 7.5, 0));
  const s = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 1.9), new THREE.MeshBasicMaterial({ map: T.signTex(text, { bg: '#0a6a3c', fg: '#fff', w: 768, h: 192, sub }), side: THREE.DoubleSide }));
  s.position.set(0, 6.4, 0.2); g.add(s); g.position.z = z; return g;
}

export const hash = (n) => { let x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function chunkTheme(level, index) {
  const zc = -(index + 0.5) * CHUNK_LEN;
  const info = sectionAt(level, zc);
  if (info && info.station) return 'station';
  // Never scatter Metro stations at random — only the real stop, in order, once.
  if (level.uid === 'pl2' || level.uid === 'pl1' || (info && info.route)) return 'street';
  if (index < 2) return 'street';
  const seg = Math.floor(index / 3);
  return hash(seg * 7.7 + level.num * 3.3) < (level.stationShare || 0) ? 'station' : 'street';
}
function stationName(level, index) {
  const zc = -(index + 0.5) * CHUNK_LEN;
  const info = sectionAt(level, zc);
  if (info && info.station) return [info.station.name.toUpperCase(), 'Metro Express'];
  if (info && info.prev && info.prev.kind === 'station') return [info.prev.name.toUpperCase(), 'Metro Express'];
  return [level.name.toUpperCase(), level.region || ''];
}

export function buildChunk(level, index) {
  const theme = chunkTheme(level, index);
  const g = new THREE.Group(); g.userData = { theme, index };
  const zc = -(index + 0.5) * CHUNK_LEN;
  const L = CHUNK_LEN;
  const rnd = () => hash(index * 13.37 + level.num * 71 + Math.random() * 0.0001 + 1) ;
  // ground
  const gm = mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), rm = mat('rails', () => std({ map: T.railTex(), roughness: 0.95 }));
  const ground = new THREE.Mesh(geo('road', () => new THREE.PlaneGeometry(8, L)), theme === 'station' ? rm : gm);
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, zc); ground.receiveShadow = true; g.add(ground);
  const tiles = mat('tiles', () => { const t = T.tilesTex().clone(); t.needsUpdate = true; t.repeat.set(1, 10); t.wrapS = t.wrapT = THREE.RepeatWrapping; return std({ map: t, roughness: 0.9 }); });
  const under = mat('underGround', () => std({ color: 0x6f7377 }));
  const farGround = box(80, 0.2, L, under, 0, -0.12, zc); g.add(farGround);
  const comb = (arr) => { // partition 5 units of 8 into 8/16 blocks
    const out = []; let left = 5; while (left > 0) { const u = left >= 2 && Math.random() < 0.55 ? 2 : 1; out.push(u * 8); left -= u; } return out; };
  const heights = [12, 24, 36, 24, 12, 36];
  if (theme === 'street') {
    for (const side of [-1, 1]) {
      g.add(box(3.5, 0.2, L, tiles, side * 5.75, 0.1, zc));
      g.add(box(0.25, 0.3, L, mat('curb', () => std({ color: 0xc9c9c4 })), side * 4.1, 0.15, zc));
      let z = zc - L / 2;
      for (const len of comb()) { g.add(building(side, z + len / 2, len, 8, pick(heights) + (Math.random() < 0.2 ? 12 : 0), Math.floor(Math.random() * T.FACADES), 7.5, true)); z += len; }
      g.add(streetLamp(side, zc + side * 8)); 
      if (Math.random() < 0.6) g.add(palm(side * 5.6, zc + rand(-14, 14)));
    }
    /* street-name gantries come from applyDecor / real route */
    // parked bus stop shelter flavour
    if (Math.random() < 0.5) { const side = Math.random() < 0.5 ? -1 : 1; const sh = new THREE.Group(); sh.add(box(2.4, 0.12, 1.4, mat('shelter', () => std({ color: 0x2c6fb3 })), 0, 2.4, 0)); sh.add(box(0.1, 2.4, 0.1, mat('metal2', () => std({ color: 0x555a63 })), -1.1, 1.2, -0.6)); sh.add(box(0.1, 2.4, 0.1, mat('metal2', () => std({ color: 0x555a63 })), 1.1, 1.2, -0.6));
      const bs = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: T.signTex('BUS STOP', { bg: '#ffffff', fg: '#0b4f8a', w: 256, h: 128 }) })); bs.position.set(0, 1.6, -0.5); sh.add(bs); sh.position.set(side * 6.2, 0.2, zc + rand(-10, 10)); g.add(sh); }
  } else {
    // metro station: platforms, pillars, canopy
    const plat = mat('platform', () => std({ color: 0xcfcabd, roughness: 0.8 }));
    const white = mat('canopy', () => std({ color: 0xe9ecef })), accent = mat('pillarAcc', () => std({ color: 0x1b3f8f }));
    const lightM = mat('tube', () => basic({ color: 0xfffbe8 }));
    for (const side of [-1, 1]) {
      g.add(box(4.2, 1.0, L, plat, side * 6.1, 0.5, zc));
      const tl = box(4.2, 0.02, L, tiles, side * 6.1, 1.02, zc); g.add(tl);
      g.add(box(0.5, 0.04, L, mat('yellowLine', () => basic({ color: 0xf2c400 })), side * 4.35, 1.03, zc));
      g.add(box(0.5, 8, L, mat('stWall', () => std({ map: (() => { const t = T.tilesTex().clone(); t.needsUpdate = true; t.repeat.set(10, 3); return t; })(), color: 0xffffff, emissive: 0x6a7480, emissiveIntensity: 0.55 })), side * 8.5, 4, zc));
      for (let k = 0; k < 3; k++) {
        const pz = zc - L / 2 + (k + 0.5) * L / 3;
        g.add(box(0.7, 8.2, 0.7, white, side * 6.4, 4.1, pz, true)); g.add(box(0.74, 1.2, 0.74, accent, side * 6.4, 1.9, pz));
        const b = box(1.6, 0.5, 0.5, mat('bench', () => std({ color: 0x3d4f66 })), side * 7.6, 1.35, pz + 3.5); g.add(b);
        const ad = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.2), new THREE.MeshBasicMaterial({ map: T.signTex(pick(['VISIT MAURITIUS', 'Phoenix Beer', 'Dodo Dash!', 'Le Morne', 'Grand Baie', 'Mauritius Telecom']), { bg: pick(['#0a8f9a', '#e07a10', '#b0286a', '#2a5cb8']), fg: '#fff', w: 256, h: 176 }) }));
        ad.position.set(side * 8.2, 3.6, pz - 3); ad.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(ad);
      }
    }
    g.add(box(18, 0.4, L, mat('canopyUnder', () => std({ color: 0xdfe3e8, emissive: 0x9aa2ac, emissiveIntensity: 0.9 })), 0, 8.2, zc));
    for (let k = 0; k < 8; k++) { g.add(box(0.2, 0.08, 4, lightM, -2.4 * (k % 3 - 1) * 1.5, 7.95, zc - L / 2 + (k + 0.5) * L / 8 )); }
    const st = stationName(level, index);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(6, 1.5), new THREE.MeshBasicMaterial({ map: T.signTex(st[0], { bg: '#0b3f8f', fg: '#fff', w: 512, h: 128, sub: st[1] }), side: THREE.DoubleSide }));
    s.position.set(0, 6.6, zc); g.add(s); g.add(box(0.06, 1.6, 0.06, white, -2.9, 7.4, zc)); g.add(box(0.06, 1.6, 0.06, white, 2.9, 7.4, zc));
    for (const side of [-1, 1]) { // buildings beyond the wall
      let z = zc - L / 2; for (const len of comb()) { g.add(building(side, z + len / 2, len, 8, pick(heights) + 12, Math.floor(Math.random() * T.FACADES), 10, false)); z += len; }
    }
  }
  mergeStatic(g);
  return g;
}


// Merge static, non-shadow-casting meshes that share a material into one mesh each (cuts draw calls ~3x).
export function mergeStatic(root) {
  root.updateMatrixWorld(true);
  const buckets = new Map(), remove = [];
  const addPiece = (mat, geom) => { if (!buckets.has(mat)) buckets.set(mat, []); buckets.get(mat).push(geom); };
  root.traverse((o) => {
    if (!o.isMesh || o.castShadow || !o.geometry.attributes.uv || !o.geometry.attributes.normal) return;
    if (o.material.transparent) return;
    const m = o.matrixWorld;
    if (Array.isArray(o.material)) {
      const ng = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      for (const gr of o.geometry.groups) {
        const part = new THREE.BufferGeometry();
        for (const name of ['position', 'normal', 'uv']) { const a = ng.attributes[name]; part.setAttribute(name, new THREE.BufferAttribute(a.array.slice(gr.start * a.itemSize, (gr.start + gr.count) * a.itemSize), a.itemSize)); }
        part.applyMatrix4(m); addPiece(o.material[gr.materialIndex], part);
      }
    } else { let ng = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); const part = new THREE.BufferGeometry(); for (const name of ['position', 'normal', 'uv']) part.setAttribute(name, ng.attributes[name]); part.applyMatrix4(m); addPiece(o.material, part); }
    remove.push(o);
  });
  for (const o of remove) o.parent.remove(o);
  for (const [material, parts] of buckets) { const g = mergeGeometries(parts, false); if (!g) continue; g.userData.own = true; const mesh = new THREE.Mesh(g, material); mesh.receiveShadow = true; mesh.frustumCulled = true; root.add(mesh); }
}

export function buildBackdrop(kind) {
  const g = new THREE.Group();
  const col = kind === 'dusk' ? 0x6a5f86 : 0x6f8fae, col2 = kind === 'dusk' ? 0x8a6f8a : 0x86a4c0;
  const m1 = new THREE.MeshBasicMaterial({ color: col, fog: false }), m2 = new THREE.MeshBasicMaterial({ color: col2, fog: false });
  const mk = (x, r, h, m, z) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), m); c.position.set(x, h / 2 - 4, z); g.add(c); return c; };
  // Le Pouce (thumb), Pieter Both, ranges
  mk(-170, 90, 120, m2, -420); mk(-60, 120, 90, m2, -440); mk(120, 110, 140, m2, -430); mk(240, 100, 100, m2, -410); mk(-290, 120, 110, m2, -400);
  const thumb = mk(30, 55, 150, m1, -400); const cap = new THREE.Mesh(new THREE.SphereGeometry(16, 10, 8), m1); cap.position.set(30, 150, -400); g.add(cap);
  mk(-110, 70, 170, m1, -395); // Pieter Both style spire
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.sunTex(), fog: false, depthWrite: false, transparent: true, blending: THREE.AdditiveBlending }));
  sun.scale.set(260, 260, 1); sun.position.set(kind === 'dusk' ? 90 : 160, kind === 'dusk' ? 60 : 210, -450); g.add(sun);
  for (let i = 0; i < 7; i++) { const c = new THREE.Sprite(new THREE.SpriteMaterial({ map: T.cloudTex(), fog: false, transparent: true, opacity: kind === 'dusk' ? 0.55 : 0.85, depthWrite: false, color: kind === 'dusk' ? 0xffd0c0 : 0xffffff })); c.scale.set(rand(160, 280), rand(70, 120), 1); c.position.set(rand(-380, 380), rand(130, 260), -440); g.add(c); }
  return g;
}
