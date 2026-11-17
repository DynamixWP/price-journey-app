export type HouseSound = "door" | "drawer" | "lamp" | "window" | "lift" | "return" | "paper" | "shutter" | "bowl";
type Place = readonly [number, number, number];

/** Where things sound from, in the same coordinates as the 3D house. */
export const soundPlaces = {
  stove: [-2.95, .55, -1.5], window: [3.6, 1.8, -1.7], door: [0, 1.3, 3.5], church: [18.25, 12, -39.85],
  drawer: [-2.35, 1.35, -3], lamp: [1.73, 1.25, -1.76],
} as const satisfies Record<string, Place>;
const effectPlaces: Partial<Record<HouseSound, Place>> = { door: soundPlaces.door, drawer: soundPlaces.drawer, lamp: soundPlaces.lamp, window: soundPlaces.window };

/** How much of the outdoors reaches the room through each opening, and how clearly the fire is heard through the wall. */
export function roomMix(inside: boolean, windowOpen: boolean, doorOpen: boolean) {
  return {
    open: inside ? 0 : 1,
    window: inside ? (windowOpen ? .9 : .16) : 0,
    door: inside ? (doorOpen ? .75 : .05) : 0,
    fire: inside ? 1 : doorOpen ? .45 : .18,
    fireTone: inside ? 6000 : doorOpen ? 1300 : 480,
    bell: !inside || windowOpen ? 1 : doorOpen ? .55 : .3,
    reverb: inside ? .12 : .015,
  };
}

/**
 * Original synthesized foley and atmosphere, never presented as a historical recording.
 * Sounds have a place: the fire is at the stove, the valley comes in through the open window or door,
 * the bell comes from the direction of the church, and the listener is wherever the visitor stands.
 */
export class ChaletSound {
  private ctx = new AudioContext();
  private master = this.ctx.createGain(); private outdoors = this.ctx.createGain(); private air = this.ctx.createGain();
  private openAir = this.ctx.createGain(); private windowLeak = this.ctx.createGain(); private doorLeak = this.ctx.createGain();
  private fire = this.ctx.createGain(); private fireWall = this.ctx.createBiquadFilter(); private fireLevel = this.ctx.createGain(); private bellLevel = this.ctx.createGain();
  private room = this.ctx.createConvolver(); private wet = this.ctx.createGain();
  private noise: AudioBuffer; private sources: AudioBufferSourceNode[] = []; private timer: ReturnType<typeof setInterval> | null = null;
  private enabled = false; private closed = false; private inside = false; private windowOpen = false; private voice = false; private volume = .65; private beat = 0; private nextBell = 18; private nextCue = 0;
  constructor() {
    const ctx = this.ctx;
    this.master.gain.value = 0; this.master.connect(ctx.destination); this.room.connect(this.wet).connect(this.master); this.wet.gain.value = .13;
    this.noise = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate); let previous = 0; const data = this.noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) { previous = (previous + (.12 * (Math.random() * 2 - 1))) / 1.12; data[i] = previous * 2.7; }
    const impulse = ctx.createBuffer(2, ctx.sampleRate * .65, ctx.sampleRate); for (let channel = 0; channel < 2; channel++) { const samples = impulse.getChannelData(channel); for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 3) * .2; } this.room.buffer = impulse;
    // The valley: one bed of air, heard all around outside and through each opening inside.
    this.air.gain.value = .15; this.loop(650).connect(this.air).connect(this.outdoors);
    this.outdoors.connect(this.openAir).connect(this.master);
    this.outdoors.connect(this.windowLeak).connect(this.panner(soundPlaces.window, 2.5, 1)).connect(this.master);
    this.outdoors.connect(this.doorLeak).connect(this.panner(soundPlaces.door, 2.5, 1)).connect(this.master);
    // The stove: a low crackle that gets louder as the visitor walks toward it.
    this.fire.gain.value = .09; this.fireWall.type = "lowpass"; this.loop(1900).connect(this.fire).connect(this.fireWall).connect(this.fireLevel).connect(this.panner(soundPlaces.stove, 1, 1.6)).connect(this.master);
    this.bellLevel.connect(this.panner(soundPlaces.church, 40, .5)).connect(this.master);
    this.setRoom(false, false, false);
  }
  private loop(cutoff: number) { const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(); source.buffer = this.noise; source.loop = true; filter.type = "lowpass"; filter.frequency.value = cutoff; source.connect(filter); source.start(); this.sources.push(source); return filter; }
  private panner(place: Place, reference: number, rolloff: number) {
    const node = this.ctx.createPanner(); node.panningModel = "HRTF"; node.distanceModel = "inverse"; node.refDistance = reference; node.rolloffFactor = rolloff; node.maxDistance = 90;
    if (node.positionX) { node.positionX.value = place[0]; node.positionY.value = place[1]; node.positionZ.value = place[2]; } else node.setPosition(place[0], place[1], place[2]);
    return node;
  }
  /** The listener follows the visitor: position on the floor plan and the direction they face. */
  setListener(x: number, z: number, heading: number) {
    if (this.closed) return; const listener = this.ctx.listener, t = this.ctx.currentTime, forwardX = -Math.sin(heading), forwardZ = -Math.cos(heading);
    if (listener.positionX) {
      listener.positionX.setTargetAtTime(x, t, .05); listener.positionY.setTargetAtTime(1.65, t, .05); listener.positionZ.setTargetAtTime(z, t, .05);
      listener.forwardX.setTargetAtTime(forwardX, t, .05); listener.forwardY.setTargetAtTime(0, t, .05); listener.forwardZ.setTargetAtTime(forwardZ, t, .05);
      listener.upX.value = 0; listener.upY.value = 1; listener.upZ.value = 0;
    } else { listener.setPosition(x, 1.65, z); listener.setOrientation(forwardX, 0, forwardZ, 0, 1, 0); }
  }
  setRoom(inside: boolean, windowOpen: boolean, doorOpen = false) {
    this.inside = inside; this.windowOpen = windowOpen; if (this.closed) return; const t = this.ctx.currentTime, mix = roomMix(inside, windowOpen, doorOpen);
    this.openAir.gain.setTargetAtTime(mix.open, t, .5); this.windowLeak.gain.setTargetAtTime(mix.window, t, .5); this.doorLeak.gain.setTargetAtTime(mix.door, t, .5);
    this.fireLevel.gain.setTargetAtTime(mix.fire, t, .5); this.fireWall.frequency.setTargetAtTime(mix.fireTone, t, .5); this.bellLevel.gain.setTargetAtTime(mix.bell, t, .5); this.wet.gain.setTargetAtTime(mix.reverb, t, .4);
  }
  private level() { if (!this.closed) this.master.gain.setTargetAtTime(this.enabled ? this.volume * (this.voice ? .32 : .72) : 0, this.ctx.currentTime, .16); }
  async play() { if (this.closed) return; await this.ctx.resume(); this.enabled = true; this.level(); if (!this.timer) this.timer = setInterval(() => this.atmosphere(), 850); }
  async pause() { if (this.closed) return; this.enabled = false; if (this.timer) clearInterval(this.timer); this.timer = null; this.master.gain.value = 0; await this.ctx.suspend(); }
  duck(value: boolean) { this.voice = value; this.level(); }
  setVolume(value: number) { this.volume = Math.max(0, Math.min(1, value)); this.level(); }
  /** Where a sound goes: a fixed bus, or a place in the room (which also feeds the room's reverberation). */
  private route(node: AudioNode, to: AudioNode | Place | undefined, done: (cleanup: () => void) => void) {
    if (to && !("connect" in to)) { const panner = this.panner(to, 1.5, 1); node.connect(panner).connect(this.master); node.connect(this.room); done(() => panner.disconnect()); }
    else if (to) { node.connect(to); done(() => {}); }
    else { node.connect(this.master); node.connect(this.room); done(() => {}); }
  }
  private tone(frequency: number, end: number, duration: number, volume: number, pan = 0, type: OscillatorType = "sine", to?: AudioNode | Place) {
    if (!this.enabled || this.closed) return; const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(), panner = this.ctx.createStereoPanner(), t = this.ctx.currentTime;
    osc.type = type; osc.frequency.setValueAtTime(frequency, t); osc.frequency.exponentialRampToValueAtTime(Math.max(20, end), t + duration); gain.gain.setValueAtTime(.0001, t); gain.gain.linearRampToValueAtTime(volume, t + .012); gain.gain.exponentialRampToValueAtTime(.0001, t + duration); panner.pan.value = pan; osc.connect(gain).connect(panner);
    this.route(panner, to, cleanup => { osc.onended = () => { osc.disconnect(); gain.disconnect(); panner.disconnect(); cleanup(); }; }); osc.start(); osc.stop(t + duration + .02);
  }
  private rustle(freq: number, duration: number, volume: number, pan = 0, to?: AudioNode | Place) {
    if (!this.enabled || this.closed) return; const source = this.ctx.createBufferSource(), filter = this.ctx.createBiquadFilter(), gain = this.ctx.createGain(), panner = this.ctx.createStereoPanner(), t = this.ctx.currentTime;
    source.buffer = this.noise; filter.type = "bandpass"; filter.frequency.value = freq; filter.Q.value = .55; gain.gain.setValueAtTime(.0001, t); gain.gain.linearRampToValueAtTime(volume, t + .018); gain.gain.exponentialRampToValueAtTime(.0001, t + duration); panner.pan.value = pan; source.connect(filter).connect(gain).connect(panner);
    this.route(panner, to, cleanup => { source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); panner.disconnect(); cleanup(); }; }); source.start(t, Math.random() * 2, duration);
  }
  footstep(inside: boolean) { this.beat++; const vary = .88 + Math.random() * .26; this.rustle((inside ? 220 : 980) * vary, inside ? .18 : .25, (inside ? .2 : .23) * (.85 + Math.random() * .3), this.beat % 2 ? .16 : -.16); if (inside) this.tone(105 * vary, 55, .12, .05); }
  /** A far-off bell from the direction of the village church: synthesized, quiet, and muffled by closed walls. */
  private distantBell() { for (const [frequency, level] of [[392, .2], [784, .07], [1058, .03]]) this.tone(frequency, frequency * .997, 3.4, level, 0, "sine", this.bellLevel); }
  /** A short, quiet swell that marks an arrival; it is a musical cue, not a recording of anything. */
  cue() {
    if (!this.enabled || this.closed || this.ctx.currentTime < this.nextCue) return; const t = this.ctx.currentTime; this.nextCue = t + 25;
    for (const [frequency, level] of [[146.83, .028], [220, .02], [369.99, .012]]) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.frequency.value = frequency; gain.gain.setValueAtTime(.0001, t); gain.gain.linearRampToValueAtTime(level, t + 1.8); gain.gain.exponentialRampToValueAtTime(.0001, t + 6);
      osc.connect(gain).connect(this.master); gain.connect(this.room); osc.start(); osc.stop(t + 6.1); osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
  }
  effect(sound: HouseSound) {
    const at = effectPlaces[sound];
    switch (sound) {
      case "door": this.rustle(420, .6, .3, 0, at); this.tone(170, 105, .5, .045, 0, "triangle", at); break;
      case "drawer": this.rustle(700, .48, .32, 0, at); this.tone(95, 62, .1, .1, 0, "sine", at); break;
      case "window": this.rustle(550, .32, .28, 0, at); this.tone(540, 190, .08, .045, 0, "sine", at); break;
      case "lamp": this.rustle(2300, .07, .34, 0, at); break;
      case "shutter": this.rustle(2100, .055, .46); this.tone(150, 75, .09, .12); break;
      case "paper": this.rustle(1850, .4, .22); break;
      case "bowl": for (const [freq, vol] of [[780, .11], [1420, .05], [2310, .018]]) this.tone(freq, freq * .998, 1.3, vol); break;
      case "lift": this.rustle(650, .16, .1); break;
      case "return": this.rustle(340, .14, .15); this.tone(120, 70, .08, .045); break;
    }
  }
  private atmosphere() {
    if (!this.enabled) return;
    const open = !this.inside || this.windowOpen, t = this.ctx.currentTime;
    // Slow gusts keep the air from sounding like a constant hiss.
    if (Math.random() > .55) this.air.gain.setTargetAtTime(.15 * (.7 + Math.random() * .6), t, 1.4);
    if (t > this.nextBell) { this.nextBell = t + 70 + Math.random() * 80; this.distantBell(); }
    // Embers pop at the stove; birds belong to the valley and are heard through whatever is open.
    if (Math.random() > .4) this.rustle(1500 + Math.random() * 2500, .025 + Math.random() * .04, .16, 0, this.fire);
    if (open && Math.random() > .65) { const frequency = 1700 + Math.random() * 1100; this.tone(frequency, frequency * 1.35, .14, .12, Math.random() * 1.6 - .8, "sine", this.outdoors); }
  }
  dispose() { if (this.closed) return; this.closed = true; if (this.timer) clearInterval(this.timer); for (const source of this.sources) source.stop(); void this.ctx.close(); }
}
