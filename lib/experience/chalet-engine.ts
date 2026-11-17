import * as THREE from "three";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { createChaletWorld, type ChaletWorld } from "./chalet-world";
import { canWalk, findWalkPath, moveInChalet, tourStops, type ChaletObjectId, type WalkPoint } from "./chalet-layout";
import { houseActions, walkingVelocity, viewfinderCrop, type HouseAction, type HouseDiscovery } from "./chalet-discoveries";
import type { HouseSound } from "./chalet-sound";

export type ChaletState={mode:"guided"|"free";walking:boolean;paused:boolean;stop:number;doorOpen:boolean;inside:boolean;held:ChaletObjectId|null;near:string|null;reachable:ChaletObjectId[];position:WalkPoint;examined:ChaletObjectId[];lamp:boolean;window:boolean;drawer:boolean;discovered:HouseDiscovery[];pointerLocked:boolean;viewfinder:boolean;quality:"balanced"|"cinematic";destination:string};
export type ChaletCallbacks={onState:(state:ChaletState)=>void;onStep:(inside:boolean)=>void;onError:(message:string)=>void;onEffect:(sound:HouseSound)=>void;onSnapshot:(image:string)=>void;onJournal:()=>void;onHelp:()=>void};
type HomeTransform={position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3};

export class ChaletEngine {
  private renderer:THREE.WebGLRenderer;
  private camera=new THREE.PerspectiveCamera(62,1,.03,150);
  private world:ChaletWorld|null=null;
  private composer:EffectComposer|null=null;private ao:GTAOPass|null=null;
  private resize:ResizeObserver;
  private active=false;private disposed=false;private frame=0;private previous=0;private lastState=0;private stepDistance=0;private elapsed=0;
  private keys=new Set<string>();private touch={forward:0,right:0};private velocity={x:0,z:0};
  private drag:{x:number;y:number;distance:number}|null=null;
  private paused=false;private settling=false;private path:WalkPoint[]=[];private destination=0;private destinationName="The approach";
  private targetPoint:WalkPoint={...tourStops[0].point};private targetLook:readonly number[]=tourStops[0].look;
  private yaw=.435;private pitch=-.06;private doorTarget=0;private sensitivity=1;
  private held:ChaletObjectId|null=null;private heldTween=false;private returning:ChaletObjectId|null=null;private homes=new Map<ChaletObjectId,HomeTransform>();
  private afterReturn:(()=>void)|null=null;
  private holdDistance=.82;private examined=new Set<ChaletObjectId>();private discovered=new Set<HouseDiscovery>();
  private mode:"guided"|"free"="guided";private near:string|null=null;private viewfinder=false;private quality:"balanced"|"cinematic"="balanced";
  private mood={lamp:false,window:false,drawer:false};private pendingPick:ChaletObjectId|null=null;private pendingAction:HouseAction|null=null;
  private ray=new THREE.Raycaster();private pointer=new THREE.Vector2();private reduced=false;
  private inspectionLight=new THREE.PointLight("#fff0d1",1.2,3,2);

  constructor(private host:HTMLElement,private callbacks:ChaletCallbacks){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.5));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.1;
    const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute("aria-label","Alpine house: drag to look, click the floor to walk, WASD to move, E to interact.");canvas.style.touchAction="none";host.append(canvas);
    this.camera.position.set(2.8,1.65,8.5);this.camera.rotation.order="YXZ";this.camera.rotation.set(this.pitch,this.yaw,0);
    this.inspectionLight.position.set(.3,.4,.2);this.inspectionLight.visible=false;this.camera.add(this.inspectionLight);
    this.resize=new ResizeObserver(()=>this.resizeView());this.resize.observe(host);this.resizeView();
    canvas.addEventListener("pointerdown",this.pointerDown);canvas.addEventListener("pointermove",this.pointerMove);canvas.addEventListener("pointerup",this.pointerUp);canvas.addEventListener("pointercancel",this.cancelDrag);canvas.addEventListener("lostpointercapture",this.cancelDrag);canvas.addEventListener("wheel",this.wheel,{passive:false});canvas.addEventListener("webglcontextlost",this.contextLost);
    window.addEventListener("keydown",this.keyDown);window.addEventListener("keyup",this.keyUp);window.addEventListener("blur",this.clearInput);document.addEventListener("visibilitychange",this.visibility);document.addEventListener("pointerlockchange",this.lockChange);
  }
  async load(){
    const world=await createChaletWorld();if(this.disposed){world.dispose();return;}this.world=world;world.scene.add(this.camera);
    for(const [id,object] of world.objects)this.homes.set(id,{position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});
    this.emit();this.renderOnce();if(this.active)this.start();
  }
  private resizeView(){const width=this.host.clientWidth||1,height=this.host.clientHeight||1;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();this.composer?.setSize(width,height);if(this.world)this.renderOnce();}
  setActive(active:boolean){this.active=active;this.clearInput();if(active)this.start();else{cancelAnimationFrame(this.frame);this.frame=0;this.releaseMouse();}}
  setReducedMotion(value:boolean){this.reduced=value;}
  setSensitivity(value:number){this.sensitivity=THREE.MathUtils.clamp(value,.35,2);}
  setQuality(value:"balanced"|"cinematic"){
    this.quality=value;
    if(value==="cinematic"&&!this.composer&&this.world){
      const target=new THREE.WebGLRenderTarget(this.host.clientWidth,this.host.clientHeight,{type:THREE.HalfFloatType,samples:4});this.composer=new EffectComposer(this.renderer,target);this.composer.addPass(new RenderPass(this.world.scene,this.camera));
      this.ao=new GTAOPass(this.world.scene,this.camera,this.host.clientWidth,this.host.clientHeight);this.ao.blendIntensity=.55;this.ao.updateGtaoMaterial({radius:.24,thickness:.6,samples:8,screenSpaceRadius:false});this.ao.updatePdMaterial({samples:8,rings:2});this.composer.addPass(this.ao);this.composer.addPass(new OutputPass());
    }this.emit();
  }
  private start(){if(!this.world||this.frame||this.disposed||document.hidden)return;this.previous=0;this.frame=requestAnimationFrame(this.tick);}
  private renderOnce(){if(!this.world||this.disposed)return;if(this.composer&&this.quality==="cinematic")this.composer.render();else this.renderer.render(this.world.scene,this.camera);}
  private cancelWalk(){this.paused=this.paused||this.path.length>0;this.path=[];this.settling=false;this.pendingPick=null;this.pendingAction=null;}
  setMode(mode:"guided"|"free"){this.mode=mode;this.cancelWalk();this.clearInput();this.emit();this.focus();}
  focus(){this.renderer.domElement.focus({preventScroll:true});}
  private walkTo(point:WalkPoint,look:readonly number[],label:string){
    if(!this.world||this.held)return;if(this.returning){this.afterReturn=()=>this.walkTo(point,look,label);return;}
    this.pendingPick=null;this.pendingAction=null;this.targetPoint={...point};this.targetLook=look;this.destinationName=label;this.mode="guided";this.paused=false;this.settling=false;this.clearInput();
    this.path=findWalkPath(this.camera.position,point);
    if((this.camera.position.z<3.5)!==(point.z<3.5)){if(!this.doorTarget)this.callbacks.onEffect("door");this.doorTarget=-Math.PI/2;}
    if(!this.path.length)this.callbacks.onError("That spot is blocked. Choose an open part of the floor or one of the nearby places.");
    this.emit();
  }
  goTo(stop:number){if(this.returning){this.afterReturn=()=>this.goTo(stop);return;}this.destination=Math.max(0,Math.min(tourStops.length-1,stop));const target=tourStops[this.destination];this.walkTo(target.point,target.look,target.label);}
  goToAction(action:HouseAction){const target=houseActions[action];this.walkTo(target.point,target.look,target.label);}
  pauseWalk(){this.cancelWalk();this.clearInput();this.emit();}
  resumeWalk(){this.walkTo(this.targetPoint,this.targetLook,this.destinationName);}
  setTouch(forward:number,right:number){if(forward||right){this.cancelWalk();this.mode="free";}this.touch={forward,right};this.emit();}
  captureMouse(){this.setMode("free");try{const promise=this.renderer.domElement.requestPointerLock();if(promise)void promise.catch(()=>this.callbacks.onError("Drag to look around in this browser. WASD and click-to-walk remain available."));}catch{this.callbacks.onError("Drag to look around in this browser. WASD and click-to-walk remain available.");}}
  releaseMouse(){if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();}
  private lockChange=()=>{this.clearInput();this.emit();};
  toggleDoor(){
    if(this.held||!this.world)return;
    if(Math.hypot(this.camera.position.x,this.camera.position.z-3.5)>3){this.goTo(1);return;}
    if(this.doorTarget!==0&&Math.abs(this.camera.position.x)<1.2&&this.camera.position.z>3.05&&this.camera.position.z<5.2){this.callbacks.onError("Step away from the doorway before closing the door.");return;}
    if(this.path.length)this.pauseWalk();this.doorTarget=this.doorTarget===0?-Math.PI/2:0;this.callbacks.onEffect("door");this.emit();
  }
  private interaction(object:THREE.Object3D|null):string|null{while(object){if(object.userData.interaction)return object.userData.interaction as string;object=object.parent;}return null;}
  private validHit(hit:THREE.Intersection){let object:THREE.Object3D|null=hit.object;while(object){if(!object.visible||object.userData.ignoreRay)return false;object=object.parent;}return hit.object instanceof THREE.Mesh;}
  private hits(){return this.world?this.ray.intersectObjects(this.world.scene.children.filter(object=>!object.userData.ignoreRay),true).filter(hit=>this.validHit(hit)):[];}
  private reachable(id:string){
    if(!this.world||this.held)return false;const object=this.world.targets.get(id);if(!object)return false;
    const position=object.userData.reachPoint?object.localToWorld(new THREE.Vector3(...object.userData.reachPoint as [number,number,number])):new THREE.Box3().setFromObject(object).getCenter(new THREE.Vector3());const distance=this.camera.position.distanceTo(position);if(distance>2.8)return false;
    this.ray.set(this.camera.position,position.sub(this.camera.position).normalize());const hit=this.hits()[0];return !!hit&&this.interaction(hit.object)===id;
  }
  action(id:HouseAction){if(this.held)return;if(this.returning){this.afterReturn=()=>this.action(id);return;}if(!this.reachable(id)){this.goToAction(id);this.pendingAction=id;return;}this.cancelWalk();this.mood[id]=!this.mood[id];this.discovered.add(id);this.callbacks.onEffect(id);this.emit();}
  pick(id:ChaletObjectId){
    if(!this.world||this.held)return;if(this.returning){this.afterReturn=()=>this.pick(id);return;}
    if(!this.reachable(id)){this.goTo(3);this.pendingPick=id;return;}
    this.cancelWalk();this.clearInput();this.releaseMouse();this.held=id;this.heldTween=true;this.holdDistance=.82;
    const object=this.world.objects.get(id)!;this.camera.attach(object);this.inspectionLight.visible=true;this.examined.add(id);this.discovered.add(id);this.callbacks.onEffect(id==="photograph"?"paper":"lift");this.emit();
  }
  putDown(){if(!this.held||!this.world)return;this.setViewfinder(false);const object=this.world.objects.get(this.held)!;this.world.scene.attach(object);this.returning=this.held;this.held=null;this.heldTween=false;this.inspectionLight.visible=false;this.callbacks.onEffect("return");this.emit();}
  rotateObject(x:number,y:number){if(!this.held||!this.world||this.viewfinder)return;this.heldTween=false;const object=this.world.objects.get(this.held)!;object.rotation.x+=x;object.rotation.y+=y;}
  flipPhotograph(){if(this.held!=="photograph")return;this.rotateObject(0,Math.PI);this.callbacks.onEffect("paper");}
  tapBowl(){if(this.held==="bowl")this.callbacks.onEffect("bowl");}
  resetObject(){if(!this.held||!this.world)return;this.heldTween=true;this.holdDistance=.82;}
  setObjectDistance(value:number){this.holdDistance=THREE.MathUtils.clamp(value,.55,1.15);}
  setViewfinder(value:boolean){if(this.held!=="camera"||!this.world)return;this.viewfinder=value;this.world.objects.get("camera")!.visible=!value;this.inspectionLight.visible=!value;this.camera.fov=value?48:62;this.camera.updateProjectionMatrix();this.clearInput();this.emit();if(value)this.focus();}
  snapshot(){
    if(!this.viewfinder||!this.world)return;this.renderOnce();
    const source=this.renderer.domElement,width=this.host.clientWidth,height=this.host.clientHeight,crop=viewfinderCrop(width,height),ratio=source.width/width;
    const canvas=document.createElement("canvas");canvas.width=1024;canvas.height=683;
    canvas.getContext("2d")!.drawImage(source,crop.x*ratio,crop.y*ratio,crop.width*ratio,crop.height*ratio,0,0,1024,683);
    this.callbacks.onSnapshot(canvas.toDataURL("image/jpeg",.88));this.discovered.add("snapshot");this.callbacks.onEffect("shutter");this.emit();
  }
  interact(){if(this.held){if(this.viewfinder)this.snapshot();else this.putDown();return;}if(this.near==="door")this.toggleDoor();else if(this.near&&this.near in houseActions)this.action(this.near as HouseAction);else if(this.near)this.pick(this.near as ChaletObjectId);}
  private pointerDown=(event:PointerEvent)=>{if(!this.active)return;this.focus();this.drag={x:event.clientX,y:event.clientY,distance:0};this.renderer.domElement.setPointerCapture(event.pointerId);};
  private pointerMove=(event:PointerEvent)=>{
    if(!this.active)return;const locked=document.pointerLockElement===this.renderer.domElement;if(!this.drag&&!locked)return;
    const dx=locked?event.movementX:event.clientX-this.drag!.x,dy=locked?event.movementY:event.clientY-this.drag!.y;
    if(this.drag){this.drag.x=event.clientX;this.drag.y=event.clientY;this.drag.distance+=Math.abs(dx)+Math.abs(dy);}
    if(this.held&&!this.viewfinder)this.rotateObject(dy*.008,dx*.008);else{this.yaw-=dx*.0024*this.sensitivity;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0024*this.sensitivity,-1.25,1.15);this.cancelWalk();}
  };
  private pointerUp=(event:PointerEvent)=>{
    const click=this.drag&&this.drag.distance<6;this.drag=null;if(!click||!this.active||!this.world)return;
    if(this.viewfinder){if(document.pointerLockElement)this.snapshot();return;}if(this.held)return;
    if(document.pointerLockElement){this.interact();return;}
    const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
    const hit=this.hits()[0];if(!hit)return;const id=this.interaction(hit.object);
    if(id==="door")this.toggleDoor();else if(id&&id in houseActions)this.action(id as HouseAction);else if(id)this.pick(id as ChaletObjectId);
    else if(hit.point.y<.15&&canWalk(hit.point,true))this.walkTo(hit.point,[hit.point.x,1.4,hit.point.z-2],"Following your curiosity");
  };
  private wheel=(event:WheelEvent)=>{if(!this.active||!this.held||this.viewfinder)return;event.preventDefault();this.setObjectDistance(this.holdDistance+event.deltaY*.0007);};
  private cancelDrag=()=>{this.drag=null;};
  private keyDown=(event:KeyboardEvent)=>{
    if(!this.active||(event.target instanceof HTMLElement&&event.target.closest("input,textarea,select")))return;
    const key=event.key.toLowerCase();
    if(key==="j"){event.preventDefault();this.callbacks.onJournal();return;}if(key==="h"){event.preventDefault();this.callbacks.onHelp();return;}
    if(key==="f"&&this.held==="camera"){event.preventDefault();if(!event.repeat)this.setViewfinder(!this.viewfinder);return;}
    if(key===" "&&this.viewfinder){event.preventDefault();if(!event.repeat)this.snapshot();return;}
    if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e","shift"].includes(key)){event.preventDefault();if(key==="e"){if(!event.repeat)this.interact();return;}this.keys.add(key);this.cancelWalk();this.mode="free";}
  };
  private keyUp=(event:KeyboardEvent)=>{this.keys.delete(event.key.toLowerCase());};
  private clearInput=()=>{this.keys.clear();this.touch={forward:0,right:0};this.velocity={x:0,z:0};this.drag=null;};
  private visibility=()=>{if(document.hidden){this.clearInput();this.cancelWalk();cancelAnimationFrame(this.frame);this.frame=0;}else if(this.active)this.start();};
  private contextLost=(event:Event)=>{event.preventDefault();this.setActive(false);this.callbacks.onError("The graphics connection was lost. Return to the village or reload to reopen the house.");};
  private tick=(now:number)=>{
    this.frame=0;if(!this.active||!this.world||this.disposed)return;
    const dt=this.previous?Math.min((now-this.previous)/1000,.1):.016;this.previous=now;this.elapsed+=dt;
    this.world.update(dt,this.elapsed,this.mood,this.reduced);
    const door=this.world.door;door.rotation.y=THREE.MathUtils.damp(door.rotation.y,this.doorTarget,this.reduced?100:4,dt);
    let dx=0,dz=0;const old=this.camera.position.clone();
    if((!this.held||this.viewfinder)&&!this.returning){
      if(this.path.length){
        const next=this.path[0],distance=Math.hypot(next.x-old.x,next.z-old.z);
        if(distance<.045)this.path.shift();else{const step=Math.min(distance,dt*1.65);dx=(next.x-old.x)/distance*step;dz=(next.z-old.z)/distance*step;const angle=Math.atan2(-(next.x-old.x),-(next.z-old.z));this.yaw+=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw))*Math.min(1,dt*2.4);this.pitch=THREE.MathUtils.damp(this.pitch,-.04,3,dt);}
        if(!this.path.length){this.settling=true;if(this.pendingPick){const id=this.pendingPick;this.pendingPick=null;this.pick(id);}else if(this.pendingAction){const id=this.pendingAction;this.pendingAction=null;this.action(id);this.settling=true;}}
      }else{
        const forward=Number(this.keys.has("w")||this.keys.has("arrowup"))-Number(this.keys.has("s")||this.keys.has("arrowdown"))+this.touch.forward;
        const right=Number(this.keys.has("d")||this.keys.has("arrowright"))-Number(this.keys.has("a")||this.keys.has("arrowleft"))+this.touch.right;
        const length=Math.max(1,Math.hypot(forward,right)),speed=this.keys.has("shift")?2.65:1.7;
        this.velocity.x=walkingVelocity(this.velocity.x,(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length*speed,dt);
        this.velocity.z=walkingVelocity(this.velocity.z,(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length*speed,dt);dx=this.velocity.x*dt;dz=this.velocity.z*dt;
      }
      const next=moveInChalet(old,dx,dz,Math.abs(door.rotation.y)>1.35);this.camera.position.x=next.x;this.camera.position.z=next.z;
      const distance=Math.hypot(next.x-old.x,next.z-old.z);this.stepDistance+=distance;if(this.stepDistance>.65){this.stepDistance=0;this.callbacks.onStep(next.z<3.4);}
    }
    if(this.settling)this.lookToward(this.targetLook,Math.min(1,dt*2.8));
    this.camera.position.y=1.65;this.camera.rotation.set(this.pitch,this.yaw,0);
    if(this.held&&!this.viewfinder){const object=this.world.objects.get(this.held)!,scale=Math.min(1.35,this.camera.aspect*1.9);object.position.lerp(new THREE.Vector3(this.camera.aspect>1.2?.08:0,this.camera.aspect<.8?.12:-.02,-this.holdDistance),Math.min(1,dt*(this.reduced?100:9)));object.scale.lerp(new THREE.Vector3().setScalar(scale),Math.min(1,dt*9));if(this.heldTween)object.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(.15,.25,0)),Math.min(1,dt*8));}
    if(this.returning){const object=this.world.objects.get(this.returning)!,home=this.homes.get(this.returning)!;const factor=Math.min(1,dt*(this.reduced?100:10));object.position.lerp(home.position,factor);object.quaternion.slerp(home.quaternion,factor);object.scale.lerp(home.scale,factor);if(object.position.distanceTo(home.position)<.002){object.position.copy(home.position);object.quaternion.copy(home.quaternion);object.scale.copy(home.scale);this.returning=null;const action=this.afterReturn;this.afterReturn=null;action?.();}}
    this.renderOnce();
    if(now-this.lastState>180){this.lastState=now;this.ray.setFromCamera(new THREE.Vector2(),this.camera);const hit=this.hits()[0];this.near=hit&&hit.distance<3?this.interaction(hit.object):null;this.emit();}
    this.frame=requestAnimationFrame(this.tick);
  };
  private lookToward(point:readonly number[],factor:number){const dx=point[0]-this.camera.position.x,dz=point[2]-this.camera.position.z,angle=Math.atan2(-dx,-dz);this.yaw+=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw))*factor;this.pitch=THREE.MathUtils.lerp(this.pitch,Math.atan2(point[1]-this.camera.position.y,Math.hypot(dx,dz)),factor);}
  private emit(){this.callbacks.onState({mode:this.mode,walking:this.path.length>0,paused:this.paused,stop:this.destination,doorOpen:this.doorTarget!==0,inside:this.camera.position.z<3.4,held:this.held,near:this.near,reachable:this.world&&!this.held?[...this.world.objects.keys()].filter(id=>this.reachable(id)):[],position:{x:this.camera.position.x,z:this.camera.position.z},examined:[...this.examined],...this.mood,discovered:[...this.discovered],pointerLocked:document.pointerLockElement===this.renderer.domElement,viewfinder:this.viewfinder,quality:this.quality,destination:this.destinationName});}
  dispose(){
    this.disposed=true;this.setActive(false);this.resize.disconnect();const canvas=this.renderer.domElement;
    canvas.removeEventListener("pointerdown",this.pointerDown);canvas.removeEventListener("pointermove",this.pointerMove);canvas.removeEventListener("pointerup",this.pointerUp);canvas.removeEventListener("pointercancel",this.cancelDrag);canvas.removeEventListener("lostpointercapture",this.cancelDrag);canvas.removeEventListener("wheel",this.wheel);canvas.removeEventListener("webglcontextlost",this.contextLost);
    window.removeEventListener("keydown",this.keyDown);window.removeEventListener("keyup",this.keyUp);window.removeEventListener("blur",this.clearInput);document.removeEventListener("visibilitychange",this.visibility);document.removeEventListener("pointerlockchange",this.lockChange);
    this.composer?.passes.forEach(pass=>pass.dispose());this.composer?.dispose();this.world?.dispose();this.renderer.dispose();canvas.remove();
  }
}
