import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export type RoomMood={lamp:boolean;window:boolean;drawer:boolean};

export function dressChalet(scene:THREE.Scene,wood:THREE.Material,brass:THREE.Material,textures:THREE.Texture[]){
  const targets=new Map<string,THREE.Group>();
  function box(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=scene){const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.012,w/5,h/5,d/5)),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function cylinder(r:number,h:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=scene){const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r*.94,h,48),material);mesh.position.set(x,y,z);mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
  function labelTexture(lines:string[],width=1024,height=640){const canvas=document.createElement("canvas");canvas.width=width;canvas.height=height;const c=canvas.getContext("2d")!;c.fillStyle="#d9cbae";c.fillRect(0,0,width,height);c.strokeStyle="#a49471";c.strokeRect(35,35,width-70,height-70);c.fillStyle="#3c4035";c.font="30px Georgia";lines.forEach((line,i)=>c.fillText(line,65,100+i*63));const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;textures.push(texture);return texture;}

  const lamp=new THREE.Group();lamp.position.set(1.73,.92,-1.76);lamp.userData.interaction="lamp";scene.add(lamp);targets.set("lamp",lamp);
  cylinder(.14,.055,0,.027,0,brass,lamp);cylinder(.09,.13,0,.10,0,brass,lamp);cylinder(.045,.15,0,.23,0,brass,lamp);
  const glass=new THREE.MeshPhysicalMaterial({color:"#f1dcad",transparent:true,opacity:.12,roughness:.17,metalness:.05,side:THREE.DoubleSide,depthWrite:false});
  const chimney=new THREE.Mesh(new THREE.LatheGeometry([[.045,.22],[.083,.29],[.09,.38],[.057,.5],[.054,.66]].map(([x,y])=>new THREE.Vector2(x,y)),48),glass);lamp.add(chimney);
  const flameMaterial=new THREE.MeshStandardMaterial({color:"#ffcb72",emissive:"#ff9c38",emissiveIntensity:0,transparent:true,opacity:0});
  const flame=new THREE.Mesh(new THREE.SphereGeometry(.025,16,16),flameMaterial);flame.scale.y=2.8;flame.position.y=.33;lamp.add(flame);
  const lampLight=new THREE.PointLight("#ffbd72",0,6,2);lampLight.position.set(1.73,1.38,-1.76);scene.add(lampLight);
  const control=cylinder(.025,.035,.105,.18,0,brass,lamp);control.rotation.z=Math.PI/2;
  // Embers behind the stove door: a low, restless warmth that reaches the floor and the nearby timber.
  const emberMaterial=new THREE.MeshStandardMaterial({color:"#3a1a0c",emissive:"#ff6a24",emissiveIntensity:1.4,roughness:1});
  const ember=new THREE.Mesh(new THREE.PlaneGeometry(.4,.3),emberMaterial);ember.position.set(-2.95,.53,-1.176);ember.userData.ignoreRay=true;scene.add(ember);
  const emberLight=new THREE.PointLight("#ff8440",.9,3.4,2);emberLight.position.set(-2.95,.5,-.85);scene.add(emberLight);

  const drawer=new THREE.Group();drawer.position.set(-2.35,1.37,-3.13);drawer.userData.interaction="drawer";drawer.userData.reachPoint=[0,0,.16];scene.add(drawer);targets.set("drawer",drawer);
  box(1.55,.2,.09,0,0,0,wood,drawer);box(1.48,.035,.56,0,-.085,-.27,wood,drawer);
  for(const x of [-.74,.74])box(.045,.15,.53,x,-.015,-.26,wood,drawer);
  const knob=cylinder(.033,.08,0,0,.08,brass,drawer);knob.rotation.x=Math.PI/2;
  const note=new THREE.Mesh(new THREE.PlaneGeometry(.76,.39),new THREE.MeshStandardMaterial({map:labelTexture(["SWITZERLAND / FIELD NOTES","1931 — first visit","1932 — return visit","Figure 1 · Lötschental Valley","Source: Price, published account","Contemporary summary, not a facsimile"]),roughness:1}));note.rotation.x=-Math.PI/2;note.position.set(0,.035,-.23);drawer.add(note);

  const windowLeaf=new THREE.Group();windowLeaf.position.set(3.65,1.8,-2.8);windowLeaf.rotation.y=-Math.PI/2;windowLeaf.userData.interaction="window";scene.add(windowLeaf);targets.set("window",windowLeaf);
  for(const x of [0,2.12])box(.065,1.3,.075,x,0,0,wood,windowLeaf);for(const y of [-.65,.65])box(2.18,.065,.075,1.06,y,0,wood,windowLeaf);box(.04,1.3,.06,1.06,0,0,wood,windowLeaf);
  const pane=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.23),new THREE.MeshPhysicalMaterial({color:"#dce6d1",transparent:true,opacity:.07,roughness:.1,side:THREE.DoubleSide,depthWrite:false}));pane.position.x=1.06;windowLeaf.add(pane);box(.025,.15,.08,1.98,0,-.075,brass,windowLeaf);

  // Curtains have folds and a real hem, rather than a flat photographic rectangle.
  const linen=new THREE.MeshStandardMaterial({color:"#e0d4b9",roughness:1,side:THREE.DoubleSide});const curtains:THREE.Mesh[]=[];
  for(const [x,z,side] of [[.70,-3.66,0],[3.32,-3.66,0],[3.42,-3.0,1],[3.42,-.38,1]]){
    const geometry=new THREE.PlaneGeometry(.46,1.78,18,22),position=geometry.attributes.position;
    for(let i=0;i<position.count;i++){const px=position.getX(i),py=position.getY(i);position.setZ(i,Math.sin(px*48)*.038+Math.cos(py*2)*.018);position.setX(i,px*(.85+.13*Math.cos(py*2)));}geometry.computeVertexNormals();
    const curtain=new THREE.Mesh(geometry,linen);curtain.position.set(x,1.66,z);curtain.rotation.y=side?Math.PI/2:0;curtain.castShadow=false;scene.add(curtain);curtains.push(curtain);
  }
  // Woven runner, books, logs and everyday tools give the room a sense of use.
  const clothCanvas=document.createElement("canvas");clothCanvas.width=clothCanvas.height=128;const clothContext=clothCanvas.getContext("2d")!;clothContext.fillStyle="#c1ae89";clothContext.fillRect(0,0,128,128);for(let i=0;i<128;i+=4){clothContext.fillStyle=i%8?"#cbb996":"#a89777";clothContext.fillRect(i,0,1,128);clothContext.fillRect(0,i,128,1);}const clothMap=new THREE.CanvasTexture(clothCanvas);clothMap.colorSpace=THREE.SRGBColorSpace;clothMap.wrapS=clothMap.wrapT=THREE.RepeatWrapping;clothMap.repeat.set(4,9);textures.push(clothMap);
  const cloth=new THREE.MeshStandardMaterial({map:clothMap,bumpMap:clothMap,bumpScale:.002,roughness:1});box(.48,.009,1.39,.66,.918,-1.35,cloth);
  for(let i=0;i<4;i++){const book=new THREE.Group();book.position.set(3.17,.58+i*.065,1.2);book.rotation.y=.08*Math.sin(i*3);scene.add(book);const cover=new THREE.MeshStandardMaterial({color:["#5e6551","#765343","#344c4e","#a18b65"][i],roughness:.95});box(.52,.006,.33,0,.025,0,cover,book);box(.52,.006,.33,0,-.025,0,cover,book);box(.025,.05,.33,-.25,0,0,cover,book);box(.47,.043,.30,.01,0,.006,new THREE.MeshStandardMaterial({color:"#d8ccb0",roughness:1}),book);}
  for(let i=0;i<9;i++){const log=cylinder(.075+.01*(i%3),.44,-3.15+(i%3)*.17,.12+Math.floor(i/3)*.15,-.65,wood);log.rotation.x=Math.PI/2;}
  const copper=new THREE.MeshStandardMaterial({color:"#9a7048",metalness:.65,roughness:.5});cylinder(.115,.24,-3.36,2.25,1.1,copper);
  const handle=new THREE.Mesh(new THREE.TorusGeometry(.095,.014,8,32),copper);handle.position.set(-3.20,2.25,1.1);scene.add(handle);

  // Soft contact shadows anchor furniture without the cost of another real-time light.
  const shadowCanvas=document.createElement("canvas");shadowCanvas.width=shadowCanvas.height=128;const sc=shadowCanvas.getContext("2d")!,gradient=sc.createRadialGradient(64,64,5,64,64,64);gradient.addColorStop(0,"rgba(18,12,6,.55)");gradient.addColorStop(1,"rgba(18,12,6,0)");sc.fillStyle=gradient;sc.fillRect(0,0,128,128);const shadowTexture=new THREE.CanvasTexture(shadowCanvas);textures.push(shadowTexture);
  for(const [x,z,w,d] of [[.7,-1.35,3.8,2.6],[-2.95,-1.65,1.5,1.6],[-2.35,-3.4,2.5,1.1],[3.17,1.2,1.1,2.2]]){const shadow=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(x,.019,z);shadow.userData.ignoreRay=true;scene.add(shadow);}
  const dustGeometry=new THREE.BufferGeometry(),dustPositions=new Float32Array(180*3);for(let i=0;i<180;i++){dustPositions[i*3]=(Math.sin(i*97.13)*.5+.5)*5-2;dustPositions[i*3+1]=(Math.sin(i*19.61)*.5+.5)*2.5+.3;dustPositions[i*3+2]=(Math.sin(i*31.79)*.5+.5)*5-3;}
  dustGeometry.setAttribute("position",new THREE.BufferAttribute(dustPositions,3));const dustCanvas=document.createElement("canvas");dustCanvas.width=dustCanvas.height=32;const dc=dustCanvas.getContext("2d")!,dg=dc.createRadialGradient(16,16,0,16,16,16);dg.addColorStop(0,"rgba(255,244,210,.9)");dg.addColorStop(1,"rgba(255,244,210,0)");dc.fillStyle=dg;dc.fillRect(0,0,32,32);const dustMap=new THREE.CanvasTexture(dustCanvas);textures.push(dustMap);const dust=new THREE.Points(dustGeometry,new THREE.PointsMaterial({map:dustMap,color:"#f6dfa8",size:.015,transparent:true,opacity:.26,depthWrite:false,blending:THREE.AdditiveBlending}));dust.userData.ignoreRay=true;scene.add(dust);
  const backTexture=labelTexture(["LÖTSCHENTAL VALLEY","Switzerland · Figure 1","Nutrition and Physical Degeneration","Weston A. Price · published 1939","Source image supplied by ANF","This paper object is a recreation."]);
  return {targets,backTexture,update(dt:number,time:number,mood:RoomMood,reduced:boolean){
    const speed=reduced?100:5;drawer.position.z=THREE.MathUtils.damp(drawer.position.z,mood.drawer?-2.58:-3.13,speed,dt);
    windowLeaf.rotation.y=THREE.MathUtils.damp(windowLeaf.rotation.y,mood.window?-2.75:-Math.PI/2,speed*.5,dt);
    const flicker=reduced?1:1+Math.sin(time*11.3)*.035+Math.sin(time*27.1)*.025,glow=reduced?1:1+Math.sin(time*2.1)*.12+Math.sin(time*7.7)*.07+Math.sin(time*17.9)*.04;
    lampLight.intensity=THREE.MathUtils.damp(lampLight.intensity,mood.lamp?2.1*flicker:0,5,dt);flameMaterial.opacity=mood.lamp?.9:0;flameMaterial.emissiveIntensity=mood.lamp?1.6:0;
    emberLight.intensity=.9*glow;emberMaterial.emissiveIntensity=1.4*glow;
    if(!reduced){flame.scale.y=2.7+Math.sin(time*9)*.15;dust.rotation.y=Math.sin(time*.04)*.035;dust.position.y=Math.sin(time*.11)*.05;for(let i=0;i<curtains.length;i++)curtains[i].rotation.z=mood.window?Math.sin(time*1.3+i)*.015:0;}
  }};
}
