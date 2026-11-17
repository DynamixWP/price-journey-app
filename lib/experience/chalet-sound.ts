export type HouseSound = "door" | "drawer" | "lamp" | "window" | "lift" | "return" | "paper" | "shutter" | "bowl";

/** Original synthesized foley and atmosphere, never presented as a historical recording. */
export class ChaletSound {
  private ctx=new AudioContext();
  private master=this.ctx.createGain();private air=this.ctx.createGain();private fire=this.ctx.createGain();
  private room=this.ctx.createConvolver();private wet=this.ctx.createGain();
  private noise:AudioBuffer;private sources:AudioBufferSourceNode[]=[];private timer:ReturnType<typeof setInterval>|null=null;
  private enabled=false;private closed=false;private inside=false;private windowOpen=false;private voice=false;private volume=.65;private beat=0;
  constructor(){
    this.master.gain.value=0;this.master.connect(this.ctx.destination);this.room.connect(this.wet).connect(this.master);this.wet.gain.value=.13;
    this.noise=this.ctx.createBuffer(1,this.ctx.sampleRate*4,this.ctx.sampleRate);let previous=0;const data=this.noise.getChannelData(0);
    for(let i=0;i<data.length;i++){previous=(previous+(.12*(Math.random()*2-1)))/1.12;data[i]=previous*2.7;}
    const impulse=this.ctx.createBuffer(2,this.ctx.sampleRate*.65,this.ctx.sampleRate);for(let channel=0;channel<2;channel++){const samples=impulse.getChannelData(channel);for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,3)*.2;}this.room.buffer=impulse;
    for(const [gain,freq] of [[this.air,650],[this.fire,1900]] as const){const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter();source.buffer=this.noise;source.loop=true;filter.type="lowpass";filter.frequency.value=freq;source.connect(filter).connect(gain).connect(this.master);source.start();this.sources.push(source);}
    this.setRoom(false,false);
  }
  setRoom(inside:boolean,windowOpen:boolean){this.inside=inside;this.windowOpen=windowOpen;if(this.closed)return;const t=this.ctx.currentTime;this.air.gain.setTargetAtTime(inside?(windowOpen?.095:.025):.15,t,.7);this.fire.gain.setTargetAtTime(inside?.018:.001,t,.7);this.wet.gain.setTargetAtTime(inside?.12:.015,t,.4);}
  private level(){if(!this.closed)this.master.gain.setTargetAtTime(this.enabled?this.volume*(this.voice?.32:.72):0,this.ctx.currentTime,.16);}
  async play(){if(this.closed)return;await this.ctx.resume();this.enabled=true;this.level();if(!this.timer)this.timer=setInterval(()=>this.atmosphere(),850);}
  async pause(){if(this.closed)return;this.enabled=false;if(this.timer)clearInterval(this.timer);this.timer=null;this.master.gain.value=0;await this.ctx.suspend();}
  duck(value:boolean){this.voice=value;this.level();}
  setVolume(value:number){this.volume=Math.max(0,Math.min(1,value));this.level();}
  private tone(frequency:number,end:number,duration:number,volume:number,pan=0,type:OscillatorType="sine"){
    if(!this.enabled||this.closed)return;const osc=this.ctx.createOscillator(),gain=this.ctx.createGain(),panner=this.ctx.createStereoPanner(),t=this.ctx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(frequency,t);osc.frequency.exponentialRampToValueAtTime(Math.max(20,end),t+duration);gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.012);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);panner.pan.value=pan;osc.connect(gain).connect(panner).connect(this.master);gain.connect(this.room);osc.start();osc.stop(t+duration+.02);osc.onended=()=>{osc.disconnect();gain.disconnect();panner.disconnect();};
  }
  private rustle(freq:number,duration:number,volume:number,pan=0){
    if(!this.enabled||this.closed)return;const source=this.ctx.createBufferSource(),filter=this.ctx.createBiquadFilter(),gain=this.ctx.createGain(),panner=this.ctx.createStereoPanner(),t=this.ctx.currentTime;
    source.buffer=this.noise;filter.type="bandpass";filter.frequency.value=freq;filter.Q.value=.55;gain.gain.setValueAtTime(.0001,t);gain.gain.linearRampToValueAtTime(volume,t+.018);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);panner.pan.value=pan;source.connect(filter).connect(gain).connect(panner).connect(this.master);gain.connect(this.room);source.start(t,Math.random()*2,duration);source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();panner.disconnect();};
  }
  footstep(inside:boolean){this.beat++;this.rustle(inside?220:980,inside?.18:.25,inside?.23:.26,this.beat%2?.16:-.16);if(inside)this.tone(105,55,.12,.055);}
  effect(sound:HouseSound){
    switch(sound){
      case "door":this.rustle(420,.6,.18);this.tone(170,105,.5,.025,0,"triangle");break;
      case "drawer":this.rustle(700,.48,.19);this.tone(95,62,.1,.06);break;
      case "window":this.rustle(550,.32,.16,.7);this.tone(540,190,.08,.025);break;
      case "lamp":this.rustle(2300,.07,.2);break;
      case "shutter":this.rustle(2100,.055,.46);this.tone(150,75,.09,.12);break;
      case "paper":this.rustle(1850,.4,.22);break;
      case "bowl":for(const [freq,vol] of [[780,.11],[1420,.05],[2310,.018]])this.tone(freq,freq*.998,1.3,vol);break;
      case "lift":this.rustle(650,.16,.1);break;
      case "return":this.rustle(340,.14,.15);this.tone(120,70,.08,.045);break;
    }
  }
  private atmosphere(){if(!this.enabled)return;if(this.inside&&Math.random()>.4)this.rustle(1500+Math.random()*2500,.025+Math.random()*.04,.025);if((!this.inside||this.windowOpen)&&Math.random()>.65){const frequency=1700+Math.random()*1100;this.tone(frequency,frequency*1.35,.14,.018,Math.random()*1.6-.8);}}
  dispose(){if(this.closed)return;this.closed=true;if(this.timer)clearInterval(this.timer);for(const source of this.sources)source.stop();void this.ctx.close();}
}
