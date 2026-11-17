import * as THREE from "three";
import { createChaletWorld, type ChaletWorld } from "./chalet-world";
import { findWalkPath, moveInChalet, tourStops, type ChaletObjectId, type WalkPoint } from "./chalet-layout";

export type ChaletState={mode:"guided"|"free";walking:boolean;paused:boolean;stop:number;doorOpen:boolean;inside:boolean;held:ChaletObjectId|null;near:string|null;reachable:ChaletObjectId[];position:WalkPoint;examined:ChaletObjectId[]};
export type ChaletCallbacks={onState:(state:ChaletState)=>void;onStep:(inside:boolean)=>void;onError:(message:string)=>void};
type HomeTransform={position:THREE.Vector3;quaternion:THREE.Quaternion;scale:THREE.Vector3};

export class ChaletEngine{
  private renderer:THREE.WebGLRenderer;
  private camera=new THREE.PerspectiveCamera(62,1,.03,120);
  private world:ChaletWorld|null=null;
  private resize:ResizeObserver;
  private active=false;private disposed=false;private frame=0;private previous=0;private lastState=0;private stepDistance=0;
  private keys=new Set<string>();private touch={forward:0,right:0};private drag:{x:number;y:number;distance:number}|null=null;
  private paused=false;private settling=false;private path:WalkPoint[]=[];private destination=0;private yaw=.435;private pitch=-.06;private doorTarget=0;
  private held:ChaletObjectId|null=null;private heldTween=false;private returning:ChaletObjectId|null=null;private homes=new Map<ChaletObjectId,HomeTransform>();
  private holdDistance=.72;private examined=new Set<ChaletObjectId>();private mode:"guided"|"free"="guided";private near:string|null=null;
  private ray=new THREE.Raycaster();private pointer=new THREE.Vector2();private reduced=false;
  private inspectionLight=new THREE.PointLight("#fff0d1",2.2,3,2);

  constructor(private host:HTMLElement,private callbacks:ChaletCallbacks){
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=THREE.PCFShadowMap;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.05;
    this.renderer.domElement.tabIndex=0;this.renderer.domElement.setAttribute("aria-label","Walkable Alpine house. Drag to look, use WASD or arrow keys to walk, and E to interact.");this.renderer.domElement.style.touchAction="none";host.append(this.renderer.domElement);
    this.camera.position.set(2.8,1.65,8.5);this.camera.rotation.order="YXZ";this.camera.rotation.set(this.pitch,this.yaw,0);
    this.inspectionLight.position.set(.3,.4,.2);this.inspectionLight.visible=false;this.camera.add(this.inspectionLight);
    this.resize=new ResizeObserver(()=>this.resizeView());this.resize.observe(host);this.resizeView();
    const canvas=this.renderer.domElement;canvas.addEventListener("pointerdown",this.pointerDown);canvas.addEventListener("pointermove",this.pointerMove);canvas.addEventListener("pointerup",this.pointerUp);canvas.addEventListener("pointercancel",this.cancelDrag);canvas.addEventListener("lostpointercapture",this.cancelDrag);
    window.addEventListener("keydown",this.keyDown);window.addEventListener("keyup",this.keyUp);window.addEventListener("blur",this.clearInput);document.addEventListener("visibilitychange",this.visibility);
    canvas.addEventListener("webglcontextlost",this.contextLost);
  }
  async load(){
    const world=await createChaletWorld();if(this.disposed){world.dispose();return;}this.world=world;world.scene.add(this.camera);
    for(const [id,object] of world.objects)this.homes.set(id,{position:object.position.clone(),quaternion:object.quaternion.clone(),scale:object.scale.clone()});
    this.emit();this.renderOnce();if(this.active)this.start();
  }
  private resizeView(){const width=this.host.clientWidth||1,height=this.host.clientHeight||1;this.renderer.setSize(width,height);this.camera.aspect=width/height;this.camera.updateProjectionMatrix();if(this.world)this.renderOnce();}
  setActive(active:boolean){this.active=active;this.clearInput();if(active){this.start();}else{cancelAnimationFrame(this.frame);this.frame=0;if(document.pointerLockElement===this.renderer.domElement)document.exitPointerLock();}}
  setReducedMotion(value:boolean){this.reduced=value;}
  private start(){if(!this.world||this.frame||this.disposed||document.hidden)return;this.previous=0;this.frame=requestAnimationFrame(this.tick);}
  private renderOnce(){if(this.world&&!this.disposed)this.renderer.render(this.world.scene,this.camera);}
  setMode(mode:"guided"|"free"){this.mode=mode;this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];this.clearInput();this.emit();this.renderer.domElement.focus({preventScroll:true});}
  goTo(stop:number){
    if(!this.world||this.held||this.returning)return;this.destination=Math.max(0,Math.min(tourStops.length-1,stop));this.mode="guided";this.paused=false;this.settling=false;this.clearInput();
    const target=tourStops[this.destination].point;this.path=findWalkPath(this.camera.position,target);
    if((this.camera.position.z<3.5)!==(target.z<3.5)||this.destination>=2)this.doorTarget=-Math.PI/2;
    if(!this.path.length)this.callbacks.onError("The path is blocked. Move into the open aisle and try again.");
    this.emit();
  }
  pauseWalk(){this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];this.clearInput();this.emit();}
  resumeWalk(){this.goTo(this.destination);}
  setTouch(forward:number,right:number){this.touch={forward,right};if(forward||right){this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];this.mode="free";this.emit();}}
  captureMouse(){this.mode="free";this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];const promise=this.renderer.domElement.requestPointerLock();if(promise)void promise.catch(()=>this.callbacks.onError("Mouse capture is unavailable here. Drag to look around; the movement controls still work."));this.emit();}
  toggleDoor(){
    if(this.held||!this.world)return;
    if(Math.hypot(this.camera.position.x,this.camera.position.z-3.5)>3){this.callbacks.onError("Walk closer to the door to open it.");return;}
    if(this.doorTarget!==0&&Math.abs(this.camera.position.x)<1.2&&this.camera.position.z>3.05&&this.camera.position.z<5.2){this.callbacks.onError("Take a step away from the doorway before closing it.");return;}
    if(this.path.length)this.pauseWalk();
    this.doorTarget=this.doorTarget===0?-Math.PI/2:0;this.emit();
  }
  private interaction(object:THREE.Object3D|null):string|null{while(object){if(object.userData.interaction)return object.userData.interaction as string;object=object.parent;}return null;}
  private reachable(id:ChaletObjectId){
    if(!this.world||this.held)return false;const object=this.world.objects.get(id)!;const position=object.getWorldPosition(new THREE.Vector3());position.y+=.04;const distance=this.camera.position.distanceTo(position);if(distance>2.65)return false;
    this.ray.set(this.camera.position,position.sub(this.camera.position).normalize());const hit=this.ray.intersectObjects(this.world.scene.children,true).find(hit=>hit.object instanceof THREE.Mesh&&!(hit.object.material instanceof THREE.Material&&hit.object.material.transparent));
    return !!hit&&this.interaction(hit.object)===id;
  }
  pick(id:ChaletObjectId){
    if(!this.world||this.held||this.returning)return;
    if(!this.reachable(id)){this.callbacks.onError("Move closer to the table and face the object before lifting it.");return;}
    this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];this.clearInput();this.held=id;this.heldTween=true;this.holdDistance=.72;const object=this.world.objects.get(id)!;this.camera.attach(object);this.inspectionLight.visible=true;this.examined.add(id);this.emit();
  }
  putDown(){if(!this.held||!this.world)return;const object=this.world.objects.get(this.held)!;this.world.scene.attach(object);this.returning=this.held;this.held=null;this.heldTween=false;this.inspectionLight.visible=false;this.emit();}
  rotateObject(x:number,y:number){if(!this.held||!this.world)return;this.heldTween=false;const object=this.world.objects.get(this.held)!;object.rotation.x+=x;object.rotation.y+=y;}
  resetObject(){if(!this.held||!this.world)return;this.heldTween=false;this.world.objects.get(this.held)!.rotation.set(.15,.25,0);this.holdDistance=.72;}
  setObjectDistance(value:number){this.holdDistance=Math.max(.48,Math.min(1.05,value));}
  interact(){if(this.held){this.putDown();return;}if(this.near==="door")this.toggleDoor();else if(this.near)this.pick(this.near as ChaletObjectId);}
  private pointerDown=(event:PointerEvent)=>{if(!this.active)return;this.renderer.domElement.focus({preventScroll:true});this.drag={x:event.clientX,y:event.clientY,distance:0};this.renderer.domElement.setPointerCapture(event.pointerId);};
  private pointerMove=(event:PointerEvent)=>{
    if(!this.active)return;const locked=document.pointerLockElement===this.renderer.domElement;if(!this.drag&&!locked)return;
    const dx=locked?event.movementX:event.clientX-this.drag!.x,dy=locked?event.movementY:event.clientY-this.drag!.y;
    if(this.drag){this.drag.x=event.clientX;this.drag.y=event.clientY;this.drag.distance+=Math.abs(dx)+Math.abs(dy);}
    if(this.held)this.rotateObject(dy*.009,dx*.009);else{this.yaw-=dx*.003;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.003,-1.1,1.05);this.paused=this.paused||this.path.length>0;this.path=[];this.settling=false;}
  };
  private pointerUp=(event:PointerEvent)=>{
    const click=this.drag&&this.drag.distance<6;this.drag=null;if(!click||!this.active||this.held||!this.world)return;
    const rect=this.renderer.domElement.getBoundingClientRect();this.pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);this.ray.setFromCamera(this.pointer,this.camera);
    const hit=this.ray.intersectObjects(this.world.scene.children,true)[0];if(!hit||hit.distance>3)return;const id=this.interaction(hit.object);if(id==="door")this.toggleDoor();else if(id)this.pick(id as ChaletObjectId);
  };
  private cancelDrag=()=>{this.drag=null;};
  private keyDown=(event:KeyboardEvent)=>{
    if(!this.active||(event.target instanceof HTMLElement&&event.target.closest("button,input,a,textarea")))return;
    const key=event.key.toLowerCase();if(["w","a","s","d","arrowup","arrowdown","arrowleft","arrowright","e"].includes(key)){event.preventDefault();if(key==="e"){if(!event.repeat)this.interact();return;}this.keys.add(key);if(this.path.length)this.paused=this.paused||this.path.length>0;this.settling=false;this.path=[];this.mode="free";}
  };
  private keyUp=(event:KeyboardEvent)=>{this.keys.delete(event.key.toLowerCase());};
  private clearInput=()=>{this.keys.clear();this.touch={forward:0,right:0};this.drag=null;};
  private visibility=()=>{if(document.hidden){this.clearInput();this.paused=this.paused||this.path.length>0;this.path=[];cancelAnimationFrame(this.frame);this.frame=0;}else if(this.active)this.start();};
  private contextLost=(event:Event)=>{event.preventDefault();this.setActive(false);this.callbacks.onError("The 3D view lost its graphics connection. Return to the village or reload the page to try again.");};

  private tick=(now:number)=>{
    this.frame=0;if(!this.active||!this.world||this.disposed)return;
    const dt=this.previous?Math.min((now-this.previous)/1000,.04):.016;this.previous=now;
    const door=this.world.door;door.rotation.y=THREE.MathUtils.damp(door.rotation.y,this.doorTarget,this.reduced?100:4,dt);
    let dx=0,dz=0;const old=this.camera.position.clone();
    if(!this.held&&!this.returning){
      if(this.path.length){
        const next=this.path[0],distance=Math.hypot(next.x-old.x,next.z-old.z);
        if(distance<.065)this.path.shift();else{
          const step=Math.min(distance,dt*1.55);dx=(next.x-old.x)/distance*step;dz=(next.z-old.z)/distance*step;
          const angle=Math.atan2(-(next.x-old.x),-(next.z-old.z));this.yaw+=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw))*Math.min(1,dt*2.4);
          this.pitch=THREE.MathUtils.damp(this.pitch,-.04,3,dt);
        }
        if(!this.path.length)this.settling=true;
      }else{
        const forward=Number(this.keys.has("w")||this.keys.has("arrowup"))-Number(this.keys.has("s")||this.keys.has("arrowdown"))+this.touch.forward;
        const right=Number(this.keys.has("d")||this.keys.has("arrowright"))-Number(this.keys.has("a")||this.keys.has("arrowleft"))+this.touch.right;
        const length=Math.max(1,Math.hypot(forward,right));dx=(-Math.sin(this.yaw)*forward+Math.cos(this.yaw)*right)/length*dt*1.65;dz=(-Math.cos(this.yaw)*forward-Math.sin(this.yaw)*right)/length*dt*1.65;
      }
      const next=moveInChalet(old,dx,dz,Math.abs(door.rotation.y)>1.35);this.camera.position.x=next.x;this.camera.position.z=next.z;
      const distance=this.camera.position.distanceTo(old);this.stepDistance+=distance;if(this.stepDistance>.7){this.stepDistance=0;this.callbacks.onStep(next.z<3.4);}
    }
    if(this.settling){const target=tourStops[this.destination].look;this.lookToward(target[0],target[1],target[2],Math.min(1,dt*2.8));}
    this.camera.position.y=1.65;this.camera.rotation.set(this.pitch,this.yaw,0);
    if(this.held){
      const object=this.world.objects.get(this.held)!;object.position.lerp(new THREE.Vector3(0,this.camera.aspect<.8?.12:-.04,-this.holdDistance),Math.min(1,dt*(this.reduced?100:9)));object.scale.lerp(new THREE.Vector3().setScalar(Math.min(1.65,this.camera.aspect*2.0)),Math.min(1,dt*9));
      if(this.heldTween)object.quaternion.slerp(new THREE.Quaternion().setFromEuler(new THREE.Euler(.15,.25,0)),Math.min(1,dt*8));
    }
    if(this.returning){const object=this.world.objects.get(this.returning)!,home=this.homes.get(this.returning)!;const factor=Math.min(1,dt*(this.reduced?100:10));object.position.lerp(home.position,factor);object.quaternion.slerp(home.quaternion,factor);object.scale.lerp(home.scale,factor);if(object.position.distanceTo(home.position)<.002){object.position.copy(home.position);object.quaternion.copy(home.quaternion);object.scale.copy(home.scale);this.returning=null;}}
    this.renderer.render(this.world.scene,this.camera);
    if(now-this.lastState>180){this.lastState=now;this.ray.setFromCamera(new THREE.Vector2(),this.camera);const hit=this.ray.intersectObjects(this.world.scene.children,true)[0];this.near=hit&&hit.distance<3?this.interaction(hit.object):null;this.emit();}
    this.frame=requestAnimationFrame(this.tick);
  };
  private lookToward(x:number,y:number,z:number,factor:number){const dx=x-this.camera.position.x,dz=z-this.camera.position.z,angle=Math.atan2(-dx,-dz);this.yaw+=Math.atan2(Math.sin(angle-this.yaw),Math.cos(angle-this.yaw))*factor;this.pitch=THREE.MathUtils.lerp(this.pitch,Math.atan2(y-this.camera.position.y,Math.hypot(dx,dz)),factor);}
  private emit(){this.callbacks.onState({mode:this.mode,walking:this.path.length>0,paused:this.paused,stop:this.destination,doorOpen:this.doorTarget!==0,inside:this.camera.position.z<3.4,held:this.held,near:this.near,reachable:this.world&&!this.held?([...this.world.objects.keys()].filter(id=>this.reachable(id))):[],position:{x:this.camera.position.x,z:this.camera.position.z},examined:[...this.examined]});}
  dispose(){this.disposed=true;this.setActive(false);this.resize.disconnect();const canvas=this.renderer.domElement;canvas.removeEventListener("pointerdown",this.pointerDown);canvas.removeEventListener("pointermove",this.pointerMove);canvas.removeEventListener("pointerup",this.pointerUp);canvas.removeEventListener("pointercancel",this.cancelDrag);canvas.removeEventListener("lostpointercapture",this.cancelDrag);canvas.removeEventListener("webglcontextlost",this.contextLost);window.removeEventListener("keydown",this.keyDown);window.removeEventListener("keyup",this.keyUp);window.removeEventListener("blur",this.clearInput);document.removeEventListener("visibilitychange",this.visibility);this.world?.dispose();this.renderer.dispose();canvas.remove();}
}

