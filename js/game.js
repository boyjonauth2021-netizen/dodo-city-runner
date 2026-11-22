import * as THREE from 'three';
import { LANE_W, CHUNK_LEN, PLAYER, STUMBLE_HEAL, SAVE_KEY } from './config.js';
import * as W from './world.js';
import * as OB from './obstacles.js';
import * as BI from './biomes.js';
import { getChaser, CHASERS, makePed, PLAYABLE, playableById, makePlayable } from './characters.js';
import { WORLDS, ALL_LEVELS, SKIES, resolveLevel } from './levels.js';
import { songOf } from './music.js';
import { routeOf, sectionAt } from './routes.js';
import { buildBackdrop as buildScenicBackdrop, updateScenery, headingBank } from './scenery.js';
import { POWERS, POWER_ORDER, makePowerCoin, applyPower, absorbHit, tickPower, jumpVelocity, speedMul, magnetPull, updatePowerHud } from './powerups.js';
import { shouldPlayIntro, markIntroSeen, playIntro } from './intro.js';
import { AudioSys } from './audio.js';
import { skyTex } from './textures.js';

const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const laneX = (l) => l * LANE_W;
const params = new URLSearchParams(location.search);
const BOT = params.get('bot') === '1', GOD = params.get('god') === '1';
const levels = ALL_LEVELS;
const worldOf = (lv) => WORLDS.find((w) => w.id === lv.world);
const ATTRACT = ['pl1', 'mt1', 'mt2', 'mt3', 'mt5', 'mt7', 'mt8', 'mt4'].map((u) => resolveLevel(u));

// ------------------------------------------------------------------ save (v2: per-world unlocks, keyed by level uid; v1 is migrated)
const SAVE_V2 = 'dodoCityRunner.v2';
const save = (() => {
  let d = null; try { d = JSON.parse(localStorage.getItem(SAVE_V2)); } catch (e) { d = null; }
  if (!d || d.v !== 2) { // migrate the v1 save (levels 1..n of Port Louis, numeric ids)
    let o = null; try { o = JSON.parse(localStorage.getItem(SAVE_KEY)); } catch (e) { o = null; }
    d = { v: 2, unlocked: { pl: 1, mt: 1 }, best: {}, stars: {}, coins: 0, char: 'dodo' };
    if (o && typeof o === 'object') {
      d.unlocked.pl = Math.max(1, Math.min(2, +o.unlocked || 1)); d.coins = +o.coins || 0;
      for (const k of Object.keys(o.best || {})) d.best['pl' + k] = o.best[k]; for (const k of Object.keys(o.stars || {})) d.stars['pl' + k] = o.stars[k];
    }
  }
  d.unlocked = Object.assign({ pl: 1, mt: 1 }, d.unlocked || {}); d.best = d.best || {}; d.stars = d.stars || {}; d.coins = d.coins || 0; d.seenIntro = !!d.seenIntro;
  if (!PLAYABLE.some((c) => c.id === d.char)) d.char = 'dodo';
  return { d, write() { try { localStorage.setItem(SAVE_V2, JSON.stringify(d)); } catch (e) { /* ignore */ } } };
})();
if (params.get('unlock')) { const n = +params.get('unlock'); for (const w of WORLDS) save.d.unlocked[w.id] = Math.min(w.levels.length, n); }

// ------------------------------------------------------------------ renderer / scene
const canvas = $('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: params.get('shot') === '1' });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(62, 1, 0.1, 700);
const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x8a7d6c, 1.15); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0d0, 2.4); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 30; sc.bottom = -30; sc.near = 1; sc.far = 120; sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.04;
scene.add(sun); scene.add(sun.target);
let backdrop = null;
function resize() {
  const w = window.innerWidth, h = window.innerHeight; renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w / h < 1 ? clamp(62 + (1 - w / h) * 32, 62, 88) : 62; camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize); resize();

const audio = new AudioSys();
const G = {
  state: 'loading', level: levels[0], lvIdx: 0, peds: [],
  chunks: new Map(), obstacles: [], coins: [], voices: [],
  dist: 0, speed: 0, score: 0, coinCount: 0, stumbles: 0, time: 0, combo: 0, comboT: 0,
  spawnZ: -55, nextCoinZ: -30, attract: true, finishing: 0, finishAdded: false, countdown: 0, shake: 0,
  healT: 0, gap: 5.3, speedMul: 1, ending: null, trail: [],
};
const P = { group: new THREE.Group(), anim: new THREE.Group(), dodo: null, lane: 0, prevLane: 0, x: 0, y: 0, vy: 0, z: 0, grounded: true, slideT: 0, invuln: 0, phase: 0, alive: true, jumpBuf: 0, tumble: 0, landSq: 0, wings: [] };
const C = { ch: null, x: 0, y: 0, z: 6 };
let shadowBlob;

// ------------------------------------------------------------------ build characters
function buildPlayer() {
  P.group.add(P.anim); scene.add(P.group); setPlayable(save.d.char);
  shadowBlob = new THREE.Mesh(new THREE.CircleGeometry(0.75, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35, depthWrite: false }));
  shadowBlob.rotation.x = -Math.PI / 2; shadowBlob.position.y = 0.02; scene.add(shadowBlob);
}
function setPlayable(id) {
  const def = playableById(id); if (P.dodo) P.anim.remove(P.dodo);
  P.dodo = makePlayable(def); P.def = def; P.anim.add(P.dodo); P.clipT = 0; save.d.char = def.id;
}
function setChaser(key) {
  if (C.ch) scene.remove(C.ch.group);
  C.ch = getChaser(key); scene.add(C.ch.group); C.ch.mixer.stopAllAction(); C.ch.acts.run.reset().play(); C.ch.acts.run.timeScale = 1.15; C.ch.group.visible = true;
  const em = document.querySelector('#hudGuard span'); if (em) em.textContent = C.ch.def.emoji;
}

// ------------------------------------------------------------------ level / world lifecycle
function clearWorld() {
  for (const g of G.chunks.values()) { scene.remove(g); W.disposeTree(g); } G.chunks.clear();
  for (const o of G.obstacles) { scene.remove(o.mesh); W.disposeTree(o.mesh); o.voice && o.voice.stop(); } G.obstacles.length = 0;
  for (const c of G.coins) scene.remove(c.mesh); G.coins.length = 0;
  G.voices.length = 0; for (const d of G.peds) if (d.obj) scene.remove(d.obj.group); G.peds.length = 0;
  if (G.finishMesh) { scene.remove(G.finishMesh); G.finishMesh = null; }
}
const _ca = new THREE.Color(), _cb = new THREE.Color();
let skyBlend = null;
function applySky(skKey, t = 0, endKey = null) { // t: blend from skKey toward endKey (sunset -> night)
  const a = SKIES[skKey], b = endKey ? SKIES[endKey] : a, k = endKey ? t : 0;
  if (endKey) {
    if (!skyBlend) { const c = document.createElement('canvas'); c.width = 8; c.height = 512; skyBlend = { c, tex: new THREE.CanvasTexture(c), last: -1 }; skyBlend.tex.colorSpace = THREE.SRGBColorSpace; }
    if (Math.abs(skyBlend.last - k) > 0.01) { skyBlend.last = k; const g = skyBlend.c.getContext('2d'); g.globalAlpha = 1; g.drawImage(skyTex(a.tex).image, 0, 0); g.globalAlpha = k; g.drawImage(skyTex(b.tex).image, 0, 0); g.globalAlpha = 1; skyBlend.tex.needsUpdate = true; }
    scene.background = skyBlend.tex;
  } else scene.background = skyTex(a.tex);
  const mix = (ca, cb) => _ca.set(ca).lerp(_cb.set(cb), k);
  if (!scene.fog) scene.fog = new THREE.Fog(0xffffff, 45, 215);
  scene.fog.color.copy(mix(a.fog[0], b.fog[0])); scene.fog.near = lerp(a.fog[1], b.fog[1], k); scene.fog.far = lerp(a.fog[2], b.fog[2], k);
  hemi.color.copy(mix(a.hemi[0], b.hemi[0])); hemi.intensity = lerp(a.hemi[1], b.hemi[1], k);
  sun.color.copy(mix(a.sun[0], b.sun[0])); sun.intensity = lerp(a.sun[1], b.sun[1], k);
  const u = backdrop && backdrop.userData;
  if (u && u.m1) { u.m1.color.copy(mix(a.hills[0], b.hills[0])); u.m2.color.copy(mix(a.hills[1], b.hills[1])); u.sun.position.set(lerp(a.sunPos[0], b.sunPos[0], k), lerp(a.sunPos[1], b.sunPos[1], k), -450); const sc2 = lerp(260, b.night ? 140 : 260, k); u.sun.scale.set(sc2, sc2, 1); u.sun.material.color.copy(_ca.set(0xffffff).lerp(_cb.set(b.night ? 0xaac0ff : 0xffffff), k)); }
}
function setTheme(level) {
  if (backdrop) { scene.remove(backdrop); } backdrop = BI.buildBackdrop(level, SKIES[level.sky]); scene.add(backdrop);
  applySky(level.sky, 0, level.skyEnd || null);
}
function resetRun(level, attract = false) {
  clearWorld(); G.level = level; G.lvIdx = levels.indexOf(level); setChaser(level.chaser); G.attract = attract; setTheme(level);
  Object.assign(G, { dist: 0, speed: 0, score: 0, coinCount: 0, stumbles: 0, time: 0, combo: 0, comboT: 0, spawnZ: -55, nextCoinZ: -32, finishing: 0, finishAdded: false, shake: 0, healT: 0, gap: 5.3, speedMul: 1, ending: null, trail: [], hintShown: false, power: null, nextPowerZ: -180, movingSeen: 0 });
  Object.assign(P, { lane: 0, prevLane: 0, x: 0, y: 0, vy: 0, z: 0, grounded: true, slideT: 0, invuln: 0, phase: 0, alive: true, jumpBuf: 0, tumble: 0, landSq: 0, flying: false });
  P.clipT = 0; P.group.visible = true; P.anim.rotation.set(0, 0, 0); P.anim.scale.set(1, 1, 1);
  C.x = 0; C.y = 0; C.z = 5.3;
  ensureChunks(); updateCamera(0, true);
}
function ensureChunks() {
  const ci = Math.floor(-P.z / CHUNK_LEN);
  for (let i = Math.max(0, ci - 1); i <= ci + 5; i++) if (!G.chunks.has(i)) { const c = G.level.biome === 'portlouis' ? W.buildChunk(G.level, i) : BI.buildChunk(G.level, i); G.chunks.set(i, c); scene.add(c); genPeds(i); }
  for (const [i, c] of G.chunks) if (i < ci - 1) { scene.remove(c); W.disposeTree(c); G.chunks.delete(i); }
}
// ---- ambient pedestrians / animals on the sidewalks. Data is generated per chunk; models are instanced only near the player.
const MAX_PEDS = 9;
function genPeds(ci) {
  const pd = G.level.peds; if (!pd || ci < 1) return;
  const n = Math.round(pd.n * rand(1.2, 2.8));
  for (let k = 0; k < n; k++) {
    const animal = pd.animals && Math.random() < 0.3, kind = animal ? pick(pd.animals) : pick(pd.kinds), side = Math.random() < 0.5 ? -1 : 1;
    const idle = Math.random() < 0.35;
    G.peds.push({ kind, variant: Math.floor(Math.random() * 4), x: side * rand(4.7, 6.9), z: -(ci + Math.random()) * CHUNK_LEN, dir: Math.random() < 0.5 ? -1 : 1, v: idle ? 0 : (animal ? rand(0.7, 1.3) : rand(1.0, 1.6)), obj: null });
  }
}
function updatePeds(dt) {
  let active = 0; for (const d of G.peds) if (d.obj) active++;
  for (let i = G.peds.length - 1; i >= 0; i--) {
    const d = G.peds[i]; d.z += d.dir * d.v * dt; const dz = d.z - P.z; // dz<0: ahead of the player
    if (d.obj) {
      if (dz > 10) { scene.remove(d.obj.group); G.peds.splice(i, 1); active--; continue; }
      d.obj.group.position.set(d.x, 0, d.z); d.obj.mixer.update(dt);
    } else if (dz > 10) G.peds.splice(i, 1);
    else if (dz > -105 && active < MAX_PEDS) {
      d.obj = makePed(d.kind, d.variant); active++;
      const a = d.v > 0 ? d.obj.walk : d.obj.idle; (a || d.obj.idle || d.obj.walk).play(); if (a && d.v > 0) a.timeScale = d.v / 1.3;
      d.obj.group.rotation.y = d.dir < 0 ? Math.PI : 0; d.obj.group.position.set(d.x, 0, d.z); d.obj.mixer.update(Math.random() * 2); scene.add(d.obj.group);
    }
  }
}
function currentTheme() { const i = Math.floor(-P.z / CHUNK_LEN); return G.chunks.get(i)?.userData.theme || 'street'; }

// ------------------------------------------------------------------ obstacle + coin spawning

function attachHeadlights(o) {
  if (!o.mesh || o._hl) return;
  const g = new THREE.Group(); g.name = 'headlights';
  const bulb = new THREE.MeshBasicMaterial({ color: 0xfff4c8 });
  const coneMat = new THREE.MeshBasicMaterial({
    color: 0xffe8a0, transparent: true, opacity: 0.28, depthWrite: false,
    side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: true,
  });
  const zf = (o.hz || 1.6) - 0.02;
  const y = Math.min(0.9, Math.max(0.45, (o.y1 || 1.4) * 0.32));
  const spread = Math.min(0.85, (o.hx || 0.9) * 0.75);
  for (const x of [-spread, spread]) {
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), bulb);
    b.position.set(x, y, zf); g.add(b);
    const c = new THREE.Mesh(new THREE.ConeGeometry(0.9, 7.2, 8, 1, true), coneMat);
    c.rotation.x = Math.PI / 2;
    c.position.set(x, 0.25, zf + 3.5);
    g.add(c);
  }
  o.mesh.add(g); o._hl = g;
}
function isSealing(o) {
  if (!o || o.hit) return false;
  if (o.kind === 'slow') return false;
  if (o.slide || o.name === 'bar' || o.name === 'barrier' || o.name === 'cones') return false;
  if (o.walkable && (o.vz || 0) <= 0 && (o.roof || o.platform || o.name === 'train')) return false;
  if (o.ramp) return false;
  return o.kind === 'crash' || o.avoid || (o.vz || 0) > 8;
}
function ensureEscape(zMid, prefer) {
  const win = 16;
  const blocked = [-1, 0, 1].filter((l) => G.obstacles.some((o) => o.lane === l && !o.hit && Math.abs(o.z - zMid) < win + (o.hz || 1) && isSealing(o)));
  if (blocked.length < 3) return;
  const preferLane = prefer == null ? 0 : prefer;
  const victim = G.obstacles.find((o) => o.lane === preferLane && !o.hit && isSealing(o) && Math.abs(o.z - zMid) < win + (o.hz || 1))
    || G.obstacles.find((o) => !o.hit && isSealing(o) && Math.abs(o.z - zMid) < win + (o.hz || 1));
  if (!victim) return;
  if (victim.mesh && victim.mesh.parent) victim.mesh.parent.remove(victim.mesh);
  victim.hit = true;
}
function levelHeat() {
  const lv = G.level; if (!lv) return 0;
  if (lv.world === 'pl') return lv.num === 1 ? 0 : 0.38;
  return Math.max(0, Math.min(1, (lv.num - 1) / 14));
}

function addObstacle(def, lane, z, opts = {}) {
  const o = Object.assign(def, { lane, x: laneX(lane), z, vz: opts.vz ?? def.vz ?? 0, hit: false, passed: false, voice: null, hornDone: false, spin: 0, laneChange: opts.laneChange || def.laneChange || null });
  if (def.cross) { const side = opts.side || (Math.random() < 0.5 ? -1 : 1); o.x = side * 5.7; o.cross = Object.assign({}, def.cross, { dir: -side, tx: laneX(lane), go: false, done: false }); }
  if (o.vz > 8) { o.walkable = false; o.roof = false; attachHeadlights(o); }
  o.mesh.position.set(o.x, 0, z); o.mesh.traverse((m) => { if (m.isMesh && !m.userData.noShadow) m.castShadow = true; });
  if (o.cross && o.cross.run) o.mesh.rotation.y = o.cross.dir > 0 ? 0 : Math.PI;
  scene.add(o.mesh); G.obstacles.push(o); return o;
}
function addCoin(x, y, z) { const m = W.makeCoin(); m.position.set(x, y, z); scene.add(m); G.coins.push({ mesh: m, x, y, z, got: false, t: Math.random() * 6 }); }
function coinLine(lane, z0, n, y = 0.75, step = 2.2) { for (let i = 0; i < n; i++) addCoin(laneX(lane), y, z0 - i * step); }
function coinArc(lane, zc, n = 7) { for (let i = 0; i < n; i++) { const t = i / (n - 1), y = 0.8 + Math.sin(t * Math.PI) * 1.75; addCoin(laneX(lane), y, zc + (n - 1) * 0.8 - i * 1.6); } }
const shuffleLanes = () => [-1, 0, 1].sort(() => Math.random() - 0.5);

function weightedPick(w) { const e = Object.entries(w).filter(([, v]) => v > 0), t = e.reduce((s, [, v]) => s + v, 0); let r = Math.random() * t; for (const [k, v] of e) { if ((r -= v) <= 0) return k; } return e[0][0]; }

function spawnPattern(zv) {
  const lv = G.level, prog = clamp(G.dist / lv.goal, 0, 1), kind = weightedPick(lv.weights), L = shuffleLanes();
  let len = 8; // virtual length consumed by this pattern
  const free = L[0], blockedLanes = L.slice(1);
  switch (kind) {
    case 'barrier': { const n = Math.random() < 0.35 + prog * 0.25 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(W.makeBarrier(), L[1 + i], zv); coinArc(L[1], zv); if (n === 1) coinLine(L[2], zv + 6, 5); else coinLine(free, zv + 6, 5); break; }
    case 'cones': { const n = Math.random() < 0.5 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(W.makeCones(), L[1 + i], zv); coinLine(L[0], zv + 5, 6); break; }
    case 'bar': { const n = Math.random() < 0.3 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) { addObstacle(W.makeBar(), L[1 + i], zv); coinLine(L[1 + i], zv + 4, 4, 0.6); } if (Math.random() < 0.5) coinLine(L[0], zv, 5); break; }
    case 'car': { const n = Math.random() < 0.4 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(W.makeCar(false), L[1 + i], zv + rand(-1, 1)); coinArc(L[1], zv + 1, 9); len = 10; break; }
    case 'bus': { const n = Math.random() < 0.3 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) { const b = W.makeBus(); addObstacle(b, L[1 + i], zv); if (b.walkable) coinLine(L[1 + i], zv + 3, 5, b.y1 + 0.7, 2.0); } coinLine(L[0], zv + 4, 8); if (n === 1 && Math.random() < 0.5) addObstacle(W.makeCar(false), L[2], zv + rand(-1, 2)); len = 14; break; }
    case 'row': { const bar = Math.random() < 0.5 ? W.makeBar : W.makeBarrier; for (const l of [-1, 0, 1]) addObstacle(bar(), l, zv); if (bar === W.makeBarrier) coinArc(0, zv + 1, 7); else for (const l of [-1, 0, 1]) coinLine(l, zv + 3.5, 3, 0.6); break; }
    case 'trainRamp': {
      const top = 3.5, ramp = W.makeRamp(top); addObstacle(ramp, L[1], zv);
      const train = W.makeTrain(); addObstacle(train, L[1], zv - ramp.hz - train.hz);
      coinLine(L[1], zv - 3, 10, top + 0.8, 2.0);
      if (Math.random() < 0.7) addObstacle(W.makeBarrier(), L[2], zv - 4);
      coinLine(L[0], zv - 1, 6); len = 24; break; }
    case 'oncomingTrain': case 'oncomingBus': case 'oncomingCar': {
      const o = kind === 'oncomingTrain' ? W.makeTrain() : kind === 'oncomingBus' ? W.makeBus() : W.makeCar(true);
      o.walkable = false; const vz = kind === 'oncomingTrain' ? 24 : kind === 'oncomingBus' ? 16 : 14;
      const zz = G.player0 + (zv - G.player0) * (1 + vz / Math.max(12, G.speed || 14));
      addObstacle(o, L[1], zz, { vz }); coinLine(L[0], zv + 2, 6);
      // a jumpable barrier is fine on the third lane; never a sealing obstacle
      if (Math.random() < 0.35 + levelHeat() * 0.2) addObstacle(W.makeBarrier(), L[2], zv);
      len = 14; break; }
    // ---------------- Moris Tour / extra obstacles
    case 'scooter': case 'bicycle': case 'tractor': case 'caneTruckMove': {
      const o = kind === 'scooter' ? OB.makeScooter(Math.random() < 0.6) : kind === 'bicycle' ? OB.makeBicycle() : kind === 'tractor' ? OB.makeTractor() : OB.makeCaneTruck();
      if (kind === 'caneTruckMove') o.vz = 12;
      const vz = o.vz, zz = G.player0 + (zv - G.player0) * (1 + vz / Math.max(12, G.speed || 14));
      addObstacle(o, L[1], zz); coinLine(L[0], zv + 2, 6); if (Math.random() < 0.4 + prog * 0.3) addObstacle(pick([W.makeCones, W.makeBarrier])(), L[2], zv); len = 10; break; }
    case 'dholl': { const n = Math.random() < 0.3 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(OB.makeDholl(), L[1 + i], zv); coinArc(L[1], zv, 7); if (n === 1) coinLine(L[2], zv + 5, 4); break; }
    case 'stall': { const n = Math.random() < 0.25 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(OB.makeStall(), L[1 + i], zv); coinLine(L[0], zv + 3, 7); break; }
    case 'crates': { const n = Math.random() < 0.4 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(OB.makeCrates(), L[1 + i], zv); coinArc(L[1], zv, 7); break; }
    case 'caneTruck': {
      const mv = Math.random() < 0.4, o = OB.makeCaneTruck(); if (mv) o.vz = 12; const zz = mv ? G.player0 + (zv - G.player0) * (1 + 12 / Math.max(12, G.speed || 14)) : zv;
      addObstacle(o, L[1], zz); coinLine(L[0], zv + 2, 7); if (!mv && Math.random() < 0.4) addObstacle(OB.makeCaneTruck(), L[2], zv + rand(-3, 3)); len = 12; break; }
    case 'truckRamp': {
      const ramp = W.makeRamp(1.62); addObstacle(ramp, L[1], zv); const tr = OB.makeCaneTrailer(); addObstacle(tr, L[1], zv - ramp.hz - tr.hz);
      coinLine(L[1], zv - 3, 8, 1.62 + 0.8, 2.0); if (Math.random() < 0.6) addObstacle(W.makeBarrier(), L[2], zv - 4); coinLine(L[0], zv - 1, 6); len = 22; break; }
    case 'pothole': case 'puddle': { const mk = kind === 'pothole' ? OB.makePothole : OB.makePuddle, n = Math.random() < 0.3 + prog * 0.4 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(mk(), L[1 + i], zv); coinLine(L[1], zv + 2, 4, kind === 'pothole' ? 1.3 : 0.75); if (n === 1) coinLine(L[2], zv + 4, 4); break; }
    case 'roadworks': { addObstacle(W.makeBarrier(), L[1], zv); addObstacle(W.makeCones(), L[2], zv - 1); coinLine(L[0], zv + 2, 6); coinArc(L[1], zv + 1, 7); break; }
    case 'log': { const n = Math.random() < 0.3 + prog * 0.35 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(OB.makeLog(), L[1 + i], zv); coinArc(L[1], zv, 7); coinLine(L[0], zv + 3, 4); break; }
    case 'logRow': { addObstacle(OB.makeLog(7.6), 0, zv); coinArc(0, zv, 9); break; }
    case 'pirogue': { const n = Math.random() < 0.3 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(OB.makePirogue(), L[1 + i], zv); coinLine(L[0], zv + 3, 7); len = 10; break; }
    case 'branch': { const n = Math.random() < 0.3 + prog * 0.35 ? 2 : 1; for (let i = 0; i < n; i++) { addObstacle(OB.makeBranch(), L[1 + i], zv); coinLine(L[1 + i], zv + 3, 4, 0.55); } if (Math.random() < 0.5) coinLine(L[0], zv, 5); break; }
    case 'rock': case 'lavaRock': case 'bench': case 'wheelbarrow': case 'goat': case 'cow': case 'tortoise': case 'pirogue2': {
      const mk = { rock: OB.makeRock, lavaRock: OB.makeLavaRock, bench: OB.makeBench, wheelbarrow: OB.makeWheelbarrow, goat: OB.makeGoat, cow: OB.makeCow, tortoise: OB.makeTortoise }[kind];
      const n = Math.random() < 0.35 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(mk(), L[1 + i], zv + rand(-1, 1)); coinArc(L[1], zv, 7); if (n === 1) coinLine(L[2], zv + 3, 4); break; }
    case 'crab': case 'dog': case 'deer': case 'boar': case 'chickens': {
      const mk = { crab: OB.makeCrab, dog: OB.makeDog, deer: OB.makeDeer, boar: OB.makeBoar, chickens: OB.makeChickens }[kind];
      const n = Math.random() < 0.3 + prog * 0.3 ? 2 : 1; for (let i = 0; i < n; i++) addObstacle(mk(), L[1 + i], zv + i * 3, { side: i ? undefined : undefined }); coinLine(L[0], zv + 2, 6); if (n === 1) coinLine(L[2], zv + 5, 4); len = 10; break; }
    case 'busRoof': {
      const top = 3.15, ramp = W.makeRamp(top); addObstacle(ramp, L[1], zv);
      const bus = W.makeBus(); addObstacle(bus, L[1], zv - ramp.hz - bus.hz);
      coinLine(L[1], zv - 3, 8, top + 0.75, 2.0);
      if (Math.random() < 0.55) addObstacle(W.makeBarrier(), L[2], zv - 3);
      coinLine(L[0], zv - 1, 5); len = 22; break; }
    case 'roofRun': {
      const top = 3.15, ramp = W.makeRamp(top); addObstacle(ramp, L[1], zv);
      const a = W.makeBus(); addObstacle(a, L[1], zv - ramp.hz - a.hz);
      const b = W.makeBus(); addObstacle(b, L[1], zv - ramp.hz - a.hz * 2 - b.hz - 1.6); // small gap to hop
      coinLine(L[1], zv - 3, 12, top + 0.75, 2.0);
      coinLine(L[0], zv - 1, 6); len = 36; break; }
    case 'houseRoof': {
      const top = 2.35, ramp = W.makeRamp(top); addObstacle(ramp, L[1], zv);
      addObstacle(OB.makeHouse(), L[1], zv - ramp.hz - 1.8);
      coinLine(L[1], zv - 3, 6, top + 0.7, 1.8);
      coinLine(L[0], zv + 2, 5); len = 18; break; }
    case 'stallRoof': {
      const top = 2.2, ramp = W.makeRamp(top); addObstacle(ramp, L[1], zv);
      addObstacle(OB.makeStall(), L[1], zv - ramp.hz - 1.2);
      coinLine(L[1], zv - 3, 5, top + 0.7, 1.6);
      coinLine(L[0], zv + 2, 4); len = 16; break; }
    case 'carBus': {
      const car = W.makeCar(false); addObstacle(car, L[1], zv);
      const bus = W.makeBus(); addObstacle(bus, L[1], zv - car.hz - bus.hz - 0.8);
      coinLine(L[1], zv, 3, (car.y1 || 1.4) + 0.7, 1.4);
      coinLine(L[1], zv - car.hz - 1, 6, 3.15 + 0.7, 2.0);
      coinLine(L[0], zv + 2, 5); len = 20; break; }
    case 'van': case 'suv': case 'taxi': case 'taptap': case 'lorry': {
      const mk = { van: OB.makeVan, suv: OB.makeSuv, taxi: OB.makeTaxi, taptap: OB.makeTaptap, lorry: OB.makeLorry }[kind];
      const oncoming = Math.random() < 0.12 + levelHeat() * 0.22; const o = mk();
      if (oncoming) { o.walkable = false; o.vz = kind === 'lorry' || kind === 'taptap' ? 14 : 13; o.mesh.rotation.y = 0; }
      else { o.vz = kind === 'lorry' ? -6 : -8; o.mesh.rotation.y = Math.PI; }
      const vz = o.vz || 0;
      const zz = vz ? G.player0 + (zv - G.player0) * (1 + Math.max(0, vz) / Math.max(12, G.speed || 14)) : zv;
      addObstacle(o, L[1], zz); if (o.walkable) coinLine(L[1], zv, 4, (o.y1 || 1.6) + 0.7, 1.6);
      coinLine(L[0], zv + 2, 6); len = 12; break; }
    case 'sameway': {
      const o = pick([W.makeCar, OB.makeVan, OB.makeTaxi, OB.makeSuv])(false);
      o.vz = -rand(6, 10); if (o.mesh && o.name !== 'car') o.mesh.rotation.y = Math.PI; addObstacle(o, L[1], zv);
      if (Math.random() < 0.5) {
        const toChoices = [-1, 0, 1].filter((x) => x !== L[1] && x !== free);
        if (toChoices.length) o.laneChange = { from: L[1], to: pick(toChoices), delay: 0.45, dur: 1.15, t: 0 };
      }
      coinLine(L[0], zv + 2, 6); len = 12; break; }
    case 'laneChange': {
      const o = pick([W.makeCar, OB.makeTaxi, OB.makeSuv, OB.makeVan])(false);
      const from = L[1];
      // never change into the only reserved escape lane
      const toChoices = [-1, 0, 1].filter((x) => x !== from && x !== free);
      const to = toChoices.length ? pick(toChoices) : from;
      o.vz = Math.random() < (0.18 + levelHeat() * 0.2) ? 12 : -7; if (o.mesh && o.name !== 'car') o.mesh.rotation.y = o.vz < 0 ? Math.PI : 0;
      const zz = o.vz > 0 ? G.player0 + (zv - G.player0) * (1 + o.vz / Math.max(12, G.speed || 14)) : zv;
      if (to !== from) addObstacle(o, from, zz, { laneChange: { from, to, delay: 0.45, dur: 1.15, t: 0 } });
      else addObstacle(o, from, zz);
      coinLine(L[0], zv + 2, 5); len = 12; break; }
    case 'parked': { addObstacle(OB.makeParkedCar(), L[1], zv); coinArc(L[1], zv, 7); coinLine(L[0], zv + 3, 4); len = 10; break; }
    case 'coconuts': { addObstacle(OB.makeCoconuts(), L[1], zv); coinLine(L[0], zv + 3, 5); break; }
    case 'nets': { addObstacle(OB.makeNets(), L[1], zv); coinLine(L[1], zv + 3, 4, 0.55); coinLine(L[0], zv, 4); break; }
    case 'monkey': { addObstacle(OB.makeMonkey(), L[1], zv); coinLine(L[0], zv + 2, 6); len = 10; break; }
    default: addObstacle(W.makeCones(), L[1], zv); coinLine(L[0], zv + 5, 6);
  }
  ensureEscape(zv, free);
  return len;
}
function updateSpawner() {
  G.player0 = P.z;
  const ahead = 180;
  while (G.spawnZ > P.z - ahead && (G.attract || -G.spawnZ < G.level.goal - 30)) {
    const prog = clamp(G.dist / G.level.goal, 0, 1);
    const len = spawnPattern(G.spawnZ);
    G.spawnZ -= len + lerp(G.level.gap[0], G.level.gap[1], prog) * rand(0.95, 1.2);
  }
  // stray coin trails in the clear stretches
  if (!G.attract && -G.spawnZ > G.level.goal - 30) { /* near finish: no new obstacles */ }
  // power-up coins, rarer than gold
  if (!G.attract && -G.nextPowerZ < G.level.goal - 80 && G.spawnZ < G.nextPowerZ) {
    const kind = POWER_ORDER[Math.floor(Math.abs(G.nextPowerZ) / 400) % POWER_ORDER.length];
    const lane = pick([-1, 0, 1]);
    const z = G.nextPowerZ;
    const mesh = makePowerCoin(kind); mesh.position.set(laneX(lane), 1.15, z); scene.add(mesh);
    G.coins.push({ mesh, x: laneX(lane), y: 1.15, z, got: false, t: Math.random() * 6, power: kind });
    G.nextPowerZ -= rand(380, 720);
  }
  if (!G.finishAdded && !G.attract && P.z - 160 < -G.level.goal) {
    G.finishAdded = true;
    const g = W.gantrySign(-G.level.goal, 'FINISH · ARRIVÉE', G.level.name); G.finishMesh = g; scene.add(g);
    const chk = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: finishTex(), transparent: true, opacity: 0.9, depthWrite: false }));
    chk.rotation.x = -Math.PI / 2; chk.position.set(0, 0.03, -G.level.goal); g.add(chk); chk.position.z = 0;
  }
}
let _fin; function finishTex() { if (_fin) return _fin; const c = document.createElement('canvas'); c.width = 256; c.height = 256; const g = c.getContext('2d'); for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { g.fillStyle = (x + y) % 2 ? '#111' : '#fff'; g.fillRect(x * 32, y * 32, 32, 32); } _fin = new THREE.CanvasTexture(c); _fin.colorSpace = THREE.SRGBColorSpace; return _fin; }

// ------------------------------------------------------------------ physics helpers
function surfaceTop(o, z) { return o.ramp ? o.y1 * clamp((o.z + o.hz - z) / (2 * o.hz), 0, 1) : o.y1; }
function playerHeight() { return P.slideT > 0 ? PLAYER.slideHeight : PLAYER.height; }

// ------------------------------------------------------------------ input
const inputQ = [];
function doLeft() { inputQ.push('l'); } function doRight() { inputQ.push('r'); } function doJump() { inputQ.push('u'); } function doSlide() { inputQ.push('d'); }
function handleInput(a) {
  if (!P.alive || G.finishing) return;
  if (a === 'l' || a === 'r') {
    const d = a === 'l' ? -1 : 1, nl = clamp(P.lane + d, -1, 1);
    if (nl !== P.lane) { P.prevLane = P.lane; P.lane = nl; P.laneChangeT = 0; audio.lane(d); }
  } else if (a === 'u') {
    if (P.grounded) startJump(); else P.jumpBuf = 0.18;
  } else if (a === 'd') {
    if (!P.grounded) { P.vy = Math.min(P.vy, -26); P.slideAfterLand = true; }
    else if (P.slideT <= 0) { P.slideT = PLAYER.slideTime; audio.slide(); }
  }
}
function startJump() { P.vy = jumpVelocity(G, PLAYER); P.grounded = false; P.slideT = 0; P.jumpBuf = 0; audio.jump(); P.flap = 0.5; }
window.addEventListener('keydown', (e) => {
  if (e.repeat && !['ArrowLeft', 'ArrowRight', 'a', 'd'].includes(e.key)) { if (e.code === 'Space' || e.key.startsWith('Arrow')) e.preventDefault(); return; }
  audio.unlock();
  const k = e.key.toLowerCase();
  if (['arrowleft', 'a'].includes(k)) doLeft(); else if (['arrowright', 'd'].includes(k)) doRight();
  else if (['arrowup', 'w', ' '].includes(k)) { doJump(); if (G.state === 'title') { /* nothing */ } }
  else if (['arrowdown', 's'].includes(k)) doSlide();
  else if (k === 'p' || k === 'escape') { if (G.state === 'playing') pause(); else if (G.state === 'paused') resume(); }
  else if (k === 'm') { setMuteIcon(audio.toggleMute()); }
  else if (k === 'enter') { if (G.state === 'title') $('btnPlay').click(); else if (G.state === 'paused') resume(); else if (G.state === 'over') $('btnRetry').click(); else if (G.state === 'complete') $('btnNext').click(); }
  if (e.key.startsWith('Arrow') || e.code === 'Space') e.preventDefault();
});
let tStart = null;
const swipe = (dx, dy) => { const ax = Math.abs(dx), ay = Math.abs(dy); if (Math.max(ax, ay) < 24) return false; if (ax > ay) (dx < 0 ? doLeft : doRight)(); else (dy < 0 ? doJump : doSlide)(); return true; };
canvas.addEventListener('pointerdown', (e) => { audio.unlock(); tStart = { x: e.clientX, y: e.clientY, id: e.pointerId }; });
canvas.addEventListener('pointermove', (e) => { if (tStart && tStart.id === e.pointerId && swipe(e.clientX - tStart.x, e.clientY - tStart.y)) tStart = null; });
window.addEventListener('pointerup', () => { tStart = null; });
canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
window.addEventListener('pointerdown', () => audio.unlock(), { once: false });
// on-screen buttons for phones (shown on coarse pointers / touch)
(function touchPad() {
  const pad = $('touchPad'); if (!pad) return;
  const show = ('ontouchstart' in window) || (navigator.maxTouchPoints || 0) > 0 || matchMedia('(pointer:coarse)').matches;
  pad.classList.toggle('hidden', !show);
  const bind = (id, fn) => { const el = $(id); if (!el) return; const go = (e) => { e.preventDefault(); audio.unlock(); fn(); }; el.addEventListener('pointerdown', go); };
  bind('tpL', doLeft); bind('tpR', doRight); bind('tpU', doJump); bind('tpD', doSlide);
})();

// ------------------------------------------------------------------ bot (attract mode / tests)
const isHard = (o) => o.kind === 'crash' || o.avoid;
const ox = (o) => (o.cross && !o.cross.done ? laneX(o.lane) : o.x); // crossing animals count as sitting in their target lane
function botThink() {
  if (!P.alive || G.finishing) return;
  const sp = Math.max(G.speed, 10);
  const lanes = [-1, 0, 1];
  const info = lanes.map((l) => {
    let hard = 999, low = 999, climb = false, oncomingT = 999;
    for (const o of G.obstacles) {
      if (o.hit || o.kind === 'slow') continue;
      if (Math.abs(ox(o) - laneX(l)) > 1.3) continue;
      const dz = P.z - (o.z + o.hz);
      const back = P.z - (o.z - o.hz);
      if (back < -1) continue;
      const closing = Math.max(6, sp + Math.max(0, o.vz || 0));
      const front = Math.max(dz, 0);
      const tti = front / closing;
      // score hard obstacles in time-to-impact so oncoming trains (closing ~50 m/s) are seen early
      const equiv = tti * sp;
      if (front > 140) continue;
      if (o.ramp) { climb = true; continue; }
      if ((o.vz || 0) > 8) {
        oncomingT = Math.min(oncomingT, tti);
        hard = Math.min(hard, equiv);
        continue;
      }
      if (o.walkable && (o.roof || o.platform || o.name === 'train')) {
        if (climb || o.y1 <= 3.35) { low = Math.min(low, front); continue; }
        if (equiv < hard) hard = equiv; continue;
      }
      if (isHard(o)) hard = Math.min(hard, equiv); else low = Math.min(low, front);
    }
    return { l, hard, low, climb, oncomingT };
  });
  if (!P.flying) {
    const cur0 = info[P.lane + 1];
    const imminent = cur0 && (cur0.oncomingT < 2.4 || cur0.hard < sp * 1.8);
    if (!imminent) {
      let bestP = null;
      for (const c of G.coins) {
        if (!c.power || c.got) continue;
        const dc = P.z - c.z;
        if (dc > 2 && dc < 42) { if (!bestP || dc < bestP.dc) bestP = { c, dc }; }
      }
      if (bestP && Math.abs(P.x - laneX(P.lane)) < 0.3) {
        const want = Math.max(-1, Math.min(1, Math.round(bestP.c.x / LANE_W)));
        const wantInfo = info[want + 1];
        if (want !== P.lane && wantInfo && wantInfo.oncomingT > 2.2 && wantInfo.hard > sp * 1.6) {
          if (want < P.lane) doLeft(); else doRight(); return;
        }
      }
    }
  }
  const cur = info[P.lane + 1];
  if (P.y > 1.2) {
    // on a roof: jump to the next roof if there's a gap, otherwise ride off the end (safe)
    let here = null, next = null;
    for (const o of G.obstacles) {
      if (!o.walkable || o.hit) continue;
      if (Math.abs(ox(o) - P.x) > 1.4) continue;
      const back = o.z - o.hz, front = o.z + o.hz;
      if (P.z <= front + 0.4 && P.z >= back - 0.4) here = o;
      else if (P.z - (o.z + o.hz) > 0 && P.z - (o.z + o.hz) < 18) { if (!next || o.z > next.z) next = o; }
    }
    if (here) {
      const endIn = P.z - (here.z - here.hz); // distance to the front lip
      if (next && endIn < sp * 0.38 && endIn > 0.4 && P.grounded) doJump();
    }
    return;
  }
  // change lanes ~2.6s before a wall / oncoming (closing-speed already folded into hard)
  if (cur.hard < sp * 2.6 || cur.oncomingT < 2.6) {
    const best = info.slice().sort((x, y) => (Math.min(y.hard, 200) - Math.min(x.hard, 200)) || (y.oncomingT - x.oncomingT) || (Math.abs(x.l - P.lane) - Math.abs(y.l - P.lane)))[0];
    if (best.l !== P.lane && (best.hard > cur.hard + 4 || best.oncomingT > cur.oncomingT + 0.4)) {
      const nl = P.lane + Math.sign(best.l - P.lane);
      const mid = info[nl + 1];
      const midFatal = mid && (mid.oncomingT < 1.15 || mid.hard < 4);
      const blocked = midFatal || G.obstacles.some((o) => !o.hit && isHard(o) && Math.abs(ox(o) - laneX(nl)) < 1.3 && Math.abs(o.z - P.z) < o.hz + 2.2);
      if (!blocked && Math.abs(P.x - laneX(P.lane)) < 0.3) { if (nl < P.lane) doLeft(); else doRight(); return; }
    }
  }
  // jump / slide for the nearest low obstacle in current lane
  let best = null;
  for (const o of G.obstacles) {
    if (o.hit || o.kind === 'slow' || Math.abs(ox(o) - P.x) > 1.2 || isHard(o) && !o.walkable) continue;
    if (o.ramp) continue;
    if ((o.roof || o.platform || o.name === 'train') && o.walkable && P.y > o.y1 - 0.5) continue;
    const dc = P.z - o.z; if (dc < -1) continue; if (!best || dc < best.dc) best = { o, dc };
  }
  if (best) {
    const roof = !!(best.o.roof || best.o.platform || best.o.name === 'train');
    const rel = Math.max(6, sp + (best.o.vz || 0)), act = rel * (best.o.slide || best.o.name === 'bar' ? 0.3 : roof ? 0.48 : 0.36);
    if (best.dc < act && best.dc > 0.5) { if (best.o.slide || best.o.name === 'bar') { if (P.grounded && P.slideT <= 0) doSlide(); } else if (P.grounded) doJump(); }
  }
}

// ------------------------------------------------------------------ gameplay update
function setState(s) { G.state = s; }
function toast(msg, ms = 1400) { const t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast.h); toast.h = setTimeout(() => t.classList.remove('show'), ms); }
function stumble(o, lateral) {
  if (absorbHit(G, P) && !lateral) return;
  if (G.healT > 0 && !GOD && !G.attract) { caught(); return; }
  G.stumbles++; G.healT = STUMBLE_HEAL; G.gap = 3.2; G.speedMul = 0.62; P.invuln = 1.4; G.shake = 0.5; P.tumble = 0.55; audio.stumble();
  toast(`STUMBLE! ${C.ch.def.name} is right behind you!`, 1700);
  if (o && !lateral) { o.hit = true; o.knock = { vx: rand(-4, 4), vy: 7, vz: -4, rx: rand(3, 8) }; }
}
function crash(o) {
  if (absorbHit(G, P)) { if (o) { o.hit = true; } audio.powerup && audio.powerup('shield'); return; }
  if (GOD || G.attract) { if (o) { o.hit = true; o.knock = { vx: 6, vy: 9, vz: -6, rx: 6 }; } return; }
  if (!P.alive) return; G.lastHit = o ? { name: o.name, lane: o.lane, z: +o.z.toFixed(1), vz: o.vz, pz: +P.z.toFixed(1), px: +P.x.toFixed(2), py: +P.y.toFixed(2) } : null; P.alive = false; G.ending = { kind: 'crash', t: 0 }; G.shake = 0.9; audio.crash(); audio.duck(true); P.vy = 9; P.grounded = false;
  C.ch.acts.run.fadeOut(0.2); C.ch.acts.idle.reset().fadeIn(0.2).play();
}
function caught() {
  if (!P.alive) return; P.alive = false; G.ending = { kind: 'caught', t: 0 }; G.shake = 0.5; audio.caught(); audio.duck(true);
  C.ch.mixer.stopAllAction(); C.ch.acts.hit.reset().play(); G.gap = 1.3;
}
function collide() {
  if (P.flying) return 0;
  const ph = playerHeight(); let gh = 0; const pz = P.z; const rise = 0.6 * G.speed * (G.dt || 0.017) * 1.6 + 0.1; // ramp climbs faster than one frame of snapping at low fps
  G.rideVz = 0;
  for (const o of G.obstacles) {
    if (o.hit) continue;
    if (Math.abs(pz - o.z) > o.hz + 0.4) continue;
    const dx = Math.abs(P.x - o.x); if (dx > o.hx + 0.28) continue;
    if (o.walkable) {
      const top = surfaceTop(o, pz);
      if (P.y >= top - 0.38 - rise) { gh = Math.max(gh, top); if (top >= gh) G.rideVz = o.vz || 0; continue; }
    } else if (!(P.y < o.y1 - 0.2 && P.y + ph > o.y0 + 0.05)) continue;
    // a hit
    if (o.kind === 'slow') { o.hit = true; G.speedMul = Math.min(G.speedMul, 0.68); if (!G.attract) audio.splash(); P.splash = 0.4; continue; }
    const switching = Math.abs(P.x - laneX(P.lane)) > 0.25;
    if (switching && dx > o.hx - 0.2 === false) { /* deep overlap while switching */ }
    if (switching) { // sideswipe: bounce back to the previous lane
      P.lane = P.prevLane; stumble(o, true); continue;
    }
    if (o.kind === 'crash') { crash(o); return gh; }
    stumble(o, false);
  }
  return gh;
}
function update(dt) {
  G.time += dt; G.dt = dt;
  const lv = G.level, prog = clamp(G.dist / lv.goal, 0, 1);
  // speed
  const target = lerp(lv.speed[0], lv.speed[1], G.attract ? Math.min(prog, 0.3) : prog);
  G.speedMul = Math.min(1, G.speedMul + dt * 0.35);
  if (P.alive && !G.finishing) G.speed = lerp(G.speed, target * G.speedMul * speedMul(G) * (G.time < 1.5 ? 0.6 + G.time / 1.5 * 0.4 : 1), Math.min(1, dt * 4));
  else if (G.finishing) G.speed = Math.max(0, G.speed - dt * 9);
  else G.speed = Math.max(0, G.speed - dt * 25);

  tickPower(G, P, dt, PLAYER);
  if (P.flying && Math.random() < dt * 6) { const lz = P.z - rand(6, 14); addCoin(P.x + rand(-0.4, 0.4), 5.4, lz); }
  if (BOT || G.attract) botThink();
  while (inputQ.length) handleInput(inputQ.shift());
  P.laneChangeT = (P.laneChangeT || 0) + dt;

  // lateral
  P.x += clamp(laneX(P.lane) - P.x, -PLAYER.laneSpeed * dt, PLAYER.laneSpeed * dt);
  // vertical / ground
  const gh = P.alive ? collide() : 0;
  if (P.alive) {
    P.z -= G.speed * dt;
    if (P.grounded && G.rideVz) P.z += G.rideVz * dt;
    G.dist = -P.z;
    if (!P.grounded || P.y > gh + 0.01) { P.vy -= PLAYER.gravity * dt; P.y += P.vy * dt; }
    if (P.y <= gh) {
      const wasAir = !P.grounded; P.y = gh; P.vy = 0; P.grounded = true;
      if (wasAir) { audio.land(); P.landSq = 0.18; if (P.slideAfterLand) { P.slideAfterLand = false; P.slideT = PLAYER.slideTime * 0.8; audio.slide(); } if (P.jumpBuf > 0) startJump(); }
    } else P.grounded = false;
    if (P.slideT > 0) P.slideT -= dt;
    P.jumpBuf -= dt; P.invuln -= dt;
    if (G.healT > 0) G.healT -= dt;
  } else {
    P.vy -= PLAYER.gravity * dt; P.y = Math.max(0, P.y + P.vy * dt); if (P.y <= 0 && P.vy < 0) { P.vy = 0; }
    if (G.ending) { G.ending.t += dt; if (G.ending.t > (G.ending.kind === 'crash' ? 1.4 : 1.2)) endRun(); }
  }
  // trail for chaser
  G.trail.push([P.z, P.x, P.y]); if (G.trail.length > 600) G.trail.shift();

  // finish
  if (!G.attract && P.alive && !G.finishing && G.dist >= lv.goal) { G.finishing = 0.001; audio.fanfare(); toast('FINISH!', 2000); }
  if (G.finishing) { G.finishing += dt; if (G.finishing > 2.4 && G.state === 'playing') levelComplete(); }
  // attract loop restart
  if (G.attract && G.dist > 600) { G.attractI = ((G.attractI ?? 0) + 1) % ATTRACT.length; resetRun(ATTRACT[G.attractI], true); }

  updateObstacles(dt); updatePeds(dt); updateCoins(dt); updateChaser(dt); updateSpawner(); ensureChunks(); updateScore(dt);
  if (lv.skyEnd && (G.frameN = (G.frameN || 0) + 1) % 4 === 0) applySky(lv.sky, clamp(prog * 1.25 - 0.1, 0, 1), lv.skyEnd);
  // audio scene
  audio.setScene({ station: currentTheme() === 'station' ? 1 : 0 });
  updateVoices(dt);
  if (G.state === 'playing') updateHud();
}
function updateObstacles(dt) {
  for (let i = G.obstacles.length - 1; i >= 0; i--) {
    const o = G.obstacles[i];
    if (o.vz) o.z += o.vz * dt;
    if (o.laneChange) {
      const lc = o.laneChange; lc.t = (lc.t || 0) + dt;
      const ind = o.mesh.userData && o.mesh.userData.indicators;
      const dir = lc.to > lc.from ? 'R' : 'L';
      if (ind && ind[dir]) {
        const on = Math.floor(G.time * 8) % 2 === 0;
        for (const m of ind[dir]) m.material = on ? ind.on : ind.off;
      }
      if (lc.t > lc.delay) {
        const k = Math.min(1, (lc.t - lc.delay) / (lc.dur || 1));
        const a = laneX(lc.from), b = laneX(lc.to);
        o.x = a + (b - a) * k; o.mesh.position.x = o.x; o.lane = k >= 1 ? lc.to : o.lane;
        if (k >= 1) o.laneChange = null;
      }
    }
    if (o.vz && Math.abs(o.z - P.z) < 40) G.movingSeen = (G.movingSeen || 0) + 1;
    o.mesh.position.z = o.z;
    if (o.cross && !o.hit) {
      const c = o.cross;
      if (!c.go && !c.done) { const sp = Math.max(G.speed, 12); if (P.z - o.z < sp * Math.abs(c.tx - o.x) / c.speed + 0.5 && P.z - o.z > -2) { c.go = true; if (c.run) { c.idle.group.visible = false; c.run.group.visible = true; } } }
      else if (c.go) { o.x += c.dir * c.speed * dt; o.mesh.position.x = o.x; if (c.dir * (o.x - 6.2 * c.dir) > 0) { c.go = false; c.done = true; } }
    }
    if (o.mixers && Math.abs(o.z - P.z) < 60 && (!o.cross || o.cross.go || !o.cross.run)) for (const m of o.mixers) m.update(dt);
    else if (o.cross && o.cross.run && !o.cross.go && Math.abs(o.z - P.z) < 60) o.cross.idle.mixer.update(dt);
    if (o.knock) { const k = o.knock; k.vy -= 25 * dt; o.mesh.position.x += k.vx * dt; o.mesh.position.y += k.vy * dt; o.z += k.vz * dt * 0; o.mesh.rotation.x += k.rx * dt; o.mesh.rotation.z += k.rx * 0.6 * dt; if (o.mesh.position.y < -3) o.mesh.visible = false; }
    // pass-by whoosh
    if (!o.passed && (o.y1 > 1.5) && P.z < o.z + o.hz + 0.2 && P.z > o.z - o.hz - 0.2 && o.lane !== P.lane) { o.passed = true; if (P.alive && Math.abs(o.x - P.x) < 6) audio.whoosh(clamp((o.x - P.x) / 4, -1, 1), o.vehicle === 'train' ? 1.3 : o.vehicle === 'bus' ? 1.1 : 0.7, o.vz ? 1.3 : 1); }
    if (o.z > P.z + 22 || o.z < P.z - 420) { scene.remove(o.mesh); W.disposeTree(o.mesh); if (o.voice) { o.voice.stop(); G.voices = G.voices.filter((v) => v !== o.voice); } G.obstacles.splice(i, 1); }
  }
}
function updateCoins(dt) {
  const ph = playerHeight();
  for (let i = G.coins.length - 1; i >= 0; i--) {
    const c = G.coins[i];
    c.t += dt * 4; c.mesh.rotation.y = c.t; c.mesh.position.y = c.y + Math.sin(c.t * 0.8) * 0.06;
    if (c.got) { c.life -= dt; const k = 1 - Math.max(0, c.life) / 0.2; c.mesh.scale.setScalar(1 + k * 0.5); c.mesh.position.y = c.y + k * 1.2; c.mesh.position.z -= G.speed * dt * 0.0; c.mesh.position.z = c.z - k * 0; if (c.life <= 0) { scene.remove(c.mesh); G.coins.splice(i, 1); } continue; }
    const reachY = P.flying ? 8 : ph + 0.4;
    if (P.alive && Math.abs(c.z - P.z) < (c.power ? 1.1 : 0.9) && Math.abs(c.x - P.x) < (c.power ? 1.15 : 0.95) && c.y > P.y - 0.3 && c.y < P.y + reachY) {
      c.got = true; c.life = 0.2;
      if (c.power) { applyPower(G, P, c.power, audio); }
      else { G.coinCount++; G.combo++; G.comboT = 0.9; audio.coin(G.combo); }
    } else if (c.z > P.z + 4.5) { scene.remove(c.mesh); G.coins.splice(i, 1); }
  }
  magnetPull(G, P, G.coins, dt);
  G.comboT -= dt; if (G.comboT < 0) G.combo = 0;
}
function trailAt(z) { // dodo path sample at depth z (z <= current)
  const t = G.trail; if (!t.length) return [P.x, P.y];
  for (let i = t.length - 1; i >= 0; i--) if (t[i][0] >= z) return [t[i][1], t[i][2]];
  return [t[0][1], t[0][2]];
}
function updateChaser(dt) {
  const normal = G.level.num === 1 ? 5.3 : 5.0;
  const want = G.ending?.kind === 'caught' ? 1.3 : G.healT > 0 ? 3.2 : normal;
  G.gap += (want - G.gap) * Math.min(1, dt * (G.healT > 0 ? 3 : 0.7));
  const cz = P.z + G.gap; const [tx, ty] = trailAt(cz);
  C.z = cz; C.x += (tx - C.x) * Math.min(1, dt * 14); C.y = Math.max(0, ty * 0.92);
  C.ch.group.position.set(C.x, C.y, C.z);
  C.ch.mixer.update(dt * (G.speed > 1 || G.ending ? 1 : 0.3));
  C.ch.acts.run.timeScale = 0.9 + G.speed * 0.025;
}
function updateScore(dt) { G.score = Math.floor(G.dist) + G.coinCount * 10; }

// ------------------------------------------------------------------ voices (positional vehicle audio)
function updateVoices(dt) {
  if (!audio.ready) return;
  const cands = G.obstacles.filter((o) => o.vehicle && !o.hit).map((o) => ({ o, d: Math.hypot(o.x - P.x, o.z - P.z) })).filter((c) => c.d < 130 && (c.o.vz || c.o.vehicle !== 'car')).sort((a, b) => a.d - b.d).slice(0, 4);
  const keep = new Set(cands.map((c) => c.o));
  for (const o of G.obstacles) if (o.voice && !keep.has(o)) { o.voice.stop(); G.voices = G.voices.filter((v) => v !== o.voice); o.voice = null; }
  for (const { o, d } of cands) {
    if (!o.voice) { o.voice = audio.createVoice(o.vehicle); if (!o.voice) continue; G.voices.push(o.voice); }
    const v = o.voice; v.hornCool -= dt;
    v.setPos({ x: o.x, y: o.y1 * 0.5, z: o.z });
    const moving = !!o.vz, base = o.vehicle === 'train' ? 0.9 : o.vehicle === 'bus' ? 0.8 : 0.5;
    v.gainTarget(base * (moving ? 1 : 0.4));
    if (v.engine) v.engine.o.frequency.setTargetAtTime((o.vehicle === 'bus' ? 55 : 90) * (1 + (moving ? 0.25 : 0)), audio.ctx.currentTime, 0.2);
    if (moving && !o.hornDone) {
      const close = Math.max(10, G.speed + Math.max(0, o.vz || 0));
      const warn = o.vehicle === 'train' ? close * 3.0 : close * 2.6;
      if (d < Math.max(warn, o.vehicle === 'train' ? 150 : 110)) { o.hornDone = true; v.horn(); }
    }
    if (!moving && !o.hornDone && o.vehicle !== 'car' && d < 50 && Math.random() < 0.004) { o.hornDone = true; v.horn(); }
  }
}

// ------------------------------------------------------------------ camera / animation
const camPos = new THREE.Vector3(), camLook = new THREE.Vector3();
function updateCamera(dt, snap) {
  const k = snap ? 1 : Math.min(1, dt * 7);
  // Original design (and Kevin's): camera sits behind the chaser, looking past him at the dodo
  // (Subway Surfers-style). When the dodo is high (fly / rooftop) pull back and lift the look
  // so the chef does not fill the frame. A slightly higher look-at also keeps the mountain
  // skyline inside the 62° gameplay frustum.
  const fly = Math.max(0, P.y - 0.9);
  const tx = P.x * 0.7, ty = 4.7 + P.y * 0.45 + fly * 1.15, tz = P.z + 8.8 + fly * 2.4;
  camPos.x += (tx - camPos.x) * k; camPos.y += (ty - camPos.y) * k; camPos.z += (tz - camPos.z) * (snap ? 1 : Math.min(1, dt * 20));
  camLook.set(P.x * 0.5, 1.8 + P.y * 0.55 + fly * 0.35, P.z - 9 - fly * 2);
  G.shake = Math.max(0, G.shake - dt * 1.8);
  const s = G.shake * 0.35;
  camera.position.set(camPos.x + rand(-s, s), camPos.y + rand(-s, s), camPos.z);
  if (G.state === 'title' || G.attract) { // slow cinematic sway behind the dodo
    camera.position.x += Math.sin(G.time * 0.35) * 2.2; camera.position.y -= 0.9; camera.position.z -= 1.5;
  }
  const hb = G.level ? headingBank(G.level, P.z) : { yaw: 0, bank: 0 };
  camera.lookAt(camLook);
  camera.rotation.z = (camera.rotation.z || 0) * 0.85 + (hb.bank || 0) * 0.15;
  if (window.__camOverride) window.__camOverride(camera, P, C);
  sun.position.set(P.x + 14, 34, P.z + 14); sun.target.position.set(P.x, 0, P.z - 8); sun.target.updateMatrixWorld();
  if (backdrop) {
    backdrop.position.set(0, 0, P.z);
    // swing the peaks / sea with real heading change so the correct side stays visible
    const yaw = Math.max(-0.6, Math.min(0.6, (hb.yaw || 0) * 0.25));
    backdrop.rotation.y += (yaw - (backdrop.rotation.y || 0)) * Math.min(1, (dt || 0.016) * 2);
    const mt = backdrop.userData.mountainRoot;
    if (mt) mt.rotation.y = -backdrop.rotation.y;
  }
  G.routeHud = hb;
}
// ---- dodo rig driving. The GLB has a skeleton + one idle clip; the idle clip plays as the "breathing / beak / neck" layer
// and we override the two foot bones (position + pitch) for the run / tuck / slide, and add small spine + neck offsets.
const _v3 = new THREE.Vector3(), _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _qc = new THREE.Quaternion(), _eu = new THREE.Euler();
const FOOT = { A: 1.5, H: 1.3 };                           // run stride half-length / foot lift (model units, dodo ~9.7 tall)
const sstep = (x) => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); };
// foot trajectory for cycle position u in [0,1): stance (foot on ground sweeps back), swing (foot lifts and reaches forward)
function runFoot(u, out) {
  u = ((u % 1) + 1) % 1;
  if (u < 0.5) { out[0] = FOOT.A * (1 - 4 * u); out[1] = 0; out[2] = u > 0.4 ? -0.35 * ((u - 0.4) / 0.1) : 0; }
  else { const v = (u - 0.5) / 0.5, e = sstep(v); out[0] = -FOOT.A + 2 * FOOT.A * e; out[1] = FOOT.H * Math.sin(Math.PI * Math.pow(v, 0.8)); out[2] = -0.35 - 0.35 * Math.sin(Math.PI * v) + 0.7 * v * v; }
  return out;
}
const _f0 = [0, 0, 0], _f1 = [0, 0, 0];
function addBone(rig, name, x, y, z) { // extra local rotation (positive x = lean forward / head down) on top of the clip
  const b = rig.bones[name]; if (!b) return; _eu.set(x, y, z); b.quaternion.multiply(_qa.setFromEuler(_eu));
}
function driveFoot(rig, name, fwd, up, pitch, side) {
  const b = rig.bones[name], r = rig.rest[name]; if (!b) return;
  _v3.set(side || 0, up, fwd).applyMatrix4(rig.inv).multiplyScalar(1 / rig.ps); b.position.copy(r.p).add(_v3);
  _qa.setFromAxisAngle(_v3.set(1, 0, 0), pitch);                      // pitch about the scene-space side axis (+ = toes down)
  _qb.copy(rig.pq).invert(); _qc.copy(_qb).multiply(_qa).multiply(rig.pq); b.quaternion.copy(_qc).multiply(r.q);
}
function poseDodo(dt, run, air, slide, spd) {
  const rig = P.dodo.userData.rig; if (!rig) return;
  const k = 1 - Math.exp(-dt * 14);
  P.bRun = lerp(P.bRun || 0, run ? 1 : 0, k); P.bAir = lerp(P.bAir || 0, air ? 1 : 0, 1 - Math.exp(-dt * 18)); P.bSlide = lerp(P.bSlide || 0, slide ? 1 : 0, 1 - Math.exp(-dt * 20));
  P.clipT = (P.clipT || 0) + dt * (0.9 + spd * 0.05); rig.sample(P.clipT);                // idle clip: breathing, beak, neck sway
  const u = P.phase / (Math.PI * 2);
  runFoot(u, _f0); runFoot(u + 0.5, _f1);
  const br = P.bRun, ba = P.bAir, bs = P.bSlide;
  // air tuck: legs pulled up and forward, slight alternate; slide: feet trail behind, toes up
  const tuck = [[1.0, 1.7, 0.55], [0.5, 2.1, 0.7]], trail = [[-1.7, 0.7, -0.5], [-2.1, 1.0, -0.5]];
  const feet = [_f0, _f1], names = ['Bone006_Armature002', 'Bone007_Armature002'];
  for (let i = 0; i < 2; i++) {
    const f = feet[i]; let fw = f[0] * br, up = f[1] * br, pi = f[2] * br;
    fw = lerp(fw, tuck[i][0], ba); up = lerp(up, tuck[i][1], ba); pi = lerp(pi, tuck[i][2], ba);
    fw = lerp(fw, trail[i][0], bs); up = lerp(up, trail[i][1], bs); pi = lerp(pi, trail[i][2], bs);
    driveFoot(rig, names[i], fw, up, pi, 0);
  }
  // body: lean, step bounce through the spine, head stays level-ish and bobs forward on every step
  const ph = P.phase, bob2 = Math.sin(ph * 2);
  const lean = br * 0.12 + ba * 0.05 + bs * 0.55;
  addBone(rig, 'Bone_Armature002', lean + br * bob2 * 0.04, 0, br * Math.sin(ph) * 0.06);
  addBone(rig, 'Bone001_Armature002', br * 0.02 * bob2 + bs * 0.1, 0, br * Math.sin(ph) * 0.05);
  const headUp = -(lean + br * 0.1) * 0.9 + bs * -0.25 + ba * -0.1;
  addBone(rig, 'Bone003_Armature002', headUp * 0.35 + br * bob2 * 0.05, 0, -br * Math.sin(ph) * 0.04);
  addBone(rig, 'Bone004_Armature002', headUp * 0.35 - br * bob2 * 0.07, 0, -br * Math.sin(ph) * 0.04);
  addBone(rig, 'Bone005_Armature002', headUp * 0.3 + br * bob2 * 0.06 + ba * 0.1, 0, 0);
}
function animatePlayer(dt) {
  if (!P.anim || !P.dodo) return;
  const sp = G.speed; P.phase += dt * (P.alive ? (6 + sp * 0.42) * (P.grounded && P.slideT <= 0 ? 1 : 0.4) : 0);
  const run = P.alive && P.grounded && P.slideT <= 0 && sp > 1;
  const bob = run ? Math.abs(Math.sin(P.phase + 0.5)) * 0.07 : 0;
  const roll = run ? Math.sin(P.phase) * 0.07 : 0;
  const yaw = run ? Math.sin(P.phase) * 0.05 : 0;
  let pitch = run ? -0.04 : 0, sy = 1, sz = 1, sx = 1;
  P.landSq = Math.max(0, P.landSq - dt * 0.8);
  if (!P.grounded && P.alive) { pitch = clamp(P.vy * 0.018, -0.4, 0.4); sy = 1 + clamp(P.vy * 0.003, -0.04, 0.06); }
  if (P.landSq > 0) { sy *= 1 - P.landSq * 0.6; sx *= 1 + P.landSq * 0.3; }
  if (P.slideT > 0) { const t = Math.min(1, (PLAYER.slideTime - P.slideT) / 0.12, P.slideT / 0.12 + 0.0); pitch = -0.35 * Math.min(1, t * 1.5 + 0.3); sy = 0.62; sz = 1.1; }
  if (P.tumble > 0) { P.tumble -= dt; pitch += -Math.sin(Math.max(0, P.tumble) / 0.55 * Math.PI) * 0.8; }
  P.anim.position.y = bob; P.anim.rotation.set(pitch, yaw, roll); P.anim.scale.set(sx, sy, sz);
  if (!P.alive) { if (G.ending?.kind === 'crash') { P.anim.rotation.x -= G.ending.t * 8; P.anim.rotation.z += G.ending.t * 3; } else { P.anim.rotation.x = -0.3; sy = 0.75; P.anim.scale.set(1.1, 0.85, 1.1); } }
  poseDodo(dt, run, !P.grounded && P.alive, P.slideT > 0 && P.alive, sp);
  const ud = P.dodo.userData; if (ud.mixer) ud.mixer.update(dt * (run ? (0.5 + sp * 0.06) * ud.speed : P.alive ? 0.15 : 0));
  P.group.position.set(P.x, P.y, P.z);
  P.group.visible = !(P.invuln > 0 && Math.floor(G.time * 14) % 2 === 0 && P.alive);
  // blob shadow
  shadowBlob.position.set(P.x, 0.03, P.z); shadowBlob.scale.setScalar(clamp(1 - P.y * 0.12, 0.4, 1) * (P.slideT > 0 ? 1.2 : 1));
  shadowBlob.visible = P.group.visible && P.y < 3.9;
}

// ------------------------------------------------------------------ HUD & screens
function updateHud() {
  $('hudScore').textContent = G.score; $('hudCoins').textContent = G.coinCount;
  const pr = clamp(G.dist / G.level.goal, 0, 1);
  $('hudBar').style.width = (pr * 100).toFixed(1) + '%'; $('hudDist').textContent = `${Math.min(G.dist | 0, G.level.goal)} / ${G.level.goal} m`;
  const danger = clamp(1 - (G.gap - 2.6) / 2.7, 0.08, 1); $('hudGuardBar').style.width = (danger * 100) + '%';
  $('hudGuard').classList.toggle('danger', G.healT > 0);
  const st = $('streetHud');
  if (st && G.level) {
    const info = sectionAt(G.level, P.z) || {};
    const road = (info.roadName || '').replace(/^\[|\]$/g, '') || '—';
    const nxt = info.next ? info.next.name : (info.station ? info.station.name : '');
    const here = (info.landmarks && info.landmarks[0] && info.landmarks[0].name) || (info.prev && info.prev.name) || '';
    const sr = st.querySelector('.sroad'); const sn = st.querySelector('.snext');
    if (sr) sr.textContent = road;
    if (sn) sn.textContent = nxt ? ('Next: ' + nxt) : (here || '');
    const sf = $('streetFill'); if (sf) sf.style.width = (pr * 100).toFixed(1) + '%';
  }
  updatePowerHud();
}
function show(id) { for (const s of document.querySelectorAll('.screen')) s.classList.add('hidden'); if (id) $(id).classList.remove('hidden'); }
function setMuteIcon(m) { $('btnMute').textContent = m ? '🔇' : '🔊'; $('btnMute2').textContent = m ? 'UNMUTE' : 'MUTE'; }
function stars(n) { return [0, 1, 2].map((i) => i < n ? '★' : '☆').join(''); }
const SKY_CARD = { day: ['#2a78c0', '#9fd8f4'], dusk: ['#5a4a86', '#f0a878'], tropic: ['#1aa0b8', '#bff0e8'], mist: ['#5a7080', '#c0ccd2'], gold: ['#b8742a', '#f8dc9c'], forest: ['#2a6a4a', '#b8dcc0'], sunset: ['#3a2a6a', '#ff9a58'], night: ['#0a1236', '#3c4a88'] };
let shownWorld = null;
function buildLevelCards(wid) {
  shownWorld = wid || shownWorld || worldOf(G.level)?.id || 'mt';
  const tabs = $('worldTabs'); tabs.innerHTML = '';
  for (const w of WORLDS) {
    const b = document.createElement('button'); b.className = 'tab' + (w.id === shownWorld ? ' on' : ''); const got = w.levels.reduce((n, l) => n + (save.d.stars[l.uid] || 0), 0);
    b.innerHTML = `<b>${w.name}</b><small>${w.sub} · ★ ${got}/${w.levels.length * 3}</small>`; b.onclick = () => { audio.click(); buildLevelCards(w.id); }; tabs.appendChild(b);
  }
  const wrap = $('levelCards'); wrap.innerHTML = ''; const world = WORLDS.find((w) => w.id === shownWorld);
  world.levels.forEach((lv) => {
    const locked = lv.num > save.d.unlocked[world.id], d = document.createElement('div'); d.className = 'card' + (locked ? ' locked' : ''); const [c1, c2] = SKY_CARD[lv.sky] || SKY_CARD.day;
    d.style.background = `linear-gradient(160deg, ${c1}, #0d2547 85%)`;
    d.innerHTML = `${locked ? '<div class="lock">🔒</div>' : ''}<div class="ic" style="background:radial-gradient(circle at 30% 30%, ${c2}, ${c1})">${lv.icon || ''}</div><div class="n">${lv.num}</div><div class="t">${lv.name}</div><div class="rg">${lv.region || ''}</div><div class="d">${lv.tagline}</div>
      <div class="meta">${lv.goal} m · ${lv.speed[0]}–${lv.speed[1]} m/s · chaser ${CHASERS[lv.chaser]?.emoji || ''}<br>Best: ${save.d.best[lv.uid] || 0}</div><div class="st">${stars(save.d.stars[lv.uid] || 0)}</div>`;
    d.onclick = () => { audio.click(); if (!locked) startLevel(lv); };
    wrap.appendChild(d);
  });
}
// ---- character select. Previews are rendered once into small images with an offscreen render target.
let previews = null;
function renderPreviews() {
  if (previews) return previews; previews = {};
  const ps = new THREE.Scene(); ps.add(new THREE.HemisphereLight(0xffffff, 0x8a7d6c, 2.2)); const dl = new THREE.DirectionalLight(0xfff0d8, 2.6); dl.position.set(-3, 5, -4); ps.add(dl);
  const pc = new THREE.PerspectiveCamera(28, 1, 0.1, 60), S = 220, rt = new THREE.WebGLRenderTarget(S, S); rt.texture.colorSpace = THREE.SRGBColorSpace;
  const buf = new Uint8Array(S * S * 4), cv = document.createElement('canvas'); cv.width = cv.height = S; const cx = cv.getContext('2d');
  const oc = renderer.getClearColor(new THREE.Color()), oa = renderer.getClearAlpha(), ot = renderer.toneMapping;
  renderer.setClearColor(0x000000, 0);
  for (const def of PLAYABLE) {
    const m = makePlayable(def); ps.add(m); if (m.userData.rig) m.userData.rig.sample(0.3); else if (m.userData.mixer) m.userData.mixer.update(0.25);
    const h = def.kind === 'dodo' ? 1.7 : def.h; pc.position.set(h * 1.25 + 0.6, h * 0.62 + 0.3, -(h * 2.2 + 2.2)); pc.lookAt(0, h * 0.48, 0);
    renderer.setRenderTarget(rt); renderer.clear(); renderer.render(ps, pc); renderer.readRenderTargetPixels(rt, 0, 0, S, S, buf);
    const img = cx.createImageData(S, S); for (let y = 0; y < S; y++) img.data.set(buf.subarray((S - 1 - y) * S * 4, (S - y) * S * 4), y * S * 4); cx.putImageData(img, 0, 0);
    previews[def.id] = cv.toDataURL('image/png'); ps.remove(m);
  }
  renderer.setRenderTarget(null); renderer.setClearColor(oc, oa); rt.dispose();
  return previews;
}
function buildCharacters() {
  const pv = renderPreviews(), wrap = $('charCards'); wrap.innerHTML = '';
  for (const def of PLAYABLE) {
    const d = document.createElement('div'); d.className = 'card ch' + (def.id === save.d.char ? ' sel' : '');
    d.innerHTML = `<img src="${pv[def.id]}" alt=""><div class="t">${def.name}</div><div class="d">${def.sub}</div><div class="st">${def.id === save.d.char ? '✔ SELECTED' : 'SELECT'}</div>`;
    d.onclick = () => { audio.click(); setPlayable(def.id); save.write(); buildCharacters(); updateTitleChar(); };
    wrap.appendChild(d);
  }
}
function updateTitleChar() { const b = $('btnChars'); if (b) b.textContent = '🦤 CHARACTER: ' + playableById(save.d.char).name.toUpperCase(); }
function goTitle() {
  audio.muffle(false); audio.duck(false); setState('title'); show('title'); $('hud').classList.add('hidden');
  if (!G.attract) resetRun(ATTRACT[G.attractI ?? 0], true);
  audio.setScene({ station: 0 }); updateTitleChar(); audio.playMusic('menu');
}
async function startLevel(lv, opts = {}) {
  const wantIntro = opts.replay || shouldPlayIntro(params, save, lv, BOT || window.__botOn);
  if (wantIntro) {
    setState('intro'); show(null); $('hud').classList.add('hidden');
    audio.unlock();
    try { await playIntro({ renderer, camera, audio }); } catch (e) { console.warn('intro', e); }
    markIntroSeen(save);
  }
  save.d.lastWorld = lv.world; save.write(); show(null); resetRun(lv, false); $('hud').classList.remove('hidden'); $('hint').classList.toggle('hidden', lv.num !== 1);
  $('hudLevel').textContent = `${worldOf(lv).id === 'mt' ? 'MORIS' : 'PORT LOUIS'} ${lv.num} · ${lv.name.toUpperCase()}`; updateHud();
  audio.unlock(); audio.muffle(false); audio.duck(false); audio.playMusic(songOf(lv.uid));
  setState('countdown'); G.countdown = 3.2; G.lastCount = 4;
}
function pause() { if (G.state !== 'playing') return; setState('paused'); show('pause'); $('pause').classList.add('dim'); audio.muffle(true); }
function resume() { if (G.state !== 'paused') return; show(null); setState('playing'); audio.muffle(false); }
function endRun() {
  if (G.state !== 'playing') return; setState('over');
  const caughtBy = G.ending.kind === 'caught';
  $('overTitle').textContent = caughtBy ? 'CAUGHT!' : 'CRASH!';
  $('overReason').textContent = caughtBy ? `${C.ch.def.name} caught you after a second stumble.` : 'You ran head-on into a vehicle too big to jump.';
  $('overScore').textContent = G.score; $('overCoins').textContent = G.coinCount; $('overDist').textContent = (G.dist | 0) + ' m';
  save.d.coins += G.coinCount; save.d.best[G.level.uid] = Math.max(save.d.best[G.level.uid] || 0, G.score); save.write();
  audio.gameOver(); show('over'); $('hud').classList.add('hidden');
}
function levelComplete() {
  setState('complete');
  let st = 1; if (G.coinCount >= G.level.coinStar) st++; if (G.stumbles === 0) st++;
  const id = G.level.uid, wd = worldOf(G.level); save.d.stars[id] = Math.max(save.d.stars[id] || 0, st); save.d.best[id] = Math.max(save.d.best[id] || 0, G.score + st * 100);
  const hasNext = G.level.num < wd.levels.length; if (hasNext) save.d.unlocked[wd.id] = Math.max(save.d.unlocked[wd.id], G.level.num + 1); save.d.coins += G.coinCount; save.write();
  G.lastStars = st;
  $('stars').innerHTML = [0, 1, 2].map((i) => `<span class="${i < st ? '' : 'off'}">★</span>`).join('');
  $('cScore').textContent = G.score + st * 100; $('cCoins').textContent = G.coinCount; $('cBest').textContent = save.d.best[id];
  $('cMsg').textContent = `★ finish  ·  ★ ${G.level.coinStar}+ coins (${G.coinCount})  ·  ★ no stumbles (${G.stumbles})` + (hasNext ? '' : '  —  all levels cleared!');
  $('btnNext').classList.toggle('hidden', !hasNext);
  show('complete'); $('hud').classList.add('hidden'); buildLevelCards(wd.id); audio.duck(false);
}

// ------------------------------------------------------------------ wiring
const click = (id, fn) => $(id).addEventListener('click', (e) => { audio.unlock(); audio.click(); fn(e); });
click('btnPlay', () => {
  if (!save.d.seenIntro) { startLevel(resolveLevel('pl1')); return; }
  const w = WORLDS.find((x) => x.id === (save.d.lastWorld || 'mt')) || WORLDS[1]; startLevel(w.levels[Math.min(save.d.unlocked[w.id], w.levels.length) - 1]);
});
click('btnIntro', () => startLevel(resolveLevel('pl1'), { replay: true }));
click('btnChars', () => { buildCharacters(); show('characters'); }); click('btnCharsBack', () => show('title'));
click('btnLevels', () => { buildLevelCards(save.d.lastWorld || 'mt'); show('levels'); });
click('btnLevelsBack', () => show('title'));
click('btnSound', () => { syncSliders(); show('sound'); G.soundFrom = 'title'; });
click('btnPauseSound', () => { syncSliders(); show('sound'); G.soundFrom = 'pause'; });
click('btnSoundBack', () => show(G.soundFrom === 'pause' ? 'pause' : 'title'));
click('btnCredits', () => show('credits')); click('btnCreditsBack', () => show('title'));
click('btnResume', resume); click('btnPause', pause);
click('btnRestart', () => startLevel(G.level)); click('btnQuit', () => goTitle());
click('btnRetry', () => startLevel(G.level)); click('btnOverMenu', () => { goTitle(); buildLevelCards(worldOf(G.level).id); show('levels'); });
click('btnNext', () => startLevel(levels[Math.min(G.lvIdx + 1, levels.length - 1)])); click('btnAgain', () => startLevel(G.level));
click('btnCMenu', () => { goTitle(); buildLevelCards(worldOf(G.level).id); show('levels'); });
click('btnMute', () => setMuteIcon(audio.toggleMute())); click('btnMute2', () => setMuteIcon(audio.toggleMute()));
function syncSliders() { $('volMaster').value = audio.set.master; $('volMusic').value = audio.set.music; $('volSfx').value = audio.set.sfx; setMuteIcon(audio.set.muted); }
$('volMaster').oninput = (e) => audio.setVol('master', +e.target.value); $('volMusic').oninput = (e) => audio.setVol('music', +e.target.value); $('volSfx').oninput = (e) => audio.setVol('sfx', +e.target.value);
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (G.state === 'playing') pause(); } });
window.addEventListener('blur', () => { if (G.state === 'playing') pause(); });

// ------------------------------------------------------------------ main loop
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  step(dt, true);
}
function step(dt, render) {
  if (G.state === 'intro') return; // intro.js owns the renderer
  if (G.state === 'playing' || G.state === 'title' || G.state === 'countdown' || G.state === 'over' || G.state === 'complete') {
    if (G.state === 'countdown') {
      G.countdown -= dt; const n = Math.ceil(G.countdown - 0.2);
      if (n !== G.lastCount) { G.lastCount = n; const el = $('countdown'); if (n > 0) { el.textContent = n; audio.count(false); } else if (n === 0) { el.textContent = 'GO!'; audio.count(true); } else el.textContent = ''; }
      if (G.countdown <= 0) { $('countdown').textContent = ''; setState('playing'); setTimeout(() => $('hint').classList.add('hidden'), 6000); }
      G.speed = 0; // hold at the start line
      updateObstacles(0); updateChaser(dt * 0.3); updateSpawner(); ensureChunks(); updateHud();
      P.alive = true;
    } else update(dt);
  }
  audio.updateAmbience(dt, camera.position, G.speed);
  updateCamera(dt, false); if (!window.__freezeAnim) animatePlayer(dt);
  if (G.level) updateScenery(dt, scene, sun.position);
  if (render) renderer.render(scene, camera);
}

// ------------------------------------------------------------------ boot
async function boot() {
  try {
    await W.loadAssets((p) => { $('loadFill').style.width = (p * 100) + '%'; });
    buildPlayer();
    camPos.set(0, 5.0, 8.8);
    resetRun(ATTRACT[0], true); updateTitleChar();
    setMuteIcon(audio.set.muted); syncSliders();
    show('title'); setState('title');
    requestAnimationFrame(frame);
    const lq = resolveLevel(params.get('level') || params.get('autoplay')); if (params.get('char')) setPlayable(params.get('char')); if (lq) await startLevel(lq);
  } catch (err) { console.error(err); $('loadText').textContent = 'Failed to load: ' + err.message + ' (serve this folder over http, see README)'; }
}
boot();

// debug / test hooks
window.__dodo = {
  renderInfo: () => ({ calls: renderer.info.render.calls, tris: renderer.info.render.triangles, geos: renderer.info.memory.geometries, tex: renderer.info.memory.textures }),
  G, P, C, audio, save, levels, startLevel, goTitle, resetRun, scene, camera,
  simulate(sec, hz = 60) { const n = Math.round(sec * hz); for (let i = 0; i < n; i++) step(1 / hz, false); },
  press: (k) => ({ l: doLeft, r: doRight, u: doJump, d: doSlide })[k](),
  setBot(v) { window.__botOn = v; },
  // test hook: freeze the dodo in a given pose (mode = run | air | slide | idle, phase in radians)
  debugPose(mode, phase = 0) {
    window.__freezeAnim = true; G.state = 'paused'; G.speed = 15; P.alive = true; P.phase = phase; P.vy = mode === 'air' ? 4 : 0;
    P.grounded = mode !== 'air'; P.slideT = mode === 'slide' ? 0.4 : 0; P.y = mode === 'air' ? 1.5 : 0; P.landSq = 0; P.tumble = 0; P.invuln = 0;
    P.bRun = mode === 'run' ? 1 : 0; P.bAir = mode === 'air' ? 1 : 0; P.bSlide = mode === 'slide' ? 1 : 0; animatePlayer(0);
  },
  info: () => ({ state: G.state, level: G.level && G.level.uid, dist: G.dist | 0, score: G.score, coins: G.coinCount, stumbles: G.stumbles, speed: +G.speed.toFixed(1), alive: P.alive, gap: +G.gap.toFixed(1), obstacles: G.obstacles.length, lastHit: G.lastHit, dodo: W.assets.dodoInfo, power: G.power && G.power.kind, moving: G.obstacles.filter((o) => o.vz).length, flying: !!P.flying }),
  givePower: (k) => applyPower(G, P, k, audio),
  playIntro: () => startLevel(resolveLevel('pl1'), { replay: true }),
};
