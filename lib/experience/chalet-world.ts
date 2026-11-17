import * as THREE from "three";
import type { ChaletObjectId } from "./chalet-layout";

export type ChaletWorld={scene:THREE.Scene;door:THREE.Group;objects:Map<ChaletObjectId,THREE.Group>;dispose:()=>void};

export async function createChaletWorld():Promise<ChaletWorld>{
  const loader=new THREE.TextureLoader();
  const [timber,stone,landscape,photo]=await Promise.all([
    loader.loadAsync("/cinematic/chalet/aged-timber.webp"),loader.loadAsync("/cinematic/chalet/alpine-stone.webp"),
    loader.loadAsync("/cinematic/alpine/valley.webp"),loader.loadAsync("/archive-originals/npd-figure-001.jpg"),
  ]);
  const textures=[timber,stone,landscape,photo];textures.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;});
  timber.wrapS=timber.wrapT=stone.wrapS=stone.wrapT=THREE.RepeatWrapping;
  const floorTexture=timber.clone();floorTexture.repeat.set(3,5);textures.push(floorTexture);
  const pathTexture=stone.clone();pathTexture.repeat.set(2,5);textures.push(pathTexture);
  const scene=new THREE.Scene();scene.background=new THREE.Color("#b8c8c7");scene.fog=new THREE.Fog("#b7c4bb",28,65);
  const wood=new THREE.MeshStandardMaterial({map:timber,color:"#a58b70",roughness:.88,bumpMap:timber,bumpScale:.014});
  const darkWood=new THREE.MeshStandardMaterial({map:timber,color:"#645344",roughness:.93,bumpMap:timber,bumpScale:.014});
  const paleWood=new THREE.MeshStandardMaterial({map:timber,color:"#d4b897",roughness:.85});
  const plaster=new THREE.MeshStandardMaterial({color:"#d6cbb5",roughness:1});
  const stoneMaterial=new THREE.MeshStandardMaterial({map:stone,color:"#aca99c",roughness:1,bumpMap:stone,bumpScale:.035});
  const iron=new THREE.MeshStandardMaterial({color:"#292b28",roughness:.65,metalness:.6});
  const brass=new THREE.MeshStandardMaterial({color:"#ab9060",roughness:.4,metalness:.75});
  const cream=new THREE.MeshStandardMaterial({color:"#d4c3a3",roughness:.8});
  const objects=new Map<ChaletObjectId,THREE.Group>();
  function box(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material=wood,parent:THREE.Object3D=scene){
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(top:number,bottom:number,height:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=scene,segments=24){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  // Ground, approach and a level threshold keep movement continuous across the doorway.
  box(85,.15,85,0,-.18,0,new THREE.MeshStandardMaterial({color:"#798366",roughness:1}));
  box(2.8,.055,8,0,-.035,7,new THREE.MeshStandardMaterial({map:pathTexture,color:"#c1bda9",roughness:1,bumpMap:pathTexture,bumpScale:.025}));
  box(8,.22,8,0,-.16,-.25,stoneMaterial);
  box(7.2,.10,7.1,0,-.045,-.25,new THREE.MeshStandardMaterial({map:floorTexture,color:"#baa080",roughness:.88,bumpMap:floorTexture,bumpScale:.012}));
  for(let x=-3.4;x<3.5;x+=.32)box(.012,.006,7.1,x,.009,-.25,darkWood);
  box(3.4,.08,1.3,0,-.02,4.1,stoneMaterial);
  // Timber front with a real doorway.
  for(const [x,width] of [[-2.4,3.0],[2.4,3.0]])box(width,3.2,.26,x,1.6,3.5,wood);
  box(1.8,.7,.26,0,2.85,3.5,wood);
  for(const x of [-.9,.9])box(.14,2.6,.38,x,1.3,3.5,darkWood);
  box(2.05,.17,.38,0,2.6,3.5,darkWood);
  for(let y=.3;y<3.2;y+=.36){box(3,.018,.015,-2.4,y,3.64,darkWood);box(3,.018,.015,2.4,y,3.64,darkWood);}
  // Left wall; right and back walls are built around open windows.
  box(.26,3.2,7.5,-3.8,1.6,-.25,plaster);
  box(.26,1.1,7.5,3.8,.55,-.25,wood);box(.26,.7,7.5,3.8,2.85,-.25,plaster);
  box(.26,1.4,1.2,3.8,1.8,-3.4,plaster);box(.26,1.4,4.2,3.8,1.8,1.4,plaster);
  box(7.6,1.1,.26,0,.55,-4,wood);box(7.6,.7,.26,0,2.85,-4,plaster);
  box(4.6,1.4,.26,-1.5,1.8,-4,plaster);box(.65,1.4,.26,3.475,1.8,-4,plaster);
  // Wainscot, framing and ceiling beams make the room legible at walking scale.
  box(.08,1.05,7.4,-3.62,.525,-.25,darkWood);
  for(const x of [-3.62,3.62])box(.12,.12,7.5,x,1.1,-.25,darkWood);
  box(7.4,.12,.15,0,1.1,-3.84,darkWood);
  for(const x of [-3.6,0,3.6])box(.18,3.2,.18,x,1.6,-3.82,darkWood);
  for(const z of [-3.5,-1.5,.5,2.5])box(7.7,.22,.19,0,3.06,z,darkWood);
  // Double-pitched roof with closed gables, visible from the entrance.
  for(const sign of [-1,1]){const roof=box(4.55,.18,8.6,sign*2.05,3.88,-.25,darkWood);roof.rotation.z=-sign*.34;}
  const shape=new THREE.Shape();shape.moveTo(-4.1,3.2);shape.lineTo(0,4.63);shape.lineTo(4.1,3.2);shape.closePath();
  for(const z of [-4.25,3.75]){const gable=new THREE.Mesh(new THREE.ShapeGeometry(shape),new THREE.MeshStandardMaterial({map:timber,color:"#84705a",roughness:1,side:THREE.DoubleSide}));gable.position.z=z;gable.castShadow=true;scene.add(gable);}
  box(.22,.22,8.8,0,4.62,-.25,darkWood);
  function windowFrame(x:number,z:number,side:boolean){
    const group=new THREE.Group();group.position.set(x,1.8,z);if(side)group.rotation.y=Math.PI/2;scene.add(group);
    for(const dx of [-1.1,1.1])box(.12,1.55,.18,dx,0,0,darkWood,group);
    for(const dy of [-.75,.75])box(2.3,.12,.18,0,dy,0,darkWood,group);
    box(.065,1.4,.11,0,0,0,paleWood,group);box(2.2,.065,.11,0,0,0,paleWood,group);
    box(2.5,.1,.42,0,-.82,.02,wood,group);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.35),new THREE.MeshStandardMaterial({color:"#e0ecdb",transparent:true,opacity:.08,roughness:.15,side:THREE.DoubleSide}));group.add(glass);
  }
  windowFrame(2,-3.99,false);windowFrame(3.79,-1.7,true);
  // Door leaf: all meshes share an interactive parent at the actual hinge.
  const door=new THREE.Group();door.position.set(-.8,0,3.5);door.userData.interaction="door";scene.add(door);
  box(1.6,2.45,.10,.8,1.225,0,darkWood,door);
  for(let x=.1;x<1.6;x+=.2)box(.012,2.4,.012,x,1.225,.06,wood,door);
  for(const y of [.4,2.0])box(1.45,.11,.10,.8,y,-.07,wood,door);
  for(const z of [-.1,.1]){const handle=cylinder(.045,.045,.09,1.43,1.1,z,brass,door,16);handle.rotation.x=Math.PI/2;}
  for(const y of [.45,1.95])cylinder(.035,.035,.19,0,y,0,iron,door,12);
  // Work table, cupboard, stove, bench, shelves and small domestic details.
  box(2.7,.14,1.4,.7,.84,-1.35,paleWood);
  for(const x of [-.45,1.85])for(const z of [-1.9,-.8])box(.13,.78,.13,x,.4,z,darkWood);
  box(2.4,.08,.08,.7,.28,-1.35,darkWood);
  box(1.8,1.65,.58,-2.35,.825,-3.48,darkWood);
  for(const x of [-2.8,-1.9]){box(.8,.9,.035,x,.55,-3.165,wood);cylinder(.025,.025,.06,x,.65,-3.12,brass).rotation.x=Math.PI/2;}
  for(const y of [1.05,1.35,1.65])box(1.7,.06,.60,-2.35,y,-3.45,wood);
  for(let i=0;i<7;i++){const plate=cylinder(.13,.13,.025,-2.95+i*.19,1.18,-3.35,cream,scene,24);plate.rotation.x=Math.PI/2;}
  box(.82,.85,.8,-2.95,.47,-1.65,iron);box(.92,.08,.9,-2.95,.92,-1.65,iron);
  box(.52,.44,.035,-2.95,.53,-1.225,brass);box(.46,.38,.04,-2.95,.53,-1.20,iron);
  for(let x=-3.15;x< -2.7;x+=.1)box(.025,.24,.025,x,.51,-1.17,brass);
  cylinder(.085,.085,2.2,-3.1,2,-1.85,iron);
  cylinder(.19,.14,.20,-2.8,1.06,-1.6,iron);cylinder(.13,.19,.035,-2.8,1.18,-1.6,iron);
  box(.55,.12,1.65,3.17,.48,1.2,wood);for(const z of [.55,1.85])box(.08,.46,.12,3.17,.23,z,darkWood);
  box(.1,.55,1.7,3.42,.76,1.2,darkWood);
  // A chair behind the table, intentionally outside the guided front aisle.
  box(.52,.09,.5,.25,.48,-2.65,wood);for(const x of [.04,.46])for(const z of [-2.86,-2.44])box(.06,.47,.06,x,.235,z,darkWood);
  box(.52,.45,.06,.25,.79,-2.89,wood);
  for(const z of [-.4,1.1]){box(.36,.07,1.1,-3.42,2.1,z,wood);for(let i=0;i<3;i++)cylinder(.075,.065,.17,-3.35,2.22,z-.35+i*.32,cream);}
  const rugMat=new THREE.MeshStandardMaterial({color:"#7e5542",roughness:1});box(1.7,.006,2.0,-1.9,.014,.65,rugMat);
  for(const z of [-.15,.05,1.25,1.45])box(1.68,.008,.05,-1.9,.018,z,cream);
  // The three inspectable objects remain tangible meshes in the same world.
  const camera=new THREE.Group();camera.userData.interaction="camera";
  const leather=new THREE.MeshStandardMaterial({color:"#252923",roughness:.8}),metal=new THREE.MeshStandardMaterial({color:"#b8b3a5",roughness:.28,metalness:.85});
  box(.32,.20,.14,0,0,0,leather,camera);box(.32,.025,.145,0,.11,0,metal,camera);
  const lens=cylinder(.064,.064,.10,0,0,.10,metal,camera,40);lens.rotation.x=Math.PI/2;
  const ring=cylinder(.054,.054,.012,0,0,.157,iron,camera,40);ring.rotation.x=Math.PI/2;
  const glass=cylinder(.043,.043,.014,0,0,.166,new THREE.MeshStandardMaterial({color:"#203b3a",metalness:.5,roughness:.08,emissive:"#092222",emissiveIntensity:.2}),camera,40);glass.rotation.x=Math.PI/2;
  for(const x of [-.11,.11])cylinder(.034,.034,.035,x,.14,0,metal,camera,24);
  box(.06,.045,.05,.065,.15,.025,iron,camera);
  for(const x of [-.14,.14])for(const y of [-.075,.075]){const screw=cylinder(.008,.008,.008,x,y,.073,metal,camera,8);screw.rotation.x=Math.PI/2;}
  camera.position.set(-.12,1.02,-1.36);camera.rotation.y=.22;scene.add(camera);objects.set("camera",camera);
  const bowl=new THREE.Group();bowl.userData.interaction="bowl";
  const profile=[[.055,0],[.08,0],[.09,.025],[.135,.08],[.18,.14],[.18,.155],[.165,.158],[.15,.11],[.105,.055],[.055,.035],[0,.035]].map(([x,y])=>new THREE.Vector2(x,y));
  const vessel=new THREE.Mesh(new THREE.LatheGeometry(profile,64),new THREE.MeshStandardMaterial({color:"#a99b7f",roughness:.45,metalness:.03,side:THREE.DoubleSide}));vessel.castShadow=true;vessel.receiveShadow=true;bowl.add(vessel);bowl.position.set(1.35,.92,-1.4);scene.add(bowl);objects.set("bowl",bowl);
  const photograph=new THREE.Group();photograph.userData.interaction="photograph";
  box(.38,.24,.006,0,0,0,new THREE.MeshStandardMaterial({color:"#e8ddc0",roughness:.95}),photograph);
  const print=new THREE.Mesh(new THREE.PlaneGeometry(.34,.186),new THREE.MeshStandardMaterial({map:photo,roughness:.85}));print.position.z=.004;photograph.add(print);
  photograph.rotation.set(-Math.PI/2,0,-.16);photograph.position.set(.65,.925,-.94);scene.add(photograph);objects.set("photograph",photograph);
  // A distant landscape is an explicitly generated backdrop; the house and objects are geometry.
  const backdropMaterial=new THREE.MeshBasicMaterial({map:landscape,color:"#c7cfbf",side:THREE.DoubleSide});
  for(const [x,z,angle] of [[0,-28,0],[0,29,Math.PI],[-29,0,Math.PI/2],[29,0,-Math.PI/2]]){const backdrop=new THREE.Mesh(new THREE.PlaneGeometry(68,35),backdropMaterial);backdrop.position.set(x,11,z);backdrop.rotation.y=angle;scene.add(backdrop);}
  // Low stone garden edges and conifers frame the approach without blocking the path.
  for(const side of [-1,1]){box(.4,.45,6,side*2.25,.18,7,stoneMaterial);for(let i=0;i<4;i++){const x=side*(5+i*.6),z=6-i*3;cylinder(.14,.22,2,x,.9,z,darkWood);for(let level=0;level<3;level++){const crown=new THREE.Mesh(new THREE.ConeGeometry(1.25-level*.25,2.6,11),new THREE.MeshStandardMaterial({color:level%2?"#405a3d":"#334c35",roughness:1}));crown.position.set(x,2+level*.8,z);crown.castShadow=true;scene.add(crown);}}}
  scene.add(new THREE.HemisphereLight("#e4eee4","#806347",2.25));
  const sun=new THREE.DirectionalLight("#fff0cf",3.1);sun.position.set(8,11,6);sun.target.position.set(0,0,-1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-12;sun.shadow.camera.right=12;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.025;sun.shadow.bias=-.0002;scene.add(sun,sun.target);
  const bounce=new THREE.PointLight("#ffdfb3",7,12,2);bounce.position.set(0,2.65,0);scene.add(bounce);
  return {scene,door,objects,dispose(){const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh){geometries.add(object.geometry);for(const mat of Array.isArray(object.material)?object.material:[object.material])materials.add(mat);}});geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());sun.shadow.map?.dispose();}};
}
