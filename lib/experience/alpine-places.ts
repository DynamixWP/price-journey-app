export type PlaceId = "overlook" | "lane" | "chapel" | "home" | "stream";
export type Environment = "valley" | "village" | "chapel" | "home" | "stream";
export type PlacePoint = { id: string; label: string; x: number; y: number; target?: PlaceId; text?: string };
export type AlpinePlace = { id: PlaceId; title: string; short: string; subtitle: string; description: string; image?: string; focus: [number,number]; environment: Environment; points: PlacePoint[] };

export const alpinePlaces: AlpinePlace[] = [
  { id:"overlook", title:"The valley opens.", short:"Valley", subtitle:"Above the village", environment:"valley", focus:[.65,.64], description:"An imagined Alpine arrival. A path through the meadow leads toward the village. Choose a doorway, follow the water, or stay here and look around. These generated scenes offer a sense of place; the original photograph remains a separate historical source.", points:[
    {id:"village",label:"Walk into the village",x:.65,y:.74,target:"lane"},
    {id:"water",label:"Take the stream path",x:.40,y:.80,target:"stream"},
  ] },
  { id:"lane", title:"Follow the village path.", short:"Village", subtitle:"Between timber and stone", environment:"village", image:"village-lane", focus:[.57,.56], description:"The lane opens into a small village. An open church door stands ahead, while a timber house invites a closer look. This is an imagined setting, created to explore how a photograph might become a place to wander. You decide which threshold to cross.", points:[
    {id:"church-door",label:"Enter the church",x:.68,y:.55,target:"chapel"},
    {id:"house-door",label:"Enter the house",x:.21,y:.59,target:"home"},
    {id:"meadow-path",label:"Follow the water",x:.88,y:.57,target:"stream"},
  ] },
  { id:"chapel", title:"Step into the quiet.", short:"Church", subtitle:"Inside the village church", environment:"chapel", image:"chapel-interior-interactive", focus:[.55,.52], description:"Inside this imagined church, daylight crosses the stone floor and touches the wooden pews. Move closer to the altar, or look toward the candle niche. The interior is an artistic invention, not a documented view of a church visited by Price.", points:[
    {id:"altar",label:"A connection with John Siegen",x:.55,y:.54,text:"Price’s Swiss chapter credits Reverend John Siegen with assisting his work in Lötschental. This gives the church a human connection to the journey. This interior is imagined; it is not a documented view of Siegen’s church or a reconstruction of a particular meeting."},
    {id:"candle",label:"Light a candle",x:.86,y:.46,text:"Leave a small light in this imagined room. The flame remains lit when you return during this visit. Its placement is an artistic interaction, not an archival detail."},
    {id:"church-exit",label:"Step outside",x:.07,y:.55,target:"lane"},
  ] },
  { id:"home", title:"A room of everyday life.", short:"House", subtitle:"Inside a timber home", environment:"home", image:"chalet-interior", focus:[.58,.53], description:"A table, a stove, and a window looking back toward the village. This imagined room invites us to notice ordinary materials and spaces. Move toward the table or look out through the window. No particular family or historical household is represented here.", points:[
    {id:"table",label:"Approach the table",x:.67,y:.64,text:"Bread, pottery and linen bring scale to this imagined household. These objects were generated for the scene; they are not items from Price’s archive."},
    {id:"window",label:"Look through the window",x:.80,y:.38,text:"The village remains in view. A shared landmark connects the room with the path outside."},
    {id:"home-exit",label:"Return to the lane",x:.10,y:.57,target:"lane"},
  ] },
  { id:"stream", title:"Follow the water.", short:"Stream", subtitle:"Along the meadow path", environment:"stream", image:"stream-path", focus:[.55,.56], description:"Beyond the village, a stream follows the valley floor. A small bridge becomes a place to pause. Explore the water and the mountain view, then return to the village or the overlook. This landscape is another artistic reconstruction, connected by atmosphere rather than an exact mapped route.", points:[
    {id:"bridge",label:"Walk toward the bridge",x:.53,y:.63,text:"Pause beside the water. This bridge and path are imagined places, designed to connect the village with the wider landscape."},
    {id:"return-village",label:"Walk back to the village",x:.20,y:.49,target:"lane"},
    {id:"viewpoint",label:"Return to the overlook",x:.47,y:.35,target:"overlook"},
  ] },
];

export function getAlpinePlace(id: PlaceId) { return alpinePlaces.find(place => place.id === id)!; }
export function placeLayers(place: AlpinePlace) {
  return place.image ? [{src:`/cinematic/alpine/places/${place.image}.webp`,depth:1}] : [
    {src:"/cinematic/alpine/valley.webp",depth:.35}, {src:"/cinematic/alpine/village.webp",depth:1}, {src:"/cinematic/alpine/foreground.webp",depth:1.6},
  ];
}
export type PlaceView = { x: number; y: number; approach: number };
export const initialView = (): PlaceView => ({x:0,y:0,approach:0});
export function explorationFrame(width:number,height:number,view:PlaceView,focus:readonly number[],depth=1) {
  const scale = Math.max(width/1536,height/1024)*(1.035+Math.max(0,Math.min(1,view.approach))*.48*depth);
  const w=1536*scale,h=1024*scale;
  const x=width*.52-w*focus[0]+view.x*Math.max(40,(w-width)*.5)*depth;
  const y=height*.5-h*focus[1]+view.y*Math.max(24,(h-height)*.5)*depth;
  return {width:w,height:h,x:Math.max(width-w,Math.min(0,x)),y:Math.max(height-h,Math.min(0,y))};
}
