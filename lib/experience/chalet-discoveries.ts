import type { WalkPoint } from "./chalet-layout";

export type HouseAction = "lamp" | "window" | "drawer";
export type HouseDiscovery = HouseAction | "photograph" | "camera" | "bowl" | "snapshot" | "price" | "plate" | "book" | "projector";
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
export function nextDiscovery(found:readonly string[]){return discoveryCards.find(card=>!found.includes(card.id))?.id??null;}
export function viewfinderCrop(width:number,height:number){const cropWidth=Math.min(width*.76,height*.68*1.5),cropHeight=cropWidth/1.5;return {x:(width-cropWidth)/2,y:(height-cropHeight)/2,width:cropWidth,height:cropHeight};}
