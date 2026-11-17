/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Pause, Play, Plus, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { studies, regions } from "@/lib/experience/content";
import { photoDetails, type PhotoDetail } from "@/lib/experience/photo-details";
import { cameraFrame } from "@/lib/experience/scroll-story";
import { containedPhotoFrame, narratedRoute, nextNarratedStop } from "@/lib/experience/archive-tour";
import { InlineDetail, type DetailBookmark } from "./inline-detail";
import styles from "./immersion.module.css";

const atlasPhotos = Array.from(new Set(regions.flatMap(region => region.photos)));
type Frame = ReturnType<typeof cameraFrame>;

export function PhotoExplorer({ index, initialDetail, sound, motion, fromAtlas, fromCinema = false, returnLabel, onSound, onVoice, onClose, onDocumentary, onPhoto, onMap, bookmarks }: {
  index: number; initialDetail?: string; sound: boolean; motion: boolean; fromAtlas: boolean; fromCinema?: boolean; returnLabel?: string;
  onSound: () => void; onVoice: (active: boolean) => void; onClose: () => void; onDocumentary: () => void;
  onPhoto: (index: number) => void; onMap: (index: number) => void;
  bookmarks: Map<string, DetailBookmark>;
}) {
  const image = studies[index];
  const contained = image.portrait || (image.aspect ?? 1.5) < 1;
  const points = photoDetails.filter(point => point.image === index);
  const [pointId, setPointId] = useState(initialDetail);
  const [paused, setPaused] = useState(false);
  const [guided, setGuided] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [betweenPassages, setBetweenPassages] = useState(false);
  const [replay, setReplay] = useState(0);
  const [trail, setTrail] = useState<{ index: number; frame: Frame } | null>(null);
  const [size, setSize] = useState({ width: 1440, height: 900 });
  const [reduced, setReduced] = useState(false);
  const viewport = useRef<HTMLElement>(null);
  const filmstrip = useRef<HTMLElement>(null);
  const back = useRef<HTMLButtonElement>(null);
  const point = points.find(point => point.id === pointId);
  const region = regions.find(region => region.photos.includes(index));
  const gallery = region ? atlasPhotos : studies.flatMap((study, photo) => Boolean(study.provenance) === Boolean(image.provenance) ? [photo] : []);
  const position = gallery.indexOf(index);
  const route = narratedRoute(gallery, photoDetails);
  const side = contained || !point || point.x >= 50 ? "left" : "right";
  const focus: [number, number] = point ? [point.x, point.y] : [50, 50];
  const zoom = point ? point.zoom ?? 2.15 : contained ? 1 : 1.04;
  const camera = contained ? containedPhotoFrame(size.width, size.height, image.aspect ?? .75, focus, zoom) : cameraFrame(size.width, size.height, focus, zoom, side, image.aspect);
  const animated = motion && !reduced;
  const frameStyle = (frame: Frame) => ({ width: frame.imageWidth, height: frame.imageHeight, transform: `translate3d(${frame.x}px,${frame.y}px,0) scale(${frame.zoom})` });

  useEffect(() => {
    back.current?.focus({ preventScroll: true });
    const element = viewport.current;
    if (!element) return;
    const observer = new ResizeObserver(() => setSize({ width: element.clientWidth, height: element.clientHeight }));
    observer.observe(element);
    const media = matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setReduced(media.matches);
    change(); media.addEventListener("change", change);
    return () => { observer.disconnect(); media.removeEventListener("change", change); };
  }, []);

  // A photograph change does not remount this session or the shared ambient score.
  const choosePhoto = useCallback((photo: number, nextPoint?: PhotoDetail) => {
    setBetweenPassages(false); setCompleted(false);
    if (photo !== index) setTrail({ index, frame: camera });
    const next = nextPoint ?? (point || guided ? photoDetails.find(detail => detail.image === photo) : undefined);
    if (next && bookmarks.get(next.id)?.ended) bookmarks.delete(next.id);
    setPointId(next?.id);
    onPhoto(photo);
  }, [index, camera, point, guided, onPhoto, bookmarks]);

  useEffect(() => {
    if (!trail) return;
    const timer = setTimeout(() => setTrail(null), animated ? 1100 : 0);
    return () => clearTimeout(timer);
  }, [trail, animated]);

  useEffect(() => {
    const strip = filmstrip.current;
    const selected = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (strip && selected) strip.scrollTo({ left: selected.offsetLeft - (strip.clientWidth - selected.offsetWidth) / 2, behavior: animated ? "smooth" : "instant" });
  }, [index, animated]);

  function selectPoint(detail: PhotoDetail) {
    setBetweenPassages(false); setCompleted(false); setPointId(detail.id);
    // Deliberate selection may replay a finished passage; unfinished ones resume.
    if (bookmarks.get(detail.id)?.ended) { bookmarks.delete(detail.id); setReplay(value => value + 1); }
    setPaused(false);
    if (!sound) onSound();
  }

  function toggleJourney() {
    if (guided && !completed) { setPaused(!paused); if (!sound) onSound(); return; }
    const first = completed ? route[0] : point ?? points[0];
    if (!first) return;
    if (bookmarks.get(first.id)?.ended) { bookmarks.delete(first.id); setReplay(value => value + 1); }
    if (first.image !== index) choosePhoto(first.image, first);
    else setPointId(first.id);
    setGuided(true); setPaused(false); setCompleted(false); setBetweenPassages(false);
    if (!sound) onSound();
  }

  useEffect(() => {
    if (!betweenPassages || !guided || paused || !sound || !point || document.hidden) return;
    const timer = setTimeout(() => {
      const next = nextNarratedStop(route, point.id);
      if (next) {
        // Guided progression starts each next passage; manual revisits retain bookmarks.
        bookmarks.delete(next.id);
        setReplay(value => value + 1);
        choosePhoto(next.image, next);
      } else { setCompleted(true); setGuided(false); setBetweenPassages(false); }
    }, 1800);
    return () => clearTimeout(timer);
  }, [betweenPassages, guided, paused, sound, point, route, bookmarks, choosePhoto]);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (pointId) { setPointId(undefined); setGuided(false); setBetweenPassages(false); back.current?.focus({ preventScroll: true }); }
        else onClose();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [pointId, onClose]);

  const stepPhoto = (direction: number) => choosePhoto(gallery[(position + direction + gallery.length) % gallery.length]);
  const showOverview = () => { setPointId(undefined); setGuided(false); setBetweenPassages(false); back.current?.focus({ preventScroll: true }); };

  return <section ref={viewport} className={styles.photoImmersion} aria-label={image.title} data-testid="photo-immersion" data-animated={animated} data-exploring={Boolean(point)} data-contained={contained || undefined}>
    <div className={styles.explorerScene}>
      {trail && <div className={`${styles.explorerCamera} ${styles.explorerTrail}`} style={frameStyle(trail.frame)} aria-hidden="true"><img src={studies[trail.index].image} alt=""/></div>}
      <div key={index} className={`${styles.explorerCamera} ${styles.explorerCurrent}`} style={frameStyle(camera)}>
        <img src={image.image} alt={image.alt} draggable={false}/>
        {!point && points.map(item => <button className={styles.explorerPin} style={{ left:`${item.x}%`, top:`${item.y}%` }} key={item.id} onClick={() => selectPoint(item)} aria-label={`Discover: ${item.title}`}><Plus size={20}/><span>{item.label}</span></button>)}
      </div>
    </div>
    <div className={styles.cinemaShade} data-side={side}/>
    <header className={styles.explorerHeader}>
      <button ref={back} onClick={onClose}><ArrowLeft size={19}/>{fromAtlas ? "Back to the globe" : fromCinema ? (returnLabel ?? "Return to living scene") : "Return to documentary"}</button>
      <span>{region?.name ?? "The photographic archive"} / {String(position + 1).padStart(2, "0")} of {gallery.length}</span>
      <div>{(fromAtlas || fromCinema) && <button onClick={onDocumentary} title="Resume the documentary from your saved place"><Play size={15}/><span>Resume documentary</span></button>}<button onClick={onSound} aria-label={sound ? "Mute photograph sound" : "Enable photograph sound"}>{sound ? <SpeakerHigh size={20}/> : <SpeakerSlash size={20}/>}</button></div>
    </header>
    {!point && <div key={index} className={styles.explorerOverview}>
      <span className={styles.storyLabel}>{region?.country ?? image.subtitle}</span><h2>{image.title}</h2><p>{image.description}</p>
      <div className={styles.explorerActions}>{points.map(item => <button key={item.id} onClick={() => selectPoint(item)}><Plus size={16}/>{item.label}</button>)}{region && <button onClick={() => onMap(index)}><Compass size={16}/> Locate photograph</button>}</div>
      <details className={styles.explorerSource}><summary>Image & source</summary><p>{image.provenance?.note ?? "AI-generated visual concept. No historical date or location is assigned."}</p>{image.provenance && <><p>{image.provenance.date}<br/>{image.provenance.reference}</p><a href={image.provenance.url} target="_blank" rel="noreferrer">Read the source <ArrowRight size={14}/></a></>}</details>
    </div>}
    {point && <InlineDetail key={`${point.id}:${replay}`} point={point} side={side} sound={sound} suspended={false} onSound={onSound} onVoice={onVoice} onReturn={showOverview} returnLabel="See the whole photograph" alternatives={points} onSelect={selectPoint} gallery bookmark={bookmarks.get(point.id)} paused={paused} onPausedChange={setPaused} onProgress={progress => bookmarks.set(point.id, progress)} onComplete={() => setBetweenPassages(true)}/>}
    <footer className={styles.explorerFooter}>
      <div className={styles.explorerSequence}>
        <button onClick={() => stepPhoto(-1)} aria-label="Previous photograph"><ArrowLeft size={18}/><span>Previous</span></button>
        {points.length > 0 ? <button className={styles.guideButton} onClick={toggleJourney} aria-pressed={guided && !paused} aria-label={guided && !paused ? "Pause photo journey" : guided ? "Resume photo journey" : completed ? "Replay photo journey" : "Play photo journey"}>{guided && !paused ? <Pause size={15}/> : <Play size={15}/>}<span>{completed ? "Journey complete · play again" : guided ? paused ? "Resume photo journey" : betweenPassages ? "The story continues…" : "Pause photo journey" : "Let the photographs guide you"}</span></button> : <span>Explore at your own pace</span>}
        <button onClick={() => stepPhoto(1)} aria-label="Next photograph"><span>Next photograph</span><ArrowRight size={18}/></button>
      </div>
      <nav ref={filmstrip} className={styles.photoFilmstrip} aria-label="Connected photographs">{gallery.map(photo => <button key={photo} aria-label={`Open photograph: ${studies[photo].title}`} aria-current={photo === index ? "true" : undefined} onClick={() => choosePhoto(photo)}><img src={studies[photo].image} alt=""/><span>{studies[photo].title}<small>{regions.find(place => place.photos.includes(photo))?.country ?? studies[photo].subtitle}</small></span></button>)}</nav>
    </footer>
  </section>;
}
