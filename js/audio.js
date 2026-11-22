// All SFX / ambience are generated with WebAudio; background music uses bundled MP3s (see js/music.js).
// Audio starts on the first user gesture (browser autoplay rules).
import { SAVE_KEY } from './config.js';
import { TRACKS, songOf } from './music.js';

export class AudioSys {
  constructor() {
    this.ctx = null; this.ready = false;
    const s = JSON.parse(localStorage.getItem(SAVE_KEY + '.audio') || 'null');
    this.set = Object.assign({ master: 0.8, music: 0.6, sfx: 0.9, muted: false }, s || {});
    this.voices = []; this.timers = { horn: 3, brake: 6, chime: 8, siren: 15 };
    this.station = 0; this.stationTarget = 0; this.intensity = 0; this.track = null;
    this.musicEls = {}; this.musicSrc = {}; this.musicWanted = false; this.fadeT = null;
  }
  save() { localStorage.setItem(SAVE_KEY + '.audio', JSON.stringify(this.set)); }
  // call from a user gesture
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const c = this.ctx = new AC();
      this.out = c.createGain();
      this.comp = c.createDynamicsCompressor(); this.comp.threshold.value = -14; this.comp.ratio.value = 4;
      this.out.connect(this.comp); this.comp.connect(c.destination);
      this.sfxBus = c.createGain(); this.sfxBus.connect(this.out);
      this.ambBus = c.createGain(); this.ambBus.gain.value = 0.9; this.ambBus.connect(this.out);
      this.musicBus = c.createGain(); this.musicFilter = c.createBiquadFilter(); this.musicFilter.type = 'lowpass'; this.musicFilter.frequency.value = 22000;
      this.musicBus.connect(this.musicFilter); this.musicFilter.connect(this.out);
      this._hookMusicEls();
      // noise buffers
      const mk = (brown) => { const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } else d[i] = w; } return b; };
      this.white = mk(false); this.brown = mk(true);
      this.applyVolumes(); this.startAmbience(); this.ready = true;
    }
    if (this.ctx.state !== 'running') this.ctx.resume();
    if (this.musicWanted) this.playMusic(this.track);
  }
  applyVolumes() {
    if (!this.ctx) return;
    const m = this.set.muted ? 0 : this.set.master, t = this.ctx.currentTime;
    this.out.gain.setTargetAtTime(m, t, 0.05);
    this.musicBus.gain.setTargetAtTime(this.set.music * 0.8, t, 0.1);
    this.sfxBus.gain.setTargetAtTime(this.set.sfx, t, 0.05);
    this.ambBus.gain.setTargetAtTime(this.set.sfx * 0.9, t, 0.1);
    this.save();
  }
  setVol(k, v) { this.set[k] = v; this.applyVolumes(); }
  toggleMute() { this.set.muted = !this.set.muted; this.applyVolumes(); return this.set.muted; }

  // ---------------- music (keyed tracks, fade in/out, respects mute)
  _el(key) {
    if (this.musicEls[key]) return this.musicEls[key];
    const t = TRACKS[key] || TRACKS[songOf('menu')];
    const a = new Audio(t.file); a.loop = true; a.preload = 'auto'; a.crossOrigin = 'anonymous'; a.volume = 0;
    this.musicEls[key] = a; if (this.ctx) this._hookMusicEls(); return a;
  }
  _hookMusicEls() {
    if (!this.ctx) return;
    for (const [k, a] of Object.entries(this.musicEls)) {
      if (this.musicSrc[k]) continue;
      try { this.musicSrc[k] = this.ctx.createMediaElementSource(a); this.musicSrc[k].connect(this.musicBus); } catch (e) { /* already connected */ }
    }
  }
  playMusic(key = 'menu') {
    // accept a legacy 0/1 index from older levels
    if (key === 0 || key === 1 || key === '0' || key === '1') key = key == 1 || key === '1' ? 'ratintin' : 'toussesali';
    if (!TRACKS[key]) key = songOf(key) || 'toussesali';
    this.musicWanted = true;
    if (this.track === key) { if (this.ctx) { const a = this._el(key); if (a.paused) a.play().catch(() => {}); } return; }
    const prev = this.track; this.track = key;
    if (!this.ctx) return;
    const next = this._el(key); this._hookMusicEls();
    const now = this.ctx.currentTime;
    // fade the bus down then up while swapping elements
    if (this.musicBus) {
      this.musicBus.gain.cancelScheduledValues(now);
      this.musicBus.gain.setTargetAtTime(0.0001, now, 0.08);
      this.musicBus.gain.setTargetAtTime(this.set.muted ? 0 : this.set.music * 0.8, now + 0.35, 0.12);
    }
    if (prev && this.musicEls[prev] && prev !== key) { try { this.musicEls[prev].pause(); this.musicEls[prev].currentTime = 0; } catch (e) {} }
    next.volume = 1; const p = next.play(); if (p && p.catch) p.catch(() => {});
  }
  stopMusic() { this.musicWanted = false; for (const a of Object.values(this.musicEls)) { try { a.pause(); } catch (e) {} } }
  muffle(on) { if (this.ctx) this.musicFilter.frequency.setTargetAtTime(on ? 700 : 22000, this.ctx.currentTime, 0.08); }
  duck(on) { if (this.ctx) this.musicBus.gain.setTargetAtTime(on ? this.set.music * 0.15 : this.set.music * 0.8, this.ctx.currentTime, 0.15); }

  // ---------------- primitives
  tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.2, vol = 0.3, at = 0, attack = 0.005, bus = this.sfxBus, pan = 0 }) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime + at;
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let n = o; o.connect(g); n = g; if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; }
    n.connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  noise({ f0 = 1000, f1 = null, q = 1, type = 'bandpass', dur = 0.3, vol = 0.3, at = 0, attack = 0.01, brown = false, pan = 0, bus = this.sfxBus }) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime + at;
    const s = c.createBufferSource(); s.buffer = brown ? this.brown : this.white; s.loop = true;
    const f = c.createBiquadFilter(); f.type = type; f.Q.value = q; f.frequency.setValueAtTime(f0, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + attack); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); let n = g; if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; }
    n.connect(bus); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  // ---------------- SFX
  jump() { this.tone({ type: 'square', f0: 260, f1: 620, dur: 0.18, vol: 0.12 }); this.noise({ f0: 500, f1: 1800, dur: 0.2, vol: 0.12, q: 0.8 }); }
  land() { this.noise({ f0: 300, f1: 120, type: 'lowpass', dur: 0.12, vol: 0.25, brown: true }); this.tone({ type: 'sine', f0: 120, f1: 60, dur: 0.12, vol: 0.2 }); }
  slide() { this.noise({ f0: 2500, f1: 500, dur: 0.45, vol: 0.2, q: 1.2 }); this.tone({ type: 'triangle', f0: 400, f1: 150, dur: 0.3, vol: 0.06 }); }
  lane(dir) { this.noise({ f0: 900, f1: 2400, dur: 0.14, vol: 0.12, q: 1.5, pan: dir * 0.5 }); }
  coin(combo = 0) { const k = Math.min(combo, 8), f = 988 * Math.pow(1.0595, k * 2); this.tone({ type: 'square', f0: f, dur: 0.07, vol: 0.1 }); this.tone({ type: 'square', f0: f * 1.5, dur: 0.22, vol: 0.1, at: 0.06 }); this.tone({ type: 'sine', f0: f * 3, dur: 0.2, vol: 0.04, at: 0.06 }); }
  stumble() { this.noise({ f0: 400, f1: 80, type: 'lowpass', dur: 0.35, vol: 0.5, brown: true }); this.tone({ type: 'sawtooth', f0: 200, f1: 70, dur: 0.35, vol: 0.18 }); this.tone({ type: 'sine', f0: 90, f1: 40, dur: 0.3, vol: 0.4 });
    // guard whistle
    for (let i = 0; i < 3; i++) this.tone({ type: 'sine', f0: 2600 + i * 80, f1: 2900, dur: 0.12, vol: 0.07, at: 0.25 + i * 0.16 }); }
  crash() { this.noise({ f0: 2500, f1: 100, type: 'lowpass', dur: 0.9, vol: 0.8, brown: false }); this.noise({ f0: 200, f1: 50, type: 'lowpass', dur: 1.1, vol: 0.9, brown: true }); this.tone({ type: 'sine', f0: 110, f1: 28, dur: 0.9, vol: 0.7 }); this.tone({ type: 'square', f0: 300, f1: 60, dur: 0.4, vol: 0.12 }); }
  gameOver() { [392, 330, 262, 196].forEach((f, i) => this.tone({ type: 'triangle', f0: f, dur: 0.45, vol: 0.2, at: 0.25 + i * 0.28 })); this.tone({ type: 'sawtooth', f0: 98, dur: 1.2, vol: 0.1, at: 1.35 }); }
  fanfare() { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => { this.tone({ type: 'square', f0: f, dur: 0.22, vol: 0.12, at: i * 0.13 }); this.tone({ type: 'triangle', f0: f / 2, dur: 0.22, vol: 0.12, at: i * 0.13 }); }); }
  splash() { this.noise({ f0: 3200, f1: 700, type: 'bandpass', dur: 0.4, vol: 0.32, q: 0.7 }); this.noise({ f0: 600, f1: 200, type: 'lowpass', dur: 0.3, vol: 0.2, brown: true }); }
  click() { this.tone({ type: 'square', f0: 700, f1: 900, dur: 0.06, vol: 0.08 }); }
  count(go) { this.tone({ type: 'square', f0: go ? 880 : 440, dur: go ? 0.35 : 0.14, vol: 0.14 }); }
  caught() { this.tone({ type: 'sawtooth', f0: 150, f1: 60, dur: 0.6, vol: 0.25 }); for (let i = 0; i < 4; i++) this.tone({ type: 'sine', f0: 2700, f1: 3000, dur: 0.1, vol: 0.08, at: i * 0.14 }); }
  levelStart() { this.tone({ type: 'sine', f0: 523, dur: 0.3, vol: 0.12 }); }

  // ---------------- ambience
  startAmbience() {
    const c = this.ctx, mkLoop = (buf, type, f, q, gain) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const g = c.createGain(); g.gain.value = gain; s.connect(fl); fl.connect(g); g.connect(this.ambBus); s.start(); return { s, fl, g }; };
    this.traffic = mkLoop(this.brown, 'lowpass', 450, 0.7, 0.3);
    this.trafficHi = mkLoop(this.white, 'bandpass', 1400, 0.4, 0.02);
    // metro station hum: low drone + air-conditioning hiss + reverb-ish rumble
    this.hum = mkLoop(this.brown, 'lowpass', 160, 1, 0);
    this.hiss = mkLoop(this.white, 'highpass', 5000, 0.3, 0);
    const o1 = c.createOscillator(), o2 = c.createOscillator(), og = c.createGain(); o1.type = 'sawtooth'; o2.type = 'sawtooth'; o1.frequency.value = 50; o2.frequency.value = 100.6;
    const of = c.createBiquadFilter(); of.type = 'lowpass'; of.frequency.value = 220; og.gain.value = 0; o1.connect(of); o2.connect(of); of.connect(og); og.connect(this.ambBus); o1.start(); o2.start(); this.droneGain = og;
  }
  setScene({ station = 0, intensity = 0 }) { this.stationTarget = station; this.intensity = intensity; }
  updateAmbience(dt, camPos, speed) {
    if (!this.ready) return; const c = this.ctx, t = c.currentTime;
    this.station += (this.stationTarget - this.station) * Math.min(1, dt * 1.5);
    const st = this.station;
    this.traffic.g.gain.setTargetAtTime(0.06 * (1 - st * 0.65) + 0.01 * (speed / 20), t, 0.2);
    this.trafficHi.g.gain.setTargetAtTime(0.006 * (1 - st * 0.7), t, 0.2);
    this.hum.g.gain.setTargetAtTime(0.15 * st, t, 0.2); this.hiss.g.gain.setTargetAtTime(0.003 * st, t, 0.2); this.droneGain.gain.setTargetAtTime(0.028 * st, t, 0.2);
    // listener at camera
    const L = c.listener; if (L.positionX) { L.positionX.value = camPos.x; L.positionY.value = camPos.y; L.positionZ.value = camPos.z; L.forwardX.value = 0; L.forwardY.value = -0.2; L.forwardZ.value = -1; L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0; }
    // random city events
    for (const k of Object.keys(this.timers)) this.timers[k] -= dt;
    if (this.timers.horn < 0) { this.timers.horn = 3 + Math.random() * 6; if (st < 0.6) this.carHorn((Math.random() - 0.5) * 1.6, 0.05 + Math.random() * 0.05); }
    if (this.timers.brake < 0) { this.timers.brake = 6 + Math.random() * 8; if (st < 0.8) this.airBrake((Math.random() - 0.5) * 1.6); }
    if (this.timers.chime < 0) { this.timers.chime = 10 + Math.random() * 8; if (st > 0.6) this.stationChime(); }
    if (this.timers.siren < 0) { this.timers.siren = 20 + Math.random() * 20; if (st < 0.5) this.distantSiren(); }
  }
  carHorn(pan = 0, vol = 0.07) { const f = 380 + Math.random() * 120, d = 0.25 + Math.random() * 0.35; this.tone({ type: 'sawtooth', f0: f, dur: d, vol, pan, attack: 0.02, bus: this.ambBus }); this.tone({ type: 'sawtooth', f0: f * 1.26, dur: d, vol: vol * 0.8, pan, attack: 0.02, bus: this.ambBus });
    if (Math.random() < 0.4) { this.tone({ type: 'sawtooth', f0: f, dur: 0.2, vol, at: d + 0.1, pan, bus: this.ambBus }); this.tone({ type: 'sawtooth', f0: f * 1.26, dur: 0.2, vol: vol * 0.8, at: d + 0.1, pan, bus: this.ambBus }); } }
  airBrake(pan = 0) { this.noise({ f0: 6000, f1: 3000, type: 'highpass', dur: 0.9, vol: 0.1, attack: 0.02, pan, bus: this.ambBus }); }
  stationChime() { [659, 523, 659].forEach((f, i) => { this.tone({ type: 'sine', f0: f, dur: 1.0, vol: 0.09, at: i * 0.5, attack: 0.01, bus: this.ambBus }); this.tone({ type: 'sine', f0: f * 2, dur: 0.6, vol: 0.025, at: i * 0.5, bus: this.ambBus }); }); }
  distantSiren() { const p = (Math.random() - 0.5) * 1.6; for (let i = 0; i < 4; i++) this.tone({ type: 'sine', f0: i % 2 ? 640 : 860, dur: 0.45, vol: 0.025, at: i * 0.5, pan: p, bus: this.ambBus }); }
  whoosh(pan, big = 1, f = 1.0) { this.noise({ f0: 400 * f, f1: 1800 * f, q: 0.9, dur: 0.5 * big, vol: 0.22 * Math.min(1.4, big), pan, attack: 0.12 * big, bus: this.ambBus }); this.noise({ f0: 1800 * f, f1: 300 * f, q: 0.9, dur: 0.6 * big, vol: 0.2 * Math.min(1.4, big), pan, at: 0.1, attack: 0.05, bus: this.ambBus }); }

  powerup(kind = 'fly') {
    const map = {
      fly: [[784, 0], [988, 0.08], [1175, 0.16], [1568, 0.28]],
      superjump: [[392, 0], [523, 0.07], [784, 0.16]],
      speed: [[523, 0], [659, 0.05], [784, 0.1], [1047, 0.18]],
      magnet: [[440, 0], [554, 0.08], [659, 0.16], [880, 0.26]],
      shield: [[330, 0], [415, 0.1], [523, 0.2], [330, 0.35]],
    };
    const notes = map[kind] || map.fly;
    for (const [f, at] of notes) this.tone({ type: 'square', f0: f, dur: 0.16, vol: 0.14, at });
    this.tone({ type: 'sine', f0: 1320, f1: 880, dur: 0.28, vol: 0.06, at: 0.08 });
  }
  labSiren() {
    this.stopSiren();
    if (!this.ready) return;
    const c = this.ctx, t = c.currentTime;
    const o = c.createOscillator(), o2 = c.createOscillator(), g = c.createGain();
    o.type = 'sawtooth'; o2.type = 'sine'; o.frequency.value = 620; o2.frequency.value = 780;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.08);
    o.connect(g); o2.connect(g); g.connect(this.sfxBus);
    o.start(t); o2.start(t);
    // sweep 620↔860 like a rotating alarm
    for (let i = 0; i < 16; i++) {
      const tt = t + i * 0.45;
      o.frequency.setValueAtTime(i % 2 ? 860 : 620, tt);
      o2.frequency.setValueAtTime(i % 2 ? 980 : 740, tt);
    }
    this._siren = { o, o2, g };
  }
  stopSiren() {
    if (!this._siren || !this.ctx) { this._siren = null; return; }
    const t = this.ctx.currentTime, { o, o2, g } = this._siren;
    try { g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15); o.stop(t + 0.2); o2.stop(t + 0.2); } catch (e) {}
    this._siren = null;
  }
  labHum(on) {
    if (!this.ready) return;
    if (on) {
      if (this._labHum) return;
      const c = this.ctx, o = c.createOscillator(), f = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = 55; f.type = 'lowpass'; f.frequency.value = 180; g.gain.value = 0.05;
      o.connect(f); f.connect(g); g.connect(this.sfxBus); o.start();
      this._labHum = { o, g };
    } else if (this._labHum) {
      const t = this.ctx.currentTime;
      try { this._labHum.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2); this._labHum.o.stop(t + 0.25); } catch (e) {}
      this._labHum = null;
    }
  }

  // ---------------- positional vehicle voices (tied to obstacles)
  createVoice(kind) {
    if (!this.ready) return null; const c = this.ctx;
    const pan = c.createPanner(); pan.panningModel = 'HRTF'; pan.distanceModel = 'inverse'; pan.refDistance = kind === 'car' ? 5 : 9; pan.rolloffFactor = 1.4; pan.maxDistance = 400;
    const g = c.createGain(); g.gain.value = 0; pan.connect(g); g.connect(this.ambBus);
    const nodes = [];
    const loopSrc = (buf, type, f, q, gain) => { const s = c.createBufferSource(); s.buffer = buf; s.loop = true; const fl = c.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gg = c.createGain(); gg.gain.value = gain; s.connect(fl); fl.connect(gg); gg.connect(pan); s.start(0, Math.random() * 1.5); nodes.push(s); return { s, fl, gg }; };
    const osc = (type, f, gain, filt) => { const o = c.createOscillator(); o.type = type; o.frequency.value = f; const gg = c.createGain(); gg.gain.value = gain; o.connect(filt || gg); if (filt) { filt.connect(gg); } gg.connect(pan); o.start(); nodes.push(o); return { o, gg }; };
    const v = { kind, pan, g, nodes, age: 0, hornCool: 0 };
    if (kind === 'train') { loopSrc(this.brown, 'lowpass', 220, 1, 1.5); const w = loopSrc(this.white, 'bandpass', 1800, 0.6, 0.0); v.clack = w; const lfo = c.createOscillator(); lfo.frequency.value = 7; const lg = c.createGain(); lg.gain.value = 0.18; lfo.connect(lg); lg.connect(w.gg.gain); w.gg.gain.value = 0.2; lfo.start(); nodes.push(lfo); osc('sawtooth', 42, 0.18, (() => { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 160; return f; })()); }
    else if (kind === 'bus') { loopSrc(this.brown, 'lowpass', 300, 1, 1.0); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260; const o = osc('sawtooth', 58, 0.35, f); v.engine = o; }
    else { loopSrc(this.brown, 'lowpass', 500, 1, 0.5); const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; const o = osc('sawtooth', 95, 0.12, f); v.engine = o; }
    v.setPos = (p) => { if (pan.positionX) { pan.positionX.value = p.x; pan.positionY.value = p.y; pan.positionZ.value = p.z; } };
    v.horn = () => {
      if (v.hornCool > 0) return; v.hornCool = 4; const t = c.currentTime;
      const freqs = kind === 'train' ? [311, 392, 466] : kind === 'bus' ? [220, 277] : [420, 530];
      const dur = kind === 'train' ? 1.5 : 0.7;
      for (const f of freqs) { const o = c.createOscillator(), gg = c.createGain(); o.type = 'sawtooth'; o.frequency.value = f; gg.gain.setValueAtTime(0.0001, t); gg.gain.exponentialRampToValueAtTime(kind === 'train' ? 0.35 : 0.22, t + 0.05); gg.gain.setValueAtTime(kind === 'train' ? 0.35 : 0.22, t + dur - 0.2); gg.gain.exponentialRampToValueAtTime(0.0001, t + dur);
        const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = 1800; o.connect(fl); fl.connect(gg); gg.connect(pan); o.start(t); o.stop(t + dur + 0.05); }
    };
    v.gainTarget = (x) => g.gain.setTargetAtTime(x, c.currentTime, 0.15);
    v.stop = () => { g.gain.setTargetAtTime(0, c.currentTime, 0.1); setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch (e) { /* */ } }); try { g.disconnect(); pan.disconnect(); } catch (e) { /* */ } }, 400); };
    return v;
  }
}
