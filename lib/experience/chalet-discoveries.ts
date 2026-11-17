import type { WalkPoint } from "./chalet-layout";

export type HouseAction = "lamp" | "window" | "drawer";
export type HouseDiscovery = HouseAction | "photograph" | "camera" | "bowl" | "snapshot" | "price" | "plate" | "book" | "projector" | "church" | "maps" | "negatives" | "loaf" | "portrait";
/** What the visitor sees beyond the house: a recreated view, tied to a documented photograph and source. */
export const churchSight = {
  title: "The same spire, from another window",
  text: "Beyond the meadow stands the village of this exploration, with its church at the centre. A church also anchors Figure 1, the Lötschental photograph in Price’s book, and his Swiss chapter credits the local pastor, Reverend John Siegen, with assisting his work. This distant view is part of the recreation: it is not the church in the photograph, nor a documented view from any house.",
  photoAction: "Find the church in the photograph",
  villageAction: "Walk to the village church",
} as const;
export const houseActions: Record<HouseAction, {label:string;point:WalkPoint;look:[number,number,number];description:string}> = {
  lamp: {label:"The lamplight",point:{x:2.4,z:-.15},look:[1.7,1.3,-1.8],description:"A small change in light changes the room. Turn the lamp on and off, then look at how its warmth reaches the timber and the objects."},
  window: {label:"The valley air",point:{x:2.35,z:.15},look:[3.8,1.8,-1.7],description:"Open the window and let the valley sound into the room. This landscape is an imagined setting inspired by the Alps."},
  drawer: {label:"The field notes",point:{x:-1.5,z:-2.35},look:[-2.35,1.4,-3.1],description:"The note connects this imagined room to the archive: Price's published account describes Swiss visits in 1931 and 1932. Those are fieldwork dates, not a proven date for the photograph."},
};
export const discoveryCards: {id:HouseDiscovery;title:string;text:string}[] = [
  {id:"price",title:"An encounter in the study",text:"The seated photographic presence was generated from the supplied portrait. Choose a topic to follow its connection to an image or a source. The figure, pose and room are artistic recreations."},
  {id:"plate",title:"An image in your hands",text:"Explore the Swiss images and contemporary archive photographs through a recreated glass mount. Every record retains its source and its own geographic context."},
  {id:"book",title:"Reading alongside the original",text:"The reading companion connects the Swiss chapter with its photographs. Its summaries are contemporary paraphrases, not Price’s notebook."},
  {id:"projector",title:"Let the archive fill the room",text:"The projector displays the chosen record on the study wall. Switch plates and compare them without leaving the room."},
  {id:"church",title:"The same spire, from another window",text:"From the path or the study window, the village church stays in view. It echoes the church at the centre of Figure 1 and the pastor Price credits in his Swiss chapter. The view itself is recreated."},
  {id:"maps",title:"The routes, drawn by hand",text:"The route maps published in Price’s book connect this room with the globe: the Pacific, the North Island of New Zealand and Peru. They are itineraries, not camera positions."},
  {id:"loaf",title:"Bread, cheese and milk",text:"Price describes whole rye bread, summer-made cheese and fresh milk as the daily food of the valley, and a community bake-oven used in turns. The loaf and cheese on the table are modelled; the account is his."},
  {id:"negatives",title:"Still waiting for a caption",text:"Some digitized negatives arrived without captions. They are shown as they are, with nothing assumed about where or when they were made."},
  {id:"portrait",title:"A portrait that moves",text:"The framed portrait by the bench is the supplied photograph of Price set in motion with an AI tool. The movement is generated, not filmed. The original photograph is in the plate cabinet."},
  {id:"lamp",title:"A room in a different light",text:houseActions.lamp.description},
  {id:"window",title:"Listen beyond the window",text:houseActions.window.description},
  {id:"drawer",title:"A note, a connection",text:houseActions.drawer.description},
  {id:"camera",title:"A way of looking",text:"An imagined period camera. Use its viewfinder to compose a photograph of this recreated space."},
  {id:"bowl",title:"A sound held in clay",text:"Turn the bowl, look inside and tap its rim. The vessel and its synthesized resonance were made for this experience."},
  {id:"photograph",title:"The original at the centre",text:"The supplied Swiss valley photograph is identified as Figure 1 in Price's book. The paper print and its placement here are recreated."},
  {id:"snapshot",title:"Your own point of view",text:"You made a photograph inside the recreation. It is saved in this visit's notebook, separately from the historical archive."},
];

/** Frame-independent easing: smooth control without a long slide after releasing a key. */
export function walkingVelocity(current:number,target:number,dt:number){return current+(target-current)*(1-Math.exp(-Math.min(dt,.1)*(target===0?18:10)));}
/** Guided walks ease away from a standstill and settle into the destination instead of stopping dead. */
export function guidedPace(current:number,remaining:number,dt:number,cruise=1.6){const target=Math.min(cruise,Math.max(.4,remaining*1.9));return current+(target-current)*(1-Math.exp(-Math.min(dt,.1)*(target<current?7:3.2)));}
/** One walking cycle: a small vertical bob and sway, scaled by how fast the visitor is moving. */
export function walkBob(phase:number,intensity:number){const amount=Math.max(0,Math.min(1,intensity));return {lift:-Math.abs(Math.sin(phase))*.022*amount,sway:Math.sin(phase)*.0032*amount};}
/**
 * One mouse movement turned into an angle. With the cursor captured the view turns more gently, a single
 * movement can only turn it so far, and the rare enormous jumps browsers report are ignored outright.
 */
export function lookAngle(movement:number,captured:boolean,sensitivity=1){
  if(!captured)return movement*.0022*sensitivity;
  if(Math.abs(movement)>240)return 0;
  return Math.max(-55,Math.min(55,movement))*.0014*sensitivity;
}
/** Held objects keep turning briefly after a drag; the impulse decays without ever reversing. */
export function spinDecay(velocity:number,dt:number){return velocity*Math.exp(-Math.min(dt,.1)*5.5);}
export function nextDiscovery(found:readonly string[]){return discoveryCards.find(card=>!found.includes(card.id))?.id??null;}
export function viewfinderCrop(width:number,height:number){const cropWidth=Math.min(width*.76,height*.68*1.5),cropHeight=cropWidth/1.5;return {x:(width-cropWidth)/2,y:(height-cropHeight)/2,width:cropWidth,height:cropHeight};}
