// Scenery for the Moris Tour levels. buildChunk(level, index) returns a 40 m chunk group (merged to a few draw calls),
// buildBackdrop(level, sky) returns the far mountains / sun / clouds. Everything is procedural (no external art).
import * as THREE from 'three';
import { CHUNK_LEN } from './config.js';
import * as T from './textures.js';
import { mat, std, basic, geo, box, cyl, rand, pick, hash, mergeStatic, building, facadeMat, gantrySign } from './world.js';
import { routeOf, sectionAt } from './routes.js';
import { makeWater, addBoat, applyDecor, routeShopSign, seaSideX, buildBackdrop as buildScenicBackdrop, tagBob } from './scenery.js';

const L = CHUNK_LEN;
const C = (hex) => mat('bc' + hex, () => std({ color: hex }));
const rep = (key, texFn, rx, ry, extra = {}) => mat(key + '|' + rx.toFixed(2) + '|' + ry.toFixed(2) + JSON.stringify(extra), () => { const t = texFn().clone(); t.needsUpdate = true; t.repeat.set(rx, ry); t.wrapS = t.wrapT = THREE.RepeatWrapping; return std({ map: t, roughness: 0.95, ...extra }); });
const plane = (w, d, m, x, y, z) => { const p = new THREE.Mesh(geo(`pl${w}|${d}`, () => new THREE.PlaneGeometry(w, d)), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); p.receiveShadow = true; return p; };
const ball = (r, m, x, y, z, sx = 1, sy = 1, sz = 1, seg = 7) => { const s = new THREE.Mesh(geo(`bs${r}|${seg}`, () => new THREE.SphereGeometry(r, seg, 5)), m); s.position.set(x, y, z); s.scale.set(sx, sy, sz); return s; };
const cone = (r, h, seg, m, x, y, z) => { const c = new THREE.Mesh(geo(`cn${r}|${h}|${seg}`, () => new THREE.ConeGeometry(r, h, seg)), m); c.position.set(x, y + h / 2, z); return c; };
const frondGeo = () => geo('frondL', () => { const gg = new THREE.PlaneGeometry(0.5, 2.2, 1, 3); gg.translate(0, 1.1, 0); const p = gg.attributes.position; for (let k = 0; k < p.count; k++) { const yy = p.getY(k); p.setZ(k, -yy * yy * 0.12); p.setX(k, p.getX(k) * (1 - yy / 3.0)); } gg.computeVertexNormals(); return gg; });
const LEAF2 = () => mat('leaf2', () => std({ color: 0x2f8f3a, side: THREE.DoubleSide }));
const rndp = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

// ---- props -------------------------------------------------------------------------------------------------------
function palmLite(g, x, z, s = 1, lean = 0) {
  const trunk = mat('trunk', () => std({ color: 0x8a6a45 }));
  let px = x, y = 0; for (let i = 0; i < 3; i++) { const seg = cyl(0.15 * s, 0.2 * s, 1.5 * s, 6, trunk, px, y + 0.75 * s, z); seg.rotation.z = -lean * 0.3; g.add(seg); y += 1.45 * s; px += lean * 0.45 * s; }
  for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(frondGeo(), LEAF2()); f.scale.setScalar(s * 1.1); f.position.set(px, y + 0.1, z); f.rotation.set(0, (i / 7) * Math.PI * 2 + x, 0); f.rotateX(-1.1 + (i % 2) * 0.35); g.add(f); }
  if (chance(0.5)) g.add(ball(0.17 * s, C(0x6a4a22), px + 0.15, y - 0.1, z + 0.1, 1, 1, 1, 6));
}
function royalPalm(g, x, z, s = 1) {
  const trunk = mat('royalTrunk', () => std({ color: 0xb9b0a0 })), green = mat('royalCrown', () => std({ color: 0x2c8a3a, side: THREE.DoubleSide }));
  g.add(cyl(0.3 * s, 0.4 * s, 9 * s, 8, trunk, x, 4.5 * s, z)); g.add(cyl(0.22 * s, 0.22 * s, 1.4 * s, 6, C(0x4c9a40), x, 9.7 * s, z));
  for (let i = 0; i < 8; i++) { const f = new THREE.Mesh(frondGeo(), green); f.scale.set(s * 1.5, s * 1.6, s * 1.5); f.position.set(x, 10.2 * s, z); f.rotation.set(0, (i / 8) * Math.PI * 2, 0); f.rotateX(-0.9 + (i % 2) * 0.35); g.add(f); }
}
function broadTree(g, x, z, s = 1, col = 0x2f8a3a, col2 = 0x3a9a44) {
  g.add(cyl(0.28 * s, 0.4 * s, 3.2 * s, 7, mat('trunk2', () => std({ color: 0x6a4a2c })), x, 1.6 * s, z));
  const a = C(col), b = C(col2);
  g.add(ball(2.0 * s, a, x, 4.2 * s, z, 1.3, 0.95, 1.3, 8)); g.add(ball(1.5 * s, b, x + 1.0 * s, 5.2 * s, z + 0.4 * s, 1, 0.9, 1, 7)); g.add(ball(1.4 * s, b, x - 1.1 * s, 4.7 * s, z - 0.5 * s, 1, 0.9, 1, 7));
}
function tallTree(g, x, z, s = 1) { // forest giants
  g.add(cyl(0.35 * s, 0.6 * s, 11 * s, 7, mat('trunk3', () => std({ color: 0x5a4430 })), x, 5.5 * s, z));
  const a = C(0x1f6a34), b = C(0x2d8040);
  g.add(ball(2.6 * s, a, x, 11 * s, z, 1.2, 0.9, 1.2, 8)); g.add(ball(2.0 * s, b, x + 1.3 * s, 9.5 * s, z, 1, 0.8, 1, 7)); g.add(ball(1.9 * s, b, x - 1.2 * s, 10 * s, z + 0.8 * s, 1, 0.8, 1, 7));
}
function pine(g, x, z, s = 1) {
  g.add(cyl(0.18 * s, 0.25 * s, 2 * s, 6, C(0x5a3d22), x, s, z));
  const m = C(0x1f5a34); for (let i = 0; i < 4; i++) g.add(cone((1.7 - i * 0.35) * s, 1.9 * s, 8, m, x, (1.4 + i * 1.15) * s, z));
}
function bush(g, x, z, s = 1, col = 0x3a8a34) { g.add(ball(0.8 * s, C(col), x, 0.5 * s, z, 1.2, 0.8, 1, 6)); }
function flowers(g, x, z) { for (let i = 0; i < 5; i++) g.add(ball(0.12, C(pick([0xe8408a, 0xf0c030, 0xf2f2f2, 0xd8322a, 0x9a4ad0])), x + rndp(-0.8, 0.8), 0.25, z + rndp(-0.8, 0.8), 1, 1, 1, 5)); }
function caneClump(g, x, z, h = 3) {
  const m = mat('caneStalk', () => std({ color: 0x86b83a, side: THREE.DoubleSide })), m2 = C(0xb7c850);
  for (let i = 0; i < 4; i++) { const s = cone(0.07, h * rndp(0.85, 1.1), 4, i % 2 ? m : m2, x + rndp(-0.35, 0.35), 0, z + rndp(-0.35, 0.35)); s.rotation.set(rndp(-0.15, 0.15), 0, rndp(-0.15, 0.15)); g.add(s); }
  for (let i = 0; i < 3; i++) { const f = new THREE.Mesh(frondGeo(), m); f.scale.set(0.7, 0.8, 0.7); f.position.set(x, h * 0.95, z); f.rotation.set(0, i * 2.1 + x, 0); f.rotateX(-1.0); g.add(f); }
}
function cottage(g, x, z, w, d, h, wall, roof, faceSide) { // colonial / creole house with a hip roof and veranda
  const wm = C(wall), rm = C(roof);
  g.add(box(w, h, d, wm, x, h / 2, z));
  const r = new THREE.Mesh(geo(`roof${w}|${d}`, () => new THREE.ConeGeometry(1, 1, 4)), rm); r.scale.set(w * 0.78, 1.5, d * 0.78); r.position.set(x, h + 0.75, z); r.rotation.y = Math.PI / 4; g.add(r);
  const fx = x - faceSide * (w / 2 + 0.02);
  g.add(box(0.06, 1.0, 1.0, C(0x2a3a4a), fx, 1.4, z - d * 0.25)); g.add(box(0.06, 1.0, 1.0, C(0x2a3a4a), fx, 1.4, z + d * 0.25)); g.add(box(0.06, 1.9, 0.9, C(0x6a3a22), fx, 0.95, z));
  g.add(box(1.4, 0.12, d * 0.8, rm, fx - faceSide * 0.6, 2.5, z)); for (const dz of [-1, 1]) g.add(box(0.1, 2.4, 0.1, C(0xf4f0e6), fx - faceSide * 1.2, 1.2, z + dz * d * 0.36));
}
function containerStack(g, x, z) {
  const cols = [0xd8322a, 0x2a6fc0, 0xe0a020, 0x2a9a5a, 0xf2f2f2, 0x8a4a9a];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const hh = 1 + (Math.random() < 0.7 ? 1 : 0); for (let k = 0; k < hh; k++) g.add(box(2.4, 2.5, 6, C(pick(cols)), x + j * 2.6, 1.25 + k * 2.5, z + (i - 1) * 6.4)); }
}
function crane(g, x, z) {
  const m = C(0xe07a10), d = C(0x444a52);
  for (const dx of [-3, 3]) for (const dz of [-2, 2]) g.add(box(0.5, 16, 0.5, m, x + dx, 8, z + dz));
  g.add(box(9, 0.6, 5.5, m, x, 16, z)); g.add(box(0.6, 0.6, 40, m, x + 6, 17, z - 6)); g.add(box(0.5, 6, 0.5, d, x + 7, 14, z - 22));
}
function yacht(g, x, z, s = 1, rot = 0) {
  const hullM = C(0xf4f4f0), tr = C(0x1e4fa0), sail = mat('sail', () => std({ color: 0xffffff, side: THREE.DoubleSide }));
  const o = new THREE.Group();
  o.add(box(1.8 * s, 0.9 * s, 6 * s, hullM, 0, 0.25, 0)); o.add(box(1.82 * s, 0.18 * s, 6.02 * s, tr, 0, 0.45, 0)); o.add(cone(0.9 * s, 1.6 * s, 4, hullM, 0, 0, -3.8 * s)).rotation?.set?.(0, 0, 0);
  o.children[2].rotation.x = -Math.PI / 2; o.children[2].position.set(0, 0.25, -3.6 * s);
  o.add(cyl(0.05 * s, 0.05 * s, 8 * s, 5, C(0xcccccc), 0, 4.2 * s, 0.2 * s));
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0, 7 * s); shape.lineTo(2.6 * s, 0.4 * s); shape.closePath();
  const sl = new THREE.Mesh(geo(`sail${s}`, () => new THREE.ShapeGeometry(shape)), sail); sl.position.set(0, 1 * s, 0.2 * s); sl.rotation.y = Math.PI / 2; o.add(sl);
  o.position.set(x, -0.3, z); o.rotation.y = rot; g.add(o);
}
function fishingBoat(g, x, z, col = 0x2a6fc0, rot = 0) {
  const o = new THREE.Group(); o.add(box(2.0, 0.9, 6, C(col), 0, 0.2, 0)); o.add(box(2.02, 0.2, 6.02, C(0xf2f2f2), 0, 0.5, 0)); o.add(box(1.5, 1.3, 1.8, C(0xf2f2f0), 0, 1.3, 0.6)); o.add(box(1.6, 0.12, 2.0, C(0xd8322a), 0, 2.0, 0.6)); o.add(cyl(0.05, 0.05, 3, 5, C(0x777777), 0, 2.2, -1.6));
  o.position.set(x, -0.3, z); o.rotation.y = rot; g.add(o);
}
function kite(g, x, y, z) {
  const col = pick([0xff5a30, 0xffd23f, 0x2ad0e0, 0xe040a0, 0xf2f2f2]);
  const grp = new THREE.Group();
  const sh = new THREE.Shape(); sh.moveTo(0, 1.15); sh.lineTo(0.85, 0); sh.lineTo(0, -1.15); sh.lineTo(-0.85, 0); sh.closePath();
  const sail = new THREE.Mesh(new THREE.ShapeGeometry(sh), new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide, depthWrite: false }));
  grp.add(sail);
  const line = new THREE.Mesh(geo('kiteline', () => new THREE.CylinderGeometry(0.015, 0.015, 12, 3)), C(0xdddddd));
  line.position.set(0, -7, 0); grp.add(line);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(geo('kitetail', () => new THREE.PlaneGeometry(0.16, 0.32)), new THREE.MeshBasicMaterial({ color: pick([0xff5a30, 0xffd23f, 0xffffff]), side: THREE.DoubleSide }));
    t.position.set((i % 2 ? 0.16 : -0.16), -1.4 - i * 0.4, 0); grp.add(t);
  }
  grp.position.set(x, y, z); grp.rotation.z = rndp(-0.25, 0.25); grp.rotation.y = rndp(-0.4, 0.4); g.add(grp);
}
function umbrella(g, x, z) {
  g.add(cyl(0.04, 0.04, 2.3, 5, C(0xdddddd), x, 1.15, z)); const u = new THREE.Mesh(geo('bumb', () => new THREE.ConeGeometry(1.2, 0.5, 8)), mat('bumb', () => std({ map: T.stripeTex(pick(['#e8302a', '#2a6fc0', '#f0a020']), '#ffffff'), side: THREE.DoubleSide }))); u.position.set(x, 2.4, z); g.add(u);
  g.add(box(0.7, 0.12, 1.8, C(0xf4f0e6), x + 1.3, 0.3, z));
}
function lilyPond(g, x, z, w, d) {
  const mm = rep('lilypond', T.lilyTex, w / 6, d / 6, { roughness: 0.3 });
  g.add(plane(w, d, mm, x, 0.0, z)); g.add(box(w + 0.6, 0.4, 0.3, C(0x8a8a80), x, 0.1, z - d / 2)); g.add(box(w + 0.6, 0.4, 0.3, C(0x8a8a80), x, 0.1, z + d / 2));
  const lm = mat('lilyBig', () => std({ color: 0x2f8a3a, side: THREE.DoubleSide })), rim = C(0x58a846);
  for (let i = 0; i < 5; i++) { const lx = x + rndp(-w / 2 + 1.5, w / 2 - 1.5), lz = z + rndp(-d / 2 + 1.5, d / 2 - 1.5), r = rndp(0.9, 1.4); const lf = new THREE.Mesh(geo('biglily', () => new THREE.CylinderGeometry(1, 1, 0.05, 14)), lm); lf.scale.set(r, 1, r); lf.position.set(lx, 0.1, lz); g.add(lf); const rm = new THREE.Mesh(geo('lilyrim', () => new THREE.TorusGeometry(1, 0.06, 4, 14)), rim); rm.rotation.x = Math.PI / 2; rm.scale.set(r, r, 1); rm.position.set(lx, 0.16, lz); g.add(rm); }
}
function lampPost(g, side, z, night = false, x = 4.35) {
  const metal = C(0x3b4048); g.add(cyl(0.07, 0.1, 5.4, 6, metal, side * x, 2.7, z)); g.add(box(1.5, 0.08, 0.08, metal, side * (x - 0.75), 5.3, z));
  g.add(box(0.5, 0.14, 0.26, mat(night ? 'lampOn' : 'lampOff', () => basic({ color: night ? 0xffe9a8 : 0xfff1c4 })), side * (x - 1.4), 5.22, z));
}
function banner(g, side, z, text, bg) {
  const m = new THREE.Mesh(geo('ban', () => new THREE.PlaneGeometry(2.6, 0.9)), new THREE.MeshBasicMaterial({ map: T.signTex(text, { bg, fg: '#fff', w: 384, h: 128 }), side: THREE.DoubleSide }));
  m.position.set(side * 4.3, 5.4, z); m.rotation.y = Math.PI / 2; g.add(m);
}
function signBoard(g, side, z, text, bg = '#0a6a3c', x = 4.9, y = 1.8) {
  g.add(box(0.1, y, 0.1, C(0x555a63), side * x, y / 2, z)); const s = new THREE.Mesh(geo('sb', () => new THREE.PlaneGeometry(2.4, 0.9)), new THREE.MeshBasicMaterial({ map: T.signTex(text, { bg, fg: '#fff', w: 384, h: 144 }), side: THREE.DoubleSide }));
  s.position.set(side * x, y + 0.3, z); s.rotation.y = Math.PI / 2; g.add(s);
}
function shopBuilding(g, side, z, len, h, xNear, sign) {
  g.add(building(side, z, len, 8, h, Math.floor(Math.random() * T.FACADES), xNear, false));
  if (sign) { const [bg, fg] = pick([['#d8322a', '#fff'], ['#1e7a46', '#fff'], ['#f2c400', '#222'], ['#1e4fa0', '#fff'], ['#b0286a', '#fff'], ['#e07a10', '#fff']]); const sg = new THREE.Mesh(geo('shopSign2', () => new THREE.PlaneGeometry(5, 1.25)), new THREE.MeshBasicMaterial({ map: T.signTex(sign, { bg, fg, w: 512, h: 128 }) })); sg.position.set(side * (xNear - 0.05), 3.4, z + rndp(-1, 1)); sg.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2; g.add(sg); }
}
const comb = () => { const out = []; let left = 5; while (left > 0) { const u = left >= 2 && Math.random() < 0.55 ? 2 : 1; out.push(u * 8); left -= u; } return out; };

function fall(g, cx, cy, cz, w, h, d, dir) { // cliff block + white waterfall strip on its road-facing side
  g.add(box(w, h, d, mat('cliffB', () => std({ map: T.lavaTex(), color: 0x7a7a70, flatShading: true })), cx, cy, cz));
  const f = plane(2.6, h * 0.9, mat('fallW', () => basic({ color: 0xf4fafc, transparent: true, opacity: 0.85 })), 0, 0, 0); f.rotation.set(0, 0, 0); f.rotation.y = dir * Math.PI / 2; f.position.set(cx + dir * (w / 2 + 0.1), cy, cz); f.geometry = new THREE.PlaneGeometry(2.6, h * 0.9); g.add(f);
}
// ---- chunk skeleton

// Map a chunk's world-z onto the OSM-derived route (scaled to the level goal).
export function routeAt(level, zc) {
  const info = sectionAt(level, zc);
  if (!info || !info.route) return { sea: null, signs: [], density: 'medium', landmarks: [] };
  const marks = info.landmarks || [];
  return { sea: info.sea, signs: marks.map((m) => m.name), density: info.density || 'medium', vegetation: info.sec && info.sec.vegetation, road: info.roadName, turn: info.turn, landmarks: marks, route: info.route, dist: info.dist, next: info.next };
}

function seaX(info, x) { // place water at -x (left) or +x (right)
  const s = info && info.sea === 'right' ? 1 : -1; return s * Math.abs(x);
}
function coastWater(g, R, zc, L, opts = {}) {
  const shore = seaX(R, opts.shore || 20);
  g.add(makeWater(opts.w || 70, L, { shoreX: shore, sideX: shore, y: opts.y ?? -0.32, z: zc, lagoon: opts.lagoon, deep: opts.deep, reef: opts.reef || 28 }));
  if (opts.boat !== false && chance(opts.boatChance ?? 0.5)) {
    addBoat(g, pick(['pirogue', 'fishing', 'catamaran', 'sailboat']), seaX(R, rndp(24, 36)), zc + rndp(-L / 3, L / 3), Math.PI / 2);
  }
}
function routeSignText(info, fallback) { return (info && info.signs && info.signs[0]) || fallback; }
applyDecor.gantry = gantrySign;
applyDecor.sign = signBoard;
applyDecor.junction = (g, t, z) => {
  const side = t.dir === 'left' ? -1 : 1;
  const asphalt = mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 }));
  const p = new THREE.Mesh(geo('juncRd', () => new THREE.PlaneGeometry(18, 6)), asphalt);
  p.rotation.x = -Math.PI / 2; p.position.set(side * 12, 0.01, z); g.add(p);
};


// ----
function ground(g, zc, o) {
  g.add(plane(8, L, o.road, 0, 0, zc));
  for (const side of [-1, 1]) {
    const v = o.verge[side < 0 ? 0 : 1]; if (v) g.add(plane(o.vw || 4, L, v, side * (4 + (o.vw || 4) / 2), 0.02, zc));
    const f = o.far[side < 0 ? 0 : 1]; if (f) { const fw = f.w || 60; g.add(plane(fw, L, f.mat, side * ((o.vw || 4) + 4 + fw / 2), f.y ?? -0.1, zc)); }
  }
  if (o.kerb) for (const side of [-1, 1]) g.add(box(0.25, 0.25, L, C(0xc9c9c4), side * 4.1, 0.12, zc));
}
const sizeOf = (level) => ({ tint: level.sky });

// ---- biomes ----------------------------------------------------------------------------------------------------------
const BIO = {
  caudan(g, level, index, zc) {
    const sea = rep('seaC', T.waterTex, 20, L / 6, { roughness: 0.25, metalness: 0.1 });
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [rep('quay', T.tilesTex, 1, 10), rep('quay', T.tilesTex, 1, 10)], vw: 4, kerb: true, far: [null, { mat: rep('quayR', T.tilesTex, 6, 6) }] });
    const R = routeAt(level, zc); g.add(makeWater(60, L, { shoreX: seaX(R, 12), y: -0.5, z: zc, lagoon: 0x2a6a8a, deep: 0x0a2a4a, reef: 42 })); g.add(box(1.0, 1.0, L, C(0xa9a79c), -8.4, 0.0, zc));        // harbour water + quay wall
    for (let k = 0; k < 4; k++) { const z = zc - L / 2 + (k + 0.5) * 10; g.add(cyl(0.2, 0.26, 0.7, 8, C(0x24272c), -7.6, 0.35, z)); }
    for (const z of [zc - 10, zc + 10]) { if (chance(0.7)) yacht(g, -rndp(13, 22), z + rndp(-3, 3), rndp(0.9, 1.5), Math.PI / 2 + rndp(-0.3, 0.3)); }
    if (index % 3 === 1 || index % 5 === 3) g.add(box(18, 0.8, L, C(0x8d8b82), -31, -0.1, zc));
    if (index % 3 === 1) containerStack(g, -rndp(26, 30), zc); if (index % 5 === 3) crane(g, -33, zc);
    for (const sd of [-1, 1]) if (sd < 0) lampPost(g, sd, zc + 8);
    let z = zc - L / 2; for (const len of comb()) { shopBuilding(g, 1, z + len / 2, len, pick([12, 24, 24, 36]), 7.5, chance(0.8) ? routeShopSign(level, zc) : null); z += len; }
    g.add(box(3.5, 0.2, L, rep('quay', T.tilesTex, 1, 10), 5.75, 0.1, zc)); lampPost(g, 1, zc - 6);
    if (chance(0.6)) palmLite(g, 5.6, zc + rndp(-14, 14), rndp(0.9, 1.2), -0.2); if (chance(0.5)) palmLite(g, -6.0, zc + rndp(-14, 14), 1.0, 0.2);
    if (index % 4 === 2) { const _s = routeShopSign(level, zc); if (_s) g.add(gantrySign(zc, _s, 'Port Louis · Mauritius')); }
    if (chance(0.5)) banner(g, 1, zc + 4, routeShopSign(level, zc) || " ", pick(['#1e4fa0', '#d8322a', '#1e7a46']));
  },
  grandbaie(g, level, index, zc) {
    const sand = rep('sand', T.sandTex, 3, L / 6), sea = rep('seaG', T.waterTex, 20, L / 6, { roughness: 0.2, color: 0x7fe0e8 });
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [sand, sand], vw: 5, far: [{ mat: sand, y: -0.05, w: 13 }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    const R = routeAt(level, zc); coastWater(g, R, zc, L, { shore: 22, w: 70, y: -0.35, lagoon: 0x3ec8c8, boatChance: 0.55 }); g.add(plane(6, L, rep('wetsand', T.sandTex, 2, 6, { color: 0xb8a878 }), seaX(R, 22), -0.2, zc));
    for (let i = 0; i < 4; i++) palmLite(g, -rndp(10, 18), zc + rndp(-L / 2, L / 2), rndp(0.9, 1.3), rndp(-0.5, 0.5));
    for (let i = 0; i < 4; i++) { const px = rndp(10, 24); if (chance(0.6)) palmLite(g, px, zc + rndp(-L / 2, L / 2), rndp(0.9, 1.3), rndp(-0.4, 0.4)); else broadTree(g, px, zc + rndp(-L / 2, L / 2), rndp(0.8, 1.1), 0x2f8a3a, 0x4aa84a); }
    if (chance(0.6)) umbrella(g, -rndp(10, 13), zc + rndp(-12, 12)); if (chance(0.4)) umbrella(g, -rndp(11, 14), zc + rndp(-12, 12));
    for (const z of [zc - 8, zc + 12]) { if (chance(0.6)) { addBoat(g, pick(['pirogue', 'fishing', 'catamaran']), -rndp(20, 28), z, Math.PI / 2 + rndp(-0.2, 0.2)); } else yacht(g, -rndp(24, 36), z, 1.3, Math.PI / 2); }
    let z = zc - L / 2 + 5; while (z < zc + L / 2 - 4) { const w = rndp(5, 8), hh = rndp(3.2, 6); cottage(g, rndp(11, 13), z + w / 2, 6, w, hh, pick([0xf4e6c8, 0xf0b0a0, 0x9fd8d0, 0xf2d070, 0xfaf4ea]), pick([0xb4442a, 0x3a7a5a, 0x555a63]), -1); z += w + rndp(2, 6); }
    lampPost(g, 1, zc + 4, false, 5.0); if (index % 3 === 0) signBoard(g, 1, zc - 6, routeShopSign(level, zc), '#0b4f8a', 5.2); if (index % 4 === 1) { const _s = routeShopSign(level, zc); if (_s) g.add(gantrySign(zc, _s, 'Grand Baie · Nord')); }
  },
  pample(g, level, index, zc) {
    const grass = rep('grass', T.grassTex, 8, L / 5);
    ground(g, zc, { road: rep('gravel', T.gravelTex, 4, L / 4), verge: [grass, grass], vw: 3.5, far: [{ mat: grass }, { mat: grass }] });
    for (const side of [-1, 1]) {
      for (let k = 0; k < 2; k++) royalPalm(g, side * 5.6, zc - L / 2 + (k + 0.5) * 20, rndp(1.0, 1.15));
      g.add(box(0.8, 1.0, L, C(0x2f6a30), side * 7.9, 0.5, zc));                    // hedge
      for (let i = 0; i < 4; i++) flowers(g, side * rndp(4.6, 7.2), zc + rndp(-L / 2, L / 2));
      lilyPond(g, side * rndp(14, 17), zc + rndp(-6, 6), rndp(12, 16), rndp(14, 20));
      for (let i = 0; i < 3; i++) broadTree(g, side * rndp(10, 14), zc + rndp(-L / 2, L / 2), rndp(0.9, 1.4), 0x2a7a3a, 0x3f9a48);
      for (let i = 0; i < 3; i++) bush(g, side * rndp(5, 9), zc + rndp(-L / 2, L / 2), rndp(0.7, 1.2), pick([0x2f8a3a, 0x4aa84a, 0x3a7a30]));
      if (chance(0.4)) palmLite(g, side * rndp(20, 28), zc + rndp(-15, 15), 1.3, rndp(-0.3, 0.3));
    }
    for (const z of [zc - 10, zc + 10]) { g.add(box(0.12, 2.0, 0.12, C(0x24272c), -4.6, 1.0, z)); g.add(box(0.12, 2.0, 0.12, C(0x24272c), 4.6, 1.0, z)); }
    if (index % 4 === 1) { g.add(gantrySign(zc, 'PAMPLEMOUSSES', 'Jardin Botanique · SSR')); }
    else if (index % 3 === 0) signBoard(g, chance(0.5) ? 1 : -1, zc, routeShopSign(level, zc), '#1e6a3a', 4.6);
  },
  curepipe(g, level, index, zc) {
    const road = mat('roadWet', () => std({ map: T.asphaltTex(), roughness: 0.6 })), tiles = rep('tilesC', T.tilesTex, 1, 10);
    ground(g, zc, { road, verge: [tiles, tiles], vw: 3.5, kerb: true, far: [{ mat: rep('grass', T.grassTex, 8, 6) }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    for (const side of [-1, 1]) {
      let z = zc - L / 2 + 3; while (z < zc + L / 2 - 4) { const w = rndp(6, 9); if (chance(0.7)) cottage(g, side * rndp(10.5, 12), z + w / 2, 7, w, rndp(3.4, 4.6), pick([0xe8d8b8, 0xc8d8c0, 0xe0c0a0, 0xd0d8e0, 0xf0e4d0]), pick([0x9a3a2a, 0x3a6a4a, 0x4a5a7a, 0x8a4a2a]), -side * 1); else shopBuilding(g, side, z + w / 2, 8, pick([12, 24]), 7.5, routeShopSign(level, zc)); z += w + rndp(1, 4); }
      lampPost(g, side, zc + side * 7); pine(g, side * rndp(8, 9), zc + rndp(-15, 15), rndp(1.0, 1.6)); if (chance(0.5)) pine(g, side * rndp(13, 22), zc + rndp(-18, 18), rndp(1.4, 2.4));
      if (chance(0.5)) bush(g, side * 6.2, zc + rndp(-14, 14), 0.8, 0x4a8a3a);
    }
    // Trou aux Cerfs crater rim in the distance on the right + lake
    if (index % 6 === 4) { const rim = mat('craterRim', () => std({ color: 0x5a7a4a, flatShading: true })); for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, r = 20; const m = cone(7, 8, 7, rim, 38 + Math.cos(a) * r, 0, zc + Math.sin(a) * r); g.add(m); } g.add(plane(24, 24, rep('craterLake', T.waterTex, 5, 5, { color: 0x5a9aa8 }), 38, 0.2, zc)); signBoard(g, 1, zc, 'TROU AUX CERFS', '#7a3a2a', 4.8); }
    if (index % 4 === 2) { const _s = routeShopSign(level, zc); if (_s) g.add(gantrySign(zc, _s, 'Curepipe · Plaines Wilhems')); }
  },
  cane(g, level, index, zc) {
    const field = rep('canefield', T.caneTex, 10, L / 5), dirt = rep('redearth', T.redEarthTex, 3, L / 6);
    ground(g, zc, { road: mat('roadCane', () => std({ map: T.asphaltTex(), roughness: 1, color: 0xd8c8b8 })), verge: [dirt, dirt], vw: 3, far: [{ mat: field, y: 0.0 }, { mat: field, y: 0.0 }] });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 16; i++) caneClump(g, side * rndp(7.4, 9.5), zc + rndp(-L / 2, L / 2), rndp(2.6, 3.4));
      for (let i = 0; i < 14; i++) caneClump(g, side * rndp(10, 24), zc + rndp(-L / 2, L / 2), rndp(2.8, 3.6));
      if (chance(0.5)) { g.add(cyl(0.12, 0.14, 8, 6, C(0x6a4a2c), side * 6.3, 4, zc + 5)); g.add(box(1.8, 0.1, 0.1, C(0x6a4a2c), side * 6.3, 7.6, zc + 5)); }
      if (chance(0.4)) palmLite(g, side * rndp(11, 18), zc + rndp(-15, 15), 1.2, rndp(-0.3, 0.3));
      if (chance(0.3)) broadTree(g, side * rndp(12, 16), zc + rndp(-15, 15), 1.1, 0x3a7a30, 0x4a9a38);
    }
    if (index % 5 === 3) { const brick = rep('brickM', T.brickTex, 2, 12); g.add(cyl(2.2, 3.0, 42, 12, brick, 22, 21, zc)); g.add(box(14, 10, 20, rep('millwall', T.brickTex, 3, 2), 22, 5, zc - 14)); g.add(box(14.5, 0.8, 20.5, C(0x4a4f58), 22, 10.3, zc - 14)); g.add(cyl(0.4, 0.5, 6, 8, C(0x777c84), 16, 13, zc - 22)); signBoard(g, 1, zc, 'USINE SUCRIÈRE', '#7a3a2a', 4.9); }
    if (index % 4 === 1) signBoard(g, -1, zc + 2, routeShopSign(level, zc), '#0a6a3c', 4.9);
    if (index % 6 === 0) g.add(gantrySign(zc, 'ROUTE DU NORD', 'Flacq · Belle Mare'));
  },
  blackriver(g, level, index, zc) {
    const floor = rep('forestfloor', T.forestFloorTex, 6, L / 5);
    ground(g, zc, { road: mat('roadForest', () => std({ map: T.asphaltTex(), roughness: 0.95, color: 0xb8b8b0 })), verge: [floor, floor], vw: 3, far: [{ mat: floor }, { mat: floor }] });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) tallTree(g, side * rndp(6.2, 11), zc - L / 2 + (i + 0.5) * (L / 6) + rndp(-2, 2), rndp(0.9, 1.3));
      for (let i = 0; i < 6; i++) tallTree(g, side * rndp(12, 26), zc + rndp(-L / 2, L / 2), rndp(1.0, 1.7));
      for (let i = 0; i < 7; i++) bush(g, side * rndp(4.8, 9), zc + rndp(-L / 2, L / 2), rndp(0.7, 1.4), pick([0x2a7a34, 0x3a8a3a, 0x1f6a30]));
      if (chance(0.5)) g.add(cone(2.5, 6, 6, mat('fern', () => std({ color: 0x3a8a3a, flatShading: true })), side * rndp(5.5, 7.5), 0, zc + rndp(-15, 15)));
    }
    if (index % 5 === 2) fall(g, -26, 20, zc, 14, 40, 18, 1);
    if (index % 4 === 0) signBoard(g, chance(0.5) ? 1 : -1, zc, routeShopSign(level, zc), '#5a3a1a', 4.8);
  },
  chamarel(g, level, index, zc) {
    const earth = rep('redearth', T.redEarthTex, 3, L / 6), bands = mat('bands', () => std({ map: T.earthBandsTex(), flatShading: true, roughness: 1 }));
    ground(g, zc, { road: mat('roadCham', () => std({ map: T.asphaltTex(), roughness: 1, color: 0xd0b8a0 })), verge: [earth, earth], vw: 4, far: [{ mat: earth }, { mat: earth }] });
    for (const side of [-1, 1]) {
      for (let i = 0; i < 2; i++) { const r = rndp(5, 9), h = rndp(4, 10); const d = new THREE.Mesh(geo(`dune${r | 0}|${h | 0}`, () => new THREE.ConeGeometry(r, h, 10, 8)), bands); d.position.set(side * rndp(12, 28), h / 2 - 0.2, zc + rndp(-16, 16)); d.rotation.y = rndp(0, 6); g.add(d); }
      for (let i = 0; i < 5; i++) { const s = new THREE.Mesh(geo('chamIco', () => new THREE.IcosahedronGeometry(1, 0)), mat('lavarockB', () => std({ map: T.lavaTex(), flatShading: true }))); const r = rndp(0.5, 1.6); s.scale.set(r * 1.2, r, r); s.position.set(side * rndp(5.4, 11), r * 0.5, zc + rndp(-L / 2, L / 2)); s.rotation.y = rndp(0, 6); g.add(s); }
      for (let i = 0; i < 3; i++) palmLite(g, side * rndp(8, 18), zc + rndp(-L / 2, L / 2), rndp(1.0, 1.4), rndp(-0.5, 0.5));
      for (let i = 0; i < 3; i++) bush(g, side * rndp(5, 9), zc + rndp(-L / 2, L / 2), rndp(0.7, 1.2), pick([0x6a8a34, 0x4a7a30, 0x8a8a3a]));
    }
    if (index % 6 === 3) { fall(g, 30, 23, zc, 16, 46, 14, -1); signBoard(g, 1, zc + 3, 'CASCADE DE CHAMAREL', '#7a3a1a', 4.8); }
    if (index % 4 === 1) signBoard(g, chance(0.5) ? 1 : -1, zc - 5, routeShopSign(level, zc), '#7a3a1a', 4.8);
  },
  lemorne(g, level, index, zc) {
    const sand = rep('sand', T.sandTex, 3, L / 6), lag = rep('lagoon', T.waterTex, 20, L / 6, { roughness: 0.15, color: 0x6ee8e0 });
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [sand, sand], vw: 5, far: [{ mat: sand, y: -0.05, w: 8 }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    const R = routeAt(level, zc); coastWater(g, R, zc, L, { shore: 18, w: 80, y: -0.3, lagoon: 0x3ee0d8, deep: 0x0a4a8a, reef: 26, boatChance: 0.7 }); g.add(plane(5, L, rep('wetsand', T.sandTex, 2, 6, { color: 0xb8a878 }), seaX(R, 17), -0.15, zc));
    for (let i = 0; i < 4; i++) palmLite(g, -rndp(9.5, 14), zc + rndp(-L / 2, L / 2), rndp(1.0, 1.4), rndp(-0.5, 0.5));
    for (let i = 0; i < 3; i++) pine(g, rndp(9.5, 16), zc + rndp(-L / 2, L / 2), rndp(1.2, 1.8));
    for (let i = 0; i < 3; i++) { if (chance(0.7)) addBoat(g, pick(['pirogue', 'fishing', 'sailboat']), -rndp(24, 34), zc + rndp(-16, 16), rndp(0, 6)); }
    for (let k = 0; k < 3; k++) kite(g, -rndp(16, 36), rndp(10, 18), zc + rndp(-L / 2, L / 2));
    let z = zc - L / 2 + 5; while (z < zc + L / 2 - 4) { const w = rndp(5, 8); if (chance(0.6)) cottage(g, rndp(11, 13), z + w / 2, 6, w, rndp(3, 4.5), pick([0xf4e6c8, 0xf0b0a0, 0x9fd8d0, 0xf2d070]), pick([0x9a3a2a, 0x3a7a5a, 0x2a5a8a]), -1); z += w + rndp(3, 8); }
    lampPost(g, 1, zc + 6, false, 5.0); if (index % 3 === 1) signBoard(g, 1, zc - 5, routeShopSign(level, zc), '#0b6f8a', 5.2); if (index % 5 === 2) g.add(gantrySign(zc, 'LE MORNE · UNESCO', 'Patrimoine Mondial'));
  },
  mahebourg(g, level, index, zc) {
    const sea = rep('seaN', T.waterTex, 20, L / 6, { roughness: 0.15, color: 0x2a4a8a, emissive: 0x0a1a3a, emissiveIntensity: 0.6 }), tiles = rep('tilesN', T.tilesTex, 1, 10, { color: 0xb8b4aa });
    ground(g, zc, { road: mat('roadNight', () => std({ map: T.asphaltTex(), roughness: 0.55 })), verge: [tiles, tiles], vw: 3.5, kerb: true, far: [null, { mat: rep('grass', T.grassTex, 8, 6, { color: 0x6a7a6a }) }] });
    const R = routeAt(level, zc); coastWater(g, R, zc, L, { shore: 16, w: 70, y: -0.45, lagoon: 0x2a6aaa, deep: 0x0a2a5a, reef: 32, boatChance: 0.5 }); g.add(box(1.0, 1.0, L, C(0x777468), seaX(R, 8.2), 0.0, zc));
    for (let k = 0; k < 4; k++) { const z = zc - L / 2 + (k + 0.5) * 10; g.add(cyl(0.18, 0.22, 0.7, 8, C(0x24272c), -7.5, 0.35, z)); }
    for (const z of [zc - 10, zc + 12]) { if (chance(0.7)) addBoat(g, pick(['pirogue', 'fishing', 'catamaran', 'sailboat']), -rndp(13, 24), z + rndp(-3, 3), Math.PI / 2 + rndp(-0.3, 0.3)); }
    if (index % 3 === 0) { const isl = mat('island', () => std({ color: 0x0f1a20, flatShading: true })); g.add(cone(14, 6, 7, isl, -62, -0.5, zc)); g.add(cone(9, 4, 6, isl, -50, -0.5, zc + 12)); }
    let z = zc - L / 2; for (const len of comb()) { shopBuilding(g, 1, z + len / 2, len, pick([12, 12, 24]), 7.5, chance(0.7) ? routeShopSign(level, zc) : null); z += len; } g.add(box(3.5, 0.2, L, tiles, 5.75, 0.1, zc));
    for (const sd of [-1, 1]) for (const dz of [-6, 8]) lampPost(g, sd, zc + dz, true, sd < 0 ? 5.2 : 4.35);
    if (chance(0.6)) palmLite(g, 5.8, zc + rndp(-14, 14), 1.0, -0.3);
    for (let i = 0; i < 2; i++) { const s = pick([1, -1]); g.add(box(0.5, 0.5, 1.6, C(0x6a4a2c), s * 4.9, 0.25, zc + rndp(-16, 16))); }
    if (index % 4 === 1) { const _s = routeShopSign(level, zc); if (_s) g.add(gantrySign(zc, _s, 'Mahébourg · Grand Port')); }
  },

  rosehill(g, level, index, zc) {
    const R = routeAt(level, zc), tiles = rep('tilesC', T.tilesTex, 1, 10);
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [tiles, tiles], vw: 3.5, kerb: true, far: [{ mat: rep('grass', T.grassTex, 8, 6) }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    for (const side of [-1, 1]) {
      let z = zc - L / 2; for (const len of comb()) { shopBuilding(g, side, z + len / 2, len, pick([12, 24, 24, 36]), 7.5, chance(0.75) ? pick(R.signs.length ? R.signs : level.signs) : null); z += len; }
      lampPost(g, side, zc + side * 6); if (chance(0.4)) palmLite(g, side * 6.0, zc + rndp(-12, 12), 0.9, -side * 0.2);
    }
    if (index % 3 === 1) g.add(gantrySign(zc, routeSignText(R, routeShopSign(level, zc)), 'Rose Hill · Quatre Bornes · Metro'));
  },
  flic(g, level, index, zc) {
    const R = routeAt(level, zc), sand = rep('sand', T.sandTex, 3, L / 6), sea = rep('seaG', T.waterTex, 20, L / 6, { roughness: 0.2, color: 0x6ed8e0 });
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [sand, sand], vw: 5, far: [{ mat: sand, y: -0.05, w: 10 }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    coastWater(g, R, zc, L, { shore: 20, w: 70, y: -0.3, lagoon: 0x4ad8e0, boatChance: 0.55 }); g.add(plane(6, L, rep('wetsand', T.sandTex, 2, 6, { color: 0xb8a878 }), seaX(R, 20), -0.18, zc));
    for (let i = 0; i < 5; i++) palmLite(g, seaX(R, rndp(10, 18)), zc + rndp(-L / 2, L / 2), rndp(1.0, 1.5), rndp(-0.5, 0.5));
    if (chance(0.6)) umbrella(g, seaX(R, rndp(10, 13)), zc + rndp(-12, 12));
    if (chance(0.5)) addBoat(g, pick(['pirogue', 'fishing', 'catamaran', 'sailboat']), seaX(R, rndp(22, 32)), zc + rndp(-10, 10), Math.PI / 2);
    let z = zc - L / 2 + 5; while (z < zc + L / 2 - 4) { const w = rndp(5, 8); cottage(g, rndp(11, 13) * (R.sea === 'right' ? -1 : 1), z + w / 2, 6, w, rndp(3, 5), pick([0xf4e6c8, 0x9fd8d0, 0xf2d070]), pick([0x9a3a2a, 0x2a5a8a]), R.sea === 'right' ? 1 : -1); z += w + rndp(2, 7); }
    if (index % 3 === 1) signBoard(g, 1, zc, routeSignText(R, routeShopSign(level, zc)), '#0b6f8a', 5.2);
    if (index % 4 === 2) g.add(gantrySign(zc, routeSignText(R, 'FLIC EN FLAC'), 'Wolmar · Côte Ouest'));
  },
  bellemare(g, level, index, zc) {
    const R = routeAt(level, zc), sand = rep('sand', T.sandTex, 3, L / 6), sea = rep('lagoon', T.waterTex, 20, L / 6, { roughness: 0.15, color: 0x5ad0d0 }), field = rep('canefield', T.caneTex, 10, L / 5);
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [sand, sand], vw: 4.5, far: [{ mat: sand, y: -0.05, w: 10 }, { mat: field }] });
    coastWater(g, R, zc, L, { shore: 20, w: 80, y: -0.28, lagoon: 0x4ae0d8, reef: 24, boatChance: 0.5 });
    for (let i = 0; i < 4; i++) palmLite(g, seaX(R, rndp(9, 16)), zc + rndp(-L / 2, L / 2), rndp(1.0, 1.4), rndp(-0.4, 0.4));
    if (chance(0.4)) addBoat(g, pick(['pirogue', 'fishing', 'catamaran']), seaX(R, rndp(22, 30)), zc, Math.PI / 2);
    for (let i = 0; i < 6; i++) caneClump(g, (R.sea === 'right' ? -1 : 1) * rndp(10, 22), zc + rndp(-L / 2, L / 2), rndp(2.6, 3.4));
    if (index % 3 === 0) signBoard(g, 1, zc, routeSignText(R, routeShopSign(level, zc)), '#0b6f8a', 5.0);
    if (index % 5 === 2) g.add(gantrySign(zc, 'BELLE MARE', 'Palmar · Côte Est'));
  },
  souillac(g, level, index, zc) {
    const R = routeAt(level, zc), grass = rep('grass', T.grassTex, 8, 6), sea = rep('seaN', T.waterTex, 20, L / 6, { roughness: 0.35, color: 0x3a6a8a });
    ground(g, zc, { road: mat('roadWet', () => std({ map: T.asphaltTex(), roughness: 0.65 })), verge: [grass, grass], vw: 4, far: [{ mat: grass }, { mat: grass }] });
    coastWater(g, R, zc, L, { shore: 22, w: 80, y: -1.15, lagoon: 0x2a5a7a, deep: 0x0a2040, reef: 18, boatChance: 0.25 });
    // cliff edge
    g.add(box(6, 4, L, mat('cliffB', () => std({ map: T.lavaTex(), color: 0x7a7a70, flatShading: true })), seaX(R, 14), 1.5, zc));
    for (let i = 0; i < 3; i++) pine(g, rndp(9, 16) * (R.sea === 'right' ? -1 : 1), zc + rndp(-L / 2, L / 2), rndp(1.2, 2.0));
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(geo('chamIco', () => new THREE.IcosahedronGeometry(1, 0)), mat('lavarockB', () => std({ map: T.lavaTex(), flatShading: true }))); const rr = rndp(0.5, 1.4); s.scale.set(rr * 1.2, rr, rr); s.position.set(seaX(R, rndp(8, 12)), rr * 0.5 + 3, zc + rndp(-L / 2, L / 2)); g.add(s); }
    if (chance(0.4)) cottage(g, (R.sea === 'right' ? -1 : 1) * 12, zc + rndp(-8, 8), 6, 7, 3.6, 0xe8d8b8, 0x9a3a2a, R.sea === 'right' ? 1 : -1);
    if (index % 3 === 1) signBoard(g, 1, zc, routeSignText(R, routeShopSign(level, zc)), '#5a3a1a', 4.8);
    if (index % 5 === 2) g.add(gantrySign(zc, 'GRIS GRIS', 'Souillac · Savanne'));
  },
  capmal(g, level, index, zc) {
    const R = routeAt(level, zc), sand = rep('sand', T.sandTex, 3, L / 6), sea = rep('seaG', T.waterTex, 20, L / 6, { roughness: 0.2, color: 0x6ee0e8 });
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [sand, sand], vw: 4.5, far: [{ mat: sand, y: -0.05, w: 10 }, { mat: rep('grass', T.grassTex, 8, 6) }] });
    coastWater(g, R, zc, L, { shore: 18, w: 70, y: -0.3, lagoon: 0x4ad8e8, boatChance: 0.6 });
    for (let i = 0; i < 4; i++) palmLite(g, seaX(R, rndp(9, 16)), zc + rndp(-L / 2, L / 2), rndp(0.9, 1.4), rndp(-0.5, 0.5));
    if (chance(0.6)) addBoat(g, pick(['pirogue', 'fishing', 'catamaran', 'sailboat']), seaX(R, rndp(20, 30)), zc + rndp(-8, 8), Math.PI / 2);
    // red church (Notre Dame Auxiliatrice) as a recurring landmark
    if (index % 4 === 2) {
      const cx = (R.sea === 'right' ? -1 : 1) * 14;
      g.add(box(6, 5, 8, C(0xe8382a), cx, 2.5, zc)); g.add(box(7, 0.5, 9, C(0xf2f2f0), cx, 5.2, zc));
      g.add(cyl(0.35, 0.5, 6, 8, C(0xe8382a), cx, 8, zc + 2)); g.add(cone(1.2, 2.2, 4, C(0xf2f2f0), cx, 11.2, zc + 2));
      signBoard(g, 1, zc, 'NOTRE DAME AUXILIATRICE', '#9a1a1a', 5.0);
    } else {
      let z = zc - L / 2 + 5; while (z < zc + L / 2 - 4) { const w = rndp(5, 7); if (chance(0.55)) cottage(g, (R.sea === 'right' ? -1 : 1) * rndp(11, 13), z + w / 2, 6, w, rndp(3, 4.5), pick([0xf4e6c8, 0xfaf4ea, 0x9fd8d0]), pick([0xb4442a, 0xe8382a, 0x3a7a5a]), R.sea === 'right' ? 1 : -1); z += w + rndp(3, 7); }
    }
    if (index % 3 === 0) g.add(gantrySign(zc, routeSignText(R, 'CAP MALHEUREUX'), 'Coin de Mire · Nord'));
  },
  goodlands(g, level, index, zc) {
    const R = routeAt(level, zc), tiles = rep('tilesC', T.tilesTex, 1, 10), field = rep('canefield', T.caneTex, 10, L / 5);
    ground(g, zc, { road: mat('road', () => std({ map: T.asphaltTex(), roughness: 0.95 })), verge: [tiles, tiles], vw: 3.5, kerb: true, far: [{ mat: field }, { mat: field }] });
    for (const side of [-1, 1]) {
      let z = zc - L / 2;
      if (index % 2 === 0) { for (const len of comb()) { shopBuilding(g, side, z + len / 2, len, pick([12, 12, 24]), 7.5, chance(0.7) ? pick(R.signs.length ? R.signs : level.signs) : null); z += len; } }
      else { while (z < zc + L / 2 - 4) { const w = rndp(6, 9); cottage(g, side * rndp(10.5, 12), z + w / 2, 7, w, rndp(3.2, 4.6), pick([0xf4e6c8, 0xe8d8b8, 0xfaf4ea, 0xc8d8c0]), pick([0xb4442a, 0x3a7a5a, 0x4a5a7a]), -side); z += w + rndp(1, 4); } }
      lampPost(g, side, zc + side * 5); if (chance(0.4)) palmLite(g, side * 6.2, zc + rndp(-12, 12), 1.0, -side * 0.2);
      for (let i = 0; i < 4; i++) caneClump(g, side * rndp(16, 28), zc + rndp(-L / 2, L / 2), rndp(2.5, 3.3));
    }
    if (index % 3 === 1) g.add(gantrySign(zc, routeSignText(R, routeShopSign(level, zc)), 'Goodlands · Nord'));
    if (index % 5 === 3) signBoard(g, -1, zc, 'MARCHÉ DE GOODLANDS', '#1e7a46', 4.9);
  },
};
export function buildChunk(level, index) {
  const g = new THREE.Group(); g.userData = { theme: 'street', index };
  const zc = -(index + 0.5) * L;
  (BIO[level.biome] || BIO.caudan)(g, level, index, zc);
  applyDecor(g, level, index, zc, level.region || '');
  mergeStatic(g);
  return g;
}

// ---- backdrop
export function buildBackdrop(level, sk) { return buildScenicBackdrop(level, sk); }
