import type { Environment } from "./alpine-places";

/** Synthesized atmosphere only. Created after an explicit sound-button gesture. */
export class ExplorationSound {
  private ctx=new AudioContext(); private master=this.ctx.createGain();
  private air=this.ctx.createGain(); private water=this.ctx.createGain(); private tone=this.ctx.createGain();
  private airFilter=this.ctx.createBiquadFilter(); private waterFilter=this.ctx.createBiquadFilter();
  private sources:(AudioBufferSourceNode|OscillatorNode)[]=[]; private noise:AudioBuffer;
  private enabled=false; private closed=false; private voice=false;
  constructor(){
    this.master.gain.value=0;this.master.connect(this.ctx.destination);
    this.airFilter.type="lowpass";this.airFilter.frequency.value=420;this.waterFilter.type="bandpass";this.waterFilter.frequency.value=1300;this.waterFilter.Q.value=.45;
    this.airFilter.connect(this.air).connect(this.master);this.waterFilter.connect(this.water).connect(this.master);this.tone.connect(this.master);
    this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*6,this.ctx.sampleRate);const samples=this.noise.getChannelData(0);let previous=0;
    for(let i=0;i<samples.length;i++){previous=(previous+(Math.random()*2-1)*.08)/1.08;samples[i]=previous*3;}
    for(const filter of [this.airFilter,this.waterFilter]){const source=this.ctx.createBufferSource();source.buffer=this.noise;source.loop=true;source.connect(filter);source.start();this.sources.push(source);}
    for(const frequency of [146.83,220,293.66]){const oscillator=this.ctx.createOscillator(),gain=this.ctx.createGain();oscillator.frequency.value=frequency;gain.gain.value=.035;oscillator.connect(gain).connect(this.tone);oscillator.start();this.sources.push(oscillator);}
    this.setPlace("valley");
  }
  setPlace(place:Environment){if(this.closed)return;const values={valley:[.12,.005,.08,500],village:[.055,.003,.06,320],chapel:[.008,0,.11,160],home:[.018,0,.055,210],stream:[.045,.24,.045,650]}[place],t=this.ctx.currentTime;
    this.air.gain.setTargetAtTime(values[0],t,.9);this.water.gain.setTargetAtTime(values[1],t,1.1);this.tone.gain.setTargetAtTime(values[2],t,1.2);this.airFilter.frequency.setTargetAtTime(values[3],t,1);
  }
  async play(){if(this.closed)return;await this.ctx.resume();this.enabled=true;this.master.gain.setTargetAtTime(this.voice?.12:.32,this.ctx.currentTime,.35);}
  async pause(){if(this.closed)return;this.enabled=false;this.master.gain.value=0;await this.ctx.suspend();}
  duck(value:boolean){this.voice=value;if(this.enabled&&!this.closed)this.master.gain.setTargetAtTime(value?.12:.32,this.ctx.currentTime,.2);}
  footstep(interior:boolean){if(!this.enabled||this.closed)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),envelope=this.ctx.createGain();source.buffer=this.noise;filter.type="lowpass";filter.frequency.value=interior?180:700;const t=this.ctx.currentTime;envelope.gain.setValueAtTime(.0001,t);envelope.gain.linearRampToValueAtTime(interior?.2:.12,t+.025);envelope.gain.exponentialRampToValueAtTime(.0001,t+.23);source.connect(filter).connect(envelope).connect(this.master);source.start(t,Math.random()*4,.25);source.onended=()=>{source.disconnect();filter.disconnect();envelope.disconnect();};}
  dispose(){if(this.closed)return;this.closed=true;this.sources.forEach(source=>source.stop());void this.ctx.close();}
}
