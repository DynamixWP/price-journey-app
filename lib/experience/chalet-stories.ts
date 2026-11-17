import * as THREE from "three";
import { livingPortrait, sheetSets, type SheetSetId, type StorySheet } from "./story-content";
import { wrapLibraryIndex } from "./library-content";
import type { ChaletObjectId } from "./chalet-layout";

/** Real archive sheets to hold, and a loaf and cheese that point to Price's account of daily food. */
export async function createChaletStories(scene: THREE.Scene, wood: THREE.Material, textures: THREE.Texture[]) {
  const loader = new THREE.TextureLoader(), objects = new Map<ChaletObjectId, THREE.Group>();
  const paper = new THREE.MeshStandardMaterial({ color: "#efe6cd", roughness: .95 }), brass = new THREE.MeshStandardMaterial({ color: "#a5915e", roughness: .4, metalness: .65 });
  function label(record: StorySheet) {
    const canvas = document.createElement("canvas"); canvas.width = 1024; canvas.height = 640; const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#e6dbc1"; ctx.fillRect(0, 0, 1024, 640); ctx.fillStyle = "#3d493a"; ctx.font = "25px sans-serif"; ctx.fillText("SOURCE RECORD / CONTEMPORARY LABEL", 55, 85);
    ctx.font = "37px Georgia"; ctx.fillText(record.title.slice(0, 45), 55, 195); ctx.font = "24px sans-serif"; ctx.fillText(record.source.slice(0, 68), 55, 290); ctx.fillText(record.kind.slice(0, 68), 55, 345);
    ctx.font = "22px sans-serif"; ctx.fillText(record.local.split("/").pop()!.slice(0, 70), 55, 430); ctx.fillText("The paper sheet is recreated. The image keeps its own source.", 55, 525);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4; textures.push(texture); return texture;
  }
  const selectors = {} as Record<SheetSetId, (index: number) => void>;
  async function sheetSet(id: SheetSetId, width: number, height: number, place: (group: THREE.Group) => void) {
    const records = sheetSets[id], images = await Promise.all(records.map(record => loader.loadAsync(record.image)));
    for (const texture of images) { texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 8; textures.push(texture); }
    const backs = records.map(label), group = new THREE.Group(); group.userData.interaction = id;
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(width, height, .006), paper); sheet.castShadow = true; sheet.receiveShadow = true; group.add(sheet);
    const printMaterial = new THREE.MeshStandardMaterial({ map: images[0], roughness: .9 }), print = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), printMaterial); print.position.z = .0045; group.add(print);
    const backMaterial = new THREE.MeshStandardMaterial({ map: backs[0], roughness: 1 }), back = new THREE.Mesh(new THREE.PlaneGeometry(width * .92, height * .92), backMaterial); back.rotation.y = Math.PI; back.position.z = -.0045; group.add(back);
    selectors[id] = index => {
      const chosen = wrapLibraryIndex(index, records.length), aspect = records[chosen].aspect, room = [width * .92, height * .92];
      printMaterial.map = images[chosen]; backMaterial.map = backs[chosen]; print.scale.set(aspect > room[0] / room[1] ? room[0] : room[1] * aspect, aspect > room[0] / room[1] ? room[0] / aspect : room[1], 1);
    };
    selectors[id](0); place(group); scene.add(group); objects.set(id, group);
  }
  // The route maps are pinned to the plaster beside the stove; the negatives rest on the bench under the window wall.
  await sheetSet("maps", .42, .52, group => { group.position.set(-3.655, 1.55, -.4); group.rotation.y = Math.PI / 2; });
  for (const z of [-.57, -.23]) { const pin = new THREE.Mesh(new THREE.SphereGeometry(.012, 12, 12), brass); pin.position.set(-3.645, 1.79, z); pin.userData.ignoreRay = true; scene.add(pin); }
  await sheetSet("negatives", .36, .24, group => { group.position.set(3.17, .549, .75); group.rotation.set(-Math.PI / 2, 0, .22); });
  const envelope = new THREE.Mesh(new THREE.BoxGeometry(.4, .004, .28), new THREE.MeshStandardMaterial({ color: "#b9a67e", roughness: 1 })); envelope.position.set(3.19, .543, .72); envelope.rotation.y = -.12; envelope.receiveShadow = true; envelope.userData.ignoreRay = true; scene.add(envelope);
  // Whole rye bread and summer cheese on a board: modelled objects, tied to a documented account.
  const loaf = new THREE.Group(); loaf.userData.interaction = "loaf"; loaf.position.set(1.62, .923, -.98); loaf.rotation.y = .5;
  const board = new THREE.Mesh(new THREE.CylinderGeometry(.2, .2, .018, 40), wood); board.castShadow = true; board.receiveShadow = true; loaf.add(board);
  const crust = new THREE.MeshStandardMaterial({ color: "#5d3f27", roughness: 1 }), bread = new THREE.Mesh(new THREE.SphereGeometry(.1, 32, 20), crust); bread.scale.set(1.25, .56, .9); bread.position.set(-.035, .06, -.02); bread.castShadow = true; loaf.add(bread);
  for (const offset of [-.045, 0, .045]) { const score = new THREE.Mesh(new THREE.BoxGeometry(.006, .004, .13), new THREE.MeshStandardMaterial({ color: "#c7ab82", roughness: 1 })); score.position.set(-.035 + offset, .1145 - Math.abs(offset) * .18, -.02); score.rotation.y = .35; loaf.add(score); }
  const cheese = new THREE.Mesh(new THREE.CylinderGeometry(.085, .085, .055, 32, 1, false, 0, 1.25), new THREE.MeshStandardMaterial({ color: "#d9be7a", roughness: .7 })); cheese.position.set(.06, .0365, .075); cheese.castShadow = true; loaf.add(cheese);
  scene.add(loaf); objects.set("loaf", loaf);
  // A framed portrait above the bench that comes to life when the visitor is near. The movement is AI-generated and says so.
  const video = document.createElement("video"); video.src = livingPortrait.video; video.muted = true; video.playsInline = true; video.preload = "auto"; video.loop = false; video.load();
  const film = new THREE.VideoTexture(video); film.colorSpace = THREE.SRGBColorSpace; textures.push(film);
  const portrait = new THREE.Group(); portrait.position.set(3.648, 1.78, 1.2); portrait.rotation.y = -Math.PI / 2; portrait.userData.interaction = "portrait"; portrait.userData.reachPoint = [0, 0, .05];
  const frame = new THREE.Mesh(new THREE.BoxGeometry(.5, .66, .035), new THREE.MeshStandardMaterial({ color: "#3b2c1f", roughness: .7 })); frame.castShadow = true; portrait.add(frame);
  const mount = new THREE.Mesh(new THREE.PlaneGeometry(.45, .61), paper); mount.position.z = .0185; portrait.add(mount);
  const picture = new THREE.Mesh(new THREE.PlaneGeometry(.36, .36 * 752 / 560), new THREE.MeshStandardMaterial({ map: film, emissiveMap: film, emissive: "#ffffff", emissiveIntensity: .22, roughness: .7 })); picture.position.set(0, .015, .0195); portrait.add(picture);
  const plaqueCanvas = document.createElement("canvas"); plaqueCanvas.width = 1024; plaqueCanvas.height = 128; const plaqueContext = plaqueCanvas.getContext("2d")!; plaqueContext.fillStyle = "#a5915e"; plaqueContext.fillRect(0, 0, 1024, 128); plaqueContext.fillStyle = "#2c2617"; plaqueContext.font = "40px sans-serif"; plaqueContext.textAlign = "center"; plaqueContext.fillText("PORTRAIT ANIMATED WITH AI · NOT ARCHIVAL FOOTAGE", 512, 78);
  const plaqueMap = new THREE.CanvasTexture(plaqueCanvas); plaqueMap.colorSpace = THREE.SRGBColorSpace; plaqueMap.anisotropy = 4; textures.push(plaqueMap);
  const plaque = new THREE.Mesh(new THREE.PlaneGeometry(.34, .0425), new THREE.MeshStandardMaterial({ map: plaqueMap, roughness: .5, metalness: .3 })); plaque.position.set(0, -.385, .006); portrait.add(plaque);
  scene.add(portrait);
  let clock = 0, nextPlay = 0; video.onended = () => { nextPlay = clock + 4; };
  return {
    objects, targets: new Map<string, THREE.Group>([["portrait", portrait]]),
    select(set: SheetSetId, index: number) { selectors[set](index); },
    /** The portrait plays while someone is in the room near it, rests a few seconds between takes, and stays still under reduced motion. */
    update(time: number, reduced: boolean, viewer: THREE.Vector3) {
      clock = time; const near = viewer.z < 3.4 && Math.hypot(viewer.x - 3.2, viewer.z - 1.2) < 3.6;
      if (reduced || !near) { if (!video.paused) video.pause(); return; }
      if (video.paused && time >= nextPlay && video.readyState >= 2) { if (video.ended || video.currentTime > 3.9) video.currentTime = 0; void video.play().catch(() => {}); }
    },
    dispose() { video.onended = null; video.pause(); video.removeAttribute("src"); video.load(); },
  };
}
export type ChaletStories = Awaited<ReturnType<typeof createChaletStories>>;
