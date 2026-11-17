"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, ArrowsClockwise, Compass, Headphones, Pause, Play, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import type { ChaletEngine, ChaletState } from "@/lib/experience/chalet-engine";
import { chaletObjects, tourStops } from "@/lib/experience/chalet-layout";
import { ExplorationSound } from "@/lib/experience/exploration-sound";
import narration from "@/lib/experience/chalet-manifest.json";
import styles from "./chalet-walk.module.css";

type Props={open:boolean;suspended:boolean;motion:boolean;fromVillage:boolean;onClose:()=>void;onDocumentary:()=>void;onMap:()=>void;onPhoto:()=>void;onVoice:(value:boolean)=>void};
const initialState:ChaletState={mode:"guided",walking:false,paused:false,stop:0,doorOpen:false,inside:false,held:null,near:null,reachable:[],position:{x:2.8,z:8.5},examined:[]};

export function ChaletWalk({open,suspended,motion,fromVillage,onClose,onDocumentary,onMap,onPhoto,onVoice}:Props){
  const host=useRef<HTMLDivElement>(null),engine=useRef<ChaletEngine|null>(null),ambience=useRef<ExplorationSound|null>(null),voice=useRef<HTMLAudioElement>(null);
  const back=useRef<HTMLButtonElement>(null),heldId=useRef<string|null>(null);
  const currentActive=useRef(false),currentMotion=useRef(true),voiceTimes=useRef(new Map<string,number>());
  const [state,setState]=useState(initialState),[ready,setReady]=useState(false),[started,setStarted]=useState(false),[error,setError]=useState("");
  const [sound,setSound]=useState(false),[soundBusy,setSoundBusy]=useState(false),[speaking,setSpeaking]=useState(false),[voiceTime,setVoiceTime]=useState(0),[reduced,setReduced]=useState(false);
  const active=open&&!suspended;
  const object=chaletObjects.find(item=>item.id===state.held),clip=narration.find(item=>item.id===`chalet-${state.held}`);
  const subtitle=clip?.cues.find(cue=>voiceTime>=cue.start&&voiceTime<cue.end)?.text;

  useEffect(()=>{
    const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);update();media.addEventListener("change",update);
    const hidden=()=>{if(document.hidden){voice.current?.pause();void ambience.current?.pause();setSound(false);}};document.addEventListener("visibilitychange",hidden);
    return()=>{media.removeEventListener("change",update);document.removeEventListener("visibilitychange",hidden);};
  },[]);
  useEffect(()=>{currentActive.current=active;engine.current?.setActive(active);if(!active){voice.current?.pause();onVoice(false);}},[active,onVoice]);
  useEffect(()=>{currentMotion.current=motion&&!reduced;engine.current?.setReducedMotion(!currentMotion.current);},[motion,reduced]);
  useEffect(()=>{
    let live=true;let instance:ChaletEngine|null=null;
    void import("@/lib/experience/chalet-engine").then(async({ChaletEngine})=>{
      if(!live||!host.current)return;
      instance=new ChaletEngine(host.current,{onState:next=>{if(live){if(heldId.current!==next.held){voice.current?.pause();setSpeaking(false);ambience.current?.duck(false);heldId.current=next.held;}setState(next);}},onStep:inside=>ambience.current?.footstep(inside),onError:message=>{if(live)setError(message);}});
      engine.current=instance;instance.setReducedMotion(!currentMotion.current);await instance.load();
      if(live){instance.setActive(currentActive.current);setReady(true);}
    }).catch(()=>{if(live)setError("The 3D house could not load. You can return to the photographic village, or reload the page to try again.");});
    return()=>{live=false;instance?.dispose();engine.current=null;ambience.current?.dispose();ambience.current=null;};
  },[]);
  useEffect(()=>{if(active&&ready)back.current?.focus({preventScroll:true});},[active,ready]);
  useEffect(()=>{ambience.current?.setPlace(state.inside?"home":"valley");},[state.inside]);
  useEffect(()=>{if(!open)void ambience.current?.pause();else if(sound)void ambience.current?.play().catch(()=>setSound(false));},[open,sound]);

  async function toggleSound(){if(soundBusy)return;setSoundBusy(true);try{if(sound){await ambience.current?.pause();setSound(false);}else{ambience.current??=new ExplorationSound();ambience.current.setPlace(state.inside?"home":"valley");ambience.current.duck(speaking);await ambience.current.play();setSound(true);}}catch{setError("Ambient sound is unavailable. The house can still be explored in silence.");}finally{setSoundBusy(false);}}
  function listen(){if(!voice.current)return;if(speaking){voice.current.pause();return;}if(voice.current.ended)voice.current.currentTime=0;void voice.current.play().catch(()=>setError("The voice could not play. You can read the description or try Listen again."));}
  function returnObject(){voice.current?.pause();onVoice(false);engine.current?.putDown();}
  function start(mode:"guided"|"free"){setStarted(true);setError("");if(mode==="guided")engine.current?.goTo(1);else engine.current?.setMode("free");}
  const nextLabel=["Walk to the door","Open the door & enter","Approach the table","Walk to the window","Return outside"][state.stop];
  const nearLabel=state.near==="door"?(state.doorOpen?"Close the door":"Open the door"):state.near?`Lift the ${state.near}`:"Look at a door or an object";

  return <section className={styles.walk} hidden={!open} inert={!active} aria-hidden={!active||undefined} aria-label="Walk inside the Alpine house" data-testid="chalet-walk" data-mode={state.mode} data-walking={state.walking} data-held={state.held??"none"} data-door={state.doorOpen?"open":"closed"} data-x={state.position.x.toFixed(2)} data-z={state.position.z.toFixed(2)} onKeyDown={event=>{if(event.key!=="Escape")return;event.stopPropagation();if(document.pointerLockElement)return;if(state.held)returnObject();else onClose();}}>
    <div ref={host} className={styles.canvas}/><div className={styles.shade} aria-hidden="true"/>
    <header className={styles.header}><button ref={back} onClick={onClose}><ArrowLeft size={18}/><span>{fromVillage?"Return to village":"Return to documentary"}</span></button><span className={styles.wordmark}>A HOUSE, A WORLD WITHIN<small>SWITZERLAND · AN IMAGINED SPACE</small></span><button onClick={toggleSound} disabled={soundBusy} aria-pressed={sound} aria-label={sound?"Turn house ambience off":"Turn house ambience on"}>{sound?<SpeakerHigh size={19}/>:<SpeakerSlash size={19}/>}<span>Ambience {sound?"on":"off"}</span></button></header>
    {!ready&&!error&&<div className={styles.loading} role="status">Opening the door to another time…</div>}
    {error&&<div className={styles.error} role="alert"><p>{error}</p><button onClick={()=>setError("")} aria-label="Dismiss house message"><X size={18}/></button></div>}
    {ready&&!started&&<div className={styles.invitation}><span>A WALKABLE VISUAL STUDY</span><h2>Cross the threshold.<br/><em>Follow your curiosity.</em></h2><p>Open the door. Walk through the room. Pick up three objects and discover the stories they invite.</p><div><button className={styles.primary} onClick={()=>start("guided")}><Play size={17} weight="fill"/> Guide me inside</button><button onClick={()=>start("free")}>I’ll find my own way <ArrowRight size={18}/></button></div><small>Voice and ambience are optional. Your place in the documentary is saved.</small></div>}
    {ready&&started&&!state.held&&<><div className={styles.location}><span>{state.inside?"INSIDE THE HOUSE":"THE APPROACH"}</span><h2>{state.mode==="guided"?tourStops[state.stop].label:"At your own pace."}</h2></div><div className={styles.crosshair} aria-hidden="true"><span/></div><div className={styles.context}><button disabled={!state.near} onClick={()=>engine.current?.interact()}>{nearLabel}{state.near&&<kbd>E</kbd>}</button></div></>}
    {object&&<div className={styles.objectInfo}><span>{object.kind}</span><h2>{object.title}</h2><p>{speaking&&subtitle?subtitle:object.text}</p><div className={styles.objectTools}><button onClick={()=>engine.current?.rotateObject(0,-.3)} aria-label="Rotate object left"><ArrowLeft size={18}/></button><button onClick={()=>engine.current?.rotateObject(-.25,0)} aria-label="Tilt object upward"><ArrowUp size={18}/></button><button onClick={()=>engine.current?.rotateObject(0,.3)} aria-label="Rotate object right"><ArrowRight size={18}/></button><button onClick={()=>engine.current?.resetObject()} aria-label="Reset object rotation"><ArrowsClockwise size={18}/></button><label>Distance<input aria-label="Object distance" type="range" min="48" max="105" defaultValue="72" onChange={event=>engine.current?.setObjectDistance(Number(event.target.value)/100)}/></label></div><div className={styles.objectActions}><button className={styles.primary} onClick={returnObject}>Return to its place <ArrowDown size={16}/></button><button onClick={listen}>{speaking?<Pause size={17}/>:<Headphones size={17}/>} {speaking?"Pause description":voiceTime>0&&voiceTime<(clip?.duration??0)-.2?"Resume description":"Listen to description"}</button></div>{object.id==="photograph"&&<button className={styles.source} onClick={onPhoto}>Explore the original photograph <ArrowRight size={16}/></button>}<small>Drag the object to turn it. Escape returns it to the table.</small></div>}
    {ready&&started&&!state.held&&<footer className={styles.controls}>
      <div className={styles.mainControls}><div className={styles.mode}><button aria-pressed={state.mode==="guided"} onClick={()=>{engine.current?.setMode("guided");}}>Guided</button><button aria-pressed={state.mode==="free"} onClick={()=>engine.current?.setMode("free")}>Free walk</button></div>
        {state.walking?<button className={styles.primary} onClick={()=>engine.current?.pauseWalk()}><Pause size={16}/> Pause walk</button>:<button className={styles.primary} onClick={()=>state.paused?engine.current?.resumeWalk():engine.current?.goTo(state.stop===4?0:state.stop+1)}>{state.paused?"Resume walk":state.mode==="free"?"Resume guided visit":nextLabel}<ArrowRight size={17}/></button>}
        <button onClick={()=>engine.current?.toggleDoor()} disabled={Math.hypot(state.position.x,state.position.z-3.5)>3}>{state.doorOpen?"Close door":"Open door"}</button>
        <button className={styles.capture} onClick={()=>engine.current?.captureMouse()}>Capture mouse</button>
      </div>
      <div className={styles.objects}><span>EXAMINE <small>{state.examined.length}/3</small></span>{chaletObjects.map(item=><button key={item.id} disabled={!state.reachable.includes(item.id)} onClick={()=>{setVoiceTime(voiceTimes.current.get(item.id)??0);engine.current?.pick(item.id);}}>{item.id==="photograph"?"Photograph":item.id==="camera"?"Camera":"Bowl"}{state.examined.includes(item.id)&&<span aria-label="examined"> ✓</span>}</button>)}{!state.reachable.length&&<button onClick={()=>engine.current?.goTo(3)}>Walk to the table <ArrowRight size={14}/></button>}</div>
      <p className={styles.hint}>Drag to look · WASD / arrow keys to walk · E to interact · Escape releases the mouse</p>
    </footer>}
    {ready&&started&&!state.held&&<nav className={styles.touchControls} aria-label="Walking controls">{[{label:"Walk forward",f:1,r:0,icon:<ArrowUp size={20}/>},{label:"Walk left",f:0,r:-1,icon:<ArrowLeft size={20}/>},{label:"Walk backward",f:-1,r:0,icon:<ArrowDown size={20}/>},{label:"Walk right",f:0,r:1,icon:<ArrowRight size={20}/>}].map(control=><button key={control.label} aria-label={control.label} onPointerDown={event=>{event.preventDefault();event.currentTarget.setPointerCapture(event.pointerId);engine.current?.setTouch(control.f,control.r);}} onPointerUp={()=>engine.current?.setTouch(0,0)} onPointerCancel={()=>engine.current?.setTouch(0,0)} onLostPointerCapture={()=>engine.current?.setTouch(0,0)}>{control.icon}</button>)}</nav>}
    <div className={styles.bottom}><span>Artistic reconstruction · Imagined house & objects</span><div><button onClick={onPhoto}>Archive</button><button onClick={onMap}><Compass size={14}/> Globe</button><button onClick={onDocumentary}>Documentary <ArrowRight size={14}/></button></div></div>
    {clip&&<audio key={clip.id} ref={voice} src={clip.audio} preload="metadata" onLoadedMetadata={event=>{event.currentTarget.currentTime=voiceTimes.current.get(state.held!)??0;setVoiceTime(event.currentTarget.currentTime);}} onTimeUpdate={event=>{setVoiceTime(event.currentTarget.currentTime);if(state.held)voiceTimes.current.set(state.held,event.currentTarget.currentTime);}} onPlaying={()=>{setSpeaking(true);onVoice(true);ambience.current?.duck(true);}} onPause={()=>{setSpeaking(false);onVoice(false);ambience.current?.duck(false);}} onEnded={()=>{setSpeaking(false);onVoice(false);ambience.current?.duck(false);}}/>}
  </section>;
}
