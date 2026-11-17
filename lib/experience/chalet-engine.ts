import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createChaletWorld, type ChaletWorld } from "./chalet-world";
import { canWalk, findWalkPath, moveInChalet, tourStops, type ChaletObjectId, type WalkPoint } from "./chalet-layout";
import { houseActions, walkingVelocity, guidedPace, walkBob, spinDecay, lookAngle, viewfinderCrop, type HouseAction, type HouseDiscovery } from "./chalet-discoveries";
import type { HouseSound } from "./chalet-sound";
import { libraryStations, libraryRecords, libraryPages, wrapLibraryIndex, type LibraryStation } from "./library-content";
import { livingPortrait, sheetSets, storyStations, type SheetSetId } from "./story-content";

export type ChaletState={mode:"guided"|"free";walking:boolean;paused:boolean;tour:boolean;stop:number;doorOpen:boolean;inside:boolean;held:ChaletObjectId|null;near:string|null;aim:"cursor"|"center";reachable:ChaletObjectId[];position:WalkPoint;heading:number;looked:boolean;walked:boolean;examined:ChaletObjectId[];lamp:boolean;window:boolean;drawer:boolean;discovered:HouseDiscovery[];pointerLocked:boolean;mouseLook:boolean;viewfinder:boolean;quality:"balanced"|"cinematic";destination:string;record:number;page:number;projecting:boolean;backlit:boolean;sheets:Record<SheetSetId,number>};
export type ChaletCallbacks={onState:(state:ChaletState)=>void;onStep:(inside:boolean)=>void;onError:(message:string)=>void;onEffect:(sound:HouseSound)=>void;onSnapshot:(image:string)=>void;onJournal:()=>void;onHelp:()=>void;onMenu:()=>void;onLibrary:(station:LibraryStation)=>void;onSight:(id:"church"|"portrait")=>void};
type HomeTransform={position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3};

const EYE=1.65,VIEW=62,HOLD_VIEW=56,FINDER_VIEW=48,SPIN=5.5;
const glintTargets=new Set(["camera","bowl","photograph","book","plate","lamp","projector","drawer","maps","negatives","loaf"]);
/** Things away from the table have their own place to stand. */
const pickStations:Partial<Record<ChaletObjectId,{label:string;point:WalkPoint;look:readonly number[]}>>={plate:libraryStations.plate,book:libraryStations.book,maps:storyStations.maps,negatives:storyStations.negatives};
const wrapAngle=(angle:number)=>Math.atan2(Math.sin(angle),Math.cos(angle));
/** Softens and dims the room behind an object in the visitor's hands. */
const focusShader={
  vertex:`varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
  fragment:`uniform sampler2D tDiffuse;uniform vec2 texel;uniform float amount;varying vec2 vUv;
void main(){vec3 color=vec3(0.);float total=0.;
for(int x=-3;x<=3;x++){for(int y=-3;y<=3;y++){vec2 offset=vec2(float(x),float(y));float weight=exp(-dot(offset,offset)/9.);color+=texture2D(tDiffuse,vUv+offset*texel*amount*2.4).rgb*weight;total+=weight;}}
float edge=smoothstep(.95,.2,length(vUv-.5));gl_FragColor=vec4(color/total*mix(1.,mix(.42,.74,edge),amount),1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`,
};

export class ChaletEngine {
  private renderer:THREE.WebGLRenderer;
  private camera=new THREE.PerspectiveCamera(VIEW,1,.03,220);
  private world:ChaletWorld|null=null;
  private composer:EffectComposer|null=null;private ao:GTAOPass|null=null;
  private resize:ResizeObserver;
  private active=false;private disposed=false;private frame=0;private previous=0;private lastState=0;private elapsed=0;
  private keys=new Set<string>();private touch={forward:0,right:0};private velocity={x:0,z:0};
  private drag:{x:number;y:number;distance:number;time:number}|null=null;
  private hover={x:0,y:0};private aimCursor=false;private lookPreferred=true;private cursorNeeded=true;private lookedAt=-1e9;private lookTravel=0;private walkTravel=0;private intro=false;private introFrom=0;
  private paused=false;private settling=false;private tour=false;private path:WalkPoint[]=[];private destination=0;private destinationName="The approach";
  private targetPoint:WalkPoint={...tourStops[0].point};private targetLook:readonly number[]=tourStops[0].look;private intent:(()=>void)|null=null;
  private yaw=.3;private pitch=.03;private viewYaw=.3;private viewPitch=.03;private doorTarget=0;private sensitivity=1;
  private pace=0;private stride=0;private footfall=0;private gait=0;
  private held:ChaletObjectId|null=null;private heldTween=false;private returning:ChaletObjectId|null=null;private homes=new Map<ChaletObjectId,HomeTransform>();
  private spin={x:0,y:0};private turnStep=new THREE.Quaternion();private turnEuler=new THREE.Euler();
  private afterReturn:(()=>void)|null=null;
  private pendingStation:LibraryStation|null=null;private pendingNote=false;private record=0;private page=0;private projecting=false;private backlit=false;private sheets:Record<SheetSetId,number>={maps:0,negatives:0};
  private holdDistance=.82;private examined=new Set<ChaletObjectId>();private discovered=new Set<HouseDiscovery>();
  private mode:"guided"|"free"="guided";private near:string|null=null;private viewfinder=false;private quality:"balanced"|"cinematic"="balanced";
  private mood={lamp:false,window:false,drawer:false};private pendingPick:ChaletObjectId|null=null;private pendingAction:HouseAction|null=null;
  private ray=new THREE.Raycaster();private pointer=new THREE.Vector2();private reduced=false;
  private inspectionLight=new THREE.PointLight("#fff0d1",1.5,3,2);
  private focus=0;private focusTarget:THREE.WebGLRenderTarget|null=null;private focusScene=new THREE.Scene();private focusCamera=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
  private focusMaterial=new THREE.ShaderMaterial({uniforms:{tDiffuse:{value:null},texel:{value:new THREE.Vector2()},amount:{value:0}},vertexShader:focusShader.vertex,fragmentShader:focusShader.fragment,depthTest:false,depthWrite:false});
  private marker:THREE.Mesh|null=null;private markerLife=0;private glint:THREE.Sprite|null=null;private glintId:string|null=null;private glintLevel=0;

  constructor(private host:HTMLElement,private callbacks:ChaletCallbacks){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.02;
    const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute("aria-label","Alpine house: drag to look, click the floor to walk, WASD to move, E to interact.");canvas.style.touchAction="none";canvas.style.cursor="grab";host.append(canvas);
    this.camera.position.set(tourStops[0].point.x,EYE,tourStops[0].point.z);this.camera.rotation.order="YXZ";this.camera.rotation.set(this.pitch,this.yaw,0);
    this.inspectionLight.position.set(.3,.4,.2);this.inspectionLight.visible=false;this.inspectionLight.layers.enable(1);this.camera.add(this.inspectionLight);
    const quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),this.focusMaterial);quad.frustumCulled=false;this.focusScene.add(quad);
    this.resize=new ResizeObserver(()=>this.resizeView());this.resize.observe(host);this.resizeView();
    canvas.addEventListener("pointerdown",this.pointerDown);canvas.addEventListener("pointermove",this.pointerMove);canvas.addEventListener("pointerup",this.pointerUp);canvas.addEventListener("pointercancel",this.cancelDrag);canvas.addEventListener("lostpointercapture",this.cancelDrag);canvas.addEventListener("pointerleave",this.pointerLeave);canvas.addEventListener("wheel",this.wheel,{passive:false});canvas.addEventListener("webglcontextlost",this.contextLost);
    window.addEventListener("keydown",this.keyDown);window.addEventListener("keyup",this.keyUp);window.addEventListener("blur",this.clearInput);document.addEventListener("visibilitychange",this.visibility);document.addEventListener("pointerlockchange",this.lockChange);
  }
  async load(){
    const world=await createChaletWorld();if(this.disposed){world.dispose();return;}this.world=world;world.scene.add(this.camera);
    for(const [id,object] of world.objects)this.homes.set(id,{position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});
    // A ring shows where a click will take the visitor; a faint glint marks what can be used.
    this.marker=new THREE.Mesh(new THREE.RingGeometry(.13,.17,40),new THREE.MeshBasicMaterial({color:"#f1dba6",transparent:true,opacity:0,depthWrite:false,fog:false}));this.marker.rotation.x=-Math.PI/2;this.marker.userData.ignoreRay=true;this.marker.visible=false;world.scene.add(this.marker);
    const spark=document.createElement("canvas");spark.width=spark.height=64;const context=spark.getContext("2d")!,gradient=context.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,"rgba(255,240,205,.95)");gradient.addColorStop(.25,"rgba(255,226,170,.38)");gradient.addColorStop(1,"rgba(255,226,170,0)");context.fillStyle=gradient;context.fillRect(0,0,64,64);
    this.glint=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(spark),transparent:true,opacity:0,depthTest:false,depthWrite:false,blending:THREE.AdditiveBlending,fog:false}));this.glint.userData.ignoreRay=true;this.glint.renderOrder=9;this.glint.visible=false;world.scene.add(this.glint);
    this.emit();this.renderOnce();if(this.active)this.start();
  }
  private resizeView(){const width=this.host.clientWidth||1,height=this.host.clientHeight||1;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.composer?.setSize(width,height);if(this.world)this.renderOnce();}
  setActive(active:boolean){this.active=active;this.clearInput();if(active)this.start();else{cancelAnimationFrame(this.frame);this.frame=0;this.releaseMouse();}}
  setReducedMotion(value:boolean){this.reduced=value;}
  /** Before the visit starts, the view pans slowly from the village toward the house: an establishing shot, not a control. */
  setIntro(value:boolean){if(value===this.intro)return;this.intro=value;this.introFrom=this.elapsed;if(value&&!this.reduced){this.yaw=this.viewYaw=-.2;this.pitch=this.viewPitch=.09;}}
  setSensitivity(value:number){this.sensitivity=THREE.MathUtils.clamp(value,.35,2);}
  setQuality(value:"balanced"|"cinematic"){
    this.quality=value;
    if(value==="cinematic"&&!this.composer&&this.world){
      const target=new THREE.WebGLRenderTarget(this.host.clientWidth,this.host.clientHeight,{type:THREE.HalfFloatType,samples:4});this.composer=new EffectComposer(this.renderer,target);this.composer.addPass(new RenderPass(this.world.scene,this.camera));
      this.ao=new GTAOPass(this.world.scene,this.camera,this.host.clientWidth,this.host.clientHeight);this.ao.blendIntensity=.55;this.ao.updateGtaoMaterial({radius:.24,thickness:.6,samples:8,screenSpaceRadius:false});this.ao.updatePdMaterial({samples:8,rings:2});this.composer.addPass(this.ao);this.composer.addPass(new OutputPass());
    }this.emit();
  }
  private start(){if(!this.world||this.frame||this.disposed||document.hidden)return;this.previous=0;this.frame=requestAnimationFrame(this.tick);}
  private renderOnce(){
    if(!this.world||this.disposed)return;
    if(this.focus>.01&&!this.viewfinder){this.renderFocused();return;}
    if(this.composer&&this.quality==="cinematic")this.composer.render();else this.renderer.render(this.world.scene,this.camera);
  }
  /** Room first, softened and dimmed; then the held object alone, sharp and lit, in front of it. */
  private renderFocused(){
    const scene=this.world!.scene,renderer=this.renderer,size=renderer.getDrawingBufferSize(new THREE.Vector2()),width=Math.max(2,Math.round(size.x/2)),height=Math.max(2,Math.round(size.y/2));
    if(!this.focusTarget)this.focusTarget=new THREE.WebGLRenderTarget(width,height,{type:THREE.HalfFloatType});else if(this.focusTarget.width!==width||this.focusTarget.height!==height)this.focusTarget.setSize(width,height);
    this.camera.layers.set(0);renderer.setRenderTarget(this.focusTarget);renderer.render(scene,this.camera);renderer.setRenderTarget(null);
    const uniforms=this.focusMaterial.uniforms;uniforms.tDiffuse.value=this.focusTarget.texture;(uniforms.texel.value as THREE.Vector2).set(1/width,1/height);uniforms.amount.value=this.focus;renderer.render(this.focusScene,this.focusCamera);
    const background=scene.background,autoClear=renderer.autoClear,shadows=renderer.shadowMap.autoUpdate;
    scene.background=null;renderer.autoClear=false;renderer.shadowMap.autoUpdate=false;renderer.clearDepth();this.camera.layers.set(1);
    renderer.render(scene,this.camera);
    this.camera.layers.set(0);scene.background=background;renderer.autoClear=autoClear;renderer.shadowMap.autoUpdate=shadows;
  }
  private cancelWalk(){this.paused=this.paused||this.path.length>0;this.path=[];this.pace=0;this.settling=false;this.pendingPick=null;this.pendingAction=null;this.pendingStation=null;this.pendingNote=false;}
  setMode(mode:"guided"|"free"){this.mode=mode;this.cancelWalk();this.clearInput();this.emit();this.focusCanvas();}
  focusCanvas(){this.renderer.domElement.focus({preventScroll:true});}
  private walkTo(point:WalkPoint,look:readonly number[],label:string){
    if(!this.world||this.held)return;if(this.returning){this.afterReturn=()=>this.walkTo(point,look,label);return;}
    this.pendingPick=null;this.pendingAction=null;this.pendingStation=null;this.pendingNote=false;this.intent=null;this.tour=false;this.targetPoint={...point};this.targetLook=look;this.destinationName=label;this.mode="guided";this.paused=false;this.settling=false;this.clearInput();
    this.path=findWalkPath(this.camera.position,point);
    if((this.camera.position.z<3.5)!==(point.z<3.5)){if(!this.doorTarget)this.callbacks.onEffect("door");this.doorTarget=-Math.PI/2;}
    if(!this.path.length)this.callbacks.onError("That spot is blocked. Choose an open part of the floor or one of the nearby places.");
    this.emit();
  }
  /** Walk to a stop. The guided tour keeps offering the next stop; a place chosen from the menu does not. */
  goTo(stop:number,tour=true){if(this.returning){this.afterReturn=()=>this.goTo(stop,tour);return;}this.destination=Math.max(0,Math.min(tourStops.length-1,stop));const target=tourStops[this.destination];this.walkTo(target.point,target.look,target.label);this.tour=tour;this.intent=()=>this.goTo(stop,tour);this.emit();}
  goToAction(action:HouseAction){const target=houseActions[action];this.walkTo(target.point,target.look,target.label);}
  visitLibrary(station:LibraryStation){
    if(this.held){this.putDown();this.afterReturn=()=>this.visitLibrary(station);return;}
    if(this.returning){this.afterReturn=()=>this.visitLibrary(station);return;}
    if(station==="plate"||station==="book"){this.pick(station);return;}
    const target=libraryStations[station];this.walkTo(target.point,target.look,target.label);this.pendingStation=station;this.intent=()=>this.visitLibrary(station);
  }
  highlightLibrary(station:LibraryStation|null){this.world?.library.highlight(station);}
  selectRecord(index:number){this.record=wrapLibraryIndex(index,libraryRecords.length);this.world?.library.select(this.record);this.callbacks.onEffect("paper");this.emit();}
  turnPage(index:number){this.page=wrapLibraryIndex(index,libraryPages.length);this.world?.library.setPage(this.page);this.callbacks.onEffect("paper");this.emit();}
  selectSheet(set:SheetSetId,index:number){this.sheets[set]=wrapLibraryIndex(index,sheetSets[set].length);this.world?.stories.select(set,this.sheets[set]);this.callbacks.onEffect("paper");this.emit();}
  togglePlateLight(){this.backlit=!this.backlit;this.world?.library.setLight(this.backlit);this.callbacks.onEffect("lamp");this.emit();}
  toggleProjection(){this.projecting=!this.projecting;this.world?.library.setProjection(this.projecting);this.discovered.add("projector");this.callbacks.onEffect("shutter");this.emit();}
  private arriveLibrary(station:LibraryStation){this.discovered.add(station);this.releaseMouse();this.world?.library.highlight(null);if(station==="projector"&&!this.projecting)this.toggleProjection();this.callbacks.onLibrary(station);this.emit();}
  viewChurch(){this.discovered.add("church");this.releaseMouse();this.callbacks.onSight("church");this.emit();}
  /** Walk up to the framed portrait, then open its note: what moves here is generated, and the original is close by. */
  viewPortrait(){
    if(this.held){this.putDown();this.afterReturn=()=>this.viewPortrait();return;}if(this.returning){this.afterReturn=()=>this.viewPortrait();return;}
    const station=livingPortrait.station;
    if(Math.hypot(this.camera.position.x-station.point.x,this.camera.position.z-station.point.z)>1.6){this.walkTo(station.point,station.look,station.label);this.pendingNote=true;this.intent=()=>this.viewPortrait();return;}
    this.cancelWalk();this.paused=false;this.intent=null;this.targetLook=station.look;this.settling=true;this.discovered.add("portrait");this.releaseMouse();this.callbacks.onSight("portrait");this.emit();
  }
  pauseWalk(){this.cancelWalk();this.clearInput();this.emit();}
  /** Resuming restores the whole intention: the walk and whatever was meant to happen on arrival. */
  resumeWalk(){const again=this.intent;if(again)again();else this.walkTo(this.targetPoint,this.targetLook,this.destinationName);}
  setTouch(forward:number,right:number){if(forward||right){this.cancelWalk();this.mode="free";this.tour=false;}this.touch={forward,right};this.emit();}
  /** Mouse look is the default on a desktop: the cursor is captured after the visitor's own click and Escape always frees it. */
  captureMouse(quiet=false){
    const canvas=this.renderer.domElement;if(this.cursorNeeded||(this.held&&!this.viewfinder)||document.pointerLockElement===canvas)return;
    const failed=()=>{if(!quiet)this.callbacks.onError("Mouse look is unavailable right now. Drag to look around; WASD and clicking still work.");};
    // Ask for raw mouse movement first: the system's pointer acceleration is what makes a quick flick overshoot.
    const request=(raw:boolean)=>(raw?canvas.requestPointerLock({unadjustedMovement:true}):canvas.requestPointerLock()) as Promise<void>|undefined;
    try{const promise=request(true);if(promise)void promise.catch((error:unknown)=>{if(error instanceof DOMException&&error.name==="NotSupportedError"){try{const plain=request(false);if(plain)void plain.catch(failed);}catch{failed();}}else failed();});}catch{failed();}
    this.focusCanvas();
  }
  releaseMouse(){if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();}
  /** Choose between captured mouse look and drag-to-look. `capture` applies the choice at once. */
  setMouseLook(value:boolean,capture=true){this.lookPreferred=value;if(capture){if(value)this.captureMouse();else this.releaseMouse();}this.emit();}
  resumeLook(){if(this.lookPreferred&&this.active)this.captureMouse(true);}
  /** Panels, menus and notes need a cursor; the scene takes it back when they close. */
  setCursorNeeded(value:boolean){const changed=this.cursorNeeded!==value;this.cursorNeeded=value;if(value)this.releaseMouse();else if(changed)this.resumeLook();}
  private lockChange=()=>{this.clearInput();this.aimCursor=false;if(document.pointerLockElement===this.renderer.domElement&&(this.cursorNeeded||(this.held&&!this.viewfinder)))this.releaseMouse();this.emit();};
  toggleDoor(){
    if(this.held||!this.world)return;
    if(Math.hypot(this.camera.position.x,this.camera.position.z-3.5)>3){this.goTo(1,false);return;}
    if(this.doorTarget!==0&&Math.abs(this.camera.position.x)<1.2&&this.camera.position.z>3.05&&this.camera.position.z<5.2){this.callbacks.onError("Step away from the doorway before closing the door.");return;}
    if(this.path.length)this.pauseWalk();this.doorTarget=this.doorTarget===0?-Math.PI/2:0;this.callbacks.onEffect("door");this.emit();
  }
  private interaction(object:THREE.Object3D|null):string|null{while(object){if(object.userData.interaction)return object.userData.interaction as string;object=object.parent;}return null;}
  private validHit(hit:THREE.Intersection){let object:THREE.Object3D|null=hit.object;while(object){if(!object.visible||object.userData.ignoreRay)return false;object=object.parent;}return hit.object instanceof THREE.Mesh;}
  private hits(){return this.world?this.ray.intersectObjects(this.world.scene.children.filter(object=>!object.userData.ignoreRay),true).filter(hit=>this.validHit(hit)):[];}
  private anchor(id:string){const object=this.world?.targets.get(id);if(!object)return null;return object.userData.reachPoint?object.localToWorld(new THREE.Vector3(...object.userData.reachPoint as [number,number,number])):new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());}
  private reachable(id:string){
    if(!this.world||this.held)return false;const position=this.anchor(id);if(!position)return false;
    if(this.camera.position.distanceTo(position)>2.8)return false;
    this.ray.set(this.camera.position,position.sub(this.camera.position).normalize());const hit=this.hits()[0];return !!hit&&this.interaction(hit.object)===id;
  }
  action(id:HouseAction){if(this.held)return;if(this.returning){this.afterReturn=()=>this.action(id);return;}if(!this.reachable(id)){this.goToAction(id);this.pendingAction=id;this.intent=()=>this.action(id);return;}this.cancelWalk();this.intent=null;this.mood[id]=!this.mood[id];this.discovered.add(id);this.callbacks.onEffect(id);this.emit();}
  pick(id:ChaletObjectId,afterWalk=false){
    if(!this.world||this.held)return;if(this.returning){this.afterReturn=()=>this.pick(id);return;}
    if(!this.reachable(id)){if(afterWalk){this.cancelWalk();this.callbacks.onError("Move a little closer to the object, then choose it again.");this.emit();return;}const target=pickStations[id]??tourStops[3];this.walkTo(target.point,target.look,target.label);this.pendingPick=id;this.intent=()=>this.pick(id);return;}
    this.cancelWalk();this.paused=false;this.intent=null;this.clearInput();this.releaseMouse();this.held=id;this.heldTween=true;this.holdDistance=.82;this.spin.x=this.spin.y=0;
    const object=this.world.objects.get(id)!;this.world.library.highlight(null);this.camera.attach(object);object.traverse(part=>part.layers.set(1));this.inspectionLight.visible=true;this.examined.add(id);this.discovered.add(id);this.callbacks.onEffect(id==="photograph"?"paper":"lift");this.emit();
  }
  putDown(){if(!this.held||!this.world)return;this.setViewfinder(false);const object=this.world.objects.get(this.held)!;this.world.scene.attach(object);object.traverse(part=>part.layers.set(0));const home=this.homes.get(this.held)!.position;this.targetLook=[home.x,home.y,home.z];this.settling=true;this.returning=this.held;this.held=null;this.heldTween=false;this.spin.x=this.spin.y=0;this.inspectionLight.visible=false;this.callbacks.onEffect("return");this.emit();this.resumeLook();}
  /** Turn around the screen axes, so a drag always moves the surface under the cursor. */
  private turn(object:THREE.Object3D,x:number,y:number){this.turnStep.setFromEuler(this.turnEuler.set(x,y,0));object.quaternion.premultiply(this.turnStep);}
  rotateObject(x:number,y:number){if(!this.held||!this.world||this.viewfinder)return;this.heldTween=false;if(this.reduced){this.turn(this.world.objects.get(this.held)!,x,y);return;}this.spin.x+=x*SPIN;this.spin.y+=y*SPIN;}
  flipPhotograph(){if(this.held!=="photograph"&&this.held!=="plate"&&this.held!=="maps"&&this.held!=="negatives")return;this.rotateObject(0,Math.PI);this.callbacks.onEffect("paper");}
  tapBowl(){if(this.held==="bowl")this.callbacks.onEffect("bowl");}
  resetObject(){if(!this.held||!this.world)return;this.heldTween=true;this.spin.x=this.spin.y=0;this.holdDistance=.82;}
  setObjectDistance(value:number){this.holdDistance=THREE.MathUtils.clamp(value,.55,1.15);}
  setViewfinder(value:boolean){if(this.held!=="camera"||!this.world)return;this.viewfinder=value;this.world.objects.get("camera")!.visible=!value;this.inspectionLight.visible=!value;this.camera.fov=value?FINDER_VIEW:HOLD_VIEW;this.camera.updateProjectionMatrix();this.clearInput();this.emit();if(value){this.focusCanvas();if(this.lookPreferred)this.captureMouse(true);}else this.releaseMouse();}
  snapshot(){
    if(!this.viewfinder||!this.world)return;this.renderOnce();
    const source=this.renderer.domElement,width=this.host.clientWidth,height=this.host.clientHeight,crop=viewfinderCrop(width,height),ratio=source.width/width;
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=683;
    canvas.getContext("2d")!.drawImage(source,crop.x*ratio,crop.y*ratio,crop.width*ratio,crop.height*ratio,0,0,1024,683);
    this.callbacks.onSnapshot(canvas.toDataURL("image/jpeg",.88));this.discovered.add("snapshot");this.callbacks.onEffect("shutter");this.emit();
  }
  private use(id:string|null){if(id==="church")this.viewChurch();else if(id==="portrait")this.viewPortrait();else if(id==="price"||id==="projector")this.visitLibrary(id);else if(id==="door")this.toggleDoor();else if(id&&id in houseActions)this.action(id as HouseAction);else if(id)this.pick(id as ChaletObjectId);}
  interact(){if(this.held){if(this.viewfinder)this.snapshot();else this.putDown();return;}this.use(this.near);}
  private pointerDown=(event:PointerEvent)=>{if(!this.active)return;this.focusCanvas();this.drag={x:event.clientX,y:event.clientY,distance:0,time:event.timeStamp};this.renderer.domElement.setPointerCapture(event.pointerId);};
  private pointerMove=(event:PointerEvent)=>{
    if(!this.active)return;const canvas=this.renderer.domElement,locked=document.pointerLockElement===canvas;
    if(!locked){const rect=canvas.getBoundingClientRect();this.hover.x=(event.clientX-rect.left)/rect.width*2-1;this.hover.y=-(event.clientY-rect.top)/rect.height*2+1;this.aimCursor=event.pointerType==="mouse";}
    if((!this.drag&&!locked)||this.intro)return;
    const dx=locked?event.movementX:event.clientX-this.drag!.x,dy=locked?event.movementY:event.clientY-this.drag!.y;
    if(this.drag){this.drag.x=event.clientX;this.drag.y=event.clientY;this.drag.distance+=Math.abs(dx)+Math.abs(dy);}
    if(this.held&&!this.viewfinder){
      if(!this.world||!this.drag)return;const elapsed=Math.max(.008,(event.timeStamp-this.drag.time)/1000),x=dy*.008,y=dx*.008;this.drag.time=event.timeStamp;this.heldTween=false;
      this.turn(this.world.objects.get(this.held)!,x,y);this.spin.x=THREE.MathUtils.clamp(THREE.MathUtils.lerp(this.spin.x,x/elapsed,.5),-5,5);this.spin.y=THREE.MathUtils.clamp(THREE.MathUtils.lerp(this.spin.y,y/elapsed,.5),-5,5);
    }else{
      // Looking around never interrupts a walk; it only takes the view back from the guide for a moment.
      const turn=lookAngle(dx,locked,this.sensitivity),tilt=lookAngle(dy,locked,this.sensitivity);
      this.yaw-=turn;this.pitch=THREE.MathUtils.clamp(this.pitch-tilt,-1.2,1.1);this.settling=false;this.lookedAt=performance.now();this.lookTravel+=Math.abs(turn)+Math.abs(tilt);
    }
  };
  private pointerUp=(event:PointerEvent)=>{
    const drag=this.drag,click=drag&&drag.distance<6;this.drag=null;
    if(drag&&(this.reduced||event.timeStamp-drag.time>90))this.spin.x=this.spin.y=0;
    if(!click||!this.active||!this.world||this.intro)return;
    const locked=document.pointerLockElement===this.renderer.domElement;
    if(this.viewfinder){if(locked)this.snapshot();return;}if(this.held)return;
    // With the cursor captured the centre of the view is the pointer; otherwise the cursor is.
    if(locked)this.pointer.set(0,0);else{const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);}
    this.ray.setFromCamera(this.pointer,this.camera);const hit=this.hits()[0],id=hit?this.interaction(hit.object):null;
    if(id)this.use(id);
    else if(!locked&&this.lookPreferred&&event.pointerType==="mouse")this.captureMouse(true);
    else this.walkToward(hit);
  };
  /** A click always means "go that way": the nearest place to stand on the way to whatever was clicked. */
  private walkToward(hit:THREE.Intersection|undefined){
    const from=this.camera.position,aim=this.ray.ray.direction,flat=Math.max(.2,Math.hypot(aim.x,aim.z));
    const x=hit&&hit.distance<14?hit.point.x:from.x+aim.x/flat*6,z=hit&&hit.distance<14?hit.point.z:from.z+aim.z/flat*6,length=Math.hypot(x-from.x,z-from.z);
    if(length<.5)return;const dx=(x-from.x)/length,dz=(z-from.z)/length;
    for(let back=0;back<length-.4;back+=.15){
      const point={x:x-dx*back,z:z-dz*back};if(!canWalk(point,true))continue;
      // Keep facing the way the visitor was heading, rather than snapping toward a fixed wall.
      this.walkTo(point,[point.x+dx*2,1.5,point.z+dz*2],"Following your curiosity");
      if(this.path.length&&this.marker){this.marker.position.set(point.x,.035,point.z);this.markerLife=1;}
      return;
    }
  }
  private pointerLeave=()=>{this.aimCursor=false;};
  private wheel=(event:WheelEvent)=>{if(!this.active||!this.held||this.viewfinder)return;event.preventDefault();this.setObjectDistance(this.holdDistance+event.deltaY*.0007);};
  private cancelDrag=()=>{this.drag=null;};
  private keyDown=(event:KeyboardEvent)=>{
    if(!this.active||this.intro||(event.target instanceof HTMLElement&&event.target.closest("input,textarea,select")))return;
    const key=event.key.toLowerCase();
    if(key==="j"){event.preventDefault();this.callbacks.onJournal();return;}if(key==="h"){event.preventDefault();this.callbacks.onHelp();return;}if(key==="m"){event.preventDefault();this.callbacks.onMenu();return;}
    if(key==="f"&&this.held==="camera"){event.preventDefault();if(!event.repeat)this.setViewfinder(!this.viewfinder);return;}
    if(key===" "&&this.viewfinder){event.preventDefault();if(!event.repeat)this.snapshot();return;}
    if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e","shift"].includes(key)){event.preventDefault();if(key==="e"){if(!event.repeat)this.interact();return;}this.keys.add(key);this.cancelWalk();this.mode="free";this.tour=false;if(key!=="shift")this.aimCursor=false;}
  };
  private keyUp=(event:KeyboardEvent)=>{this.keys.delete(event.key.toLowerCase());};
  private clearInput=()=>{this.keys.clear();this.touch={forward:0,right:0};this.velocity={x:0,z:0};this.drag=null;};
  private visibility=()=>{if(document.hidden){this.clearInput();this.cancelWalk();cancelAnimationFrame(this.frame);this.frame=0;}else if(this.active)this.start();};
  private contextLost=(event:Event)=>{event.preventDefault();this.setActive(false);this.callbacks.onError("The graphics connection was lost. Return to the village or reload to reopen the house.");};
  private tick=(now:number)=>{
    this.frame=0;if(!this.active||!this.world||this.disposed)return;
    const dt=this.previous?Math.min((now-this.previous)/1000,.1):.016;this.previous=now;this.elapsed+=dt;
    const damp=THREE.MathUtils.damp,swift=this.reduced?100:1,guiding=now-this.lookedAt>1400;
    this.world.update(dt,this.elapsed,this.mood,this.reduced,this.camera.position);
    const door=this.world.door;door.rotation.y=damp(door.rotation.y,this.doorTarget,this.reduced?100:4,dt);
    if(this.intro){const age=this.elapsed-this.introFrom,ease=this.reduced?1:THREE.MathUtils.smootherstep(age,0,11);this.yaw=THREE.MathUtils.lerp(-.2,.3,ease)+(this.reduced?0:Math.sin(age*.23)*.012);this.pitch=THREE.MathUtils.lerp(.09,.03,ease);}let dx=0,dz=0,travelled=0;const old={x:this.camera.position.x,z:this.camera.position.z};
    if((!this.held||this.viewfinder)&&!this.returning){
      if(this.path.length){
        const next=this.path[0],distance=Math.hypot(next.x-old.x,next.z-old.z);
        if(distance<.045)this.path.shift();else{
          let remaining=distance;for(let i=1;i<this.path.length;i++)remaining+=Math.hypot(this.path[i].x-this.path[i-1].x,this.path[i].z-this.path[i-1].z);
          this.pace=this.reduced?1.6:guidedPace(this.pace,remaining,dt);
          const step=Math.min(distance,dt*this.pace);dx=(next.x-old.x)/distance*step;dz=(next.z-old.z)/distance*step;
          if(guiding){this.yaw+=wrapAngle(Math.atan2(-(next.x-old.x),-(next.z-old.z))-this.yaw)*Math.min(1,dt*3);this.pitch=damp(this.pitch,-.04,3,dt);}
        }
        if(!this.path.length){this.pace=0;this.settling=guiding;this.intent=null;if(this.pendingPick){const id=this.pendingPick;this.pendingPick=null;this.pick(id,true);}else if(this.pendingAction){const id=this.pendingAction;this.pendingAction=null;this.action(id);this.settling=guiding;}else if(this.pendingStation){const id=this.pendingStation;this.pendingStation=null;this.arriveLibrary(id);}else if(this.pendingNote){this.pendingNote=false;this.viewPortrait();}}
      }else{
        const forward=Number(this.keys.has("w")||this.keys.has("arrowup"))-Number(this.keys.has("s")||this.keys.has("arrowdown"))+this.touch.forward;
        const right=Number(this.keys.has("d")||this.keys.has("arrowright"))-Number(this.keys.has("a")||this.keys.has("arrowleft"))+this.touch.right;
        const length=Math.max(1,Math.hypot(forward,right)),speed=this.keys.has("shift")?2.65:1.7;
        this.velocity.x=walkingVelocity(this.velocity.x,(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length*speed,dt);
        this.velocity.z=walkingVelocity(this.velocity.z,(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length*speed,dt);dx=this.velocity.x*dt;dz=this.velocity.z*dt;
      }
      const next=moveInChalet(old,dx,dz,Math.abs(door.rotation.y)>1.35);this.camera.position.x=next.x;this.camera.position.z=next.z;
      travelled=Math.hypot(next.x-old.x,next.z-old.z);this.walkTravel+=travelled;this.stride+=travelled/.7*Math.PI;
      const footfall=Math.floor(this.stride/Math.PI+.5);if(footfall!==this.footfall){this.footfall=footfall;this.callbacks.onStep(next.z<3.4);}
    }
    this.gait=damp(this.gait,Math.min(1.3,travelled/dt/1.7),8,dt);
    if(this.settling)this.lookToward(this.targetLook,Math.min(1,dt*2.8));
    // A light touch of smoothing and a walking rhythm; both vanish under reduced motion.
    const ease=this.reduced?1:1-Math.exp(-dt*18);this.viewYaw+=(this.yaw-this.viewYaw)*ease;this.viewPitch+=(this.pitch-this.viewPitch)*ease;
    const bob=this.reduced?{lift:0,sway:0}:walkBob(this.stride,this.gait);
    this.camera.position.y=EYE+bob.lift;this.camera.rotation.set(this.viewPitch,this.viewYaw,bob.sway);
    const view=this.viewfinder?FINDER_VIEW:this.held?HOLD_VIEW:VIEW;if(Math.abs(this.camera.fov-view)>.02){this.camera.fov=damp(this.camera.fov,view,6*swift,dt);this.camera.updateProjectionMatrix();}
    this.focus=damp(this.focus,this.held&&!this.viewfinder?1:0,(this.held?5:9)*swift,dt);
    if(this.held&&!this.viewfinder){
      const object=this.world.objects.get(this.held)!,scale=Math.min(1.35,this.camera.aspect*1.9);object.position.lerp(new THREE.Vector3(this.camera.aspect>1.2?.08:0,this.camera.aspect<.8?.12:-.02,-this.holdDistance),Math.min(1,dt*(this.reduced?100:7)));object.scale.lerp(new THREE.Vector3().setScalar(scale),Math.min(1,dt*7*swift));
      if(this.heldTween)object.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(.15,.25,0)),Math.min(1,dt*7*swift));
      else if(!this.drag&&Math.abs(this.spin.x)+Math.abs(this.spin.y)>.0005){this.turn(object,this.spin.x*dt,this.spin.y*dt);this.spin.x=spinDecay(this.spin.x,dt);this.spin.y=spinDecay(this.spin.y,dt);}
    }
    if(this.returning){const object=this.world.objects.get(this.returning)!,home=this.homes.get(this.returning)!;const factor=Math.min(1,dt*(this.reduced?100:9));object.position.lerp(home.position,factor);object.quaternion.slerp(home.quaternion,factor);object.scale.lerp(home.scale,factor);if(object.position.distanceTo(home.position)<.002){object.position.copy(home.position);object.quaternion.copy(home.quaternion);object.scale.copy(home.scale);this.returning=null;const action=this.afterReturn;this.afterReturn=null;action?.();}}
    this.decorate(dt);
    this.renderOnce();
    if(now-this.lastState>140){this.lastState=now;this.sense();this.emit();}
    this.frame=requestAnimationFrame(this.tick);
  };
  /** What is the visitor pointing at? The cursor when the mouse is in use, the centre of the view otherwise. */
  private sense(){
    const canvas=this.renderer.domElement,cursor=this.aimCursor&&document.pointerLockElement!==canvas;
    if(this.held||this.returning||this.drag)this.near=this.held||this.returning?null:this.near;
    else{this.ray.setFromCamera(cursor?this.pointer.set(this.hover.x,this.hover.y):this.pointer.set(0,0),this.camera);const hit=this.hits()[0],id=hit?this.interaction(hit.object):null;this.near=hit&&id&&(cursor||id==="church"||hit.distance<3)?id:null;}
    canvas.style.cursor=this.drag?"grabbing":this.near&&cursor?"pointer":"grab";
  }
  private decorate(dt:number){
    if(this.marker){const material=this.marker.material as THREE.MeshBasicMaterial;this.markerLife=this.path.length&&this.destinationName==="Following your curiosity"?Math.max(this.markerLife,.75):Math.max(0,this.markerLife-dt*2.6);material.opacity=Math.min(.7,this.markerLife);this.marker.visible=this.markerLife>.01;if(!this.reduced)this.marker.scale.setScalar(1+Math.sin(this.elapsed*3.2)*.06);}
    if(this.glint){
      const id=this.near&&glintTargets.has(this.near)&&!this.held?this.near:null;
      if(id&&id!==this.glintId){const anchor=this.anchor(id);if(anchor){this.glint.position.copy(anchor);this.glintId=id;}}
      this.glintLevel=THREE.MathUtils.damp(this.glintLevel,id?1:0,this.reduced?100:7,dt);if(this.glintLevel<.01)this.glintId=null;
      this.glint.material.opacity=this.glintLevel*(this.reduced?.4:.36+Math.sin(this.elapsed*2.6)*.1);this.glint.scale.setScalar(.34+this.glintLevel*.1);this.glint.visible=this.glintLevel>.01;
    }
  }
  private lookToward(point:readonly number[],factor:number){const dx=point[0]-this.camera.position.x,dz=point[2]-this.camera.position.z,angle=Math.atan2(-dx,-dz);this.yaw+=wrapAngle(angle-this.yaw)*factor;this.pitch=THREE.MathUtils.lerp(this.pitch,Math.atan2(point[1]-EYE,Math.hypot(dx,dz)),factor);}
  private emit(){this.callbacks.onState({mode:this.mode,walking:this.path.length>0,paused:this.paused,tour:this.tour,stop:this.destination,doorOpen:this.doorTarget!==0,inside:this.camera.position.z<3.4,held:this.held,near:this.near,aim:this.aimCursor&&document.pointerLockElement!==this.renderer.domElement?"cursor":"center",reachable:this.world&&!this.held?[...this.world.objects.keys()].filter(id=>this.reachable(id)):[],position:{x:this.camera.position.x,z:this.camera.position.z},heading:this.yaw,looked:this.lookTravel>.7,walked:this.walkTravel>1.5,examined:[...this.examined],...this.mood,discovered:[...this.discovered],pointerLocked:document.pointerLockElement===this.renderer.domElement,mouseLook:this.lookPreferred,viewfinder:this.viewfinder,quality:this.quality,destination:this.destinationName,record:this.record,page:this.page,projecting:this.projecting,backlit:this.backlit,sheets:{...this.sheets}});}
  dispose(){
    this.disposed=true;this.setActive(false);this.resize.disconnect();const canvas=this.renderer.domElement;
    canvas.removeEventListener("pointerdown",this.pointerDown);canvas.removeEventListener("pointermove",this.pointerMove);canvas.removeEventListener("pointerup",this.pointerUp);canvas.removeEventListener("pointercancel",this.cancelDrag);canvas.removeEventListener("lostpointercapture",this.cancelDrag);canvas.removeEventListener("pointerleave",this.pointerLeave);canvas.removeEventListener("wheel",this.wheel);canvas.removeEventListener("webglcontextlost",this.contextLost);
    window.removeEventListener("keydown",this.keyDown);window.removeEventListener("keyup",this.keyUp);window.removeEventListener("blur",this.clearInput);document.removeEventListener("visibilitychange",this.visibility);document.removeEventListener("pointerlockchange",this.lockChange);
    this.composer?.passes.forEach(pass=>pass.dispose());this.composer?.dispose();this.focusTarget?.dispose();this.focusMaterial.dispose();this.focusScene.traverse(object=>{if(object instanceof THREE.Mesh)object.geometry.dispose();});
    if(this.glint){this.glint.material.map?.dispose();this.glint.material.dispose();}
    this.world?.dispose();this.renderer.dispose();canvas.remove();
  }
}
