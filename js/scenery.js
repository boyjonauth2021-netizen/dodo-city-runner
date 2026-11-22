// Recognisable Mauritian massifs built from real SRTM elevation (AWS Terrarium / Mapzen tiles).
// Vertex-coloured heightfields, skirts, slope-based basalt, and distance haze. Not extruded blocks.
import * as THREE from 'three';
import * as T from './textures.js';
import { routeOf, sectionAt } from './routes.js';
import { TERRAIN } from './terrain.js';

const geoCache = new Map();
const geo = (k, fn) => { if (geoCache.has(k)) return geoCache.get(k); const g = fn(); geoCache.set(k, g); return g; };

function decodeHeights(t) {
  const bin = atob(t.data);
  const buf = new ArrayBuffer(bin.length);
  const u8 = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return new Uint16Array(buf);
}

function massifGeo(id, worldW, worldD, yPerM) {
  return geo(`hf|${id}|${worldW.toFixed(0)}|${yPerM.toFixed(3)}`, () => {
    const t = TERRAIN[id];
    const gw = t.w, gh = t.h;
    const g = new THREE.PlaneGeometry(worldW, worldD, gw - 1, gh - 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const raw = decodeHeights(t);
    const metres = new Float32Array(pos.count);
    let maxI = 0, maxH = -1;
    for (let i = 0; i < pos.count; i++) {
      const hm = (raw[i] || 0) / 10;
      metres[i] = hm;
      if (hm > maxH) { maxH = hm; maxI = i; }
      // tuck bare cells slightly under the ground so edges don't flash a black underside
      pos.setY(i, hm < 1.2 ? -0.6 : hm * yPerM);
    }
    g.computeVertexNormals();
    const nrm = g.attributes.normal;
    const colors = new Float32Array(pos.count * 3);
    const maxHm = Math.max(1, t.maxH || maxH);
    const islet = !!t.islet;
    for (let i = 0; i < pos.count; i++) {
      const hm = metres[i];
      const ny = nrm.getY(i);
      const slope = 1 - Math.max(0, Math.min(1, ny)); // 0 flat, 1 vertical
      const ht = Math.max(0, Math.min(1, hm / maxHm));
      let r, gv, b;
      if (hm < 1.2) {
        // hidden skirt
        r = 0.22; gv = 0.36; b = 0.22;
      } else if (islet && ht < 0.35) {
        r = 0.55 + ht * 0.15; gv = 0.50 + ht * 0.12; b = 0.34;
      } else {
        // forest + darker valleys + lighter ridges
        r  = 0.14 + ht * 0.22 + (1 - ht) * 0.02;
        gv = 0.30 + ht * 0.18 + (1 - ht) * 0.04;
        b  = 0.12 + ht * 0.08;
        if (slope > 0.42) {
          const k = Math.min(1, (slope - 0.42) / 0.45);
          // exposed basalt / laterite cliffs (Le Morne faces, Pieter Both shoulders)
          r  = r  * (1 - k) + (0.36 + ht * 0.10) * k;
          gv = gv * (1 - k) + (0.31 + ht * 0.07) * k;
          b  = b  * (1 - k) + (0.27 + ht * 0.05) * k;
        }
        // slight north-face cool / south-face warm from the normal.xz
        const nx = nrm.getX(i), nz = nrm.getZ(i);
        const warm = Math.max(0, -nz) * 0.06;
        r += warm; gv += warm * 0.4; b -= warm * 0.3;
        r += nx * 0.03;
      }
      colors[i * 3]     = Math.min(1, Math.max(0.07, r));
      colors[i * 3 + 1] = Math.min(1, Math.max(0.08, gv));
      colors[i * 3 + 2] = Math.min(1, Math.max(0.06, b));
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    g.userData.summitIndex = maxI;
    g.userData.summitH = maxH * yPerM;
    g.computeBoundingSphere();
    return g;
  });
}

function makeMassifMesh(id, w, d, yPerM, haze, hazeHex, night) {
  const geom = massifGeo(id, w, d, yPerM);
  const tint = new THREE.Color(0xffffff);
  tint.lerp(new THREE.Color(hazeHex), haze);
  if (night) tint.multiplyScalar(0.6);
  const mat = new THREE.MeshLambertMaterial({
    vertexColors: true,
    color: tint,
    fog: false,
    flatShading: false,
  });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.userData.peak = id;
  return mesh;
}

const HERO = /le_pouce|pieter_both|le_morne|lion|trois_mamelles|rempart|trou_aux_cerfs|signal|signaux|corps_de_garde|coin_de_mire|piton_noir/;

function skylineRel(pk, sea, urban) {
  let rel = pk.rel || 0;
  // Coastal heroes sit over the lagoon / open water so they read in the usual framing.
  if ((pk.id === 'le_morne' || pk.id === 'coin_de_mire' || pk.id === 'ile_aux_aigrettes' || pk.id === 'ile_aux_cerfs') && (sea === 'left' || sea === 'right')) {
    rel = (sea === 'left' ? -1 : 1) * Math.max(12, Math.min(20, Math.abs(rel) || 16));
  }
  const sign = rel === 0 ? 1 : Math.sign(rel);
  let a = Math.abs(rel);
  if (urban && HERO.test(pk.id)) a = Math.min(a, 12); // sit in the street-end sky gap
  else if (HERO.test(pk.id) && a > 18) a = 12 + Math.min(8, (a - 18) * 0.04);
  else if (a > 36) a = 22;
  return sign * a;
}

export function placeMountains(group, level, sk) {
  const r = routeOf(level && level.uid);
  const peaks = (r && r.mountains) || [];
  const night = !!(sk && sk.night);
  const hazeFar = night ? 0x2a3a58 : 0x8eb0c4;
  const Y_PER_M = 46 / 828;

  const root = new THREE.Group();
  root.userData.mountainRoot = true;
  group.add(root);
  group.userData.mountainRoot = root;

  const sea = r && r.sea;
  // inland only: a wide low haze range. On coastal levels it reads as a cheap slab over the lagoon.
  if (TERRAIN.far_highlands && !sea) {
    const far = makeMassifMesh('far_highlands', 860, 540, Y_PER_M * 0.55, night ? 0.8 : 0.7, hazeFar, night);
    far.position.set(0, -6, -620);
    far.userData.peak = 'far_highlands';
    root.add(far);
  }

  const urban = !!(level && /pl1|pl2|mt3|mt10|mt12|mt15/.test(level.uid));
  const placed = peaks.filter((pk) => TERRAIN[pk.id]).map((pk) => ({
    pk, rel: skylineRel(pk, sea, urban), dist: Math.max(1.15, pk.distKm || 8),
  }));
  if (urban) {
    const pref = ['le_pouce', 'pieter_both', 'signal', 'signaux', 'corps_de_garde', 'ory', 'moka', 'trou_aux_cerfs'];
    placed.sort((a, b) => (pref.indexOf(a.pk.id) + 99) - (pref.indexOf(b.pk.id) + 99));
    const n = placed.length;
    for (let i = 0; i < n; i++) placed[i].rel = (i - (n - 1) / 2) * 5;
  } else {
    placed.sort((a, b) => a.rel - b.rel);
    for (let i = 1; i < placed.length; i++) {
      if (Math.abs(placed[i].rel - placed[i - 1].rel) < 5) {
        const dir = placed[i].rel >= placed[i - 1].rel ? 1 : -1;
        placed[i].rel = placed[i - 1].rel + dir * 5;
        if (Math.abs(placed[i].rel) > 22) placed[i].rel = Math.sign(placed[i].rel || dir) * 22;
      }
    }
  }

  for (const { pk, rel, dist } of placed) {
    const t = TERRAIN[pk.id];
    const haze = THREE.MathUtils.clamp((dist - 1.2) / 16, 0.05, 0.55);
    const w = Math.max(pk.islet ? 48 : 80, t.rKm * 2 * 52);
    const yScale = Y_PER_M * (pk.islet ? 2.1 : urban ? 1.25 : 1);
    const mesh = makeMassifMesh(pk.id, w, w * 0.92, yScale, haze, hazeFar, night);
    const relR = rel * Math.PI / 180;
    const radius = (pk.islet ? 160 : urban ? 175 : 190) + Math.min(50, dist * 4);
    mesh.position.set(Math.sin(relR) * radius, 0, -Math.cos(relR) * radius - 24);
    const heading = ((pk.bearing || 0) - (pk.rel || 0)) * Math.PI / 180;
    mesh.rotation.y = -heading;
    root.add(mesh);

    if (pk.id === 'pieter_both') {
      const geom = mesh.geometry;
      const idx = geom.userData.summitIndex || 0;
      const pos = geom.attributes.position;
      const boulder = new THREE.Mesh(
        geo('pbBoulder', () => new THREE.SphereGeometry(5.4, 9, 7)),
        new THREE.MeshLambertMaterial({ color: new THREE.Color(0x6a6258).lerp(new THREE.Color(hazeFar), haze * 0.5), fog: false })
      );
      boulder.position.set(pos.getX(idx), pos.getY(idx) + 3.6, pos.getZ(idx));
      boulder.scale.set(1.15, 0.82, 1.0);
      mesh.add(boulder);
    }
  }
}

const WATER_VERT = /* glsl */`
  uniform float uTime;
  varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vV;
  void main(){
    vUv = uv;
    vec3 p = position;
    float w1 = sin(p.x*0.06 + uTime*0.7)*0.06 + sin(p.z*0.08 + uTime*0.55)*0.05;
    float w2 = sin((p.x+p.z)*0.14 + uTime*1.1)*0.03;
    p.y += w1 + w2;
    vec4 wp = modelMatrix * vec4(p,1.0);
    vW = wp.xyz;
    vN = normalize(mat3(modelMatrix)*normal);
    vV = cameraPosition - vW;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;
const WATER_FRAG = /* glsl */`
  uniform float uTime; uniform vec3 uSun; uniform float uReef; uniform float uShore;
  uniform vec3 uLagoon; uniform vec3 uDeep; uniform vec3 uFoam;
  varying vec2 vUv; varying vec3 vW; varying vec3 vN; varying vec3 vV;
  void main(){
    vec3 V = normalize(vV);
    vec3 N = normalize(vN);
    // extra normal ripple
    float n1 = sin(vW.x*0.35 + uTime*1.3)*0.15 + sin(vW.z*0.4 + uTime*0.9)*0.12;
    N = normalize(N + vec3(n1, 0.0, n1*0.6));
    float distShore = abs(vW.x - uShore);
    float shallow = smoothstep(55.0, 6.0, distShore);
    vec3 col = mix(uDeep, uLagoon, shallow);
    // reef line: a band of white surf at uReef from the shore
    float reefD = abs(distShore - uReef);
    float surf = smoothstep(5.5, 0.6, reefD) * (0.55 + 0.45*sin(vW.z*0.35 + uTime*4.0));
    col = mix(col, uFoam, surf);
    // near-shore foam
    col = mix(col, uFoam, smoothstep(8.0, 0.8, distShore)*0.65);
    float fres = pow(1.0 - max(dot(N, V), 0.0), 3.0);
    col = mix(col, vec3(0.75, 0.9, 0.95), fres*0.45);
    vec3 L = normalize(uSun);
    float spec = pow(max(dot(N, normalize(L+V)), 0.0), 80.0);
    col += vec3(1.0, 0.96, 0.85) * spec * 0.85;
    gl_FragColor = vec4(col, 0.92);
  }
`;

export function makeWater(width, depth, opts = {}) {
  const shore = opts.shoreX ?? -22;
  const side = Math.sign(opts.sideX || shore) || -1;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSun: { value: new THREE.Vector3(40, 80, 20) },
      uReef: { value: opts.reef || 28 },
      uShore: { value: shore },
      uLagoon: { value: new THREE.Color(opts.lagoon || 0x3ec8c8) },
      uDeep: { value: new THREE.Color(opts.deep || 0x0a3a7a) },
      uFoam: { value: new THREE.Color(0xf4f8fc) },
    },
    vertexShader: WATER_VERT, fragmentShader: WATER_FRAG,
    transparent: true, depthWrite: false,
  });
  const mesh = new THREE.Mesh(geo(`sea|${width}|${depth}`, () => new THREE.PlaneGeometry(width, depth, 48, 24)), mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(side * (Math.abs(shore) + width / 2 - 4), opts.y ?? -0.35, opts.z || 0);
  mesh.userData.water = mat;
  return mesh;
}

export function tagBob(obj, amp = 0.16, freq = 0.55) {
  obj.userData.bob = { amp, freq, phase: Math.random() * Math.PI * 2, y0: obj.position.y };
  return obj;
}
export function updateScenery(dt, scene, sunPos) {
  const t = (updateScenery.t = (updateScenery.t || 0) + dt);
  scene.traverse((o) => {
    if (o.userData && o.userData.water) {
      o.userData.water.uniforms.uTime.value = t;
      if (sunPos) o.userData.water.uniforms.uSun.value.copy(sunPos);
    }
    const b = o.userData && o.userData.bob;
    if (b) {
      o.position.y = b.y0 + Math.sin(t * b.freq * Math.PI * 2 + b.phase) * b.amp;
      o.rotation.z = Math.sin(t * b.freq * Math.PI * 2 + b.phase * 1.3) * 0.04;
    }
  });
}

// Better working boats (pirogue, catamaran, sailboat, fishing). All CC0 procedural.
export function addBoat(g, kind, x, z, rot = Math.PI / 2) {
  const o = new THREE.Group();
  const col = (h) => new THREE.MeshStandardMaterial({ color: h, roughness: 0.7 });
  if (kind === 'catamaran') {
    const hull = col(0xf4f4f0), accent = col(0x1e4fa0);
    o.add(boxM(0.55, 0.45, 5.2, hull, -0.9, 0.15, 0));
    o.add(boxM(0.55, 0.45, 5.2, hull, 0.9, 0.15, 0));
    o.add(boxM(2.4, 0.12, 2.2, accent, 0, 0.7, 0.2));
    o.add(boxM(0.12, 3.2, 0.12, col(0xcccccc), 0, 2.3, 0.3));
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 2.8), new THREE.MeshStandardMaterial({ color: 0xffffff, side: THREE.DoubleSide }));
    sail.position.set(0.15, 2.4, 0.3); o.add(sail);
  } else if (kind === 'sailboat') {
    o.add(boxM(1.5, 0.7, 5.4, col(0xf2efe6), 0, 0.2, 0));
    o.add(boxM(1.52, 0.14, 5.42, col(0x1e4fa0), 0, 0.45, 0));
    o.add(boxM(0.08, 5.5, 0.08, col(0xdddddd), 0, 3.0, 0.4));
    const sail = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 4.4), new THREE.MeshStandardMaterial({ color: 0xfffaf0, side: THREE.DoubleSide }));
    sail.position.set(0.7, 2.8, 0.4); o.add(sail);
  } else if (kind === 'pirogue') {
    const c = pick([0xd8322a, 0x2a6fc0, 0xe0a020, 0x1e7a46, 0xf2f2f0]);
    o.add(boxM(1.15, 0.55, 4.6, col(c), 0, 0.1, 0));
    o.add(boxM(1.18, 0.12, 4.62, col(0xf4f4f0), 0, 0.32, 0));
    o.add(boxM(0.06, 2.2, 0.06, col(0x555555), 0, 1.3, -0.8));
  } else { // fishing
    const c = pick([0x2a6fc0, 0xd8322a, 0xe0a020, 0x3a3a3a]);
    o.add(boxM(1.8, 0.85, 5.6, col(c), 0, 0.2, 0));
    o.add(boxM(1.82, 0.16, 5.62, col(0xf2f2f2), 0, 0.5, 0));
    o.add(boxM(1.3, 1.1, 1.6, col(0xf2f2f0), 0, 1.2, 0.5));
    o.add(boxM(1.4, 0.1, 1.8, col(0xd8322a), 0, 1.8, 0.5));
    o.add(boxM(0.06, 2.6, 0.06, col(0x777777), 0, 2.0, -1.4));
  }
  o.position.set(x, -0.15, z); o.rotation.y = rot;
  tagBob(o, kind === 'pirogue' ? 0.12 : 0.18, 0.4 + Math.random() * 0.3);
  g.add(o); return o;
}
function boxM(w, h, d, m, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); mesh.position.set(x, y, z); return mesh;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];

export function buildBackdrop(level, sk) {
  const g = new THREE.Group(); const night = !!(sk && sk.night);
  placeMountains(g, level, sk);
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({
    map: T.sunTex(), fog: false, depthWrite: false, transparent: true,
    blending: THREE.AdditiveBlending, color: night ? 0xaac0ff : 0xffffff,
  }));
  sun.scale.set(night ? 140 : 260, night ? 140 : 260, 1);
  sun.position.set(sk.sunPos[0], sk.sunPos[1], -450); g.add(sun);
  const cloudCount = night ? 3 : (level.biome === 'curepipe' || level.biome === 'blackriver') ? 11 : 7;
  for (let i = 0; i < cloudCount; i++) {
    const c = new THREE.Sprite(new THREE.SpriteMaterial({
      map: T.cloudTex(), fog: false, transparent: true, depthWrite: false,
      opacity: night ? 0.2 : 0.8, color: night ? 0x8090c0 : level.sky === 'sunset' ? 0xffc0a0 : 0xffffff,
    }));
    c.scale.set(160 + Math.random() * 120, 70 + Math.random() * 50, 1);
    c.position.set(-380 + Math.random() * 760, 130 + Math.random() * 130, -440);
    g.add(c);
  }
  g.userData = { sun, heading0: (routeOf(level.uid) && routeOf(level.uid).heading0) || 0, mountainRoot: g.userData.mountainRoot };
  return g;
}

export function seaSideX(info, x) {
  const s = info && info.sea === 'right' ? 1 : -1;
  return s * Math.abs(x);
}

export function applyDecor(g, level, index, zc, gantrySub) {
  const info = sectionAt(level, zc);
  if (!info || !info.route) return info;
  const L = 40;
  const z0 = zc - L / 2, z1 = zc + L / 2;
  const toZ = (at) => -((at / info.route.lengthM) * (level.goal || info.route.lengthM));
  // street-name gantry when a road begins in this chunk
  for (const rd of (info.route.roads || [])) {
    const z = toZ(rd.at);
    if (z <= z1 && z >= z0 && rd.name && !/^\[/.test(rd.name) && rd.name.length > 2) {
      const { gantrySign } = applyDecor;
      if (applyDecor.gantry) g.add(applyDecor.gantry(z, rd.name.toUpperCase(), gantrySub || level.region || ''));
    }
  }
  for (const lm of (info.route.landmarks || [])) {
    const z = toZ(lm.at);
    if (z <= z1 && z >= z0) {
      if (applyDecor.sign) applyDecor.sign(g, lm.side === 'right' ? 1 : -1, z, lm.name, lm.kind === 'station' ? '#0b3f8f' : '#0a6a3c');
    }
  }
  for (const t of (info.route.turns || [])) {
    const z = toZ(t.at);
    if (z <= z1 && z >= z0 && applyDecor.junction) applyDecor.junction(g, t, z);
  }
  return info;
}

export function routeShopSign(level, zc) {
  const info = sectionAt(level, zc);
  const lm = info && info.landmarks && info.landmarks[0];
  if (!lm) return null;
  const k = (lm.kind || '').toLowerCase();
  if (/shop|market|restaurant|cafe|supermarket|convenience|amenity/.test(k) || /marché|marche|market|bazar|dholl|snack/i.test(lm.name)) return lm.name;
  return null;
}

export function headingBank(level, z) {
  const info = sectionAt(level, z);
  if (!info || !info.route) return { yaw: 0, bank: 0, heading: info && info.heading };
  const h0 = info.route.heading0 || 0;
  const h = info.heading != null ? info.heading : h0;
  let d = (h - h0 + 540) % 360 - 180;
  const turn = info.turn;
  return { yaw: d * Math.PI / 180, bank: turn ? (turn.dir === 'left' ? 0.12 : -0.12) : 0, heading: h, road: info.roadName, next: info.next, prev: info.prev, station: info.station, sea: info.sea };
}
