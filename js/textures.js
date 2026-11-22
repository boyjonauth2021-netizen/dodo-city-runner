import * as THREE from 'three';

const cache = new Map();
function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, { repeat = false, aniso = 4 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function memo(key, fn) { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); }

export function asphaltTex() {
  return memo('asphalt', () => {
    const W = 512, H = 1024, c = canvas(W, H), g = c.getContext('2d'), r = rng(7);
    g.fillStyle = '#383b41'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 9000; i++) { const v = 40 + r() * 40 | 0; g.fillStyle = `rgba(${v},${v},${v + 4},${0.25 + r() * .3})`; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    // patches / cracks
    g.strokeStyle = 'rgba(20,20,22,.35)'; g.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) { g.beginPath(); let x = r() * W, y = r() * H; g.moveTo(x, y); for (let k = 0; k < 6; k++) { x += (r() - .5) * 60; y += r() * 50; g.lineTo(x, y); } g.stroke(); }
    const X = (x) => (x + 4) / 8 * W; // road spans x -4..4
    g.fillStyle = '#f2f2ea';
    for (const x of [-3.88, 3.88]) g.fillRect(X(x) - 5, 0, 10, H);
    for (const x of [-1.2, 1.2]) for (let y = 0; y < 8; y++) g.fillRect(X(x) - 4, y * H / 8 + 10, 8, H / 8 * 0.5);
    // painted arrows / zebra at one spot
    g.fillStyle = 'rgba(240,240,230,.85)';
    for (let i = 0; i < 7; i++) g.fillRect(X(-3.4) + i * 66, 40, 34, 90);
    return tex(c, { repeat: false });
  });
}
export function railTex() {
  return memo('rail', () => {
    const W = 512, H = 1024, c = canvas(W, H), g = c.getContext('2d'), r = rng(11);
    g.fillStyle = '#4b4a47'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 12000; i++) { const v = 60 + r() * 60 | 0; g.fillStyle = `rgba(${v},${v - 4},${v - 8},.6)`; g.fillRect(r() * W, r() * H, 1 + r() * 3, 1 + r() * 3); }
    const X = (x) => (x + 4) / 8 * W;
    // sleepers
    for (const lane of [-2.4, 0, 2.4]) {
      for (let y = 0; y < 50; y++) { g.fillStyle = '#5a4630'; g.fillRect(X(lane - 1.05), y * H / 50 + 3, X(lane + 1.05) - X(lane - 1.05), H / 50 * 0.5); }
      for (const o of [-0.55, 0.55]) { g.fillStyle = '#b9bcc2'; g.fillRect(X(lane + o) - 4, 0, 8, H); g.fillStyle = '#7d8087'; g.fillRect(X(lane + o) + 3, 0, 2, H); }
    }
    // yellow platform edge lines
    g.fillStyle = '#f2c400'; for (const x of [-3.85, 3.85]) g.fillRect(X(x) - 6, 0, 12, H);
    return tex(c);
  });
}
const FACADE_COLORS = [
  ['#f1d9a0', '#2c3e50'], ['#e8a5a0', '#2f3b4c'], ['#9fd6cf', '#26384a'], ['#efe9dc', '#33414f'],
  ['#c9ced4', '#2a3a48'], ['#b8624c', '#2e3a46'], ['#f0b46a', '#2c3b4d'], ['#a9c4e8', '#25364a'],
];
export function facadeTex(variant) {
  const v = variant % FACADE_COLORS.length;
  return memo('facade' + v, () => {
    const W = 256, H = 512, c = canvas(W, H), g = c.getContext('2d'), r = rng(100 + v);
    const [wall, glass] = FACADE_COLORS[v];
    g.fillStyle = wall; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(0,0,0,${r() * .05})`; g.fillRect(r() * W, r() * H, 3, 3); }
    // tile = 4 columns x 4 floors (each cell 2 x 3 units)
    const cw = W / 4, ch = H / 4;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      const x = col * cw + cw * .2, y = row * ch + ch * .18, w = cw * .6, h = ch * .58;
      const lit = r() < 0.22;
      const gr = g.createLinearGradient(x, y, x + w, y + h);
      if (lit) { gr.addColorStop(0, '#ffe9a8'); gr.addColorStop(1, '#ffc36a'); } else { gr.addColorStop(0, '#8fb4d6'); gr.addColorStop(.5, glass); gr.addColorStop(1, '#1b2836'); }
      g.fillStyle = '#00000033'; g.fillRect(x - 3, y - 3, w + 6, h + 8);
      g.fillStyle = gr; g.fillRect(x, y, w, h);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(x + w / 2 - 1, y, 2, h); g.fillRect(x, y + h * .5, w, 2);
      g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(x - 5, y + h + 2, w + 10, 5); // sill
      if (r() < .3) { g.fillStyle = '#44556699'; g.fillRect(x - 6, y + h - 8, w + 12, 12); g.fillStyle = '#ffffff55'; g.fillRect(x - 6, y + h - 8, w + 12, 2); } // balcony
    }
    g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, H - 5, W, 5);
    return tex(c, { repeat: true });
  });
}
export function signTex(text, { bg = '#0b4f8a', fg = '#ffffff', w = 512, h = 128, sub = '', border = true } = {}) {
  return memo(`sign|${text}|${bg}|${fg}|${w}|${sub}`, () => {
    const c = canvas(w, h), g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    if (border) { g.strokeStyle = fg; g.lineWidth = 5; g.strokeRect(6, 6, w - 12, h - 12); }
    g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `bold ${sub ? h * .46 : h * .5}px Arial, Helvetica, sans-serif`;
    g.fillText(text, w / 2, sub ? h * .38 : h / 2);
    if (sub) { g.font = `${h * .22}px Arial, sans-serif`; g.fillText(sub, w / 2, h * .74); }
    return tex(c);
  });
}
export function stripeTex(a = '#e8302a', b = '#f4f4f4') {
  return memo('stripe' + a + b, () => {
    const c = canvas(256, 64), g = c.getContext('2d'); g.fillStyle = b; g.fillRect(0, 0, 256, 64);
    g.fillStyle = a; for (let i = -2; i < 10; i++) { g.beginPath(); g.moveTo(i * 40, 64); g.lineTo(i * 40 + 20, 64); g.lineTo(i * 40 + 52, 0); g.lineTo(i * 40 + 32, 0); g.fill(); }
    g.strokeStyle = '#222'; g.lineWidth = 4; g.strokeRect(0, 0, 256, 64);
    return tex(c);
  });
}
export function hazardTex() { return stripeTex('#1a1a1a', '#f2c400'); }

const BUS_STYLES = [
  { body: '#f4f4f0', accent: '#d8322a', accent2: '#1e4fa0', dest: 'PORT LOUIS' },
  { body: '#f6f1da', accent: '#1e7a46', accent2: '#f2c400', dest: 'CUREPIPE' },
  { body: '#eef3f8', accent: '#1e4fa0', accent2: '#e8a020', dest: 'GRAND BAIE' },
  { body: '#f6e9e6', accent: '#b0286a', accent2: '#2a2a2a', dest: 'ROSE HILL' },
  { body: '#f2f2f2', accent: '#e07a10', accent2: '#1a1a1a', dest: 'QUATRE BORNES' },
];
export function busStyles() { return BUS_STYLES.length; }
export function busTextures(i) {
  const s = BUS_STYLES[i % BUS_STYLES.length];
  return memo('bus' + i, () => {
    // side: 1024x256 (9 units x 3)
    const side = canvas(1024, 256), g = side.getContext('2d');
    g.fillStyle = s.body; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = s.accent; g.fillRect(0, 170, 1024, 46); g.fillStyle = s.accent2; g.fillRect(0, 216, 1024, 12);
    g.fillStyle = '#1a1d22'; g.fillRect(0, 228, 1024, 28);
    for (let i = 0; i < 8; i++) { const x = 50 + i * 118; const gr = g.createLinearGradient(x, 50, x, 150); gr.addColorStop(0, '#9fc3dd'); gr.addColorStop(1, '#2d4256'); g.fillStyle = gr; g.fillRect(x, 50, 96, 100); g.fillStyle = '#ffffff44'; g.fillRect(x + 8, 54, 14, 92); }
    g.fillStyle = '#222'; g.fillRect(20, 20, 984, 10);
    g.fillStyle = s.accent; g.font = 'bold 26px Arial'; g.fillText('Mauritius Bus Services', 340, 198);
    // wheel arches
    g.fillStyle = '#0d0d0f'; for (const x of [150, 800]) { g.beginPath(); g.arc(x, 252, 44, Math.PI, 0); g.fill(); }
    // front 256x256
    const front = canvas(256, 256), f = front.getContext('2d');
    f.fillStyle = s.body; f.fillRect(0, 0, 256, 256);
    f.fillStyle = s.accent; f.fillRect(0, 170, 256, 50); f.fillStyle = s.accent2; f.fillRect(0, 220, 256, 10);
    const gr = f.createLinearGradient(0, 40, 0, 150); gr.addColorStop(0, '#a8cbe4'); gr.addColorStop(1, '#2b3f52'); f.fillStyle = gr; f.fillRect(20, 40, 216, 110);
    f.fillStyle = '#ffffff55'; f.fillRect(120, 40, 4, 110);
    f.fillStyle = '#111'; f.fillRect(40, 10, 176, 26); f.fillStyle = '#ffb000'; f.font = 'bold 18px Arial'; f.textAlign = 'center'; f.fillText(s.dest, 128, 30);
    f.fillStyle = '#fff6c0'; f.beginPath(); f.arc(36, 195, 14, 0, 7); f.arc(220, 195, 14, 0, 7); f.fill();
    f.fillStyle = '#222'; f.fillRect(0, 232, 256, 24);
    const back = canvas(256, 256), b = back.getContext('2d'); b.fillStyle = s.body; b.fillRect(0, 0, 256, 256); b.fillStyle = s.accent; b.fillRect(0, 170, 256, 50);
    b.fillStyle = '#2b3f52'; b.fillRect(40, 50, 176, 80); b.fillStyle = '#d00'; b.fillRect(20, 180, 30, 14); b.fillRect(206, 180, 30, 14);
    const roof = canvas(64, 64), rr = roof.getContext('2d'); rr.fillStyle = '#d7dadd'; rr.fillRect(0, 0, 64, 64);
    return { side: tex(side), front: tex(front), back: tex(back), roof: tex(roof), s };
  });
}
export function trainTextures() {
  return memo('train', () => {
    const side = canvas(1024, 256), g = side.getContext('2d');
    g.fillStyle = '#eef1f5'; g.fillRect(0, 0, 1024, 256);
    g.fillStyle = '#1b3f8f'; g.fillRect(0, 190, 1024, 52);
    g.fillStyle = '#e33a3a'; g.fillRect(0, 178, 1024, 12);
    g.fillStyle = '#7ac143'; g.fillRect(0, 242, 1024, 8);
    for (let i = 0; i < 6; i++) {
      const x = 28 + i * 168; const gr = g.createLinearGradient(x, 40, x, 160); gr.addColorStop(0, '#6c8fb0'); gr.addColorStop(.5, '#1d2a3a'); gr.addColorStop(1, '#0f1722');
      g.fillStyle = gr; g.fillRect(x, 40, 100, 124); g.fillStyle = '#ffffff30'; g.fillRect(x + 10, 44, 12, 116);
      g.fillStyle = '#9aa3ad'; g.fillRect(x + 108, 40, 48, 150); g.fillStyle = '#4a5560'; g.fillRect(x + 130, 40, 2, 150);
    }
    g.fillStyle = '#fff'; g.font = 'bold 30px Arial'; g.fillText('METRO EXPRESS', 360, 224);
    g.fillStyle = '#222'; g.fillRect(0, 250, 1024, 6);
    const front = canvas(256, 256), f = front.getContext('2d');
    f.fillStyle = '#eef1f5'; f.fillRect(0, 0, 256, 256); f.fillStyle = '#1b3f8f'; f.fillRect(0, 196, 256, 44); f.fillStyle = '#e33a3a'; f.fillRect(0, 184, 256, 12);
    const gr = f.createLinearGradient(0, 30, 0, 150); gr.addColorStop(0, '#7fa0c0'); gr.addColorStop(1, '#101a26'); f.fillStyle = gr; f.fillRect(26, 28, 204, 124);
    f.fillStyle = '#ffffff50'; f.fillRect(124, 28, 6, 124); f.fillStyle = '#ffd24a'; f.fillRect(70, 6, 116, 16); f.fillStyle = '#222'; f.font = 'bold 13px Arial'; f.textAlign = 'center'; f.fillText('ROSE HILL ⇄ PORT LOUIS', 128, 19);
    f.fillStyle = '#fffbe0'; f.beginPath(); f.arc(38, 170, 13, 0, 7); f.arc(218, 170, 13, 0, 7); f.fill();
    f.fillStyle = '#222'; f.fillRect(0, 244, 256, 12);
    const back = canvas(64, 64), b = back.getContext('2d'); b.fillStyle = '#c8cdd3'; b.fillRect(0, 0, 64, 64);
    const roof = canvas(64, 64), r = roof.getContext('2d'); r.fillStyle = '#c4c9cf'; r.fillRect(0, 0, 64, 64); r.fillStyle = '#9ea5ad'; r.fillRect(0, 28, 64, 8);
    return { side: tex(side), front: tex(front), back: tex(back), roof: tex(roof) };
  });
}
const SKY_GRADS = {
  day: [[0, '#2f86d8'], [.5, '#8cc8f2'], [.85, '#d6ecf8'], [1, '#f6f0dc']],
  dusk: [[0, '#2c4f8f'], [.45, '#c78fb0'], [.7, '#ffb26b'], [1, '#ffd9a0']],
  tropic: [[0, '#1a8ae0'], [.45, '#5cc4ee'], [.8, '#bfeaf5'], [1, '#f4f6e4']],
  mist: [[0, '#7f95a6'], [.5, '#a9bac6'], [.85, '#cfd9df'], [1, '#e2e8ea']],
  gold: [[0, '#3a82cf'], [.5, '#a9cdea'], [.8, '#f2dcb0'], [1, '#ffe7b8']],
  sunset: [[0, '#27386e'], [.35, '#8a4a8c'], [.65, '#ff7a4a'], [.88, '#ffb85a'], [1, '#ffe0a0']],
  night: [[0, '#050a22'], [.5, '#0e1d4a'], [.85, '#23336b'], [1, '#3c4a80']],
  forest: [[0, '#4a86b8'], [.5, '#8fb7c8'], [.85, '#cde0d4'], [1, '#e4ecdc']],
};
export function skyTex(kind) {
  return memo('sky' + kind, () => {
    const c = canvas(8, 512), g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 512);
    for (const [p, col] of (SKY_GRADS[kind] || SKY_GRADS.day)) gr.addColorStop(p, col);
    g.fillStyle = gr; g.fillRect(0, 0, 8, 512);
    if (kind === 'night') { const r = rng(5); g.fillStyle = '#fff'; for (let i = 0; i < 30; i++) g.fillRect(r() * 8, r() * 300, 1, 1); }
    return tex(c);
  });
}
// ---- generic procedural ground / material textures (small, repeatable)
function speck(key, base, cols, { n = 260, size = 3, w = 128, h = 128, rep = true, seed = 7, lines = null } = {}) {
  return memo(key, () => {
    const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let i = 0; i < n; i++) { g.fillStyle = cols[(r() * cols.length) | 0]; const s = 1 + r() * size; g.fillRect(r() * w, r() * h, s, s); }
    if (lines) lines(g, w, h, r);
    return tex(c, { repeat: rep });
  });
}
export const sandTex = () => speck('sand', '#e8d8a8', ['#f4e7bd', '#dcc994', '#efdcae', '#d4c088'], { n: 420, size: 2 });
export const grassTex = () => speck('grass', '#4f9a3c', ['#5aa845', '#448a34', '#68b350', '#3c7f2e'], { n: 400, size: 3 });
export const dirtTex = () => speck('dirt', '#8a5a3a', ['#9a6a46', '#78492c', '#a87850', '#6a3f26'], { n: 380, size: 3 });
export const redEarthTex = () => speck('redearth', '#a8482a', ['#b85a38', '#923a20', '#c86a44', '#7e3018'], { n: 380, size: 3 });
export const forestFloorTex = () => speck('forestfloor', '#3b4a2a', ['#4a5a34', '#2c3a1e', '#5c4a30', '#34452a'], { n: 420, size: 3 });
export const gravelTex = () => speck('gravel', '#a9a59b', ['#bdb9ae', '#8f8b82', '#cfcbc0', '#7d7970'], { n: 520, size: 2 });
export const lavaTex = () => speck('lava', '#3a2f2b', ['#4a3c36', '#2a211e', '#5a4a40', '#6a4a38'], { n: 400, size: 3 });
export const brickTex = () => speck('brick', '#9a4b34', ['#a85a40', '#8a3f2c', '#b46a4c'], { n: 160, size: 3, lines: (g, w, h) => { g.strokeStyle = 'rgba(230,220,200,.55)'; g.lineWidth = 2; for (let y = 0; y <= h; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 16); g.stroke(); } } } });
export function waterTex() {
  return memo('water', () => {
    const c = canvas(128, 128), g = c.getContext('2d'), r = rng(11);
    g.fillStyle = '#1fa7c4'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 2;
    for (let i = 0; i < 22; i++) { const x = r() * 128, y = r() * 128, l = 10 + r() * 22; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + l / 2, y - 3, x + l, y); g.stroke(); }
    g.fillStyle = 'rgba(10,80,120,.18)'; for (let i = 0; i < 40; i++) g.fillRect(r() * 128, r() * 128, 6, 2);
    return tex(c, { repeat: true });
  });
}
export function boardwalkTex() {
  return memo('boardwalk', () => {
    const c = canvas(128, 128), g = c.getContext('2d'), r = rng(19);
    for (let i = 0; i < 8; i++) { const v = 150 + r() * 40 | 0; g.fillStyle = `rgb(${v},${v - 40},${v - 80})`; g.fillRect(0, i * 16, 128, 15); g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i * 16 + 15, 128, 1); }
    return tex(c, { repeat: true });
  });
}
export function caneTex() {
  return memo('cane', () => {
    const c = canvas(128, 128), g = c.getContext('2d'), r = rng(23);
    g.fillStyle = '#5f9a2e'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 60; i++) { g.strokeStyle = ['#7fb83c', '#4a8423', '#9cc84a', '#b3b84a'][(r() * 4) | 0]; g.lineWidth = 1 + r() * 2; const x = r() * 128; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + (r() - .5) * 8, 128); g.stroke(); }
    return tex(c, { repeat: true });
  });
}
export function earthBandsTex() { // Chamarel Seven Coloured Earth
  return memo('earthbands', () => {
    const c = canvas(8, 256), g = c.getContext('2d'), cols = ['#b8452a', '#8a4a2a', '#7a4a8c', '#4f8a4a', '#3e6fa8', '#9a3a6a', '#e0b030'];
    const r = rng(3); for (let i = 0; i < 14; i++) { g.fillStyle = cols[i % 7]; g.fillRect(0, i * 18.3, 8, 19); }
    for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(r() * 8, r() * 256, 2, 1); }
    return tex(c, { repeat: true });
  });
}
export function lilyTex() {
  return memo('lily', () => {
    const c = canvas(128, 128), g = c.getContext('2d');
    g.fillStyle = '#1b9db8'; g.fillRect(0, 0, 128, 128);
    for (const [x, y, r] of [[34, 40, 26], [92, 34, 20], [70, 92, 30], [20, 100, 16]]) { g.fillStyle = '#2f8a3a'; g.beginPath(); g.moveTo(x, y); g.arc(x, y, r, .35, Math.PI * 2 - .1); g.closePath(); g.fill(); g.strokeStyle = '#a6e07a'; g.lineWidth = 2; g.stroke(); }
    return tex(c, { repeat: true });
  });
}
export function woodRingTex() {
  return memo('woodring', () => {
    const c = canvas(64, 64), g = c.getContext('2d'); g.fillStyle = '#7b5632'; g.fillRect(0, 0, 64, 64);
    g.strokeStyle = '#5a3c20'; g.lineWidth = 2; for (let i = 0; i < 7; i++) { g.beginPath(); g.moveTo(0, i * 10 + 3); g.lineTo(64, i * 10 + 3); g.stroke(); } return tex(c, { repeat: true });
  });
}
export function cloudTex() {
  return memo('cloud', () => {
    const c = canvas(256, 128), g = c.getContext('2d');
    for (let i = 0; i < 14; i++) { const x = 40 + Math.random() * 176, y = 50 + Math.random() * 30, r = 18 + Math.random() * 26; const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
    return tex(c);
  });
}
export function sunTex() {
  return memo('sun', () => {
    const c = canvas(256, 256), g = c.getContext('2d'), gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(255,250,220,1)'); gr.addColorStop(.12, 'rgba(255,240,190,.95)'); gr.addColorStop(.3, 'rgba(255,210,140,.35)'); gr.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); return tex(c);
  });
}
export function tilesTex() {
  return memo('tiles', () => {
    const c = canvas(256, 256), g = c.getContext('2d'), r = rng(3);
    g.fillStyle = '#d9d4c7'; g.fillRect(0, 0, 256, 256);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 205 + r() * 25 | 0; g.fillStyle = `rgb(${v},${v - 4},${v - 14})`; g.fillRect(x * 32 + 1, y * 32 + 1, 30, 30); }
    return tex(c, { repeat: true });
  });
}
export const FACADES = FACADE_COLORS.length;
