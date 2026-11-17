/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, CornersOut, Headphones, Pause, Plus, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { alpinePlaces, explorationFrame, getAlpinePlace, initialView, placeLayers, type PlaceId, type PlacePoint, type PlaceView } from "@/lib/experience/alpine-places";
import { ExplorationSound } from "@/lib/experience/exploration-sound";
import narration from "@/lib/experience/exploration-manifest.json";
import styles from "./alpine-cinema.module.css";
import { priceBookSource } from "@/lib/experience/library-content";

export type PlaceRequest={place:PlaceId;id:number};
type Props={onHouse:()=>void;houseOpen:boolean;request?:PlaceRequest|null;open:boolean;suspended:boolean;motion:boolean;onVoice:(value:boolean)=>void;onClose:()=>void;onContinue:()=>void;onPhoto:()=>void;onMap:()=>void};
type Frame=ReturnType<typeof explorationFrame>;
const loadedPlaces=new Map<PlaceId,Promise<void>>();
function preparePlace(id:PlaceId):Promise<void>{
  if(!loadedPlaces.has(id))loadedPlaces.set(id,Promise.all(placeLayers(getAlpinePlace(id)).map(layer=>new Promise<void>((resolve,reject)=>{const image=new Image();image.onload=()=>resolve();image.onerror=()=>reject(new Error("Image unavailable"));image.src=layer.src;}))).then(()=>{}).catch(error=>{loadedPlaces.delete(id);throw error;}));
  return loadedPlaces.get(id)!;
}

export function AlpineCinema({onHouse,houseOpen,request,open,suspended,motion,onVoice,onClose,onContinue,onPhoto,onMap}:Props){
  const stage=useRef<HTMLElement>(null),back=useRef<HTMLButtonElement>(null),audio=useRef<HTMLAudioElement>(null);
  const images=useRef<(HTMLImageElement|null)[]>([]),pins=useRef<(HTMLButtonElement|null)[]>([]);
  const view=useRef<PlaceView>(initialView()),smoothView=useRef<PlaceView>(initialView()),focus=useRef([.65,.64]);
  const frames=useRef<Frame[]>([]),views=useRef(new Map<PlaceId,PlaceView>()),audioTimes=useRef(new Map<PlaceId,number>());
  const ambience=useRef<ExplorationSound|null>(null),gesture=useRef<{x:number;y:number}|null>(null);
  const transition=useRef<PlacePoint|null>(null),ticket=useRef(0),alive=useRef(true);
  const [placeId,setPlaceId]=useState<PlaceId>(request?.place??"overlook"),[history,setHistory]=useState<PlaceId[]>([]),[visited,setVisited]=useState<PlaceId[]>([request?.place??"overlook"]);
  const handled=useRef(request?.id??0),current=useRef<PlaceId>(placeId),[entering,setEntering]=useState(false);
  const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const [detail,setDetail]=useState<PlacePoint|null>(null),[description,setDescription]=useState(false),[showPlaces,setShowPlaces]=useState(false);
  const [ambienceOn,setAmbienceOn]=useState(false),[soundBusy,setSoundBusy]=useState(false),[listening,setListening]=useState(false),[time,setTime]=useState(0);
  const [reduced,setReduced]=useState(false),[approach,setApproach]=useState(0);
  const [trail,setTrail]=useState<{id:PlaceId;frames:Frame[]}|null>(null);
  const [candleLit,setCandleLit]=useState(false),[bellBusy,setBellBusy]=useState(false);
  const candle=useRef<HTMLDivElement>(null);
  const place=getAlpinePlace(placeId),layers=placeLayers(place),clip=narration.find(item=>item.id===`explore-${placeId}`)!;
  const active=open&&!suspended,animated=motion&&!reduced;
  const subtitle=clip.cues.find(cue=>time>=cue.start&&time<cue.end)?.text;

  useEffect(()=>{
    alive.current=true;
    const media=matchMedia("(prefers-reduced-motion: reduce)");const update=()=>setReduced(media.matches);update();media.addEventListener("change",update);
    const hide=()=>{if(document.hidden){audio.current?.pause();void ambience.current?.pause();setAmbienceOn(false);}};
    document.addEventListener("visibilitychange",hide);
    void preparePlace(current.current).then(()=>{if(alive.current)setReady(true);}).catch(()=>{if(alive.current)setError("The valley could not load. Try again or open the original photograph.");});
    return()=>{alive.current=false;media.removeEventListener("change",update);document.removeEventListener("visibilitychange",hide);ambience.current?.dispose();ambience.current=null;};
  },[]);
  useEffect(()=>{for(const point of place.points)if(point.target)void preparePlace(point.target).catch(()=>{});ambience.current?.setPlace(place.environment);},[place]);
  useEffect(()=>{if(!active){audio.current?.pause();onVoice(false);}else back.current?.focus({preventScroll:true});},[active,onVoice]);
  useEffect(()=>{if(!open||houseOpen)void ambience.current?.pause();else if(ambienceOn)void ambience.current?.play().catch(()=>setAmbienceOn(false));},[open,houseOpen,ambienceOn]);
  useEffect(()=>{if(!trail)return;const timer=setTimeout(()=>setTrail(null),animated?850:0);return()=>clearTimeout(timer);},[trail,animated]);
  useEffect(()=>{current.current=placeId;},[placeId]);
  // Another experience can ask for a place (the study window leads to the church). The arrival happens under the veil.
  useEffect(()=>{
    if(!request||request.id===handled.current)return;handled.current=request.id;
    const target=request.place,origin=current.current;if(target===origin)return;
    ticket.current++;views.current.set(origin,{...view.current});if(audio.current){audioTimes.current.set(origin,audio.current.currentTime);audio.current.pause();}
    let live=true;
    void preparePlace(target).then(()=>{
      if(!live||!alive.current)return;
      const next=views.current.get(target)??initialView();view.current={...next};smoothView.current={...next};focus.current=[...getAlpinePlace(target).focus];transition.current=null;
      setApproach(next.approach);setPlaceId(target);setHistory(previous=>[...previous,origin]);setVisited(previous=>previous.includes(target)?previous:[...previous,target]);setTime(audioTimes.current.get(target)??0);setListening(false);setBusy(false);setDetail(null);setDescription(false);setShowPlaces(false);
    }).catch(()=>{});
    return()=>{live=false;};
  },[request]);

  function savePlace(){views.current.set(placeId,{...view.current});if(audio.current)audioTimes.current.set(placeId,audio.current.currentTime);audio.current?.pause();}
  async function travel(target:PlaceId,point?:PlacePoint,backwards=false){
    if(busy||target===placeId)return;
    savePlace();setBusy(true);setError("");setDetail(null);setDescription(false);transition.current=point??null;
    const operation=++ticket.current;
    try{
      await Promise.all([preparePlace(target),new Promise(resolve=>setTimeout(resolve,animated?650:0))]);
      if(!alive.current||operation!==ticket.current)return;
      setTrail({id:placeId,frames:frames.current.map(frame=>({...frame}))});
      transition.current=null;const next=views.current.get(target)??initialView();view.current={...next};smoothView.current={...next};focus.current=[...getAlpinePlace(target).focus];
      setApproach(next.approach);setPlaceId(target);setHistory(previous=>backwards?previous.slice(0,-1):[...previous,placeId]);setVisited(previous=>previous.includes(target)?previous:[...previous,target]);setTime(audioTimes.current.get(target)??0);setListening(false);setBusy(false);setShowPlaces(false);
      ambience.current?.footstep(target==="home"||target==="chapel");
    }catch{if(alive.current&&operation===ticket.current){transition.current=null;setBusy(false);setError("That place could not load. Choose the path again to retry.");}}
  }
  /** The camera pushes toward the doorway while the scene dips to dark; the house fades in from the same darkness. */
  function enterHouse(point?:PlacePoint){
    if(busy||entering)return;savePlace();setDetail(null);setDescription(false);setShowPlaces(false);
    if(!animated){onHouse();return;}
    setEntering(true);if(point)transition.current=point;ambience.current?.footstep(true);
    setTimeout(()=>{if(!alive.current)return;onHouse();transition.current=null;setEntering(false);},720);
  }
  function selectPoint(point:PlacePoint){if(point.id==="house-door"){enterHouse(point);return;}if(point.target){void travel(point.target,point);return;}if(point.id==="candle")setCandleLit(true);if(!detail)views.current.set(placeId,{...view.current});setDetail(point);view.current={x:0,y:0,approach:.78};setApproach(.78);setDescription(false);ambience.current?.footstep(placeId==="home"||placeId==="chapel");}
  function resetView(){setDetail(null);view.current=initialView();setApproach(0);}
  function moveCloser(value:number){if(busy)return;view.current.approach=Math.max(0,Math.min(1,value));setApproach(view.current.approach);}
  async function toggleAmbience(){if(soundBusy)return;setSoundBusy(true);setError("");try{if(ambienceOn){await ambience.current?.pause();setAmbienceOn(false);}else{ambience.current??=new ExplorationSound();ambience.current.setPlace(place.environment);ambience.current.duck(listening);await ambience.current.play();setAmbienceOn(true);}}catch{setError("Ambient sound is unavailable. You can still explore in silence.");}finally{setSoundBusy(false);}}
  function listen(){if(!audio.current||busy)return;if(listening){audio.current.pause();return;}if(audio.current.ended)audio.current.currentTime=0;setDescription(true);setError("");void audio.current.play().catch(()=>setError("The description could not play. The full text is available below; tap Listen to retry."));}
  async function ringBell(){if(bellBusy)return;setBellBusy(true);try{ambience.current??=new ExplorationSound();ambience.current.setPlace("chapel");await ambience.current.play();setAmbienceOn(true);ambience.current.bell();}catch{setError("The bell is unavailable in this browser.");}finally{setBellBusy(false);}}

  useEffect(()=>{
    if(!active||!ready)return;let raf=0,previous=0;
    const render=(now:number)=>{
      const dt=previous?Math.min((now-previous)/1000,.06):.016;previous=now;const smoothing=animated?1-Math.exp(-dt*5):1;
      const targetFocus=transition.current?[transition.current.x,transition.current.y]:detail?[detail.x,detail.y]:place.focus;
      focus.current=focus.current.map((value,index)=>value+(targetFocus[index]-value)*smoothing);
      const targetView=transition.current?{x:0,y:0,approach:1}:view.current;
      for(const key of ["x","y","approach"] as const)smoothView.current[key]+=(targetView[key]-smoothView.current[key])*smoothing;
      const {width,height}=stage.current!.getBoundingClientRect();
      frames.current=placeLayers(place).map((layer,index)=>{
        const frame=explorationFrame(width,height,smoothView.current,focus.current,layer.depth),image=images.current[index];
        if(image){image.style.width=`${frame.width}px`;image.style.height=`${frame.height}px`;image.style.transform=`translate3d(${frame.x}px,${frame.y}px,0)`;}
        if(placeId==="chapel"&&candle.current)candle.current.style.transform=`translate3d(${frame.x+frame.width*.86}px,${frame.y+frame.height*.46}px,0) scale(${frame.width/1536})`;
        if(layer.depth===1)place.points.forEach((point,i)=>{const pin=pins.current[i];if(!pin)return;const x=frame.x+frame.width*point.x,y=frame.y+frame.height*point.y;pin.style.transform=`translate3d(${x}px,${y}px,0) translate(-50%,-50%)`;pin.style.visibility=x>30&&x<width-30&&y>150&&y<height-235?"visible":"hidden";});
        return frame;
      });stage.current?.setAttribute("data-framed","true");raf=requestAnimationFrame(render);
    };raf=requestAnimationFrame(render);return()=>cancelAnimationFrame(raf);
  },[active,ready,animated,place,placeId,detail]);
  useEffect(()=>{if(!active)return;const element=stage.current!;const wheel=(event:WheelEvent)=>{if((event.target as HTMLElement).closest("button,a,input,nav"))return;event.preventDefault();if(!busy){view.current.approach=Math.max(0,Math.min(1,view.current.approach+event.deltaY/2200));setApproach(view.current.approach);}};element.addEventListener("wheel",wheel,{passive:false});return()=>element.removeEventListener("wheel",wheel);},[active,busy]);

  return <section ref={stage} className={styles.cinema} hidden={!open} inert={!active} aria-hidden={!active||undefined} aria-label="Explore the Alpine village" data-testid="alpine-cinema" data-place={placeId} data-motion={animated} data-approach={approach.toFixed(3)} data-listening={listening} data-candle={candleLit} data-busy={busy} data-entering={entering} tabIndex={-1}
    onPointerDown={event=>{if(busy||(event.target as HTMLElement).closest("button,a,input,nav"))return;gesture.current={x:event.clientX,y:event.clientY};event.currentTarget.setPointerCapture(event.pointerId);}}
    onPointerMove={event=>{if(!gesture.current)return;view.current.x=Math.max(-1,Math.min(1,view.current.x+(event.clientX-gesture.current.x)/Math.max(200,event.currentTarget.clientWidth)*2));view.current.y=Math.max(-1,Math.min(1,view.current.y+(event.clientY-gesture.current.y)/Math.max(200,event.currentTarget.clientHeight)*2));gesture.current={x:event.clientX,y:event.clientY};}}
    onPointerUp={()=>{gesture.current=null;}} onPointerCancel={()=>{gesture.current=null;}}
    onKeyDown={event=>{if(event.key==="Escape"){event.stopPropagation();if(detail)resetView();else if(showPlaces)setShowPlaces(false);else onClose();return;}if((event.target as HTMLElement).closest("button,input,a")||busy)return;const key=event.key.toLowerCase();if(["arrowleft","arrowright","arrowup","arrowdown","w","a","s","d"].includes(key)){event.preventDefault();if(key==="w"||key==="arrowup")moveCloser(view.current.approach+.12);if(key==="s"||key==="arrowdown")moveCloser(view.current.approach-.12);if(key==="a"||key==="arrowleft")view.current.x=Math.min(1,view.current.x+.15);if(key==="d"||key==="arrowright")view.current.x=Math.max(-1,view.current.x-.15);}}}>
    <div key={`scene-${placeId}`} className={styles.landscape} aria-hidden="true">{layers.map((layer,index)=><img key={layer.src} ref={node=>{images.current[index]=node;}} src={layer.src} alt="" draggable={false}/>)}</div>
    {trail&&<div className={styles.trail} aria-hidden="true">{placeLayers(getAlpinePlace(trail.id)).map((layer,index)=>{const frame=trail.frames[index];return <img key={layer.src} src={layer.src} alt="" style={frame?{width:frame.width,height:frame.height,transform:`translate3d(${frame.x}px,${frame.y}px,0)`}:undefined}/>;})}</div>}
    <div className={styles.shade} aria-hidden="true"/><div className={styles.veil} data-on={entering||houseOpen} aria-hidden="true"/>
    {placeId==="chapel"&&<div ref={candle} className={styles.candle} data-lit={candleLit} aria-hidden="true"><i/><span/></div>}
    <header className={styles.header}><button ref={back} onClick={onClose}><ArrowLeft size={19}/><span>Return to documentary</span></button><span className={styles.wordmark}>A PLACE TO WANDER<small>{visited.length} OF {alpinePlaces.length} PLACES DISCOVERED</small></span><button onClick={toggleAmbience} disabled={soundBusy} aria-pressed={ambienceOn} aria-label={ambienceOn?"Turn ambience off":"Turn ambience on"}>{ambienceOn?<SpeakerHigh size={20}/>:<SpeakerSlash size={20}/>}<span>Ambience {ambienceOn?"on":"off"}</span></button></header>
    <div className={styles.editorial}><span className={styles.kicker}>SWITZERLAND / {place.subtitle}</span><h2>{place.title}</h2><p>Drag to look around. Choose a path. Stay as long as you like.</p></div>
    <span className={styles.announcement} aria-live="polite">{busy?"Walking to the next place…":`${place.short}. ${visited.length} of ${alpinePlaces.length} places discovered.`}</span>
    {!ready&&<div className={styles.loading} role="status">Opening the valley…</div>}
    {error&&<div className={styles.error} role="alert"><p>{error}</p>{!ready&&<button onClick={()=>{setError("");void preparePlace(placeId).then(()=>setReady(true)).catch(()=>setError("The images are unavailable. Open the original photograph instead."));}}>Retry scene</button>}<button onClick={onPhoto}>Original photograph <ArrowRight size={16}/></button><button aria-label="Dismiss message" onClick={()=>setError("")}><X size={16}/></button></div>}
    <div className={styles.hotspots} hidden={!ready||busy||!!detail}>{place.points.map((point,index)=><button key={point.id} ref={node=>{pins.current[index]=node;}} className={styles.point} onClick={()=>selectPoint(point)} aria-label={point.label}>{point.target?<ArrowRight size={19}/>:<Plus size={19}/>}<span>{point.label}</span></button>)}</div>
    <footer className={styles.dock}><nav className={styles.swissTrail} aria-label="The Swiss trail"><span>YOUR SWISS TRAIL</span>{(["overlook","lane","chapel"] as PlaceId[]).map((id,index)=><button key={id} disabled={busy} aria-current={placeId===id?"location":undefined} onClick={()=>void travel(id)}><small>0{index+1}</small>{getAlpinePlace(id).short}{visited.includes(id)&&<i/>}</button>)}<button onClick={()=>enterHouse()} disabled={entering}><small>04</small>Price’s study<ArrowRight size={14}/></button></nav>
      {detail&&<div className={styles.detail}><span>A CLOSER LOOK</span><h3>{detail.label}</h3><p>{detail.text}</p>{placeId==="chapel"&&detail.id==="altar"&&<div className={styles.churchActions}><a href={priceBookSource} target="_blank" rel="noreferrer">Read the Swiss chapter ↗</a><button onClick={()=>enterHouse()} disabled={entering}>Continue in Price’s study <ArrowRight size={15}/></button></div>}{placeId==="chapel"&&detail.id==="candle"&&<button onClick={()=>setCandleLit(!candleLit)}>{candleLit?"Extinguish the candle":"Light the candle"}</button>}{placeId==="chapel"&&<button onClick={ringBell} disabled={bellBusy}>Ring a soft bell <SpeakerHigh size={15}/></button>}<button onClick={resetView}><ArrowLeft size={16}/> Step back</button></div>}
      {description&&!detail&&<div className={styles.description}><button className={styles.closeDescription} aria-label="Hide description" onClick={()=>setDescription(false)}><X size={17}/></button><p>{listening&&subtitle?subtitle:place.description}</p><small>Contemporary description · AI-generated place</small></div>}
      <nav className={styles.paths} aria-label="Paths and details"><button onClick={()=>enterHouse()} disabled={entering}>Visit Price’s study <ArrowRight size={14}/></button>{place.points.map(point=><button key={point.id} onClick={()=>selectPoint(point)} disabled={busy||!ready}>{point.target?<ArrowRight size={14}/>:<Plus size={14}/>} {point.label}</button>)}</nav>
      <div className={styles.transport}>
        <div className={styles.walkControls}><button onClick={()=>{moveCloser(view.current.approach+.18);ambience.current?.footstep(placeId==="home"||placeId==="chapel");}} disabled={busy||!ready||approach>=1} aria-label="Step forward"><ArrowRight size={17}/><span>Step closer</span></button><button onClick={resetView} disabled={busy} aria-label="Reset view"><CornersOut size={19}/></button><input aria-label="Move closer" type="range" min="0" max="100" value={Math.round(approach*100)} onChange={event=>moveCloser(Number(event.target.value)/100)} disabled={busy}/></div>
        <button onClick={listen} disabled={busy||!ready} aria-label={listening?"Pause description":time>0&&time<clip.duration-.2?"Resume description":"Listen to description"}>{listening?<Pause size={17}/>:<Headphones size={18}/>}<span>{listening?"Pause description":time>0&&time<clip.duration-.2?"Resume description":"Listen to description"}</span></button>
        <button onClick={()=>{setDetail(null);setDescription(!description);}} aria-expanded={description}>Read</button><button onClick={()=>setShowPlaces(!showPlaces)} aria-expanded={showPlaces}>Places <span>{visited.length}/{alpinePlaces.length}</span></button>
      </div>
      {showPlaces&&<nav className={styles.placeRail} aria-label="All Alpine places">{alpinePlaces.map(destination=><button key={destination.id} aria-current={placeId===destination.id?"location":undefined} onClick={()=>void travel(destination.id)} disabled={busy}><img src={placeLayers(destination)[0].src} alt=""/><span>{destination.short}<small>{visited.includes(destination.id)?"Visited":"Discover"}</small></span></button>)}</nav>}
      <div className={styles.footnote}><span>AI-generated recreation · Imagined interiors</span><div>{history.length>0&&<button onClick={()=>void travel(history[history.length-1],undefined,true)} disabled={busy}><ArrowLeft size={14}/> Previous place</button>}<button onClick={onPhoto}>Original photo</button><button onClick={onMap}><Compass size={16}/> Globe</button><button onClick={onContinue}>Documentary <ArrowRight size={14}/></button></div></div>
    </footer>
    <audio key={`voice-${placeId}`} ref={audio} src={clip.audio} preload="metadata" onLoadedMetadata={event=>{event.currentTarget.currentTime=Math.min(audioTimes.current.get(placeId)??0,event.currentTarget.duration||0);}} onTimeUpdate={event=>{const current=event.currentTarget.currentTime;setTime(current);audioTimes.current.set(placeId,current);}} onPlaying={()=>{setListening(true);onVoice(true);ambience.current?.duck(true);}} onPause={()=>{setListening(false);onVoice(false);ambience.current?.duck(false);}} onEnded={()=>{setListening(false);onVoice(false);ambience.current?.duck(false);}} onError={()=>{if(listening)setError("The description is unavailable. You can read the text instead.");}}/>
  </section>;
}
