/** Original synthesized score and environment textures. No field recordings. */
export class AmbientScore {
  private context = new AudioContext();
  private master = this.context.createGain();
  private music = this.context.createGain();
  private wind = this.context.createGain();
  private water = this.context.createGain();
  private windFilter = this.context.createBiquadFilter();
  private waterFilter = this.context.createBiquadFilter();
  private delay = this.context.createDelay(2);
  private voices = new Set<OscillatorNode>();
  private textures: AudioBufferSourceNode[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private playing = false;
  private disposed = false;
  private scene = 0;
  private intensity = 0;
  private step = 0;
  private volume = .35;
  private ducked = false;

  constructor() {
    this.master.gain.value = 0; this.master.connect(this.context.destination);
    this.music.gain.value = .8; this.music.connect(this.master);
    this.delay.delayTime.value = .71;
    const feedback = this.context.createGain(); feedback.gain.value = .24;
    const wet = this.context.createGain(); wet.gain.value = .23;
    this.music.connect(this.delay); this.delay.connect(feedback).connect(this.delay); this.delay.connect(wet).connect(this.master);
    this.windFilter.type = "bandpass"; this.windFilter.frequency.value = 440; this.windFilter.Q.value = .35;
    this.waterFilter.type = "lowpass"; this.waterFilter.frequency.value = 1200;
    this.wind.gain.value = .018; this.water.gain.value = 0;
    this.windFilter.connect(this.wind).connect(this.master);
    this.waterFilter.connect(this.water).connect(this.master);
    const buffer = this.context.createBuffer(1, this.context.sampleRate * 8, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    let previous = 0;
    for (let i = 0; i < data.length; i++) { previous = (previous + (Math.random() * 2 - 1) * .025) / 1.025; data[i] = previous * 4; }
    [this.windFilter, this.waterFilter].forEach((filter) => { const source = this.context.createBufferSource(); source.buffer = buffer; source.loop = true; source.connect(filter); source.start(); this.textures.push(source); });
    const tide = this.context.createOscillator(); tide.frequency.value = .075;
    const depth = this.context.createGain(); depth.gain.value = 230;
    tide.connect(depth).connect(this.waterFilter.frequency); tide.start(); this.voices.add(tide);
  }

  private note(frequency: number, at: number, duration: number, gain: number, type: OscillatorType = "sine") {
    const voice = this.context.createOscillator(); const envelope = this.context.createGain();
    voice.type = type; voice.frequency.value = frequency;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(gain, at + Math.min(2.6, duration / 5));
    envelope.gain.exponentialRampToValueAtTime(.00001, at + duration);
    voice.connect(envelope).connect(this.music); voice.start(at); voice.stop(at + duration + .1);
    this.voices.add(voice);
    voice.onended = () => { this.voices.delete(voice); voice.disconnect(); envelope.disconnect(); };
  }

  private phrase() {
    if (this.disposed) return;
    const now = this.context.currentTime;
    const palettes = [[146.83, 220, 293.66, 440], [130.81, 196, 261.63, 392], [174.61, 220, 349.23, 440]];
    const notes = palettes[this.scene];
    notes.slice(0, 3).forEach((frequency, i) => this.note(frequency, now + i * .18, 16, .035));
    this.note(notes[(this.step++) % 4] * 2, now + 2, 7, .015, "triangle");
    this.note(notes[(this.step + 1) % 4], now + 6, 7, .012);
  }

  setScene(index: number, intensity = 0) {
    if (this.disposed) return;
    const changed = index !== this.scene;
    if (!changed && Math.abs(intensity - this.intensity) < .025) return;
    this.scene = Math.max(0, Math.min(2, index)); this.intensity = intensity;
    const time = this.context.currentTime;
    this.wind.gain.setTargetAtTime(index === 0 ? .06 : index === 1 ? .025 : .009, time, 1.8);
    this.water.gain.setTargetAtTime(index === 1 ? .09 : .004, time, 2);
    this.windFilter.frequency.setTargetAtTime(index === 0 ? 350 + intensity * 500 : 270, time, 1);
    this.music.gain.setTargetAtTime(.75 + intensity * .25, time, 1.5);
    if (changed && this.playing) { if (this.timer) clearInterval(this.timer); this.phrase(); this.timer = setInterval(() => this.phrase(), 11000); }
  }

  async play() {
    if (this.disposed) return;
    await this.context.resume();
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.setTargetAtTime(this.volume * (this.ducked ? .27 : 1), this.context.currentTime, .65);
    if (!this.playing) { this.playing = true; this.phrase(); this.timer = setInterval(() => this.phrase(), 11000); }
  }
  async pause() {
    if (this.disposed) return;
    this.playing = false;
    if (this.timer) clearInterval(this.timer); this.timer = null;
    this.master.gain.cancelScheduledValues(this.context.currentTime);
    this.master.gain.value = 0;
    await this.context.suspend();
  }
  setVolume(value: number) { this.volume = value; if (!this.disposed && this.playing) this.master.gain.setTargetAtTime(value * (this.ducked ? .27 : 1), this.context.currentTime, .15); }
  setDucking(speaking: boolean) { this.ducked = speaking; if (!this.disposed && this.playing) this.master.gain.setTargetAtTime(this.volume * (speaking ? .27 : 1), this.context.currentTime, speaking ? .2 : .8); }
  dispose() {
    if (this.disposed) return; this.disposed = true;
    if (this.timer) clearInterval(this.timer);
    this.textures.forEach((source) => source.stop()); this.voices.forEach((voice) => { try { voice.stop(); } catch { /* Already finished. */ } });
    void this.context.close();
  }
}
