"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Pause, Play, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import type { PhotoDetail } from "@/lib/experience/photo-details";
import clips from "@/lib/experience/detail-manifest.json";
import styles from "./immersion.module.css";

export const timeLabel = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2,"0")}`;
export type DetailBookmark = { time: number; ended: boolean };

/** A passage on the existing image: no backdrop, dialog or replacement photograph. */
export function InlineDetail({ point, side, sound, suspended, onSound, onVoice, onReturn, returnLabel, savedTime, alternatives, onSelect, bookmark, paused: controlledPaused, onPausedChange, onProgress, onComplete, gallery = false }: {
  point: PhotoDetail; side: "left" | "right"; sound: boolean; suspended: boolean;
  onSound: () => void; onVoice: (active: boolean) => void; onReturn: () => void;
  returnLabel: string; savedTime?: number; alternatives: PhotoDetail[]; onSelect: (point: PhotoDetail) => void;
  bookmark?: DetailBookmark; paused?: boolean; onPausedChange?: (paused: boolean) => void;
  onProgress?: (progress: DetailBookmark) => void; onComplete?: () => void; gallery?: boolean;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const [localPaused, setLocalPaused] = useState(false);
  const paused = controlledPaused ?? localPaused;
  const setPaused = useCallback((value: boolean) => { if (onPausedChange) onPausedChange(value); else setLocalPaused(value); }, [onPausedChange]);
  const [time, setTime] = useState(bookmark?.time ?? 0);
  const [ended, setEnded] = useState(bookmark?.ended ?? false);
  const initialTime = useRef(bookmark?.time ?? 0);
  const progress = useRef(onProgress);
  progress.current = onProgress;
  const [error, setError] = useState(false);
  const clip = clips.find(clip => clip.audio === point.audio);
  const cue = clip?.cues.find(cue => time >= cue.start && time < cue.end) ?? (ended ? clip?.cues.at(-1) : clip?.cues[0]);
  useEffect(() => { if (!gallery) back.current?.focus({ preventScroll: true }); }, [gallery]);
  useEffect(() => {
    const player = audio.current;
    return () => { if (player) progress.current?.({ time: player.currentTime, ended: player.ended }); };
  }, []);
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    if (!sound || paused || suspended || ended) { player.pause(); return; }
    const timer = setTimeout(() => { void player.play().catch(() => setError(true)); }, 300);
    return () => { clearTimeout(timer); player.pause(); onVoice(false); };
  }, [sound, paused, suspended, ended, onVoice]);
  useEffect(() => {
    const hide = () => { if (document.hidden) { audio.current?.pause(); setPaused(true); } };
    document.addEventListener("visibilitychange", hide);
    return () => document.removeEventListener("visibilitychange", hide);
  }, [setPaused]);
  function toggleVoice() {
    if (!sound) { onSound(); setPaused(false); return; }
    if (ended && audio.current) { audio.current.currentTime = 0; setEnded(false); setPaused(false); setTime(0); }
    else setPaused(!paused);
  }
  return <div className={styles.inlinePassage} data-side={side} data-gallery={gallery || undefined} data-testid="inline-detail">
    <audio ref={audio} src={point.audio} preload="auto" data-testid="detail-audio"
      onLoadedMetadata={() => { if (audio.current) audio.current.currentTime = Math.min(initialTime.current, audio.current.duration); }}
      onTimeUpdate={() => { const player = audio.current; if (player) { setTime(player.currentTime); progress.current?.({ time: player.currentTime, ended: player.ended }); } }}
      onPlaying={() => { onVoice(true); setError(false); }} onPause={() => onVoice(false)}
      onEnded={() => { setEnded(true); onVoice(false); if (audio.current) progress.current?.({ time: audio.current.currentTime, ended: true }); onComplete?.(); }} onError={() => setError(true)} />
    <div className={styles.inlineCopy}>
      <span className={styles.storyLabel}>Within the photograph{savedTime !== undefined ? ` / Documentary saved at ${timeLabel(savedTime)}` : " / A closer look"}</span>
      <h2>{point.title}</h2>
      <details className={styles.inlineSource}><summary>Read the story & source</summary><p>{point.text}</p><a href={point.source} target="_blank" rel="noreferrer">{point.sourceLabel} <ArrowRight size={14}/></a></details>
      {alternatives.length > 1 && <div className={styles.inlineAlternatives}>{alternatives.map(item => <button key={item.id} aria-pressed={point.id === item.id} onClick={() => onSelect(item)}>{item.label}</button>)}</div>}
    </div>
    <div className={styles.inlineDock}>
      <p className={styles.inlineCaption} aria-label="Detail narration subtitles">{error ? point.text : sound ? cue?.text : "Enable sound to hear this detail, or read its story above."}</p>
      <div className={styles.inlineTransport}>
        <button ref={back} className={styles.continueStory} onClick={onReturn}><ArrowLeft size={18}/><span>{returnLabel}{savedTime !== undefined && <small>Continue from {timeLabel(savedTime)} · your place is kept</small>}</span></button>
        <div><button onClick={toggleVoice} aria-label={!sound ? "Listen to detail" : ended ? "Replay detail" : paused ? "Resume detail narration" : "Pause detail narration"}>{sound && !paused && !ended ? <Pause size={18}/> : <Play size={18}/>}<span>{!sound ? "Listen" : ended ? "Hear again" : paused ? "Resume voice" : "Pause voice"}</span></button><span>{timeLabel(time)} / {timeLabel(clip?.duration ?? 0)}</span><button aria-label={sound ? "Mute detail sound" : "Enable detail sound"} onClick={onSound}>{sound ? <SpeakerHigh size={18}/> : <SpeakerSlash size={18}/>}</button></div>
      </div>
    </div>
  </div>;
}
