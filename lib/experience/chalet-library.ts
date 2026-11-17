import * as THREE from "three";
import { libraryPages, libraryRecords, wrapLibraryIndex, type LibraryStation } from "./library-content";
import type { ChaletObjectId } from "./chalet-layout";

/** A photographic presence in a real-time room; never represented as an archival scene. */
export async function createChaletLibrary(scene:THREE.Scene, wood:THREE.Material, textures:THREE.Texture[]) {
  const loader=new THREE.TextureLoader();
  const [price,...records]=await Promise.all(["/library/price-seated-recreation.webp",...libraryRecords.map(record=>record.image)].map(src=>loader.loadAsync(src)));
  for(const texture of [price,...records]){texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);}
  const targets=new Map<string,THREE.Group>(),objects=new Map<ChaletObjectId,THREE.Group>();
  const paper=new THREE.MeshStandardMaterial({color:"#eee2c2",roughness:.9});
  const iron=new THREE.MeshStandardMaterial({color:"#30352f",roughness:.6,metalness:.4});
  const brass=new THREE.MeshStandardMaterial({color:"#a5915e",roughness:.4,metalness:.65});
  const box=(w:number,h:number,d:number,x:number,y:number,z:number,mat:THREE.Material=wood,parent:THREE.Object3D=scene)=>{const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;};
  function canvasTexture(draw:(ctx:CanvasRenderingContext2D)=>void,w=1024,h=640){const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;draw(canvas.getContext("2d")!);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=4;textures.push(texture);return texture;}
  function label(text:string){return canvasTexture(ctx=>{ctx.fillStyle="#e5d9b6";ctx.fillRect(0,0,1024,640);ctx.fillStyle="#394334";ctx.font="52px Georgia";ctx.textAlign="center";ctx.fillText(text,512,270);ctx.font="24px sans-serif";ctx.fillText("THE SWISS STUDY · RECREATED DISPLAY",512,350);});}
  const seated=new THREE.Group();seated.position.set(.25,0,-2.68);seated.userData.interaction="price";seated.userData.reachPoint=[0,1.25,.08];scene.add(seated);targets.set("price",seated);
  const bodyGeometry=new THREE.PlaneGeometry(1.08,1.62,18,26);
  const vertices=bodyGeometry.attributes.position;for(let i=0;i<vertices.count;i++){const x=vertices.getX(i);vertices.setZ(i,.055*(1-Math.pow(x/.54,2)));}bodyGeometry.computeVertexNormals();
  const figure=new THREE.Mesh(bodyGeometry,new THREE.MeshStandardMaterial({map:price,alphaTest:.5,roughness:1,side:THREE.DoubleSide}));figure.position.y=.81;figure.castShadow=true;seated.add(figure);
  const nameplate=new THREE.Mesh(new THREE.PlaneGeometry(.6,.18),new THREE.MeshStandardMaterial({map:label("Weston A. Price"),roughness:1}));nameplate.position.set(.25,.47,-2.34);nameplate.rotation.x=-.3;scene.add(nameplate);
  const portraitLight=new THREE.PointLight("#ffe6c4",1.5,4.2,2);portraitLight.position.set(.75,1.75,-1.85);scene.add(portraitLight);
  // A soft contact shadow seats the photographic figure on the floor instead of leaving it floating.
  const seatShadow=new THREE.Mesh(new THREE.PlaneGeometry(1.15,.8),new THREE.MeshBasicMaterial({map:canvasTexture(ctx=>{const g=ctx.createRadialGradient(128,128,8,128,128,128);g.addColorStop(0,"rgba(14,9,5,.62)");g.addColorStop(1,"rgba(14,9,5,0)");ctx.fillStyle=g;ctx.fillRect(0,0,256,256);},256,256),transparent:true,depthWrite:false}));
  seatShadow.rotation.x=-Math.PI/2;seatShadow.position.set(.25,.022,-2.6);seatShadow.userData.ignoreRay=true;scene.add(seatShadow);
  let turned=0,clock=0;
  // Books occupy the existing back cupboard, without reducing the walking aisle.
  const bookColors=["#574838","#52604a","#5b3730","#9a845a","#3d4d51"];
  for(let row=0;row<2;row++)for(let i=0;i<12;i++){const h=.23+(i%3)*.035;box(.10,h,.27,-3.02+i*.115,1.08+row*.30+h/2,-3.39,new THREE.MeshStandardMaterial({color:bookColors[i%5],roughness:.85}));box(.085,.008,.005,-3.02+i*.115,1.12+row*.3,-3.25,brass);}
  // A low archival cabinet and reading light, placed outside the main tour route.
  box(1.0,.10,1.0,-2.85,.82,.95);
  for(const x of [-3.25,-2.45])for(const z of [.55,1.35])box(.075,.8,.075,x,.4,z);
  const cabinet=new THREE.Group();cabinet.position.set(-2.85,.9,.72);cabinet.userData.interaction="plate";scene.add(cabinet);targets.set("plate",cabinet);
  box(.72,.22,.46,0,.11,0,wood,cabinet);box(.66,.025,.40,0,.235,0,iron,cabinet);
  const lid=box(.72,.035,.45,0,.43,-.25,wood,cabinet);lid.rotation.x=-.95;
  for(let i=0;i<7;i++){const divider=box(.57,.27,.016,0,.27,-.14+i*.044,paper,cabinet);divider.rotation.x=-.2;}
  const cabinetLabel=new THREE.Mesh(new THREE.PlaneGeometry(.41,.11),new THREE.MeshStandardMaterial({map:label("Photographic studies"),roughness:1}));cabinetLabel.position.set(0,.12,.236);cabinet.add(cabinetLabel);
  const lightTable=box(.75,.025,.28,-2.85,.889,1.27,new THREE.MeshStandardMaterial({color:"#f8efcf",emissive:"#eedbbc",emissiveIntensity:.5,roughness:.6}));lightTable.userData.ignoreRay=true;
  const plate=new THREE.Group();plate.userData.interaction="plate";plate.position.set(-2.85,.94,1.27);plate.rotation.set(-Math.PI/2,0,.12);scene.add(plate);objects.set("plate",plate);
  box(.56,.40,.012,0,0,0,iron,plate);box(.50,.34,.014,0,0,.002,paper,plate);
  const printMat=new THREE.MeshStandardMaterial({map:records[0],emissiveMap:records[0],emissive:"#ffffff",emissiveIntensity:.05,roughness:.55});
  const print=new THREE.Mesh(new THREE.PlaneGeometry(1,1),printMat);print.position.z=.011;plate.add(print);
  const rearMat=new THREE.MeshStandardMaterial({roughness:1});const rear=new THREE.Mesh(new THREE.PlaneGeometry(.49,.33),rearMat);rear.rotation.y=Math.PI;rear.position.z=-.008;plate.add(rear);
  const sourceTextures=libraryRecords.map(record=>canvasTexture(ctx=>{ctx.fillStyle="#e6dbc1";ctx.fillRect(0,0,1024,640);ctx.fillStyle="#3d493a";ctx.font="25px sans-serif";ctx.fillText("SOURCE RECORD / CONTEMPORARY LABEL",55,85);ctx.font="37px Georgia";ctx.fillText(record.title.slice(0,45),55,195);ctx.font="24px sans-serif";ctx.fillText(record.source.slice(0,65),55,290);ctx.fillText(record.kind,55,345);ctx.font="22px sans-serif";ctx.fillText("Virtual glass mount created for this experience.",55,480);ctx.fillText("The image retains its own provenance.",55,525);}));
  // An open reading companion: editorial paraphrase with a source on every page.
  const book=new THREE.Group();book.userData.interaction="book";book.position.set(.72,.965,-1.73);book.rotation.set(-Math.PI/2,0,-.1);scene.add(book);objects.set("book",book);targets.set("book",book);
  box(.57,.38,.025,0,0,0,new THREE.MeshStandardMaterial({color:"#354b3e",roughness:1}),book);box(.55,.36,.018,0,0,.019,paper,book);
  const pageTextures=libraryPages.map(page=>canvasTexture(ctx=>{ctx.fillStyle="#eadfc4";ctx.fillRect(0,0,1400,920);ctx.strokeStyle="#c8b996";ctx.beginPath();ctx.moveTo(700,35);ctx.lineTo(700,890);ctx.stroke();ctx.fillStyle="#364333";ctx.font="20px sans-serif";ctx.fillText("A READING COMPANION",65,95);ctx.font="39px Georgia";ctx.fillText(page.title,65,175);ctx.font="19px sans-serif";ctx.fillText(page.subtitle,65,235);ctx.font="25px Georgia";page.lines.forEach((line,i)=>ctx.fillText(line,65,340+i*48));ctx.font="25px Georgia";ctx.fillText("Read alongside the original",755,190);ctx.font="22px sans-serif";["Nutrition and Physical", "Degeneration · Swiss chapter", "", "Contemporary paraphrase", "Not Price’s notebook", "Not his recorded voice", "", "Open the source from", "the reading controls."].forEach((line,i)=>ctx.fillText(line,755,280+i*48));},1400,920));
  const pageMat=new THREE.MeshStandardMaterial({map:pageTextures[0],roughness:1});const pages=new THREE.Mesh(new THREE.PlaneGeometry(.54,.35),pageMat);pages.position.z=.03;book.add(pages);
  // Wall projection is part of the room and remains visible while walking.
  box(2.22,1.26,.035,-2.04,2.33,-3.82,paper);
  const projectedMat=new THREE.MeshBasicMaterial({map:records[0],toneMapped:false,color:"#ebdbbb"});const projected=new THREE.Mesh(new THREE.PlaneGeometry(1,1),projectedMat);projected.position.set(-2.04,2.33,-3.79);projected.visible=false;scene.add(projected);
  const screenLabel=new THREE.Mesh(new THREE.PlaneGeometry(1.6,.9),new THREE.MeshBasicMaterial({map:label("A window into the archive"),toneMapped:false}));screenLabel.position.set(-2.04,2.33,-3.795);scene.add(screenLabel);
  const projector=new THREE.Group();projector.position.set(-2.83,.92,.52);projector.userData.interaction="projector";scene.add(projector);targets.set("projector",projector);
  box(.28,.25,.30,.38,.13,0,iron,projector);const lens=new THREE.Mesh(new THREE.CylinderGeometry(.065,.065,.12,24),brass);lens.rotation.x=Math.PI/2;lens.position.set(.38,.16,-.20);projector.add(lens);
  const beamMat=new THREE.MeshBasicMaterial({color:"#ffedbf",transparent:true,opacity:.025,depthWrite:false,side:THREE.DoubleSide});const beam=new THREE.Mesh(new THREE.ConeGeometry(.85,4.7,32,1,true),beamMat);beam.userData.ignoreRay=true;beam.position.set(-2.14,1.7,-1.1);beam.rotation.x=-1.29;beam.visible=false;scene.add(beam);
  const marker=new THREE.Mesh(new THREE.RingGeometry(.19,.22,48),new THREE.MeshBasicMaterial({color:"#e7c77f",transparent:true,opacity:.9,side:THREE.DoubleSide,depthTest:false}));marker.userData.ignoreRay=true;marker.renderOrder=8;marker.visible=false;scene.add(marker);
  let highlighted:LibraryStation|null=null;
  function select(index:number){index=wrapLibraryIndex(index,records.length);const record=libraryRecords[index];printMat.map=records[index];printMat.emissiveMap=records[index];rearMat.map=sourceTextures[index];rearMat.needsUpdate=true;projectedMat.map=records[index];const fit=(w:number,h:number)=>record.aspect>w/h?[w,w/record.aspect]:[h*record.aspect,h];const [w,h]=fit(.47,.31);print.scale.set(w,h,1);const [sw,sh]=fit(2.12,1.16);projected.scale.set(sw,sh,1);}
  select(0);
  return {objects,targets,select,setPage(index:number){pageMat.map=pageTextures[wrapLibraryIndex(index,pageTextures.length)];},setLight(value:boolean){printMat.emissiveIntensity=value?.7:.05;},setProjection(value:boolean){projected.visible=value;screenLabel.visible=!value;beam.visible=value;},highlight(id:LibraryStation|null){highlighted=id;marker.visible=!!id;},update(time:number,reduced:boolean,viewer:THREE.Vector3){
    // The cutout turns a little toward the visitor and breathes almost imperceptibly; it never walks or speaks.
    const dt=Math.min(.1,Math.max(0,time-clock));clock=time;const facing=THREE.MathUtils.clamp(Math.atan2(viewer.x-seated.position.x,viewer.z-seated.position.z),-.48,.48);
    turned=reduced?facing:THREE.MathUtils.damp(turned,facing,2.2,dt);seated.rotation.y=turned;const breath=reduced?1:1+Math.sin(time*1.15)*.0035;figure.scale.y=breath;figure.position.y=.81*breath;
    if(highlighted){const target=objects.get(highlighted as ChaletObjectId)??targets.get(highlighted);if(target){target.getWorldPosition(marker.position);marker.position.y+=highlighted==="price"?1.7:.45;marker.rotation.set(0,0,0);marker.scale.setScalar(reduced?1:1+Math.sin(time*2)*.08);}}}};
}
export type ChaletLibrary=Awaited<ReturnType<typeof createChaletLibrary>>;
