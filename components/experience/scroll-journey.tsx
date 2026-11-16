/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowRight, ArrowsOut, Compass, Pause, Play, Plus, SpeakerHigh, SpeakerSlash, Microphone, ClosedCaptioning, ArrowCounterClockwise } from "@phosphor-icons/react";
import { studies } from "@/lib/experience/content";
import { photoDetails, type PhotoDetail } from "@/lib/experience/photo-details";
import { beatAt, cameraFrame, clamp, smooth, storyBeats } from "@/lib/experience/scroll-story";
import narration from "@/lib/experience/narration-manifest.json";
import styles from "./immersion.module.css";
import { InlineDetail } from "./inline-detail";

type Props = {
  motion: boolean; sound: boolean; suspended: boolean; playRequest: number;
  onSound: () => void; onPhoto: (index: number, detail?: boolean, hotspotId?: string) => void; onMap: (image?: number) => void;
  onScene: (scene: number, intensity: number) => void; onVoice: (speaking: boolean) => void;
  onDiscovery: (active: boolean) => void;
};
const stamp = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

export function ScrollJourney({ motion, sound, suspended, playRequest, onSound, onPhoto, onMap, onScene, onVoice, onDiscovery }: Props) {
  const track = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const images = useRef<(HTMLDivElement | null)[]>([]);
  const copy = useRef<HTMLDivElement>(null);
  const meter = useRef<HTMLDivElement>(null);
  const hotspot = useRef<HTMLButtonElement>(null);
  const audio = useRef<HTMLAudioElement>(null);
  const currentBeat = useRef(-1);
  const autoRef = useRef(false);
  const automaticClock = useRef({ beat: -1, time: 0, tail: 0 });
  const savedPassage = useRef({ time: 0, scroll: 0, auto: false, paused: false, focus: null as HTMLElement | null });
  const lastDetail = useRef<PhotoDetail | null>(null);
  const detailBlend = useRef(0);
  const discoveryActive = useRef(false);
  const detailFocus = useRef({ x: 50, y: 50 });
  const [discovery, setDiscovery] = useState<PhotoDetail | null>(null);
  const visible = useRef(false);
  const clock = useRef({ beat: 0, ended: false, failed: false });
  const callbacks = useRef({ onScene });
  const [beat, setBeat] = useState(0);
  const [auto, setAuto] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [inView, setInView] = useState(false);
  const [voice, setVoice] = useState(true);
  const [captions, setCaptions] = useState(true);
  const [paused, setPaused] = useState(false);
  const [voiceTime, setVoiceTime] = useState(0);
  const [voiceError, setVoiceError] = useState("");
  const [finished, setFinished] = useState(false);
  const active = storyBeats[beat];
  const clip = narration[beat];
  const image = studies[active.image];
  const point = photoDetails.find(point => point?.id === active.hotspot);
  const cue = clip.cues.find(c => voiceTime >= c.start && voiceTime < c.end) ?? (voiceTime < (clip.cues[0]?.start ?? 0) ? clip.cues[0] : undefined);

  useEffect(() => { callbacks.current = { onScene }; }, [onScene]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change(); media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);

  useEffect(() => {
    clock.current = { beat, ended: false, failed: false };
  }, [beat]);
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    const shouldPlay = sound && voice && inView && !suspended && !paused && !discovery && !document.hidden;
    let cancelled = false;
    if (!shouldPlay) { player.pause(); onVoice(false); return; }
    // A short dwell avoids narrating every intermediate scene during a fast scroll.
    const timer = setTimeout(() => {
      if (clock.current.ended) return;
      void player.play().catch(() => {
        if (cancelled) return;
        clock.current.failed = true;
        setVoiceError("Voice paused. Press Replay narration to try again; the transcript remains available.");
        onVoice(false);
      });
    }, 220);
    return () => { cancelled = true; clearTimeout(timer); player.pause(); onVoice(false); };
  }, [beat, sound, voice, inView, suspended, paused, auto, discovery, onVoice]);

  useEffect(() => {
    if (!discovery) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [discovery]);

  useEffect(() => {
    if (!playRequest || !track.current) return;
    let cancelled = false;
    window.scrollTo({ top: window.scrollY + track.current.getBoundingClientRect().top + 2, behavior: "instant" });
    if (audio.current) audio.current.currentTime = 0;
    clock.current = { beat: 0, ended: false, failed: false };
    automaticClock.current = { beat: -1, time: 0, tail: 0 };
    currentBeat.current = 0;
    queueMicrotask(() => { if (!cancelled) { setBeat(0); setPaused(false); setFinished(false); setAuto(true); autoRef.current = true; } });
    return () => { cancelled = true; };
  }, [playRequest]);

  useEffect(() => {
    const element = track.current;
    const view = stage.current;
    if (!element || !view) return;
    let frame = 0, lastTime = 0, target = 0, current = 0;
    let { time: silentTime, tail, beat: lastAutoBeat } = automaticClock.current;
    let width = view.clientWidth, height = view.clientHeight;
    const animated = motion && !reduced;
    const measure = () => {
      width = view.clientWidth; height = view.clientHeight;
      const rect = element.getBoundingClientRect();
      target = clamp(-rect.top / Math.max(1, element.offsetHeight - height));
      const shown = rect.top < height * .4 && rect.bottom > height * .7;
      if (shown !== visible.current) { visible.current = shown; setInView(shown); }
    };
    const render = (time: number) => {
      const elapsedReal = lastTime ? time - lastTime : 16;
      const elapsed = Math.min(250, elapsedReal);
      lastTime = time;
      // Keep the same DOM audio element, camera position and play state while exploring.
      // On return the voice continues at its currentTime; the camera follows that clock.
      if (suspended) { frame = 0; return; }
      if (autoRef.current && !document.hidden && !discoveryActive.current) {
        const index = Math.max(0, currentBeat.current);
        const scene = storyBeats[index];
        const end = storyBeats[index + 1]?.start ?? 1;
        const player = audio.current;
        if (lastAutoBeat !== index) { silentTime = clock.current.beat === index ? player?.currentTime ?? 0 : 0; tail = 0; lastAutoBeat = index; }
        const useVoice = sound && voice && !clock.current.failed;
        if (!useVoice) silentTime += elapsedReal / 1000;
        const duration = useVoice && player && Number.isFinite(player.duration) ? player.duration : narration[index].duration;
        const fraction = clamp((useVoice ? (clock.current.beat === index ? player?.currentTime ?? 0 : 0) : silentTime) / duration);
        if (useVoice) silentTime = player?.currentTime ?? 0;
        let desired = scene.start + .0005 + (end - scene.start - .009) * fraction;
        const ended = useVoice ? clock.current.beat === index && Boolean(player?.ended) : fraction >= 1;
        if (ended) {
          tail += elapsedReal / 1600;
          desired = end - .008 + .01 * clamp(tail);
          if (index === storyBeats.length - 1 && tail >= 1) { autoRef.current = false; setAuto(false); setFinished(true); setPaused(true); }
        }
        const top = window.scrollY + element.getBoundingClientRect().top;
        window.scrollTo({ top: top + (element.offsetHeight - height) * Math.min(.999, desired), behavior: "instant" });
        automaticClock.current = { beat: index, time: silentTime, tail };
        measure();
      }
      current = animated ? current + (target - current) * (1 - Math.exp(-elapsed / 110)) : target;
      if (Math.abs(current - target) < .00005) current = target;
      const index = beatAt(current);
      const next = storyBeats[index];
      const previous = storyBeats[Math.max(0, index - 1)];
      const t = smooth((current - next.start) / .045);
      const fade = smooth((current - next.start) / .012);
      let zoom = animated ? previous.image === next.image ? previous.zoom + (next.zoom - previous.zoom) * t : 1 + (next.zoom - 1) * t : 1;
      let focus: [number, number] = animated && previous.image === next.image ? [previous.focus[0] + (next.focus[0] - previous.focus[0]) * t, previous.focus[1] + (next.focus[1] - previous.focus[1]) * t] : next.focus;
      const blendTarget = discovery ? 1 : 0;
      detailBlend.current = animated ? detailBlend.current + (blendTarget - detailBlend.current) * (1 - Math.exp(-elapsed / 220)) : blendTarget;
      if (Math.abs(detailBlend.current - blendTarget) < .001) detailBlend.current = blendTarget;
      if (lastDetail.current && detailBlend.current > 0) {
        const targetDetail = lastDetail.current;
        const easing = animated ? 1 - Math.exp(-elapsed / 240) : 1;
        detailFocus.current.x += (targetDetail.x - detailFocus.current.x) * easing;
        detailFocus.current.y += (targetDetail.y - detailFocus.current.y) * easing;
        const detail = detailFocus.current;
        const blend = detailBlend.current;
        focus = [focus[0] + (detail.x - focus[0]) * blend, focus[1] + (detail.y - focus[1]) * blend];
        zoom += (2.15 - zoom) * blend;
      }
      // A slow optical drift keeps a still photograph alive without altering its contents.
      if (animated && visible.current && !paused) {
        zoom *= 1.018 + Math.sin(time / 13000) * .006;
        focus = [focus[0] + Math.sin(time / 17000) * .22, focus[1] + Math.cos(time / 19000) * .14];
      }
      images.current.forEach((img, imageIndex) => {
        if (!img) return;
        const shown = imageIndex === next.image;
        const leaving = previous.image !== next.image && imageIndex === previous.image;
        img.style.opacity = String(shown ? previous.image === next.image || !animated ? 1 : fade : leaving && animated ? 1 - fade : 0);
        img.style.zIndex = shown ? "2" : "1";
        if (shown) {
          if (studies[imageIndex].portrait) {
            img.style.width = `${width}px`; img.style.height = `${height}px`; img.style.transform = "none";
          } else {
            const camera = cameraFrame(width, height, focus, zoom, next.side, studies[imageIndex].aspect);
            img.style.width = `${camera.imageWidth}px`; img.style.height = `${camera.imageHeight}px`;
            img.style.transform = `translate3d(${camera.x}px,${camera.y}px,0) scale(${camera.zoom})`;
            const detail = photoDetails.find(point => point?.id === next.hotspot);
            if (hotspot.current && detail) {
              const pointX = camera.x + camera.imageWidth * camera.zoom * detail.x / 100;
              hotspot.current.style.left = `${pointX}px`;
              hotspot.current.dataset.edge = pointX > width - 180 ? "right" : "left";
              hotspot.current.style.top = `${camera.y + camera.imageHeight * camera.zoom * detail.y / 100}px`;
            }
          }
        }
      });
      if (copy.current) copy.current.style.opacity = String(animated && index > 0 ? .4 + .6 * smooth((current - next.start) / .018) : 1);
      if (meter.current) meter.current.style.transform = `scaleX(${current})`;
      if (index !== currentBeat.current) { currentBeat.current = index; setBeat(index); setPaused(false); setFinished(false); setVoiceError(""); }
      callbacks.current.onScene(next.image < 3 ? next.image : 2, Math.min(1, (zoom - 1) / 1.7));
      frame = 0;
      if (autoRef.current || Math.abs(current - target) > .00005 || detailBlend.current !== blendTarget || (animated && visible.current && !paused)) frame = requestAnimationFrame(render);
    };
    const update = () => { measure(); if (!frame) frame = requestAnimationFrame(render); };
    const interrupt = () => { if (!suspended && !discovery && autoRef.current) { autoRef.current = false; setAuto(false); } };
    const key = (event: KeyboardEvent) => { if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", "Escape"].includes(event.key)) interrupt(); };
    const hidden = () => { if (document.hidden) { interrupt(); audio.current?.pause(); setPaused(true); } };
    const observer = new ResizeObserver(update); observer.observe(view);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("wheel", interrupt, { passive: true });
    window.addEventListener("touchstart", interrupt, { passive: true });
    window.addEventListener("keydown", key); document.addEventListener("visibilitychange", hidden);
    measure(); current = target; update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); window.removeEventListener("scroll", update); window.removeEventListener("wheel", interrupt); window.removeEventListener("touchstart", interrupt); window.removeEventListener("keydown", key); document.removeEventListener("visibilitychange", hidden); };
  }, [motion, reduced, auto, suspended, sound, voice, discovery, paused]);

  function openDiscovery(point: PhotoDetail) {
    if (!discovery) {
      discoveryActive.current = true; detailFocus.current = { x: point.x, y: point.y };
      savedPassage.current = { time: autoRef.current && (!sound || !voice) ? automaticClock.current.time : audio.current?.currentTime ?? 0, scroll: window.scrollY, auto: autoRef.current, paused, focus: document.activeElement as HTMLElement | null };
      audio.current?.pause();
      onDiscovery(true);
    }
    lastDetail.current = point;
    setDiscovery(point);
  }
  function resumePassage() {
    if (!discovery) return;
    discoveryActive.current = false;
    setDiscovery(null); onVoice(false);
    window.scrollTo({ top: savedPassage.current.scroll, behavior: "instant" });
    setPaused(savedPassage.current.paused);
    autoRef.current = savedPassage.current.auto; setAuto(savedPassage.current.auto);
    onDiscovery(false);
    requestAnimationFrame(() => savedPassage.current.focus?.focus({ preventScroll: true }));
  }
  useEffect(() => {
    const key = (event: KeyboardEvent) => { if (event.key === "Escape" && discovery && !suspended) { event.preventDefault(); resumePassage(); } };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });

  function seek(index: number) {
    automaticClock.current = { beat: -1, time: 0, tail: 0 };
    autoRef.current = false; setAuto(false); setPaused(false); setFinished(false);
    if (!track.current || !stage.current) return;
    const top = window.scrollY + track.current.getBoundingClientRect().top;
    window.scrollTo({ top: top + (track.current.offsetHeight - stage.current.clientHeight) * (storyBeats[index].start + .048), behavior: "instant" });
  }
  function replayVoice() {
    if (!sound) onSound();
    setVoice(true); setPaused(false); setVoiceError(""); setVoiceTime(0);
    clock.current.ended = false; clock.current.failed = false;
    if (audio.current) { audio.current.currentTime = 0; void audio.current.play().catch(() => setVoiceError("Voice is unavailable. Read the transcript below.")); }
  }
  function toggleAuto() {
    if (finished) { seek(0); currentBeat.current = 0; setBeat(0); if (audio.current) audio.current.currentTime = 0; clock.current = { beat: 0, ended: false, failed: false }; }
    // Resume the existing media/silent clock. Only explicit replay starts at zero.
    if (!auto && !sound) onSound();
    setPaused(auto); autoRef.current = !auto; setAuto(!auto); setFinished(false);
  }

  return <><section ref={track} id="chapter-one" className={styles.scrollTrack} aria-label="Immersive photographic story">
    <span className={styles.chapterAnchor} id="switzerland" style={{ top: "15.5%" }} />
    <span className={styles.chapterAnchor} id="new-zealand" style={{ top: "50%" }} />
    <audio ref={audio} src={clip.audio} preload="auto" data-testid="documentary-audio"
      onLoadedMetadata={() => { setVoiceTime(0); }}
      onTimeUpdate={() => setVoiceTime(audio.current?.currentTime ?? 0)}
      onPlaying={() => { clock.current.failed = false; setVoiceError(""); onVoice(true); }}
      onPause={() => onVoice(false)}
      onEnded={() => { clock.current.ended = true; onVoice(false); }}
      onError={() => { clock.current.failed = true; setVoiceError("Voice is unavailable for this scene. The transcript remains available."); onVoice(false); }} />
    <div ref={stage} className={styles.stickyStage} data-testid="immersive-stage" data-scene={beat} data-exploring={Boolean(discovery)}>
      <div className={styles.cameraWindow} aria-hidden="true">{Array.from(new Set(storyBeats.map(beat => beat.image))).map(index => { const study = studies[index]; return <div key={study.id} className={styles.cameraImage} data-portrait={study.portrait || undefined} ref={(el) => { images.current[index] = el; }}><img src={study.image} alt="" draggable={false} /></div>; })}</div>
      <div className={styles.cinemaShade} data-side={active.side} />
      <div className={styles.stageTop}><span>A JOURNEY IN PHOTOGRAPHS / {auto ? "DOCUMENTARY MODE" : "YOUR OWN PACE"}</span><button onClick={() => onMap(active.image)}><Compass size={17} /> {active.image === 4 ? "Travel to Switzerland" : active.image === 5 ? "Travel to New Zealand" : "Explore the globe"}</button></div>
      <button hidden={!point || Boolean(discovery)} ref={hotspot} className={styles.storyHotspot} onClick={() => { if (point) openDiscovery(point); }} aria-label={`Discover: ${point?.title}`}><Plus size={22} /><span>{point?.id === "church" ? "The church" : point?.id === "landscape" ? "The landscape" : point?.id === "sign" ? "The sign" : "The people"}</span></button>
      <div ref={copy} className={styles.storyCopy} data-side={active.side} key={beat}>
        <span className={styles.storyLabel}>{active.label}</span>
        <h2>{active.title.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
        <p>{active.text}</p>
        <button onClick={() => point ? openDiscovery(point) : onPhoto(active.image)} className={styles.detailButton}><ArrowsOut size={18} /> Look within the photograph <ArrowRight size={17} /></button>
      </div>
      <div className={styles.sceneIndex} aria-label="Photographic scenes">{storyBeats.map((item, index) => <button key={item.label} aria-label={`Scene ${index + 1}: ${item.title.replace("\n", " ")}`} aria-current={beat === index ? "step" : undefined} onClick={() => seek(index)}><span>{String(index + 1).padStart(2, "0")}</span></button>)}</div>
      <div className={styles.narrationDock}>
        {captions && <div className={styles.captionLine} aria-label="Narration subtitles">{sound && voice && !paused ? cue?.text ?? "" : ""}</div>}
        {voiceError && <p className={styles.voiceError} role="status">{voiceError}</p>}
        <div className={styles.transport}>
          <button className={styles.documentaryPlay} onClick={toggleAuto} aria-label={auto ? "Pause documentary" : finished ? "Replay documentary" : "Play documentary"} aria-pressed={auto}>{auto ? <Pause size={18} weight="fill" /> : <Play size={18} weight="fill" />}<span>{auto ? "Pause documentary" : finished ? "Watch again" : paused ? "Resume documentary" : "Let the story guide you"}</span></button>
          <div className={styles.voiceTools}>
            <button onClick={() => setVoice(!voice)} aria-label={voice ? "Turn narration off" : "Turn narration on"} aria-pressed={voice}><Microphone size={18} /><span>Voice</span></button>
            <button onClick={() => setCaptions(!captions)} aria-label="Subtitles" aria-pressed={captions}><ClosedCaptioning size={21} /></button>
            <button onClick={replayVoice} aria-label="Replay narration"><ArrowCounterClockwise size={18} /></button>
            <button onClick={onSound} aria-label={sound ? "Mute immersive sound" : "Enable immersive sound"}>{sound ? <SpeakerHigh size={19} /> : <SpeakerSlash size={19} />}</button>
            <span className={styles.audioTime}>{stamp(voiceTime)} / {stamp(clip.duration)}</span>
          </div>
        </div>
        <div className={styles.documentaryMeta}><span>{finished ? "The story is yours to continue." : auto ? sound && voice ? "The voice guides the journey · scroll to take control" : "A gentle pace · scroll to take control" : "Scroll to discover"} <ArrowDown size={12} /></span><span>{image.provenance?.label ?? "AI visual reconstruction"} · {String(beat + 1).padStart(2,"0")} / {storyBeats.length}</span></div>
      </div>
      <div className={styles.progressTrack}><div ref={meter} /></div>
      {discovery && <InlineDetail key={discovery.id} point={discovery} side={active.side} sound={sound} suspended={suspended} onSound={onSound} onVoice={onVoice} onReturn={resumePassage} returnLabel={savedPassage.current.paused ? "Return to documentary" : "Resume documentary"} savedTime={savedPassage.current.time} alternatives={photoDetails.filter(point => point.image === active.image)} onSelect={openDiscovery} />}
    </div>
    </section><details className={styles.transcript}><summary>Read the documentary transcript <span>English · synthetic narrator · demo script</span></summary><div>{narration.map((item,index)=><article key={item.id}><button onClick={()=>seek(index)}>{String(index+1).padStart(2,"0")} / {storyBeats[index].title.replace("\n"," ")}</button><p>{item.text}</p></article>)}</div></details>
  </>;
}
