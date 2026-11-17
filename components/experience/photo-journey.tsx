/* Native images keep the full-resolution study available for the zoomable viewer. */
/* eslint-disable @next/next/no-img-element */
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowRight, Check, Compass, MagnifyingGlass, Plus, SlidersHorizontal, SpeakerHigh, SpeakerSlash, X } from "@phosphor-icons/react";
import { studies } from "@/lib/experience/content";
import { photoDetails } from "@/lib/experience/photo-details";
import { storyBeats } from "@/lib/experience/scroll-story";
import { AmbientScore } from "@/lib/experience/ambient-score";
import styles from "./experience.module.css";
import immersion from "./immersion.module.css";
import { ScrollJourney } from "./scroll-journey";
import { PhotoExplorer } from "./photo-explorer";
import type { DetailBookmark } from "./inline-detail";
import { AlpineCinema, type PlaceRequest } from "./alpine-cinema";
import chaletStyles from "./chalet-walk.module.css";
import cinemaStyles from "./alpine-cinema.module.css";

const SpatialArchive = dynamic(() => import("./spatial-archive").then((module) => module.SpatialArchive), { ssr: false, loading: () => <p className={styles.loading}>Opening the map…</p> });
const ChaletWalk = dynamic(() => import("./chalet-walk").then(module => module.ChaletWalk), { ssr: false, loading: () => <div className={chaletStyles.preload} role="status">Preparing your visit<small>Materials, light and the world beyond the window.</small></div> });
type Panel = "photo" | "archive" | "chapters" | "about" | "sound" | null;
const sections = ["top", "chapter-one", "switzerland", "new-zealand", "concept-arctic"];
const chapterNames = ["A world within a photograph", "Prologue · Weston A. Price", "Switzerland · Lötschental", "New Zealand · Rotorua", "Arctic · A separate visual concept"];

export function PhotoJourney() {
  const [panel, setPanel] = useState<Panel>(null);
  const [atlasOpen, setAtlasOpen] = useState(false);
  const [cinematicOpen, setCinematicOpen] = useState(false);
  const [cinematicVisited, setCinematicVisited] = useState(false);
  const [houseOpen, setHouseOpen] = useState(false);
  const [houseVisited, setHouseVisited] = useState(false);
  const [villageRequest, setVillageRequest] = useState<PlaceRequest | null>(null);
  // The home opens like a documentary: a living portrait and a line of the prologue, then the valley and the title.
  const [opening, setOpening] = useState(true);
  const [openingRun, setOpeningRun] = useState(0);
  const portrait = useRef<HTMLVideoElement>(null);
  const immersiveOpen = cinematicOpen || houseOpen;
  const cinematicReturn = useRef<{ scroll: number; focus: HTMLElement | null }>({ scroll: 0, focus: null });
  const [atlasPhoto, setAtlasPhoto] = useState<number>();
  const [bookmark, setBookmark] = useState("");
  const returnPoint = useRef<{ scroll: number; focus: HTMLElement | null }>({ scroll: 0, focus: null });
  const [detailId, setDetailId] = useState<string>();



  const [photo, setPhoto] = useState(0);
  const [discoveryActive, setDiscoveryActive] = useState(false);
  const photoReturnFocus = useRef<HTMLElement | null>(null);
  const [photoBookmarks] = useState(() => new Map<string, DetailBookmark>());




  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("All photographs");
  const [active, setActive] = useState(0);
  const [sound, setSound] = useState(false);
  const [audioBusy, setAudioBusy] = useState(false);
  const [audioError, setAudioError] = useState("");
  const [volume, setVolume] = useState(35);
  const [playRequest, setPlayRequest] = useState(0);
  const voiceSpeaking = useRef(false);
  const [motion, setMotion] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const score = useRef<AmbientScore | null>(null);

  const item = studies[photo];


  const soundScene = useRef({ index: 0, intensity: 0 });
  const changeScene = useCallback((index: number, intensity: number) => { soundScene.current = { index, intensity }; score.current?.setScene(index, intensity); }, []);

  const changeVoice = useCallback((speaking: boolean) => { voiceSpeaking.current = speaking; score.current?.setDucking(speaking); }, []);

  // The exploratory soundscape has its own opt-in control; suspend the documentary score.
  useEffect(() => {
    if (immersiveOpen) void score.current?.pause();
    else if (sound) void score.current?.play().catch(() => setAudioError("The music could not resume. Use Sound to try again."));
  }, [immersiveOpen, sound]);

  useEffect(() => {
    if (!opening) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Start the silent portrait explicitly: on a server-rendered page the browser may have skipped autoplay before React marked it muted.
    const video = portrait.current;
    if (video && !still) { video.muted = true; video.currentTime = 0; void video.play().catch(() => {}); }
    const timer = setTimeout(() => setOpening(false), still ? 0 : 6400);
    const scrolled = () => { if (window.scrollY > 40) setOpening(false); };
    window.addEventListener("scroll", scrolled, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", scrolled); };
  }, [opening, openingRun]);

  useEffect(() => {
    if (!panel || panel === "photo") return;
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, [panel]);
  useEffect(() => {
    if (!panel && !atlasOpen && !immersiveOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previous; };
  }, [panel, atlasOpen, immersiveOpen]);
  const returnToStory = useCallback(() => {
    setAtlasOpen(false);
    requestAnimationFrame(() => { window.scrollTo({ top: returnPoint.current.scroll, behavior: "instant" }); returnPoint.current.focus?.focus({ preventScroll: true }); });
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape" && atlasOpen && !panel) returnToStory(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [atlasOpen, panel, returnToStory]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) setActive(sections.indexOf(entry.target.id));
    }, { rootMargin: "-15% 0px -60% 0px" });
    sections.forEach((id) => { const element = document.getElementById(id); if (element) observer.observe(element); });
    const reveal = new IntersectionObserver((entries) => entries.forEach((entry) => {
      if (entry.isIntersecting) { entry.target.setAttribute("data-seen", "true"); reveal.unobserve(entry.target); }
    }), { threshold: 0.12 });
    document.querySelectorAll("[data-reveal]").forEach((element) => reveal.observe(element));
    const hide = () => { if (document.hidden) { void score.current?.pause(); setSound(false); } };
    document.addEventListener("visibilitychange", hide);
    return () => { observer.disconnect(); reveal.disconnect(); document.removeEventListener("visibilitychange", hide); score.current?.dispose(); score.current = null; };
  }, []);

  function openPhoto(index: number, showDetail = false, hotspotId?: string) {
    if (panel !== "photo") photoReturnFocus.current = document.activeElement as HTMLElement | null;
    const point = photoDetails.find(point => point.image === index && (!hotspotId || point.id === hotspotId));
    setDetailId(showDetail ? point?.id : undefined); setPhoto(index); setPanel("photo");
  }
  function closePhoto() {
    setPanel(null);
    requestAnimationFrame(() => photoReturnFocus.current?.focus({ preventScroll: true }));
  }
  function openAtlas(imageIndex?: number) {
    if (!atlasOpen) {
      returnPoint.current = { scroll: window.scrollY, focus: document.activeElement as HTMLElement | null };
      const scene = Number(document.querySelector('[data-testid="immersive-stage"]')?.getAttribute("data-scene") ?? 0);
      setBookmark(`${houseOpen ? "Inside the Alpine house" : cinematicOpen ? "An Alpine exploration" : storyBeats[scene].title.replace("\n", " ")} · Your place is saved`);
      setAtlasPhoto(imageIndex ?? storyBeats[scene].image);
    } else if (imageIndex !== undefined) setAtlasPhoto(imageIndex);
    setPanel(null); setAtlasOpen(true);
  }
  function openCinema() {
    cinematicReturn.current = { scroll: window.scrollY, focus: document.activeElement as HTMLElement | null };
    setCinematicVisited(true); setCinematicOpen(true);
  }
  function openHouse() {
    if (!cinematicOpen) cinematicReturn.current = { scroll: window.scrollY, focus: document.activeElement as HTMLElement | null };
    setHouseVisited(true); setHouseOpen(true);
  }
  function closeHouse() {
    if (cinematicOpen) setHouseOpen(false); else closeCinema();
  }
  function closeCinema(continueStory = false) {
    setHouseOpen(false); setCinematicOpen(false); setAtlasOpen(false); setPanel(null);
    requestAnimationFrame(() => {
      const story = document.getElementById("chapter-one");
      const target = continueStory && story ? Math.max(story.offsetTop, Math.min(cinematicReturn.current.scroll, story.offsetTop + story.offsetHeight - window.innerHeight)) : cinematicReturn.current.scroll;
      window.scrollTo({ top: target, behavior: "instant" });
      cinematicReturn.current.focus?.focus({ preventScroll: true });
    });
  }
  async function toggleSound() {
    if (audioBusy) return;
    setAudioBusy(true); setAudioError("");
    try {
      if (sound) { await score.current?.pause(); setSound(false); }
      else { score.current ??= new AmbientScore(); score.current.setVolume(volume / 100); score.current.setDucking(voiceSpeaking.current); score.current.setScene(soundScene.current.index, soundScene.current.intensity); if (!immersiveOpen) await score.current.play(); setSound(true); }
    } catch { setAudioError("Sound is unavailable in this browser. The full story is available without it."); setSound(false); }
    finally { setAudioBusy(false); }
  }
  function goTo(index: number) {
    setPanel(null);
    document.getElementById(sections[index])?.scrollIntoView({ behavior: motion && !window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant" });
  }
  const filtered = studies.filter((study) => (theme === "All photographs" || study.theme === theme) && `${study.title} ${study.subtitle} ${study.description}`.toLowerCase().includes(query.toLowerCase()));
  const titles = { photo: item.title, archive: "Follow your curiosity.", chapters: "A journey, at your own pace.", about: "A new way into the archive.", sound: "Make room for the atmosphere." };

  return <div className={styles.experience} data-motion={motion ? "on" : "off"}>
    <div inert={atlasOpen || panel === "photo" || immersiveOpen} aria-hidden={atlasOpen || panel === "photo" || immersiveOpen || undefined}>
    <a className={styles.skipLink} href="#chapter-one">Skip to the story</a>
    <header inert={discoveryActive} aria-hidden={discoveryActive || undefined} data-discovery={discoveryActive} className={`${styles.header} ${active > 0 ? styles.headerSolid : ""}`}>
      <a href="#top" onClick={(event) => { event.preventDefault(); goTo(0); }} className={styles.brand} aria-label="Weston A. Price, return to the beginning"><span>WESTON A. PRICE</span><small>A JOURNEY IN PHOTOGRAPHS</small></a>
      <nav aria-label="Main navigation" className={styles.nav}>
        <button onClick={() => setPanel("chapters")}>Chapters</button>
        <button onClick={() => setPanel("archive")}>Archive</button>
        <button onClick={() => openAtlas()}>Globe</button>
        <button className={cinemaStyles.navLink} onClick={openCinema}>Living scene</button>
        <button className={styles.aboutNav} onClick={() => setPanel("about")}>About</button>
        <button className={styles.soundButton} aria-label={sound ? "Sound on" : "Sound off"} onClick={toggleSound} disabled={audioBusy} aria-pressed={sound}>{sound ? <SpeakerHigh size={19} /> : <SpeakerSlash size={19} />}<span>Sound {sound ? "on" : "off"}</span></button>
        <button className={styles.settingsButton} onClick={() => setPanel("sound")} aria-label="Sound and motion settings"><SlidersHorizontal size={18} /></button>
      </nav>
    </header>

    <section className={`${styles.hero} ${immersion.heroStage}`} id="top" aria-labelledby="journey-title" data-opening={opening}>
      {/* Archival-style imagery is explicitly identified as generated visual studies. */}

      <img className={styles.heroImage} src={studies[4].image} alt={studies[4].alt} fetchPriority="high" />
      <div className={styles.heroShade} />
      <div key={openingRun} className={immersion.opening} data-done={!opening} inert={!opening} aria-hidden={!opening || undefined} onClick={() => setOpening(false)}>
        <img className={immersion.openingGlow} src={studies[3].image} alt="" aria-hidden="true" />
        <div className={immersion.openingCopy}><span>Weston A. Price · An interactive documentary</span><p>A researcher. A camera.<br />A world of questions.</p></div>
        <figure className={immersion.openingPortrait}><video ref={portrait} src="/cinematic/home/price-living-portrait.mp4" poster={studies[3].image} muted playsInline autoPlay preload="auto" aria-label="Weston A. Price: a portrait animated with AI from the supplied photograph" /><figcaption>Weston A. Price · Portrait animated with AI from the supplied photograph · Not archival footage</figcaption></figure>
        <button className={immersion.openingSkip} onClick={(event) => { event.stopPropagation(); setOpening(false); }}>Skip the opening <ArrowRight size={14} /></button>
      </div>
      <div className={styles.heroContent} inert={opening} data-hero-part="copy">
        <span className={styles.eyebrow}>Weston A. Price · An interactive documentary</span>
        <h1 id="journey-title">A world within<br />a photograph.</h1>
        <p>Every photograph holds a story.<br />Listen. Look closer. Follow your curiosity.</p>
        <div className={styles.heroActions}>
          <button className={styles.outlineButton} onClick={() => { if (!sound) void toggleSound(); setPlayRequest(value => value + 1); }}>Watch the documentary <ArrowDown size={18} /></button>
          <button className={styles.textButton} onClick={openHouse}>Walk inside the house <ArrowRight size={18} /></button>
        </div>
      </div>
      <button className={styles.heroHotspot} disabled={opening} data-hero-part="aside" onClick={() => openPhoto(4, true)}><span><Plus size={20} /></span>Look closer</button>
      <div className={styles.heroBottom} inert={opening} data-hero-part="aside"><button onClick={() => setPanel("about")}>Historical photographs · About the journey</button><button onClick={() => { setOpeningRun(run => run + 1); setOpening(true); }}>Replay the opening</button><span>Scroll to begin <ArrowDown size={14} /></span><span>8 scenes · About 4 minutes</span></div>
    </section>

    <nav hidden={active !== 0} className={`${styles.progressRail} ${active === 1 || active === 3 ? styles.progressDark : ""}`} aria-label="Story progress">{sections.map((id, index) => <button key={id} onClick={() => goTo(index)} aria-label={chapterNames[index]} aria-current={active === index ? "step" : undefined}><span className={styles.progressLabel}>{chapterNames[index]}</span><span className={styles.progressDot} /></button>)}</nav>

    <ScrollJourney motion={motion} sound={sound} suspended={panel !== null || atlasOpen || immersiveOpen} onSound={toggleSound} onPhoto={openPhoto} onMap={openAtlas} onScene={changeScene} onVoice={changeVoice} playRequest={playRequest} onDiscovery={setDiscoveryActive} />
    <section className={cinemaStyles.invitation} aria-labelledby="living-scene-title"><div className={cinemaStyles.preview} aria-hidden="true">{["valley", "village", "foreground"].map(name => <img key={name} src={`/cinematic/alpine/${name}.webp`} alt="" loading="lazy" />)}</div><div className={cinemaStyles.invitationCopy}><span>AI-GENERATED RECREATION · SWITZERLAND</span><h2 id="living-scene-title">A village to enter.<br />A world to explore.</h2><p>Wander through an imagined Alpine village. Enter the church and a timber home, follow the stream, and listen to a description only when you choose.</p><button onClick={openCinema}>{cinematicVisited ? "Return to the living scene" : "Enter the living scene"} <ArrowRight size={20} /></button></div></section>
    <section className={immersion.worldInvitation}>
      <div><span>The story has more than one path</span><h2>From a detail.<br /><em>Into a world.</em></h2><p>Pull back from the photograph. Turn the globe, drift between places, and choose where your curiosity takes you next.</p><button onClick={() => openAtlas()}>Explore the living atlas <Compass size={21} /></button></div>
      <div className={immersion.invitationPhotos}><img src={studies[4].image} alt={studies[4].alt} loading="lazy" /><img src={studies[5].image} alt={studies[5].alt} loading="lazy" /></div>
    </section>
    <section className={styles.collectionSection}>
      <div className={styles.collectionHeading}><div><span className={styles.eyebrow}>The journey continues</span><h2>Follow your curiosity.</h2></div><button className={styles.textButton} onClick={() => setPanel("archive")}>Open the archive <ArrowRight size={19} /></button></div>
      <div className={styles.photoGrid}>{studies.slice(3).map((study, index) => <button className={styles.photoCard} key={study.id} onClick={() => openPhoto(index + 3)}><img src={study.image} alt={study.alt} loading="lazy" /><span className={styles.cardMeta}>0{index + 1} / {study.subtitle}</span><span className={styles.cardTitle}>{study.title}<ArrowRight size={20} /></span></button>)}</div>
      <div className={styles.archiveBottom}><span>Historical photographs. Documented places. Connected stories.</span><button onClick={() => openAtlas()}>Explore the globe <Compass size={18} /></button></div>
    </section>
    <section id="concept-arctic" className={`${styles.collectionSection} ${immersion.conceptSection}`}><div className={styles.collectionHeading}><div><span className={styles.eyebrow}>A separate visual exploration · AI-generated imagery</span><h2>An imagined Arctic.</h2><p>A study in atmosphere, movement and close looking. These scenes are independent of the historical documentary.</p></div></div><div className={styles.photoGrid}>{studies.slice(0,3).map((study,index)=><button key={study.id} className={styles.photoCard} onClick={()=>openPhoto(index)}><img src={study.image} alt={study.alt} loading="lazy" /><span className={styles.cardMeta}>Visual concept · No historical location assigned</span><span className={styles.cardTitle}>{study.title}<ArrowRight size={20}/></span></button>)}</div></section><footer className={styles.footer}><div className={styles.brand}><span>WESTON A. PRICE</span><small>A JOURNEY IN PHOTOGRAPHS</small></div><p>A direction for the digital archive.<br />Historical photographs and a demo narrator.</p><button onClick={() => setPanel("about")}>About this experience <ArrowRight size={17} /></button><button onClick={() => setPanel("sound")}>Sound & motion <SlidersHorizontal size={17} /></button><button onClick={() => goTo(0)}>Back to the beginning <ArrowDown className={styles.upArrow} size={16} /></button></footer>
    {audioError && <div className={styles.audioNotice} role="status">{audioError}<button onClick={() => setAudioError("")} aria-label="Dismiss audio message"><X size={18} /></button></div>}

    </div>
    {cinematicVisited && <AlpineCinema onHouse={openHouse} houseOpen={houseOpen} request={villageRequest} open={cinematicOpen} suspended={houseOpen || atlasOpen || panel !== null} motion={motion} onVoice={changeVoice} onClose={() => closeCinema()} onContinue={() => closeCinema(true)} onPhoto={() => openPhoto(4)} onMap={() => openAtlas(4)} />}
    {houseVisited && <ChaletWalk open={houseOpen} suspended={atlasOpen || panel !== null} motion={motion} fromVillage={cinematicOpen} onClose={closeHouse} onVillage={(place) => { if (place) setVillageRequest(previous => ({ place, id: (previous?.id ?? 0) + 1 })); setHouseOpen(false); setCinematicVisited(true); setCinematicOpen(true); }} onDocumentary={() => closeCinema(true)} onMap={() => openAtlas(4)} onPhoto={(detail) => openPhoto(4, !!detail, detail)} onVoice={changeVoice} />}
    {atlasOpen && <div inert={panel === "photo"} aria-hidden={panel === "photo" || undefined}><SpatialArchive motion={motion} initialPhoto={atlasPhoto} onPhoto={openPhoto} onReturn={returnToStory} onVoice={changeVoice} rise={immersiveOpen} onValley={() => { setVillageRequest(previous => ({ place: "overlook", id: (previous?.id ?? 0) + 1 })); if (!immersiveOpen) cinematicReturn.current = { scroll: returnPoint.current.scroll, focus: returnPoint.current.focus }; setHouseOpen(false); setCinematicVisited(true); setCinematicOpen(true); setAtlasOpen(false); setPanel(null); }} bookmark={bookmark} returnLabel={houseOpen ? "Return to house" : cinematicOpen ? "Return to living scene" : undefined} /></div>}
    {panel === "photo" && <PhotoExplorer index={photo} initialDetail={detailId} sound={sound} motion={motion} fromAtlas={atlasOpen} fromCinema={immersiveOpen} returnLabel={houseOpen ? "Return to house" : undefined} onSound={toggleSound} onVoice={changeVoice} onClose={closePhoto} onDocumentary={() => { if (immersiveOpen) closeCinema(true); else { setPanel(null); if (atlasOpen) returnToStory(); else closePhoto(); } }} onPhoto={openPhoto} onMap={openAtlas} bookmarks={photoBookmarks} />}
    {panel && panel !== "photo" && <dialog ref={dialog} className={`${styles.dialog} ${panel === "archive" ? styles.largeDialog : ""}`} onCancel={() => setPanel(null)} onClick={(event) => { if (event.target === event.currentTarget) setPanel(null); }} aria-labelledby="panel-title">
      <div className={styles.dialogSurface}>
        <div className={styles.dialogHeading}><div><span className={styles.eyebrow}>A journey in photographs</span><h2 id="panel-title">{titles[panel]}</h2></div><button className={styles.closeButton} onClick={() => setPanel(null)} aria-label="Close panel" autoFocus><X size={24}/></button></div>

        {panel === "archive" && <div className={styles.archivePanel}><div className={styles.archiveFilters}><label className={styles.searchBox}><MagnifyingGlass size={21} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the photographs" aria-label="Search the photographs" />{query && <button onClick={() => setQuery("")} aria-label="Clear search"><X size={18} /></button>}</label><label className={styles.selectLabel}>Theme<select value={theme} onChange={(event) => setTheme(event.target.value)}>{["All photographs", "Travel", "Coast", "Daily life"].map((option) => <option key={option}>{option}</option>)}</select></label></div><p className={styles.resultsCount} role="status">{filtered.length} {filtered.length === 1 ? "image" : "images"} · Historical photographs and clearly marked visual concepts</p>{filtered.length ? <div className={styles.photoGrid}>{filtered.map((study) => <button className={styles.photoCard} key={study.id} onClick={() => openPhoto(studies.indexOf(study))}><img src={study.image} alt={study.alt} /><span className={styles.cardMeta}>{study.subtitle}</span><span className={styles.cardTitle}>{study.title}<ArrowRight size={20} /></span></button>)}</div> : <div className={styles.emptyState}><MagnifyingGlass size={36} weight="light" /><h3>No photographs found.</h3><p>Try a different word or explore the photographs and visual studies.</p><button className={styles.inkButton} onClick={() => { setQuery(""); setTheme("All photographs"); }}>Show all photographs <ArrowRight size={17} /></button></div>}</div>}
        {panel === "chapters" && <div className={styles.chapterMenu}><p>Follow the story in sequence, or choose a place to pause.</p>{chapterNames.map((name, index) => <button key={name} onClick={() => goTo(index)}><span>0{index}</span><span>{name}</span>{active === index ? <Check size={21} /> : <ArrowRight size={21} />}</button>)}<small>Documentary · Switzerland & New Zealand / Arctic concept separately</small></div>}
        {panel === "about" && <div className={styles.prosePanel}><p className={styles.lead}>Photographs lead. Stories unfold. The archive is always within reach.</p><p>This prototype explores a new way to encounter Weston A. Price’s photographic archive: a guided story with room for close looking and free exploration.</p><h3>About the images and words</h3><p>The documentary uses three images supplied in the project folder: a portrait and Figures 1 and 68 from Price’s book. Six additional historical images connect the globe to Peru, Rarotonga, North Island and New Caledonia. Three AI-generated Arctic studies are available in a separate concept section. The Alpine exploration connects a layered valley with four generated environments, including imagined church and home interiors. It is explicitly labeled as an artistic recreation, with optional sound and descriptions. Historical context is linked in each source panel. Reconstruction subjects, dates and locations are not assigned archival identities. The narrator and script are a contemporary demonstration, not Price’s recorded voice.</p><h3>From visual study to living archive</h3><p>The next step is to work with reviewed photographs, captions, field notes, and community perspectives. Each connection will distinguish the historical source, editorial interpretation, and later research.</p><h3>Sound, at your pace</h3><p>The optional ambient score and changing wind and water textures are original synthesized sound studies. It contains no archival audio or claimed recordings from these places.</p><button className={styles.inkButton} onClick={() => setPanel("archive")}>Explore the visual studies <ArrowRight size={18} /></button></div>}
        {panel === "sound" && <div className={styles.prosePanel}><p className={styles.lead}>An invitation to slow down.</p><p>A synthetic English narrator follows each scene. The music lowers beneath the voice, then returns between passages. Use the Voice and Subtitles controls in the story, or explore in silence.</p><button className={styles.preferenceRow} onClick={toggleSound} disabled={audioBusy} aria-pressed={sound}><span>{sound ? <SpeakerHigh size={24} /> : <SpeakerSlash size={24} />} Sound · voice & music</span><span>{sound ? "On" : "Off"}</span></button><label className={styles.volumeLabel} htmlFor="ambient-volume">Music level <output>{volume}%</output></label><input id="ambient-volume" className={styles.volumeSlider} type="range" min="0" max="100" value={volume} onChange={(event) => { const next = Number(event.target.value); setVolume(next); score.current?.setVolume(next / 100); }} /><button className={styles.preferenceRow} aria-pressed={motion} onClick={() => setMotion(!motion)}><span>Gentle motion</span><span>{motion ? "On" : "Off"}</span></button><p className={styles.smallNote}>Your device’s reduced-motion setting always takes priority. Sound pauses when you leave this tab.</p>{audioError && <p role="status">{audioError}</p>}</div>}
      </div>
    </dialog>}
  </div>;
}
