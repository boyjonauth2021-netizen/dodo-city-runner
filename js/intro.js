// 8-second skippable lab-escape intro, played once before Port Louis Streets (level 1).
import * as THREE from 'three';
import { makeDodo } from './world.js';

export function shouldPlayIntro(params, save, level, BOT) {
  if (!level || level.uid !== 'pl1') return false;
  if (params.get('intro') === '0') return false;
  if (params.get('intro') === '1') return true;
  if (BOT || params.get('bot') === '1' || params.get('shot') === '1') return false;
  return !save.d.seenIntro;
}

export function markIntroSeen(save) {
  save.d.seenIntro = true; save.write();
}

/**
 * Play the intro in a temporary scene using the same renderer/camera.
 * Resolves when finished or skipped. Calls onTick(t, skipped) optionally.
 */
export function playIntro({ renderer, camera, audio, onSkip }) {
  return new Promise((resolve) => {
    const prevExposure = renderer.toneMappingExposure;
    renderer.toneMappingExposure = 1.55;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x2a3e50);
    scene.fog = new THREE.Fog(0x163044, 28, 70);

    const hemi = new THREE.HemisphereLight(0x9fe8ff, 0x1a2430, 1.35); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xc8f4ff, 1.6);
    key.position.set(-4, 8, 6); scene.add(key);
    const fill = new THREE.PointLight(0x9ad8ff, 2.4, 22, 1.2); fill.position.set(-2.2, 3.6, 3.2); scene.add(fill);
    const fill2 = new THREE.PointLight(0xffd4a8, 1.1, 16, 1.4); fill2.position.set(3.4, 2.8, 3.6); scene.add(fill2);
    const podLight = new THREE.PointLight(0xd8f6ff, 2.2, 6, 1.1); podLight.position.set(0, 1.6, 0.3); scene.add(podLight);
    const alarm = new THREE.PointLight(0xff3a3a, 0, 16, 1.0); alarm.position.set(0, 3.5, 0); scene.add(alarm);
    const doorLight = new THREE.PointLight(0xfff4d0, 1.4, 18, 1.2); doorLight.position.set(0, 1.8, -7.2); scene.add(doorLight);

    const lamb = (c, rough = 0.7) => new THREE.MeshLambertMaterial({ color: c });
    const basic = (c) => new THREE.MeshBasicMaterial({ color: c });

    // open-front lab: five planes so the camera never sits in a dark sealed box
    const wallC = lamb(0x4a5d70);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 18), lamb(0x2a3544));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const ceil = new THREE.Mesh(new THREE.PlaneGeometry(80, 80), basic(0x4a5c6c));
    ceil.rotation.x = Math.PI / 2; ceil.position.y = 6.2; scene.add(ceil);
    const back = new THREE.Mesh(new THREE.PlaneGeometry(16, 6.2), wallC);
    back.position.set(0, 3.1, -8.9); scene.add(back);
    const left = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.2), wallC);
    left.rotation.y = Math.PI / 2; left.position.set(-8, 3.1, 0); scene.add(left);
    const right = new THREE.Mesh(new THREE.PlaneGeometry(18, 6.2), wallC);
    right.rotation.y = -Math.PI / 2; right.position.set(8, 3.1, 0); scene.add(right);

    // floor cyan safety stripes
    for (let i = 0; i < 7; i++) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(16, 0.03, 0.09), basic(0x3ec8e0));
      s.position.set(0, 0.02, -7 + i * 2.15); scene.add(s);
    }

    // ceiling light bars
    for (const [x, z] of [[-3.2, -2], [3.2, -2], [-3.2, 2.4], [3.2, 2.4], [0, 0]]) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.08, 0.28), basic(0xb8f4ff));
      bar.position.set(x, 6.05, z); scene.add(bar);
      const glow = new THREE.PointLight(0xa8e8ff, 0.7, 10, 1.6); glow.position.set(x, 5.6, z); scene.add(glow);
    }

    // tanks / machinery along the walls
    for (const x of [-5.4, 5.4]) for (const z of [-4.2, -1.2, 1.8]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 4.6, 12, 1, true),
        new THREE.MeshLambertMaterial({ color: 0x6aa8c0, transparent: true, opacity: 0.45 }));
      t.position.set(x, 2.4, z); scene.add(t);
      const fluid = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 3.8, 10),
        new THREE.MeshBasicMaterial({ color: 0x2ee0c8, transparent: true, opacity: 0.45 }));
      fluid.position.set(x, 2.1, z); scene.add(fluid);
      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.16, 12), lamb(0x8899aa));
      cap.position.set(x, 4.75, z); scene.add(cap);
    }
    // wall cabinets
    for (const [x, z, ry] of [[-7.6, 4.2, Math.PI / 2], [7.6, -3.2, -Math.PI / 2]]) {
      const cab = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.8, 0.5), lamb(0x3a4654));
      cab.position.set(x, 1.5, z); cab.rotation.y = ry; scene.add(cab);
    }

    // monitors with glowing screens
    function screenTex(hue) {
      const c = document.createElement('canvas'); c.width = 256; c.height = 160;
      const g = c.getContext('2d');
      g.fillStyle = '#03140e'; g.fillRect(0, 0, 256, 160);
      g.strokeStyle = hue; g.lineWidth = 2;
      g.beginPath();
      for (let x = 0; x < 256; x++) {
        const y = 80 + Math.sin(x * 0.08 + hue.length) * 28 + Math.sin(x * 0.21) * 12;
        if (x === 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
      g.fillStyle = hue;
      g.font = '11px monospace';
      g.fillText('VITALS  OK', 12, 22);
      g.fillText('POD-01   LOCK', 12, 38);
      g.fillText('SEQ  0041', 12, 148);
      const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; return tx;
    }
    const monitors = [];
    for (const [x, y, z, ry, col] of [
      [-3.5, 2.5, -8.55, 0, '#3ef0a8'],
      [3.3, 2.5, -8.55, 0, '#7fd0ff'],
      [-7.55, 2.6, 1.2, Math.PI / 2, '#3ef0a8'],
    ]) {
      const bezel = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.15, 0.1), lamb(0x1a222c));
      bezel.position.set(x, y, z); bezel.rotation.y = ry; scene.add(bezel);
      const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.62, 0.98), new THREE.MeshBasicMaterial({ map: screenTex(col) }));
      const off = 0.08;
      scr.position.set(x + Math.sin(ry) * off, y, z + Math.cos(ry) * off); scr.rotation.y = ry; scene.add(scr);
      const glow = new THREE.PointLight(col === '#7fd0ff' ? 0x7fd0ff : 0x3ef0a8, 0.85, 5, 1.4);
      glow.position.set(x, y, z + 0.4); scene.add(glow);
      monitors.push(scr);
    }

    // pod
    const pod = new THREE.Group();
    const glassMat = new THREE.MeshLambertMaterial({ color: 0xb8e8ff, transparent: true, opacity: 0.28, side: THREE.DoubleSide });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 2.6, 20, 1, true), glassMat);
    glass.position.y = 1.3; pod.add(glass);
    const lid = new THREE.Mesh(new THREE.SphereGeometry(1.05, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), glassMat);
    lid.position.y = 2.55; pod.add(lid);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.25, 0.28, 16), lamb(0x3a4558));
    base.position.y = 0.14; pod.add(base);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.08, 0.06, 6, 20), basic(0x7aeeff));
    ring.rotation.x = Math.PI / 2; ring.position.y = 0.3; pod.add(ring);
    // inner lit floor of the pod so the dodo reads clearly
    const pad = new THREE.Mesh(new THREE.CircleGeometry(0.9, 16), basic(0xc8f4ff));
    pad.rotation.x = -Math.PI / 2; pad.position.y = 0.3; pod.add(pad);
    pod.position.set(0, 0, 0); scene.add(pod);

    // crack overlay
    const crackCanvas = document.createElement('canvas'); crackCanvas.width = 256; crackCanvas.height = 256;
    const cg = crackCanvas.getContext('2d');
    const crackTex = new THREE.CanvasTexture(crackCanvas);
    const crack = new THREE.Mesh(new THREE.CylinderGeometry(1.06, 1.06, 2.6, 16, 1, true),
      new THREE.MeshBasicMaterial({ map: crackTex, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
    crack.position.y = 1.3; pod.add(crack);
    function drawCracks(n) {
      cg.clearRect(0, 0, 256, 256); cg.strokeStyle = 'rgba(230,255,255,0.95)'; cg.lineWidth = 1.6;
      for (let i = 0; i < n; i++) {
        cg.beginPath(); let x = 128 + Math.random() * 40 - 20, y = 40 + Math.random() * 40;
        cg.moveTo(x, y);
        for (let k = 0; k < 6; k++) { x += Math.random() * 30 - 10; y += 20 + Math.random() * 18; cg.lineTo(x, y); if (Math.random() < 0.5) { cg.lineTo(x + (Math.random() * 40 - 20), y - 8); cg.moveTo(x, y); } }
        cg.stroke();
      }
      crackTex.needsUpdate = true;
    }

    // dodo in the pod, asleep then waking
    const dodo = makeDodo();
    dodo.scale.setScalar(0.18);
    dodo.position.set(0, 0.35, 0);
    dodo.rotation.y = Math.PI;
    pod.add(dodo);
    const rig = dodo.userData.rig;
    const bones = (rig && rig.bones) || {};
    const findBone = (...names) => {
      const keys = Object.keys(bones);
      for (const n of names) { const h = keys.find((k) => k.toLowerCase().includes(n)); if (h) return bones[h]; }
      return null;
    };
    const head = findBone('head', 'neck', 'head_');
    const spine = findBone('spine', 'chest', 'body');

    // rotating alarm — a sweep, not a room-crushing strobe
    const lamp = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.3, 8), basic(0xff3333));
    lamp.position.set(0, 5.7, 0); scene.add(lamp);
    const beam = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.55),
      new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }));
    beam.position.set(0, 2.8, 0); scene.add(beam);

    // bright doorway: a glowing opening in the back wall, framed, widening as the dodo runs out
    const doorGlow = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 3.5), basic(0xfff1bc));
    doorGlow.position.set(0, 1.75, -8.86); doorGlow.scale.x = 0.22; scene.add(doorGlow);
    const frameMat = lamb(0x1e2833);
    const jambL = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 0.22), frameMat); jambL.position.set(-1.3, 1.75, -8.84); scene.add(jambL);
    const jambR = new THREE.Mesh(new THREE.BoxGeometry(0.16, 3.7, 0.22), frameMat); jambR.position.set(1.3, 1.75, -8.84); scene.add(jambR);
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.16, 0.22), frameMat); lintel.position.set(0, 3.55, -8.84); scene.add(lintel);

    // sparks + glass shards (activated on crack)
    const sparks = [];
    const shards = [];
    const sparkMat = basic(0xfff2a0);
    const shardMat = new THREE.MeshBasicMaterial({ color: 0xd8f4ff, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
    for (let i = 0; i < 18; i++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(0.035, 5, 4), sparkMat);
      s.visible = false; scene.add(s);
      sparks.push({ m: s, v: new THREE.Vector3(), life: 0 });
    }
    for (let i = 0; i < 22; i++) {
      const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.12 + Math.random() * 0.18, 0.08 + Math.random() * 0.14), shardMat);
      sh.visible = false; scene.add(sh);
      shards.push({ m: sh, v: new THREE.Vector3(), spin: new THREE.Vector3(), life: 0 });
    }
    function burst(origin) {
      for (const s of sparks) {
        s.m.position.copy(origin); s.m.visible = true;
        s.v.set((Math.random() - 0.5) * 6, 1 + Math.random() * 4, (Math.random() - 0.5) * 6);
        s.life = 0.4 + Math.random() * 0.5;
      }
      for (const s of shards) {
        s.m.position.copy(origin); s.m.visible = true;
        s.v.set((Math.random() - 0.5) * 5, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 4);
        s.spin.set((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8);
        s.life = 1.2 + Math.random() * 0.8;
      }
    }

    const clock = { t: 0, skip: false, done: false, burst: false };
    const skip = () => { if (clock.done) return; clock.skip = true; finish(); };
    const onKey = (e) => { if (e.code === 'Space' || e.key === 'Escape' || e.key === 'Enter') skip(); };
    const onPtr = () => skip();
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', onPtr);

    const hint = document.getElementById('introHint');
    if (hint) hint.classList.remove('hidden');

    if (audio) { try { audio.unlock(); if (audio.labHum) audio.labHum(true); } catch (e) {} }

    let last = performance.now();
    function finish() {
      if (clock.done) return; clock.done = true;
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('pointerdown', onPtr);
      if (hint) hint.classList.add('hidden');
      if (audio && audio.labHum) audio.labHum(false);
      if (audio && audio.stopSiren) audio.stopSiren();
      renderer.toneMappingExposure = prevExposure;
      resolve({ skipped: clock.skip, t: clock.t });
    }
    function tickFx(dt) {
      for (const s of sparks) {
        if (!s.m.visible) continue;
        s.life -= dt; s.v.y -= 8 * dt;
        s.m.position.addScaledVector(s.v, dt);
        if (s.life <= 0) s.m.visible = false;
      }
      for (const s of shards) {
        if (!s.m.visible) continue;
        s.life -= dt; s.v.y -= 9 * dt;
        s.m.position.addScaledVector(s.v, dt);
        s.m.rotation.x += s.spin.x * dt; s.m.rotation.y += s.spin.y * dt;
        s.m.material.opacity = Math.max(0, Math.min(0.85, s.life));
        if (s.life <= 0) s.m.visible = false;
      }
    }
    function frame(now) {
      if (clock.done) return;
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      clock.t += dt;
      const t = clock.t;
      tickFx(dt);
      // pulsy monitors
      for (const m of monitors) m.material.opacity = 0.85 + 0.15 * Math.sin(t * 6);

      // timeline 0–8s
      if (t < 1.6) {
        camera.position.set(2.4 - t * 0.4, 1.7 + t * 0.15, 5.2 - t * 0.8);
        camera.lookAt(0, 1.25, 0);
        if (rig) rig.sample(0.15);
        if (head) head.rotation.x = 0.5;
      } else if (t < 3.1) {
        const k = (t - 1.6) / 1.5;
        camera.position.set(1.8, 1.95, 3.9);
        camera.lookAt(0, 1.35, 0);
        if (rig) rig.sample(t * 0.6);
        if (head) head.rotation.x = 0.5 * (1 - k) - 0.15 * k;
        if (spine) spine.rotation.x = 0.08 * k;
      } else if (t < 4.6) {
        if (t - dt < 3.1 && audio && audio.labSiren) audio.labSiren();
        const pulse = 0.5 + 0.5 * Math.sin(t * 10);
        // sweep colour across the room without crushing blacks
        alarm.intensity = 1.15 * pulse;
        beam.material.opacity = 0.28 * pulse;
        lamp.rotation.y += dt * 6;
        beam.rotation.y = lamp.rotation.y;
        hemi.color.setRGB(0.62 + pulse * 0.18, 0.55, 0.62);
        drawCracks(Math.min(8, 1 + Math.floor((t - 3.1) * 6)));
        crack.material.opacity = Math.min(0.9, (t - 3.1) * 0.8);
        camera.position.set(1.7, 2.0, 3.6);
        camera.lookAt(0, 1.35, 0);
        if (rig) rig.sample(t);
      } else if (t < 6.2) {
        if (!clock.burst) { clock.burst = true; burst(new THREE.Vector3(0, 1.5, 0.6)); }
        glassMat.opacity = Math.max(0, 0.28 - (t - 4.6) * 0.55);
        crack.material.opacity = Math.max(0, 0.9 - (t - 4.6) * 1.2);
        lid.rotation.z = Math.min(1.2, (t - 4.6) * 2.0);
        lid.position.x = (t - 4.6) * 1.4;
        const k = Math.min(1, (t - 4.6) / 0.8);
        dodo.position.set(0, 0.35 + Math.sin(k * Math.PI) * 1.3, -k * 1.6);
        dodo.rotation.x = -k * 0.4;
        if (rig) rig.sample(t * 1.4);
        camera.position.set(1.6 - k * 0.2, 2.1, 3.6 - k * 0.6);
        camera.lookAt(dodo.position.x, 1.4 + dodo.position.y * 0.5, dodo.position.z);
        alarm.intensity *= 0.96;
        doorGlow.scale.x = Math.max(doorGlow.scale.x, 0.2 + k * 0.3);
        doorLight.intensity = 1.4 + k * 1.6;
      } else {
        const k = Math.min(1, (t - 6.2) / 1.8);
        doorGlow.scale.x = Math.min(1, 0.5 + k * 1.2);
        doorLight.intensity = 3.2;
        dodo.position.set(0, 0.2, -1.6 - k * 7.2);
        dodo.rotation.set(0, Math.PI, 0);
        if (rig) rig.sample(t * 2.2);
        camera.position.set(2.2 - k * 0.4, 2.0, 1.0 - k * 3.2);
        camera.lookAt(0, 1.25, dodo.position.z - 0.8);
        scene.background.lerp(new THREE.Color(0x8ed0f4), k * 0.35);
        doorGlow.material.color.lerp(new THREE.Color(0xc8ecff), k);
      }
      renderer.render(scene, camera);
      if (t >= 8) finish();
      else requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  });
}
