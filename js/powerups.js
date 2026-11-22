// Glowing special coins: Fly, Super Jump, Speed Boost, Magnet, Shield.
import * as THREE from 'three';

export const POWERS = {
  fly:       { id: 'fly',       title: 'FLY',          color: 0x66e8ff, dur: 8,  hint: 'Soar over the traffic' },
  superjump: { id: 'superjump', title: 'SUPER JUMP',   color: 0xb388ff, dur: 10, hint: 'Jump higher' },
  speed:     { id: 'speed',     title: 'SPEED BOOST',  color: 0xffd23f, dur: 6,  hint: 'Fast and invulnerable' },
  magnet:    { id: 'magnet',    title: 'MAGNET',       color: 0xff7ad9, dur: 10, hint: 'Pulls in coins' },
  shield:    { id: 'shield',    title: 'SHIELD',       color: 0x7cff9a, dur: 12, hint: 'Absorbs one hit' },
};
export const POWER_ORDER = ['fly', 'superjump', 'speed', 'magnet', 'shield'];

export function makePowerCoin(kind) {
  const def = POWERS[kind] || POWERS.fly;
  const g = new THREE.Group();
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 12, 10),
    new THREE.MeshBasicMaterial({ color: def.color, transparent: true, opacity: 0.55, depthWrite: false })
  );
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.28, 0),
    new THREE.MeshStandardMaterial({ color: def.color, emissive: def.color, emissiveIntensity: 1.4, roughness: 0.25, metalness: 0.2 })
  );
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.46, 0.05, 6, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.85 })
  );
  ring.rotation.x = Math.PI / 2;
  g.add(glow); g.add(core); g.add(ring);
  g.userData.kind = def.id;
  return g;
}

export function applyPower(G, P, kind, audio) {
  const def = POWERS[kind]; if (!def) return;
  G.power = { kind: def.id, t: def.dur, max: def.dur, title: def.title, color: def.color };
  if (def.id === 'speed') P.invuln = Math.max(P.invuln || 0, def.dur);
  if (def.id === 'shield') G.power.hits = 1;
  if (def.id === 'fly') { P.flyFrom = P.y; P.flying = true; }
  if (audio && audio.powerup) audio.powerup(def.id);
}

export function absorbHit(G, P) {
  if (G.power && G.power.kind === 'shield' && (G.power.hits || 0) > 0) {
    G.power.hits = 0; G.power.t = 0; P.invuln = Math.max(P.invuln || 0, 1.2);
    return true;
  }
  if (G.power && (G.power.kind === 'speed' || G.power.kind === 'fly')) return true;
  if ((P.invuln || 0) > 0) return true;
  return false;
}

export function tickPower(G, P, dt, PLAYER) {
  const p = G.power; if (!p) { P.flying = false; return; }
  p.t -= dt;
  if (p.kind === 'fly') {
    const want = p.t > 0.7 ? 5.6 : 0;
    P.y += (want - P.y) * Math.min(1, dt * 3.2);
    P.vy = 0; P.grounded = p.t <= 0.7 && P.y < 0.4;
    P.flying = p.t > 0.15;
    if (p.t <= 0.7) P.invuln = Math.max(P.invuln || 0, 0.8);
  }
  if (p.t <= 0) {
    if (p.kind === 'fly') { P.flying = false; if (P.y > 0.3) { P.vy = 0; /* settle */ } }
    G.power = null;
  }
}

export function jumpVelocity(G, PLAYER) {
  if (G.power && G.power.kind === 'superjump') return PLAYER.jumpV * 1.62;
  return PLAYER.jumpV;
}

export function speedMul(G) {
  if (G.power && G.power.kind === 'speed') return 1.48;
  return 1;
}

export function magnetPull(G, P, coins, dt) {
  if (!G.power || G.power.kind !== 'magnet') return;
  for (const c of coins) {
    if (c.got) continue;
    const dz = c.z - P.z, dx = c.x - P.x, dy = c.y - (P.y + 0.8);
    const d = Math.hypot(dx, dz, dy);
    if (d < 9 && d > 0.01) {
      const k = Math.min(1, dt * 8);
      c.x -= dx * k; c.y -= dy * k * 0.6; c.z -= dz * k;
      c.mesh.position.set(c.x, c.y, c.z);
    }
  }
}

export function updatePowerHud() {
  const el = document.getElementById('powerHud'); if (!el) return;
  const G = window.__dodo && window.__dodo.G;
  if (!G || !G.power || G.power.t <= 0) { el.classList.add('hidden'); return; }
  el.classList.remove('hidden');
  const p = G.power;
  const fill = el.querySelector('.pfill');
  const lab = el.querySelector('.plab');
  if (lab) lab.textContent = p.title;
  if (fill) {
    fill.style.width = (100 * p.t / p.max) + '%';
    const hex = '#' + (p.color || 0xffd23f).toString(16).padStart(6, '0');
    fill.style.background = hex;
  }
}
