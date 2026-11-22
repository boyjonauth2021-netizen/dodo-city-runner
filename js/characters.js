// Characters: chasers (one per level theme), ambient pedestrians / animals, and the playable character list.
// All GLB characters are CC0 Quaternius (poly.pizza) except "Male Officer" (J-Toastie, CC BY 3.0). See README / Credits.
import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { assets, makeDodo } from './world.js';

const cache = new Map();
function restHeight(scene) { scene.updateMatrixWorld(true); const b = new THREE.Box3(); scene.traverse((o) => { if (o.isMesh && o.visible) { if (o.isSkinnedMesh) { o.computeBoundingBox(); b.union(o.boundingBox.clone().applyMatrix4(o.matrixWorld)); } else b.expandByObject(o); } }); return b; }
// Returns {k: scale to reach `h` metres tall, y: offset so feet sit on y=0}
function fit(src, h) {
  const key = src + '|' + h; if (cache.has(key)) return cache.get(key);
  const sc = assets[src].scene, b = restHeight(sc), size = b.getSize(new THREE.Vector3());
  const r = { k: h / (size.y || 1), y: -b.min.y * (h / (size.y || 1)) }; cache.set(key, r); return r;
}
function findClip(clips, re) { return clips.find((c) => re.test(c.name)) || null; }
function tintMaterials(root, tint) { // tint = { MaterialName: 0xrrggbb }
  if (!tint) return;
  root.traverse((o) => { if (o.isMesh && o.material) { const nm = o.material.name; if (tint[nm] !== undefined) { o.material = o.material.clone(); o.material.color.set(tint[nm]); } } });
}
function instance(src, h, { tint, shadow = false, rotY = Math.PI } = {}) {
  const f = fit(src, h);
  const o = SkeletonUtils.clone(assets[src].scene); tintMaterials(o, tint);
  o.traverse((m) => { if (m.isMesh) { m.castShadow = shadow; m.frustumCulled = false; } });
  o.scale.setScalar(f.k); o.position.y = f.y;
  const g = new THREE.Group(); g.add(o); g.rotation.y = rotY; const outer = new THREE.Group(); outer.add(g);
  return { group: outer, obj: o, clips: assets[src].animations };
}

// ------------------------------------------------------------------ chasers
export const CHASERS = {
  chef:      { src: 'chef',         h: 1.9, emoji: '👨‍🍳', name: 'Chef', run: /^Run$/, idle: /^Idle$/, hit: /^Punch$|Victory/ },
  police:    { src: 'm_officer',    h: 1.9, emoji: '👮', name: 'Policier', run: /Sprint/, idle: /^Armature\|Idle/, hit: /Grounded/ },
  tourist:   { src: 'm_woman_casual', h: 1.8, emoji: '📸', name: 'Touriste', run: /Female_Run$/, idle: /Female_Idle/, hit: /Female_Punch/ },
  gardener:  { src: 'm_worker',     h: 1.9, emoji: '🧑‍🌾', name: 'Jardinier', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  vendor:    { src: 'm_woman_dress', h: 1.8, emoji: '🧺', name: 'Marchande', run: /Female_Run$/, idle: /Female_Idle/, hit: /Female_Punch/ },
  farmer:    { src: 'm_farmer',     h: 1.9, emoji: '🧑‍🌾', name: 'Planteur', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  ranger:    { src: 'm_adventurer', h: 1.9, emoji: '🏞️', name: 'Garde-parc', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  guide:     { src: 'm_man',        h: 1.85, emoji: '🧭', name: 'Guide', run: /Man_Run$/, idle: /Man_Idle/, hit: /Man_Punch/, tint: { Shirt: 0x2f9a5a, Pants: 0x3a3226 } },
  fisherman: { src: 'm_man',        h: 1.85, emoji: '🎣', name: 'Pêcheur', run: /Man_Run$/, idle: /Man_Idle/, hit: /Man_Punch/, tint: { Shirt: 0xe8902a, Pants: 0x1f4f8f } },
  inspector:    { src: 'suit',         h: 1.9, emoji: '🕴️', name: 'Inspecteur', run: /Run$/, idle: /Idle$/, hit: /Punch|Victory/ },
  trader:       { src: 'm_woman_casual', h: 1.75, emoji: '🛍️', name: 'Boutikye', run: /Female_Run$/, idle: /Female_Idle/, hit: /Female_Punch/, tint: { Shirt: 0xc8457a } },
  surfer:       { src: 'm_adventurer', h: 1.85, emoji: '🏄', name: 'Surfeur', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  porter:       { src: 'm_worker',     h: 1.9, emoji: '🧳', name: 'Bagajiste', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  keeper:       { src: 'm_farmer',     h: 1.9, emoji: '🕯️', name: 'Gardien', run: /\|Run$/, idle: /\|Idle$/, hit: /Punch_Left/ },
  photographer: { src: 'm_man',        h: 1.85, emoji: '📷', name: 'Fotografe', run: /Man_Run$/, idle: /Man_Idle/, hit: /Man_Punch/, tint: { Shirt: 0xf2f2f0, Pants: 0x1a1a1a } },
  neighbour:    { src: 'm_man',        h: 1.85, emoji: '🏠', name: 'Vwaizin', run: /Man_Run$/, idle: /Man_Idle/, hit: /Man_Punch/, tint: { Shirt: 0x2a7a4a, Pants: 0x3a3226 } },
};
const chaserCache = {};
export function getChaser(key) {
  if (chaserCache[key]) return chaserCache[key];
  const d = CHASERS[key] || CHASERS.chef, inst = instance(d.src, d.h, { shadow: true, tint: d.tint });
  const mixer = new THREE.AnimationMixer(inst.obj), acts = {};
  const mk = (re, name) => { const c = findClip(inst.clips, re); if (c) acts[name] = mixer.clipAction(c); };
  mk(d.run, 'run'); mk(d.idle, 'idle'); mk(d.hit, 'hit');
  if (!acts.run) acts.run = mixer.clipAction(inst.clips.find((c) => /run|walk/i.test(c.name)) || inst.clips[0]);
  if (!acts.idle) acts.idle = acts.run; if (!acts.hit) acts.hit = acts.idle;
  return (chaserCache[key] = { key, def: d, group: inst.group, mixer, acts });
}

// ------------------------------------------------------------------ ambient people & animals
const PEDS = {
  man:          { src: 'm_man',          h: 1.75, walk: /Man_Walk/, idle: /Man_Idle/, tints: [{ Shirt: 0xd8452a }, { Shirt: 0x2a6fc0 }, { Shirt: 0xf0c030 }, { Shirt: 0x3a9a5a }] },
  woman_casual: { src: 'm_woman_casual', h: 1.68, walk: /Female_Walk/, idle: /Female_Idle/, tints: [{ Shirt: 0xe05a8a }, { Shirt: 0x39a0c0 }, { Shirt: 0xf2f2f2 }] },
  woman_dress:  { src: 'm_woman_dress',  h: 1.68, walk: /Female_Walk/, idle: /Female_Idle/, tints: [{ Dress: 0xd8322a }, { Dress: 0x2a8a5a }, { Dress: 0xe0a020 }, { Dress: 0x7a3a9a }] },
  woman_tank:   { src: 'm_woman_tank',   h: 1.68, walk: /Female_Walk/, idle: /Female_Idle/, tints: [{ Shirt: 0xffd23f }, { Shirt: 0x30c0b0 }, { Shirt: 0xff7a50 }] },
  adventurer:   { src: 'm_adventurer',   h: 1.8, walk: /\|Walk$/, idle: /\|Idle$/ },
  farmer:       { src: 'm_farmer',       h: 1.8, walk: /\|Walk$/, idle: /\|Idle$/ },
  worker:       { src: 'm_worker',       h: 1.8, walk: /\|Walk$/, idle: /\|Idle$/ },
  shiba:        { src: 'm_shiba',        h: 0.75, walk: /^Walk$/, idle: /^Idle$/, animal: true },
  cow:          { src: 'm_cow',          h: 1.35, walk: /^Walk$/, idle: /^Idle$/, animal: true, eat: /^Eating$/ },
  deer:         { src: 'm_deer',         h: 1.5, walk: /^Walk$/, idle: /^Idle$/, animal: true, eat: /^Eating$/ },
  pig:          { src: 'm_pig',          h: 0.8, walk: /Walk$/, idle: /Idle$/, animal: true },
  sheep:        { src: 'm_sheep',        h: 0.9, walk: /Idle/, idle: /Idle/, animal: true },
  chicken:      { src: 'm_chicken',      h: 0.55, walk: /Walk/, idle: /Idle/, animal: true },
};
export const PED_KINDS = Object.keys(PEDS);
export function makePed(kind, variant = 0) {
  const d = PEDS[kind]; const tint = d.tints ? d.tints[variant % d.tints.length] : undefined;
  const inst = instance(d.src, d.h, { tint, shadow: false, rotY: 0 });
  const mixer = new THREE.AnimationMixer(inst.obj);
  const walk = findClip(inst.clips, d.walk), idle = findClip(inst.clips, d.idle);
  const aw = walk && mixer.clipAction(walk), ai = idle && mixer.clipAction(idle);
  return { group: inst.group, mixer, walk: aw, idle: ai, def: d, kind };
}
// Obstacle / animated prop helper (animals running across the road etc.). Returns {group, mixer, act}.
export function makeAnimal(kind, h, clipRe, { rotY = Math.PI, tint } = {}) {
  const d = PEDS[kind]; const inst = instance(d.src, h, { shadow: true, rotY, tint });
  const mixer = new THREE.AnimationMixer(inst.obj);
  const clip = findClip(inst.clips, clipRe) || inst.clips[0]; const act = mixer.clipAction(clip); act.play();
  act.time = Math.random() * clip.duration;
  return { group: inst.group, mixer, act };
}

// ------------------------------------------------------------------ playable characters
export const PLAYABLE = [
  { id: 'dodo',      name: 'Dodo',        sub: 'The original. Grey, chubby, proud.',        kind: 'dodo' },
  { id: 'dodo_blue', name: 'Dodo Ble',    sub: 'Blue-dyed dodo from the lagoon.',            kind: 'dodo', tint: 0x86c4ff },
  { id: 'dodo_gold', name: 'Dodo Lor',    sub: 'Golden dodo. Very shiny, very fast.',        kind: 'dodo', tint: 0xffd061 },
  { id: 'dodo_rose', name: 'Dodo Roz',    sub: 'Pink dodo, Port Louis carnival edition.',     kind: 'dodo', tint: 0xff9fc4 },
  { id: 'shiba',     name: 'Sien Shiba',  sub: 'Street dog with a sprint (Quaternius, CC0).', kind: 'clip', src: 'm_shiba', h: 1.1, clip: /^Gallop$/, air: /^Gallop_Jump$/ },
  { id: 'chicken',   name: 'Poul',        sub: 'Fast little hen (Quaternius, CC0).',          kind: 'clip', src: 'm_chicken', h: 1.1, clip: /Walk/, speed: 2.4 },
  { id: 'deer',      name: 'Sèf Rusa',    sub: 'Rusa deer from Black River (Quaternius, CC0).', kind: 'clip', src: 'm_deer', h: 1.6, clip: /^Gallop$/, air: /^Gallop_Jump$/ },
  { id: 'pig',       name: 'Koson Maron', sub: 'Wild boar on the run (Quaternius, CC0).',      kind: 'clip', src: 'm_pig', h: 1.1, clip: /Run$/ },
];
export const playableById = (id) => PLAYABLE.find((p) => p.id === id) || PLAYABLE[0];
// Builds the model for a playable character. Dodo variants use the procedural rig (poseDodo in game.js); the animals loop a clip.
export function makePlayable(def) {
  if (def.kind === 'dodo') { const g = makeDodo(def.tint); g.userData.def = def; return g; }
  const inst = instance(def.src, def.h, { shadow: true, rotY: Math.PI });
  const mixer = new THREE.AnimationMixer(inst.obj); const run = mixer.clipAction(findClip(inst.clips, def.clip) || inst.clips[0]); run.play();
  const air = def.air ? findClip(inst.clips, def.air) : null;
  inst.group.userData = { def, mixer, run, air: air && mixer.clipAction(air), speed: def.speed || 1 };
  return inst.group;
}
