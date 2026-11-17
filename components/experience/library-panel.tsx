/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Headphones, Pause, X } from "@phosphor-icons/react";
import { libraryPages, libraryRecords, libraryTopics, priceBookSource, type LibraryTopic } from "@/lib/experience/library-content";
import styles from "./library-panel.module.css";
import libraryNarration from "@/lib/experience/library-manifest.json";
const readingBookmarks=new Map<string,number>();

export function LibraryReader({text,active,onVoice}:{text:string;active:boolean;onVoice:(value:boolean)=>void}) {
  const [speaking,setSpeaking]=useState(false),[unavailable,setUnavailable]=useState(false),[time,setTime]=useState(0);
  const audio=useRef<HTMLAudioElement>(null),callback=useRef(onVoice);
  const clip=libraryNarration.find(item=>item.text===text);
  useEffect(()=>{callback.current=onVoice;},[onVoice]);
  useEffect(()=>{if(!active){audio.current?.pause();callback.current(false);}},[active]);
  useEffect(()=>{const node=audio.current;const hidden=()=>{if(document.hidden)node?.pause();};document.addEventListener("visibilitychange",hidden);return()=>{node?.pause();callback.current(false);document.removeEventListener("visibilitychange",hidden);};},[clip?.id]);
  function toggle(){const node=audio.current;if(!node)return;if(!node.paused){node.pause();return;}if(node.ended)node.currentTime=0;setUnavailable(false);void node.play().catch(()=>setUnavailable(true));}
  return <div className={styles.reader}><button onClick={toggle} disabled={!active||!clip}>{speaking?<Pause size={16}/>:<Headphones size={16}/>} {speaking?"Pause reading":time>0&&time<(clip?.duration??0)-.3?"Resume reading":"Listen to this text"}</button><small>{unavailable?"Voice unavailable here. The full text is above.":"Optional synthetic narrator · Not Price’s voice"}</small>{clip&&<audio key={clip.id} ref={audio} src={clip.audio} preload="metadata" onLoadedMetadata={event=>{const saved=readingBookmarks.get(clip.id)??0;event.currentTarget.currentTime=saved;setTime(saved);}} onTimeUpdate={event=>{setTime(event.currentTarget.currentTime);readingBookmarks.set(clip.id,event.currentTarget.currentTime);}} onPlaying={()=>{setSpeaking(true);callback.current(true);}} onPause={()=>{setSpeaking(false);callback.current(false);}} onEnded={()=>{setSpeaking(false);callback.current(false);}} onError={()=>setUnavailable(true)}/>}</div>;
}

type PanelProps={mode:"price"|"projector";record:number;projecting:boolean;active:boolean;onClose:()=>void;onTopic:(topic:LibraryTopic)=>void;onSelect:(index:number)=>void;onProjection:()=>void;onVoice:(value:boolean)=>void};
export function LibraryPanel({mode,record,projecting,active,onClose,onTopic,onSelect,onProjection,onVoice}:PanelProps){
  const [topic,setTopic]=useState(0),item=libraryRecords[record],selected=libraryTopics[topic];
  return <aside className={styles.panel} aria-label={mode==="price"?"An encounter with Price":"The archive projection"}>
    <header><span>{mode==="price"?"AN ENCOUNTER IN THE STUDY":"THE PROJECTION WALL"}</span><button onClick={onClose} aria-label="Close library conversation"><X size={19}/></button></header>
    {mode==="price"?<><h2>A life of looking.</h2><p className={styles.intro}>Choose a thread. Follow it into the archive.</p><nav className={styles.topics} aria-label="Topics with Price">{libraryTopics.map((item,index)=><button key={item.id} aria-pressed={topic===index} onClick={()=>setTopic(index)}><span>0{index+1}</span>{item.title}<ArrowRight size={14}/></button>)}</nav><div className={styles.topic}><span>{selected.question}</span><p>{selected.text}</p><button className={styles.primary} onClick={()=>onTopic(selected)}>{selected.action}<ArrowRight size={15}/></button></div><LibraryReader key={selected.id} text={selected.text} active={active} onVoice={onVoice}/><small className={styles.provenance}>Seated figure generated from the supplied portrait. Topics are editorial introductions, not invented dialogue attributed to Price.</small></>:<><h2>{item.title}</h2><span className={styles.recordKind}>{item.kind}</span><p>{item.text}</p><RecordPicker record={record} onSelect={onSelect}/><button className={styles.primary} onClick={onProjection}>{projecting?"Switch projector off":"Switch projector on"}</button><SourceRecord record={record}/><LibraryReader key={item.id} text={item.text} active={active} onVoice={onVoice}/></>}
  </aside>;
}
function RecordPicker({record,onSelect}:{record:number;onSelect:(index:number)=>void}){return <><div className={styles.recordNav}><button onClick={()=>onSelect(record-1)} aria-label="Previous archive plate"><ArrowLeft size={16}/></button><span>PLATE {String(record+1).padStart(2,"0")} / {libraryRecords.length}</span><button onClick={()=>onSelect(record+1)} aria-label="Next archive plate"><ArrowRight size={16}/></button></div><nav className={styles.records} aria-label="Library archive records">{libraryRecords.map((item,index)=><button key={item.id} aria-pressed={record===index} onClick={()=>onSelect(index)} aria-label={`Select archive record: ${item.title}`}><img src={item.image} alt=""/><span>{String(index+1).padStart(2,"0")}</span></button>)}</nav></>;}
function SourceRecord({record}:{record:number}){const item=libraryRecords[record];return <details className={styles.source}><summary>Image & source</summary><p>{item.source}</p><small>{item.local}</small>{item.url&&<a href={item.url} target="_blank" rel="noreferrer">Read the published source ↗</a>}<p>The virtual mount and its placement are recreated.</p></details>;}
export function LibraryObjectControls({kind,record,page,backlit,onSelect,onPage,onFlip,onLight,onZoom,onProject,active,onVoice}:{kind:"plate"|"book";record:number;page:number;backlit:boolean;onSelect:(index:number)=>void;onPage:(index:number)=>void;onFlip:()=>void;onLight:()=>void;onZoom:()=>void;onProject:()=>void;active:boolean;onVoice:(value:boolean)=>void}){
  const item=libraryRecords[record],reading=libraryPages[page];
  return <div className={styles.objectContent}>
    {kind==="plate"?<><h3>{item.title}</h3><span className={styles.recordKind}>{item.kind}</span><p>{item.text}</p><RecordPicker record={record} onSelect={onSelect}/><div className={styles.actions}><button onClick={onFlip}>Turn over · Source label</button><button onClick={onLight} aria-pressed={backlit}>{backlit?"Lower the light":"Hold to the light"}</button><button onClick={onZoom}>Look closer</button><button onClick={onProject}>Place in the projector <ArrowRight size={14}/></button></div><SourceRecord record={record}/><LibraryReader key={item.id} text={item.text} active={active} onVoice={onVoice}/></>:<><h3>{reading.title}</h3><p>{reading.lines.join(" ")}</p><p>{reading.detail}</p><div className={styles.recordNav}><button onClick={()=>onPage(page-1)} aria-label="Previous reading page"><ArrowLeft size={16}/></button><span>PAGE {page+1} / {libraryPages.length}</span><button onClick={()=>onPage(page+1)} aria-label="Next reading page"><ArrowRight size={16}/></button></div><a href={priceBookSource} target="_blank" rel="noreferrer">Read Price’s published account ↗</a><LibraryReader key={page} text={reading.lines.join(" ")+" "+reading.detail} active={active} onVoice={onVoice}/></>}
  </div>;
}
