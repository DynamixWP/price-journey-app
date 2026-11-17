export type ChaletObjectId = "camera" | "bowl" | "photograph" | "plate" | "book";
export type WalkPoint = { x:number; z:number };
export type Obstacle = { minX:number; maxX:number; minZ:number; maxZ:number };
export const PLAYER_RADIUS=.22;
export const chaletObstacles:Obstacle[]=[
  {minX:-3.95,maxX:-3.55,minZ:-4.2,maxZ:3.65},
  {minX:3.55,maxX:3.95,minZ:-4.2,maxZ:3.65},
  {minX:-3.95,maxX:3.95,minZ:-4.2,maxZ:-3.8},
  {minX:-3.95,maxX:-.85,minZ:3.35,maxZ:3.65},
  {minX:.85,maxX:3.95,minZ:3.35,maxZ:3.65},
  {minX:-.65,maxX:2.05,minZ:-2.05,maxZ:-.65}, // Table.
  {minX:-3.4,maxX:-2.45,minZ:-2.2,maxZ:-1.05}, // Stove.
  {minX:-3.3,maxX:-1.4,minZ:-3.8,maxZ:-3.1}, // Cupboard.
  {minX:2.9,maxX:3.5,minZ:.35,maxZ:2.05}, // Bench.
  {minX:-.01,maxX:.51,minZ:-2.94,maxZ:-2.4}, // Chair.
  {minX:-3.35,maxX:-2.35,minZ:.45,maxZ:1.45}, // Photographic cabinet; preserve the left walking aisle.
];
export function canWalk(point:WalkPoint,doorOpen:boolean){
  if(point.x < -5.7||point.x>5.7||point.z < -3.65||point.z>10.1)return false;
  if(point.z<3.35&&(point.x< -3.35||point.x>3.35))return false;
  const door=doorOpen?{minX:-.94,maxX:-.68,minZ:3.5,maxZ:5.05}:{minX:-.85,maxX:.85,minZ:3.38,maxZ:3.62};
  return ![...chaletObstacles,door].some(box=>point.x>box.minX-PLAYER_RADIUS&&point.x<box.maxX+PLAYER_RADIUS&&point.z>box.minZ-PLAYER_RADIUS&&point.z<box.maxZ+PLAYER_RADIUS);
}
/** Short substeps and axis sliding prevent tunnelling through walls or the door. */
export function moveInChalet(from:WalkPoint,dx:number,dz:number,doorOpen:boolean):WalkPoint{
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08)),next={...from};
  for(let i=0;i<steps;i++){if(canWalk({x:next.x+dx/steps,z:next.z},doorOpen))next.x+=dx/steps;if(canWalk({x:next.x,z:next.z+dz/steps},doorOpen))next.z+=dz/steps;}
  return next;
}
export const tourStops=[
  {id:"arrival",label:"The approach",point:{x:2.8,z:8.5},look:[0,1.4,3.5]},
  {id:"door",label:"At the threshold",point:{x:0,z:5.35},look:[0,1.25,3.5]},
  {id:"room",label:"Inside the house",point:{x:0,z:2.0},look:[.6,1.15,-1.5]},
  {id:"table",label:"Three objects, three stories",point:{x:.35,z:.35},look:[.65,.95,-1.25]},
  {id:"window",label:"The valley beyond",point:{x:2.35,z:.15},look:[3.8,1.9,-1.7]},
] as const;
/** Small navigation grid: a guided walk can resume from any free-walk position. */
export function findWalkPath(from:WalkPoint,to:WalkPoint):WalkPoint[]{
  const step=.25,key=(x:number,z:number)=>`${x},${z}`;
  const nearest=(point:WalkPoint)=>{
    const x=Math.round(point.x/step),z=Math.round(point.z/step);let best={x,z},distance=Infinity;
    for(let dx=-2;dx<=2;dx++)for(let dz=-2;dz<=2;dz++){const candidate={x:(x+dx)*step,z:(z+dz)*step},d=Math.hypot(candidate.x-point.x,candidate.z-point.z);if(canWalk(candidate,true)&&d<distance){best={x:x+dx,z:z+dz};distance=d;}}
    return best;
  };
  const start=nearest(from),end=nearest(to),startKey=key(start.x,start.z),endKey=key(end.x,end.z);
  const open=new Map<string,{x:number;z:number;g:number;f:number}>([[startKey,{...start,g:0,f:0}]]),closed=new Set<string>(),parents=new Map<string,string>();
  while(open.size){
    let currentKey="",current:{x:number;z:number;g:number;f:number}|undefined;
    for(const [id,node] of open)if(!current||node.f<current.f){current=node;currentKey=id;}
    if(!current)break;
    if(currentKey===endKey){const path:WalkPoint[]=[];let id=currentKey;while(id!==startKey){const [x,z]=id.split(",").map(Number);path.unshift({x:x*step,z:z*step});id=parents.get(id)!;}path.push(to);return smoothWalkPath(from,path);}
    open.delete(currentKey);closed.add(currentKey);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
      const x=current.x+dx,z=current.z+dz,id=key(x,z);if(closed.has(id)||!canWalk({x:x*step,z:z*step},true))continue;
      if(dx&&dz&&(!canWalk({x:current.x*step,z:z*step},true)||!canWalk({x:x*step,z:current.z*step},true)))continue;
      const g=current.g+Math.hypot(dx,dz),old=open.get(id);if(old&&old.g<=g)continue;
      parents.set(id,currentKey);open.set(id,{x,z,g,f:g+Math.hypot(end.x-x,end.z-z)});
    }
  }
  return [];
}
/** Remove grid zigzags only when the whole straight segment is walkable. */
function smoothWalkPath(from:WalkPoint,path:WalkPoint[]){
  const result:WalkPoint[]=[];let anchor=from,index=0;
  while(index<path.length){
    let furthest=index;
    for(let candidate=path.length-1;candidate>index;candidate--){
      const target=path[candidate],steps=Math.ceil(Math.hypot(target.x-anchor.x,target.z-anchor.z)/.05);let clear=true;
      for(let step=1;step<=steps;step++)if(!canWalk({x:anchor.x+(target.x-anchor.x)*step/steps,z:anchor.z+(target.z-anchor.z)*step/steps},true)){clear=false;break;}
      const reached=clear?moveInChalet(anchor,target.x-anchor.x,target.z-anchor.z,true):anchor;
      if(clear&&Math.hypot(reached.x-target.x,reached.z-target.z)<.001){furthest=candidate;break;}
    }
    anchor=path[furthest];result.push(anchor);index=furthest+1;
  }
  return result;
}
export const chaletObjects=[
  {id:"plate" as const,title:"An image, held in the light",kind:"Historical and contemporary archive images",text:"Choose a record, turn the virtual glass mount over to find its source, or bring it closer. The mount is recreated; each image keeps its original context."},
  {id:"book" as const,title:"The Swiss reading companion",kind:"Contemporary reading guide · Source-linked",text:"Turn the pages of a reading companion to Price’s Swiss chapter. These summaries are editorial paraphrases, not an original notebook or Price’s recorded words."},
  {id:"camera" as const,title:"A camera, a way of looking",kind:"Recreated period object",text:"Lift this imagined camera and look at its lens, body and controls. It represents the act of recording a journey. It is not a documented camera owned or used by Weston A. Price."},
  {id:"bowl" as const,title:"An ordinary object, closely seen",kind:"Imagined household object",text:"Turn the bowl to see its rim, interior and foot. This object was modeled for the experience. Its shape and glaze suggest a handmade household vessel, without identifying a particular maker, family or collection."},
  {id:"photograph" as const,title:"From a room, back to the archive",kind:"Historical image · recreated print",text:"This virtual print reproduces the supplied Swiss valley photograph identified as Figure One in Price’s book. The paper object and its placement in this house are imagined. Open the original photograph to explore its source and documented context."},
];
