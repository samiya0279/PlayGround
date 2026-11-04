export class Soundscape {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.ambient = null;
    this.alarm = null;
    this.chase = null;
    this.ready = false;
    this.noiseBuffer = null;
    this.reverb = null;
    this.stepTimer = 0;
    this.muted = false;
  }

  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    const ctx = this.ctx;
    this.master = ctx.createGain();
    this.master.gain.value = .55;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 4;
    comp.attack.value = .01;
    comp.release.value = .3;
    this.master.connect(comp);
    comp.connect(ctx.destination);

    // simple generated room reverb
    const len = Math.floor(ctx.sampleRate * 1.9);
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.7) * .32;
      }
    }
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = .27;
    this.reverb.connect(wet);
    wet.connect(this.master);

    const noiseLen = Math.floor(ctx.sampleRate * 2);
    this.noiseBuffer = ctx.createBuffer(1, noiseLen, ctx.sampleRate);
    const noise = this.noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) noise[i] = Math.random() * 2 - 1;

    this.ready = true;
    this.startAmbient();
  }

  setMuted(value) {
    this.muted = value;
    if (this.master) this.master.gain.setTargetAtTime(value ? 0 : .55, this.ctx.currentTime, .08);
  }

  makeNoise(duration = .25, volume = .15, filterFreq = 700, type = 'bandpass') {
    if (!this.ready) return;
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    filter.Q.value = .8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + duration);
    src.connect(filter); filter.connect(g); g.connect(this.master);
    if (this.reverb) g.connect(this.reverb);
    src.start();
    src.stop(ctx.currentTime + duration + .02);
  }

  tone(freq = 440, duration = .2, volume = .08, type = 'sine', slide = 0, delay = 0) {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), now + duration);
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(volume, now + .012);
    g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    o.connect(g); g.connect(this.master);
    if (this.reverb) g.connect(this.reverb);
    o.start(now); o.stop(now + duration + .04);
  }

  startAmbient() {
    if (!this.ready || this.ambient) return;
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = .13;
    bus.connect(this.master);
    if (this.reverb) bus.connect(this.reverb);

    // low factory drone
    const drone = ctx.createOscillator();
    drone.type = 'sawtooth';
    drone.frequency.value = 43;
    const drone2 = ctx.createOscillator();
    drone2.type = 'sine';
    drone2.frequency.value = 65.2;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 140;
    filter.Q.value = 2;
    const dg = ctx.createGain();
    dg.gain.value = .075;
    drone.connect(filter); drone2.connect(filter);
    filter.connect(dg); dg.connect(bus);
    drone.start(); drone2.start();

    // airy room noise
    const air = ctx.createBufferSource();
    air.buffer = this.noiseBuffer;
    air.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass'; bp.frequency.value = 340; bp.Q.value = .5;
    const ag = ctx.createGain(); ag.gain.value = .024;
    air.connect(bp); bp.connect(ag); ag.connect(bus);
    air.start();

    const lfo = ctx.createOscillator();
    lfo.frequency.value = .08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = .018;
    lfo.connect(lfoGain); lfoGain.connect(dg.gain);
    lfo.start();

    this.ambient = { bus, drone, drone2, air, lfo };
  }

  stopAmbient() {
    if (!this.ambient) return;
    const a = this.ambient;
    try { a.bus.gain.setTargetAtTime(0, this.ctx.currentTime, .5); } catch { }
    setTimeout(() => {
      try { a.drone.stop(); a.drone2.stop(); a.air.stop(); a.lfo.stop(); } catch { }
    }, 1200);
    this.ambient = null;
  }

  footstep(sprint = false) {
    if (!this.ready) return;
    this.makeNoise(sprint ? .13 : .18, sprint ? .13 : .075, sprint ? 240 : 160, 'lowpass');
    this.tone(sprint ? 76 : 60, .08, .035, 'sine', -20);
  }

  pickup() {
    this.tone(620, .11, .06, 'sine', 220);
    this.tone(940, .18, .045, 'triangle', 260, .08);
  }

  tape() {
    this.tone(180, .18, .05, 'square', 20);
    this.makeNoise(.1, .04, 1500, 'highpass');
    this.tone(440, .4, .035, 'sine', -120, .12);
  }

  interact() {
    this.tone(230, .06, .04, 'square', 90);
    this.makeNoise(.06, .025, 2000, 'highpass');
  }

  denied() {
    this.tone(130, .15, .07, 'square', -20);
    this.tone(110, .2, .05, 'square', -20, .13);
  }

  insertFuse() {
    this.tone(300, .12, .09, 'square', 340);
    this.makeNoise(.09, .07, 1200, 'bandpass');
    this.tone(1100, .3, .035, 'sine', -150, .1);
  }

  powerOn() {
    if (!this.ready) return;
    this.makeNoise(.7, .11, 400, 'lowpass');
    const notes = [110, 164.8, 220, 329.6];
    notes.forEach((n, i) => this.tone(n, .8, .05, 'triangle', 0, i * .11));
    this.tone(55, 1.4, .13, 'sawtooth', 20, 0);
    setTimeout(() => this.startPowerHum(), 300);
    setTimeout(() => this.stopAlarm(), 400);
  }

  startPowerHum() {
    if (!this.ready || this.powerHum) return;
    const ctx = this.ctx;
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 100;
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 260;
    const g = ctx.createGain(); g.gain.value = 0;
    g.gain.setTargetAtTime(.035, ctx.currentTime, 1.2);
    o.connect(f); f.connect(g); g.connect(this.master);
    if (this.reverb) g.connect(this.reverb);
    o.start();
    this.powerHum = { o, g, f };
  }

  glassBreak() {
    if (!this.ready) return;
    this.makeNoise(.55, .18, 3800, 'highpass');
    for (let i = 0; i < 7; i++) this.tone(1200 + Math.random() * 2400, .1 + Math.random() * .2, .018, 'triangle', -400, i * .025);
  }

  door(intensity = 1) {
    this.makeNoise(.7, .12 * intensity, 190, 'lowpass');
    this.tone(52, .45, .1 * intensity, 'sawtooth', -18);
    this.tone(38, .7, .06 * intensity, 'sine', -10);
  }

  roar() {
    if (!this.ready) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;
    const g = ctx.createGain();
    g.gain.setValueAtTime(.0001, now);
    g.gain.exponentialRampToValueAtTime(.24, now + .1);
    g.gain.exponentialRampToValueAtTime(.0001, now + 1.8);
    g.connect(this.master); if (this.reverb) g.connect(this.reverb);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass'; filter.frequency.setValueAtTime(400, now);
    filter.frequency.exponentialRampToValueAtTime(1200, now + .5);
    filter.connect(g);
    for (const detune of [0, 7, -5]) {
      const o = ctx.createOscillator();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(82 + detune, now);
      o.frequency.exponentialRampToValueAtTime(46 + detune, now + 1.4);
      o.connect(filter); o.start(now); o.stop(now + 1.85);
    }
    const growl = ctx.createBufferSource();
    growl.buffer = this.noiseBuffer;
    const nf = ctx.createBiquadFilter(); nf.type = 'bandpass'; nf.frequency.value = 320;
    const ng = ctx.createGain(); ng.gain.value = .15;
    growl.connect(nf); nf.connect(ng); ng.connect(g);
    growl.start(now); growl.stop(now + 1.8);
  }

  startAlarm() {
    if (!this.ready || this.alarm) return;
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = .0001;
    bus.gain.setTargetAtTime(.055, ctx.currentTime, .3);
    bus.connect(this.master);
    if (this.reverb) bus.connect(this.reverb);
    const o = ctx.createOscillator();
    o.type = 'sawtooth'; o.frequency.value = 540;
    const lfo = ctx.createOscillator();
    lfo.type = 'sine'; lfo.frequency.value = .62;
    const depth = ctx.createGain(); depth.gain.value = 190;
    lfo.connect(depth); depth.connect(o.frequency);
    const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 1500;
    o.connect(f); f.connect(bus);
    o.start(); lfo.start();
    this.alarm = { bus, o, lfo };
  }

  stopAlarm() {
    if (!this.alarm) return;
    const a = this.alarm;
    try { a.bus.gain.setTargetAtTime(0, this.ctx.currentTime, .5); } catch { }
    setTimeout(() => { try { a.o.stop(); a.lfo.stop(); } catch { } }, 1600);
    this.alarm = null;
  }

  startChase() {
    if (!this.ready || this.chase) return;
    this.startAlarm();
    const ctx = this.ctx;
    const bus = ctx.createGain();
    bus.gain.value = .0001;
    bus.gain.setTargetAtTime(.055, ctx.currentTime, .5);
    bus.connect(this.master);
    if (this.reverb) bus.connect(this.reverb);

    const pulse = ctx.createOscillator();
    pulse.type = 'triangle'; pulse.frequency.value = 55;
    const lfo = ctx.createOscillator();
    lfo.type = 'square'; lfo.frequency.value = 3.1;
    const lg = ctx.createGain(); lg.gain.value = .8;
    const pg = ctx.createGain(); pg.gain.value = .5;
    lfo.connect(lg); lg.connect(pg.gain);
    pulse.connect(pg); pg.connect(bus);
    pulse.start(); lfo.start();

    const high = ctx.createOscillator();
    high.type = 'sawtooth'; high.frequency.value = 146.8;
    const hg = ctx.createGain(); hg.gain.value = .009;
    high.connect(hg); hg.connect(bus);
    high.start();
    this.chase = { bus, pulse, high, lfo };
  }

  stopChase() {
    this.stopAlarm();
    if (!this.chase) return;
    const c = this.chase;
    try { c.bus.gain.setTargetAtTime(0, this.ctx.currentTime, .4); } catch { }
    setTimeout(() => { try { c.pulse.stop(); c.high.stop(); c.lfo.stop(); } catch { } }, 1000);
    this.chase = null;
  }

  heartbeat(intensity = 1) {
    this.tone(52, .11, .075 * intensity, 'sine', -12);
    this.tone(44, .16, .05 * intensity, 'sine', -8, .18);
  }

  whisper() {
    this.makeNoise(.8, .022, 900, 'bandpass');
    this.tone(310, 1.2, .012, 'sine', -60);
  }

  win() {
    if (!this.ready) return;
    this.stopChase();
    const notes = [220, 277.2, 329.6, 440, 554.4];
    notes.forEach((n, i) => this.tone(n, 1.5, .04, 'sine', 0, i * .18));
    this.tone(110, 3, .07, 'triangle', 0, 0);
  }

  lose() {
    if (!this.ready) return;
    this.stopChase();
    this.roar();
    this.makeNoise(1.2, .22, 240, 'lowpass');
    this.tone(70, 1.6, .13, 'sawtooth', -30);
  }
}
