import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { dressChalet, type RoomMood } from "./chalet-dressing";
import { createChaletLibrary, type ChaletLibrary } from "./chalet-library";
import { createChaletStories, type ChaletStories } from "./chalet-stories";
import type { ChaletObjectId } from "./chalet-layout";

export type ChaletWorld={scene:THREE.Scene;door:THREE.Group;objects:Map<ChaletObjectId,THREE.Group>;targets:Map<string,THREE.Group>;library:ChaletLibrary;stories:ChaletStories;update:(dt:number,time:number,mood:RoomMood,reduced:boolean,viewer:THREE.Vector3)=>void;dispose:()=>void};

export async function createChaletWorld():Promise<ChaletWorld>{
  const loader=new THREE.TextureLoader();
  const [timber,stone,landscape,photo,fir,village]=await Promise.all([
    loader.loadAsync("/cinematic/chalet/aged-timber.webp"),loader.loadAsync("/cinematic/chalet/alpine-stone.webp"),
    loader.loadAsync("/cinematic/chalet-v2/alpine-panorama.webp"),loader.loadAsync("/archive-originals/npd-figure-001.jpg"),loader.loadAsync("/cinematic/chalet-v2/alpine-fir.webp"),
    loader.loadAsync("/cinematic/alpine/village.webp"),
  ]);
  const textures=[timber,stone,landscape,photo,fir,village];textures.forEach(texture=>{texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;});
  timber.wrapS=timber.wrapT=stone.wrapS=stone.wrapT=THREE.RepeatWrapping;
  async function surface(id:string,repeatX:number,repeatY:number,folder="chalet-v2"){
    const [map,normalMap,roughnessMap]=await Promise.all(["color","normal","roughness"].map(channel=>loader.loadAsync(`/cinematic/${folder}/${id}-${channel}.webp`)));
    map.colorSpace=THREE.SRGBColorSpace;for(const texture of [map,normalMap,roughnessMap]){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(repeatX,repeatY);texture.anisotropy=4;textures.push(texture);}return {map,normalMap,roughnessMap};
  }
  const [floorSurface,plasterSurface,groundSurface]=await Promise.all([surface("old_wood_floor",2,3),surface("clay_plaster",2,2),surface("forest_ground_04",50,50)]);
  // Exterior materials are photographic CC0 scans; their UVs are laid out in metres so boards and stones keep a real scale.
  const [sidingSurface,planksSurface,slateSurface,masonrySurface]=await Promise.all(["weathered_plank_siding","weathered_planks","roof_slates_02","old_stone_wall"].map(id=>surface(id,1,1,"chalet-v3")));
  const pathTexture=stone.clone();pathTexture.repeat.set(2,6.2);textures.push(pathTexture);
  const scene=new THREE.Scene();landscape.mapping=THREE.EquirectangularReflectionMapping;scene.background=landscape;scene.environment=landscape;scene.environmentIntensity=.5;scene.backgroundIntensity=.85;scene.backgroundRotation.y=.8;scene.environmentRotation.y=.8;scene.fog=new THREE.Fog("#9d9d85",28,85);
  const wood=new THREE.MeshStandardMaterial({map:timber,color:"#aeb09d",roughness:.9,bumpMap:timber,bumpScale:.009});
  const darkWood=new THREE.MeshStandardMaterial({map:timber,color:"#8a8a79",roughness:.86,bumpMap:timber,bumpScale:.008});
  const furnitureMap=floorSurface.map.clone();furnitureMap.repeat.set(1,1);textures.push(furnitureMap);
  const paleWood=new THREE.MeshStandardMaterial({map:furnitureMap,roughness:.82,color:"#b8a78a",normalMap:floorSurface.normalMap,normalScale:new THREE.Vector2(.3,.3)});
  const plaster=new THREE.MeshStandardMaterial({...plasterSurface,map:null,color:"#d9cdb4",roughness:1,normalScale:new THREE.Vector2(.3,.3)});
  const stoneMaterial=new THREE.MeshStandardMaterial({map:stone,color:"#aca99c",roughness:1,bumpMap:stone,bumpScale:.035});
  const siding=new THREE.MeshStandardMaterial({...sidingSurface,color:"#e6d8c2",roughness:1});
  const planks=new THREE.MeshStandardMaterial({...planksSurface,color:"#bfb19c",roughness:1,side:THREE.DoubleSide});
  const slate=new THREE.MeshStandardMaterial({...slateSurface,color:"#b9b4a8",roughness:1,side:THREE.DoubleSide,normalScale:new THREE.Vector2(1.3,1.3)});
  const masonry=new THREE.MeshStandardMaterial({...masonrySurface,color:"#cdc6b6",roughness:1,normalScale:new THREE.Vector2(1.4,1.4)});
  const iron=new THREE.MeshStandardMaterial({color:"#292b28",roughness:.65,metalness:.6});
  const brass=new THREE.MeshStandardMaterial({color:"#ab9060",roughness:.4,metalness:.75});
  const cream=new THREE.MeshStandardMaterial({color:"#d4c3a3",roughness:.8});
  const objects=new Map<ChaletObjectId,THREE.Group>();
  function box(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material=wood,parent:THREE.Object3D=scene){
    const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,2,Math.min(.018,w/6,h/6,d/6)),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  function cylinder(top:number,bottom:number,height:number,x:number,y:number,z:number,material:THREE.Material,parent:THREE.Object3D=scene,segments=24){
    const mesh=new THREE.Mesh(new THREE.CylinderGeometry(top,bottom,height,segments),material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  /** A box whose faces repeat a texture every `tile` metres instead of stretching it. */
  function solid(w:number,h:number,d:number,x:number,y:number,z:number,material:THREE.Material,tile:number,parent:THREE.Object3D=scene){
    const geometry=new THREE.BoxGeometry(w,h,d),uv=geometry.attributes.uv,faces=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
    for(let i=0;i<uv.count;i++){const [across,up]=faces[Math.floor(i/4)];uv.setXY(i,uv.getX(i)*across/tile,uv.getY(i)*up/tile);}
    const mesh=new THREE.Mesh(geometry,material);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;
  }
  type Wall={turn:number;sign:number;place:(mesh:THREE.Mesh,along:number,height:number)=>void};
  /** One board-clad panel of an outside wall; neighbouring panels share continuous boards. */
  function cladding(wall:Wall,from:number,to:number,low:number,high:number){
    const geometry=new THREE.PlaneGeometry(to-from,high-low),uv=geometry.attributes.uv,position=geometry.attributes.position,along=(from+to)/2,height=(low+high)/2;
    for(let i=0;i<uv.count;i++)uv.setXY(i,(position.getX(i)+wall.sign*along)/1.57,(position.getY(i)+height)/1.57);
    const mesh=new THREE.Mesh(geometry,siding);mesh.rotation.y=wall.turn;wall.place(mesh,along,height);mesh.receiveShadow=true;scene.add(mesh);
  }
  function claddingAround(wall:Wall,from:number,to:number,opening:[number,number]){cladding(wall,from,to,.5,1);cladding(wall,from,to,2.6,3.2);cladding(wall,from,opening[0],1,2.6);cladding(wall,opening[1],to,1,2.6);}
  // Ground, approach and a level threshold keep movement continuous across the doorway.
  box(170,.15,170,0,-.18,0,new THREE.MeshStandardMaterial({...groundSurface,color:"#8f9671",roughness:1,normalScale:new THREE.Vector2(.7,.7)}));
  box(2.8,.055,10,0,-.035,8,new THREE.MeshStandardMaterial({map:pathTexture,color:"#c1bda9",roughness:1,bumpMap:pathTexture,bumpScale:.025}));
  box(8,.22,8,0,-.16,-.25,stoneMaterial);
  box(7.2,.10,7.1,0,-.045,-.25,new THREE.MeshStandardMaterial({...floorSurface,color:"#d5c7a7",roughness:.85,normalScale:new THREE.Vector2(.5,.5)}));

  box(3.4,.08,1.3,0,-.02,4.1,stoneMaterial);
  // Timber front with a real doorway.
  for(const [x,width] of [[-2.4,3.0],[2.4,3.0]])box(width,3.2,.26,x,1.6,3.5,wood);
  box(1.8,.7,.26,0,2.85,3.5,wood);
  for(const x of [-.9,.9])box(.14,2.6,.38,x,1.3,3.5,darkWood);
  box(2.05,.17,.38,0,2.6,3.5,darkWood);
  // Outside, the house wears weathered boards over a stone footing, like the timber houses of the village plate.
  const frontWall:Wall={turn:0,sign:1,place:(mesh,along,height)=>mesh.position.set(along,height,3.655)},backWall:Wall={turn:Math.PI,sign:-1,place:(mesh,along,height)=>mesh.position.set(along,height,-4.155)};
  const rightWall:Wall={turn:Math.PI/2,sign:-1,place:(mesh,along,height)=>mesh.position.set(3.955,height,along)},leftWall:Wall={turn:-Math.PI/2,sign:1,place:(mesh,along,height)=>mesh.position.set(-3.955,height,along)};
  cladding(frontWall,-3.93,-.97,.5,3.2);cladding(frontWall,.97,3.93,.5,3.2);cladding(frontWall,-.97,.97,2.68,3.2);
  claddingAround(backWall,-3.93,3.93,[.85,3.15]);claddingAround(rightWall,-4.13,3.63,[-2.85,-.55]);cladding(leftWall,-4.13,3.63,.5,3.2);
  for(const x of [-3.96,3.96])for(const z of [3.66,-4.16])solid(.24,2.72,.24,x,1.86,z,planks,2);
  for(const x of [-2.46,2.46])solid(3.1,.56,.22,x,.28,3.72,masonry,2);
  for(const x of [-4.03,4.03])solid(.22,.56,8.06,x,.28,-.25,masonry,2);
  solid(8.28,.56,.22,0,.28,-4.22,masonry,2);
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
  const gableGeometry=new THREE.ShapeGeometry(shape),gableUv=gableGeometry.attributes.uv;for(let i=0;i<gableUv.count;i++)gableUv.setXY(i,gableUv.getX(i)/2,gableUv.getY(i)/2);
  for(const z of [-4.25,3.75]){const gable=new THREE.Mesh(gableGeometry,planks);gable.position.z=z;gable.castShadow=true;scene.add(gable);}
  // Stone slates over the timber deck, with bargeboards closing the gable edges and a capped ridge.
  for(const sign of [-1,1]){
    const eave=[sign*4.352,3.205],ridge=[sign*.004,4.742],run=Math.hypot(eave[0]-ridge[0],eave[1]-ridge[1])/3,geometry=new THREE.BufferGeometry();
    geometry.setAttribute("position",new THREE.Float32BufferAttribute([eave[0],eave[1],4.2,eave[0],eave[1],-4.7,ridge[0],ridge[1],-4.7,ridge[0],ridge[1],4.2],3));
    geometry.setAttribute("uv",new THREE.Float32BufferAttribute([0,0,8.9/3,0,8.9/3,run,0,run],2));geometry.setIndex(sign>0?[0,1,2,0,2,3]:[0,2,1,0,3,2]);geometry.computeVertexNormals();
    const slates=new THREE.Mesh(geometry,slate);slates.receiveShadow=true;slates.userData.ignoreRay=true;scene.add(slates);
    for(const z of [4.23,-4.73]){const board=solid(4.72,.3,.07,sign*2.14,3.93,z,planks,2);board.rotation.z=-sign*.34;}
  }
  solid(.34,.09,8.96,0,4.775,-.25,slate,3);
  box(.22,.22,8.8,0,4.62,-.25,darkWood);
  function windowFrame(x:number,z:number,side:boolean){
    const group=new THREE.Group();group.position.set(x,1.8,z);if(side)group.rotation.y=Math.PI/2;scene.add(group);
    for(const dx of [-1.1,1.1])box(.12,1.55,.18,dx,0,0,darkWood,group);
    for(const dy of [-.75,.75])box(2.3,.12,.18,0,dy,0,darkWood,group);
    box(.065,1.4,.11,0,0,0,paleWood,group);box(2.2,.065,.11,0,0,0,paleWood,group);
    box(2.5,.1,.42,0,-.82,.02,wood,group);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(2.1,1.35),new THREE.MeshStandardMaterial({color:"#e0ecdb",transparent:true,opacity:.08,roughness:.15,side:THREE.DoubleSide}));glass.userData.ignoreRay=true;group.add(glass);
  }
  windowFrame(2,-3.99,false);windowFrame(3.79,-1.7,true);
  // Door leaf: all meshes share an interactive parent at the actual hinge.
  const door=new THREE.Group();door.position.set(-.8,0,3.5);door.userData.interaction="door";scene.add(door);
  solid(1.6,2.45,.10,.8,1.225,0,planks,2,door);

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
  box(.82,.85,.8,-2.95,.47,-1.65,iron);box(.92,.08,.9,-2.95,.92,-1.65,iron);
  box(.52,.44,.035,-2.95,.53,-1.225,brass);box(.46,.38,.04,-2.95,.53,-1.20,iron);
  for(let x=-3.15;x< -2.7;x+=.1)box(.025,.24,.025,x,.51,-1.17,brass);
  cylinder(.085,.085,2.2,-3.1,2,-1.85,iron);
  cylinder(.19,.14,.20,-2.8,1.06,-1.6,iron);cylinder(.13,.19,.035,-2.8,1.18,-1.6,iron);
  box(.55,.12,1.65,3.17,.48,1.2,wood);for(const z of [.55,1.85])box(.08,.46,.12,3.17,.23,z,darkWood);
  box(.1,.55,1.7,3.42,.76,1.2,darkWood);
  // A chair behind the table, intentionally outside the guided front aisle.
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
  const dressing=dressChalet(scene,paleWood,brass,textures);
  const reverse=new THREE.Mesh(new THREE.PlaneGeometry(.34,.21),new THREE.MeshStandardMaterial({map:dressing.backTexture,roughness:1}));reverse.rotation.y=Math.PI;reverse.position.z=-.004;photograph.add(reverse);
  // Photographic foliage cutouts and instanced grass replace the geometric cone trees.
  const foliage=new THREE.MeshStandardMaterial({map:fir,alphaTest:.45,side:THREE.DoubleSide,roughness:1,color:"#aaa995"});
  function plantFir(x:number,z:number,height:number,turn:number){for(const angle of [0,Math.PI/2]){const tree=new THREE.Mesh(new THREE.PlaneGeometry(height*.66,height),foliage);tree.position.set(x,height/2-.08,z);tree.rotation.y=angle+turn;tree.castShadow=true;tree.userData.ignoreRay=true;scene.add(tree);}}
  // The right-hand trees step aside beyond the house, opening a sight line to the village.
  for(const side of [-1,1]){solid(.42,.5,8.4,side*2.25,.2,8.3,masonry,2);for(let i=0;i<7;i++){const open=side>0&&i>2;plantFir(side*(6+i*.7)+(open?9+i*1.6:side>0?3.6:0),9-i*3.4,7+(i%3)*1.3,i*.7);}}
  for(const [x,z,height] of [[37,-27,10],[41,-33,8.5],[-17,-50,11],[-23,-44,9],[-9,-58,12]])plantFir(x,z,height,x);

  // The photographic village of the valley scene, seen from the house: one place, two ways of exploring it.
  const villagePlane=new THREE.Mesh(new THREE.PlaneGeometry(54,36),new THREE.MeshBasicMaterial({map:village,transparent:true,alphaTest:.06,color:"#bdb7a3",depthWrite:false}));
  villagePlane.position.set(10.72,16.4,-43.1);villagePlane.rotation.y=-.408;villagePlane.userData.ignoreRay=true;villagePlane.renderOrder=-1;scene.add(villagePlane);
  const church=new THREE.Group();church.position.set(18.25,0,-39.85);church.rotation.y=-.408;church.userData.interaction="church";church.userData.reachPoint=[0,12,0];scene.add(church);
  const churchProxy=new THREE.Mesh(new THREE.PlaneGeometry(9,15),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));churchProxy.position.set(0,13.5,.3);church.add(churchProxy);

  // Facade details echo the timber houses of the village: a stone footing, closed shutters, flowers and firewood.

  for(const dx of [-.27,.27])solid(.5,.95,.05,-2.4+dx,1.78,3.69,planks,2);
  box(1.2,.07,.09,-2.4,2.3,3.67,darkWood);box(1.2,.09,.2,-2.4,1.25,3.72,darkWood);
  for(const dx of [-.27,.27])for(const dy of [-.3,.3])box(.44,.03,.02,-2.4+dx,1.78+dy,3.725,darkWood);
  const flowerBox=box(1.05,.15,.2,-2.4,1.37,3.78,darkWood);flowerBox.userData.ignoreRay=true;
  const petals=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.05,1),new THREE.MeshStandardMaterial({color:"#b5412f",roughness:.9}),16),leaves=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.07,1),new THREE.MeshStandardMaterial({color:"#4c6238",roughness:1}),14),sprig=new THREE.Object3D();
  for(let i=0;i<16;i++){sprig.position.set(-2.88+i*.064,1.5+Math.abs(Math.sin(i*3.1))*.07,3.8+Math.sin(i*5.3)*.05);sprig.scale.setScalar(.7+Math.abs(Math.sin(i*1.7))*.5);sprig.updateMatrix();petals.setMatrixAt(i,sprig.matrix);}
  for(let i=0;i<14;i++){sprig.position.set(-2.88+i*.074,1.45+Math.abs(Math.sin(i*2.3))*.03,3.79+Math.sin(i*4.1)*.05);sprig.scale.setScalar(.8+Math.abs(Math.sin(i*2.9))*.4);sprig.updateMatrix();leaves.setMatrixAt(i,sprig.matrix);}
  for(const cluster of [petals,leaves]){cluster.castShadow=true;cluster.userData.ignoreRay=true;scene.add(cluster);}
  for(let row=0;row<5;row++)for(let i=0;i<9-row;i++){const log=cylinder(.085,.08,.42,1.62+row*.09+i*.18,.09+row*.155,4.06,darkWood,scene,10);log.rotation.x=Math.PI/2;}
  // A meadow rather than a lawn: short blades in mixed greens around the house, with a scatter of small flowers.
  const scatter=(seed:number)=>{const value=Math.sin(seed*127.1+311.7)*43758.5453;return value-Math.floor(value);};
  const meadow=(x:number,z:number)=>!(Math.abs(x)<4.5&&z>-4.7&&z<4.4)&&!(Math.abs(x)<2.55&&z>3.4&&z<12.8);
  const grassGeometry=new THREE.BufferGeometry();grassGeometry.setAttribute("position",new THREE.Float32BufferAttribute([-.016,0,0,.016,0,0,.006,.2,.02],3));grassGeometry.computeVertexNormals();
  const grass=new THREE.InstancedMesh(grassGeometry,new THREE.MeshStandardMaterial({color:"#ffffff",side:THREE.DoubleSide,roughness:1}),4600),dummy=new THREE.Object3D(),tint=new THREE.Color(),dry=new THREE.Color("#8f9459"),lush=new THREE.Color("#55653a");
  for(let i=0;i<4600;i++){
    let x=(scatter(i)-.5)*30,z=-13+scatter(i+.37)*32;if(!meadow(x,z)){x=(x<0?-1:1)*(4.7+scatter(i+.71)*9);z=-4+scatter(i+.13)*20;}
    dummy.position.set(x,-.1,z);dummy.rotation.set((scatter(i+.5)-.5)*.5,scatter(i+.9)*Math.PI*2,(scatter(i+.2)-.5)*.5);dummy.scale.set(1,.55+scatter(i+.6)*1.1,1);dummy.updateMatrix();grass.setMatrixAt(i,dummy.matrix);grass.setColorAt(i,tint.copy(lush).lerp(dry,scatter(i+.44)));
  }
  grass.receiveShadow=true;grass.userData.ignoreRay=true;scene.add(grass);
  const flowers=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.013,0),new THREE.MeshStandardMaterial({color:"#ffffff",roughness:.9}),320),blooms=["#f1ead2","#e9cf6a","#b7a0cf","#f1ead2"];
  for(let i=0;i<320;i++){
    let x=(scatter(i+7.1)-.5)*22,z=-8+scatter(i+3.3)*26;if(!meadow(x,z)){x=(x<0?-1:1)*(4.8+scatter(i+5.7)*6);z=2+scatter(i+9.1)*14;}
    dummy.position.set(x,-.02+scatter(i+1.9)*.07,z);dummy.rotation.set(0,0,0);dummy.scale.setScalar(.7+scatter(i+2.3)*.8);dummy.updateMatrix();flowers.setMatrixAt(i,dummy.matrix);flowers.setColorAt(i,tint.set(blooms[i%4]));
  }
  flowers.userData.ignoreRay=true;scene.add(flowers);
  // A stone chimney above the stove, with a thread of smoke: the house is lived in.
  solid(.62,2.15,.62,-3.1,4.4,-1,masonry,2);for(const dx of [-.22,.22])for(const dz of [-.22,.22])solid(.1,.14,.1,-3.1+dx,5.545,-1+dz,masonry,2);solid(.86,.07,.86,-3.1,5.65,-1,slate,3);
  const smokeCanvas=document.createElement("canvas");smokeCanvas.width=smokeCanvas.height=64;const smokeContext=smokeCanvas.getContext("2d")!,smokeGradient=smokeContext.createRadialGradient(32,32,2,32,32,32);smokeGradient.addColorStop(0,"rgba(255,255,255,.9)");smokeGradient.addColorStop(.5,"rgba(255,255,255,.35)");smokeGradient.addColorStop(1,"rgba(255,255,255,0)");smokeContext.fillStyle=smokeGradient;smokeContext.fillRect(0,0,64,64);
  const smokeMap=new THREE.CanvasTexture(smokeCanvas),smoke:THREE.Sprite[]=[];
  for(let i=0;i<8;i++){const puff=new THREE.Sprite(new THREE.SpriteMaterial({map:smokeMap,color:"#d8d4cb",transparent:true,opacity:0,depthWrite:false}));puff.userData.ignoreRay=true;scene.add(puff);smoke.push(puff);}
  function drift(time:number,reduced:boolean){for(let i=0;i<smoke.length;i++){const age=reduced?(i+.5)/smoke.length:(time*.085+i/smoke.length)%1,puff=smoke[i];puff.position.set(-3.1+age*age*2.1+Math.sin(time*.45+i*1.7)*.1*age,5.72+age*3.1,-1+age*.55);puff.scale.setScalar(.34+age*2);puff.material.opacity=Math.sin(age*Math.PI)*.34*(1-age*.35);}}
  drift(0,true);
  scene.add(new THREE.HemisphereLight("#dfe3dc","#7a5c3e",1.0));
  const sun=new THREE.DirectionalLight("#ffd9a0",4.2);sun.position.set(9,7,-7);sun.target.position.set(0,0,-1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.camera.left=-11;sun.shadow.camera.right=11;sun.shadow.camera.top=11;sun.shadow.camera.bottom=-11;sun.shadow.normalBias=.018;sun.shadow.bias=-.00015;sun.shadow.radius=2.5;scene.add(sun,sun.target);
  const bounce=new THREE.PointLight("#ffd9ad",2.3,11,2);bounce.position.set(1.6,2.3,-1.4);scene.add(bounce);const fill=new THREE.DirectionalLight("#d8d6cb",.9);fill.position.set(-4,5,9);scene.add(fill);
  // Open shade: sky light on the facade and the path, so the arrival is not a silhouette against the sun.
  const porch=new THREE.PointLight("#ece6d8",38,14,2);porch.position.set(.8,4,8.6);scene.add(porch);
  // Sunlight made visible: additive sheets follow the sun from each window to the floor.
  const sunDirection=new THREE.Vector3(-9,-7,6).normalize(),shaftMaterial=new THREE.MeshBasicMaterial({color:"#ffdca6",vertexColors:true,transparent:true,opacity:.032,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
  function shaft(low:THREE.Vector3,high:THREE.Vector3,across:THREE.Vector3){
    const positions:number[]=[],colors:number[]=[],fall=(point:THREE.Vector3)=>point.clone().addScaledVector(sunDirection,(point.y-.03)/-sunDirection.y);
    const quad=(a:THREE.Vector3,b:THREE.Vector3)=>{const c=fall(b),d=fall(a);for(const [point,light] of [[a,1],[b,1],[c,.12],[a,1],[c,.12],[d,.12]] as const){positions.push(point.x,point.y,point.z);colors.push(light,light,light);}};
    for(let i=0;i<=6;i++){const offset=across.clone().multiplyScalar(i/6);quad(low.clone().add(offset),high.clone().add(offset));}
    quad(low,low.clone().add(across));quad(high,high.clone().add(across));
    const geometry=new THREE.BufferGeometry();geometry.setAttribute("position",new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute("color",new THREE.Float32BufferAttribute(colors,3));
    const mesh=new THREE.Mesh(geometry,shaftMaterial);mesh.userData.ignoreRay=true;mesh.renderOrder=5;scene.add(mesh);
  }
  shaft(new THREE.Vector3(3.64,1.14,-2.72),new THREE.Vector3(3.64,2.46,-2.72),new THREE.Vector3(0,0,2.04));
  shaft(new THREE.Vector3(.98,1.14,-3.85),new THREE.Vector3(.98,2.46,-3.85),new THREE.Vector3(2.04,0,0));
  const library=await createChaletLibrary(scene,paleWood,textures);for(const [id,object] of library.objects)objects.set(id,object);
  const stories=await createChaletStories(scene,paleWood,textures);for(const [id,object] of stories.objects)objects.set(id,object);
  const targets=new Map<string,THREE.Group>([...dressing.targets,...library.targets,...stories.targets,...objects,["church",church]]);
  // Layer 1 is the "in your hands" pass: every light also reaches an object drawn in front of the softened room.
  scene.traverse(object=>{if(object instanceof THREE.Light)object.layers.enable(1);});
  return {scene,door,objects,targets,library,stories,update(dt,time,mood,reduced,viewer){dressing.update(dt,time,mood,reduced);library.update(time,reduced,viewer);stories.update(time,reduced,viewer);drift(time,reduced);},dispose(){stories.dispose();for(const puff of smoke)puff.material.dispose();smokeMap.dispose();const geometries=new Set<THREE.BufferGeometry>(),materials=new Set<THREE.Material>();scene.traverse(object=>{if(object instanceof THREE.Mesh||object instanceof THREE.Points){geometries.add(object.geometry);for(const mat of Array.isArray(object.material)?object.material:[object.material])materials.add(mat);}});geometries.forEach(geometry=>geometry.dispose());materials.forEach(material=>material.dispose());textures.forEach(texture=>texture.dispose());sun.shadow.map?.dispose();}};
}
