const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
function load(name){
 const source=fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 const scope={exports:{}};new Function('module','exports',compiled)(scope,scope.exports);return scope.exports;
}
const {photoDetails}=load('photo-details');
const {regions,studies}=load('content');
const {narratedRoute,nextNarratedStop,containedPhotoFrame}=load('archive-tour');
const photos=Array.from(new Set(regions.flatMap(region=>region.photos)));

test('every atlas photograph has a reachable, recorded narrative point',()=>{
 const clips=require('../lib/experience/detail-manifest.json');
 for(const image of photos){
  const points=photoDetails.filter(point=>point.image===image);
  assert.ok(points.length>0,studies[image].title);
  for(const point of points){
   assert.ok(point.label.length>0);
   assert.ok(point.x>0&&point.x<100&&point.y>0&&point.y<100);
   const clip=clips.find(clip=>clip.audio===point.audio);
   assert.ok(clip,point.id);assert.equal(clip.text,point.text);
  }
 }
});
test('the guided route completes each photo before moving on and stops at the last passage',()=>{
 const route=narratedRoute(photos,photoDetails);
 assert.deepEqual(route.map(point=>point.image),[4,4,5,5,6,6,7,8,9,10,11]);
 assert.equal(nextNarratedStop(route,'peru-scale').id,'peru-stone');
 assert.equal(nextNarratedStop(route,'peru-stone').image,7);
 assert.equal(nextNarratedStop(route,route.at(-1).id),undefined);
 assert.equal(nextNarratedStop(route,'missing'),undefined);
});
test('portrait and plate pins stay tied to the same image coordinates through zoom',()=>{
 for(const [width,height] of [[1536,864],[768,1024],[390,844],[320,667]]){
  for(const point of photoDetails.filter(point=>point.image>=6)){
   const aspect=studies[point.image].aspect;
   const base=containedPhotoFrame(width,height,aspect,[50,50],1);
   const frame=containedPhotoFrame(width,height,aspect,[point.x,point.y],point.zoom);
   assert.ok(Math.abs(frame.imageWidth/frame.imageHeight-aspect)<.00001);
   assert.ok(frame.x<=base.x+.001&&frame.y<=base.y+.001);
   assert.ok(frame.x+frame.imageWidth*frame.zoom>=base.x+base.imageWidth-.001);
   assert.ok(frame.y+frame.imageHeight*frame.zoom>=base.y+base.imageHeight-.001);
   const pinX=frame.x+point.x/100*frame.imageWidth*frame.zoom;
   const pinY=frame.y+point.y/100*frame.imageHeight*frame.zoom;
   assert.ok(pinX>=0&&pinX<=width&&pinY>=0&&pinY<=height);
  }
 }
});
test('the paper atlas restyles a basemap without touching its geometry, and adds relief and a graticule',()=>{
  const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
  const load=name=>{const out=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const scope={exports:{}};new Function('module','exports',out)(scope,scope.exports);return scope.exports;};
  const {paperAtlas,graticule,atlasInk,demSource}=load('atlas-style');
  const base={version:8,sprite:'https://example.test/sprite',glyphs:'https://example.test/{fontstack}/{range}.pbf',sources:{protomaps:{type:'vector',tiles:['https://example.test/{z}/{x}/{y}.mvt']}},layers:[
    {id:'background',type:'background',paint:{'background-color':'#fff'}},
    {id:'landcover',type:'fill',source:'protomaps','source-layer':'landuse',filter:['==',['get','kind'],'forest'],paint:{'fill-color':'#0f0'}},
    {id:'water',type:'fill',source:'protomaps','source-layer':'water',filter:['==',['geometry-type'],'Polygon'],paint:{'fill-color':'#00f'}},
    {id:'building',type:'fill',source:'protomaps','source-layer':'buildings',paint:{'fill-color':'#ccc'}},
    {id:'boundary_country',type:'line',source:'protomaps','source-layer':'boundaries',minzoom:2,paint:{'line-color':'#f00','line-width':6}},
    {id:'poi',type:'symbol',source:'protomaps','source-layer':'pois',layout:{'icon-image':'star','text-field':['get','name']}},
    {id:'place_country_1',type:'symbol',source:'protomaps','source-layer':'places',layout:{'text-field':['get','name'],'icon-image':'dot','text-font':['Open Sans Regular']},paint:{'text-color':'#000'}},
  ]};
  const frozen=JSON.stringify(base),style=paperAtlas(base),ids=style.layers.map(layer=>layer.id);
  assert.equal(JSON.stringify(base),frozen,'the published style is not mutated');
  assert.deepEqual(ids,['background','landcover','paper-relief','water','boundary_country','paper-graticule','place_country_1']);
  assert.equal(style.sprite,undefined);assert.equal(style.glyphs,base.glyphs);
  assert.equal(style.layers[0].paint['background-color'],atlasInk.paper);assert.equal(style.layers[3].paint['fill-color'],atlasInk.sea);
  assert.deepEqual(style.layers[3].filter,base.layers[2].filter,'filters are kept');assert.equal(style.layers[4].minzoom,2);
  const country=style.layers[6];assert.equal(country.layout['icon-image'],undefined);assert.equal(country.layout['text-transform'],'uppercase');assert.equal(country.paint['text-color'],atlasInk.ink);
  assert.equal(style.sources.dem.encoding,'terrarium');assert.equal(style.sources.terrain,demSource);assert.match(demSource.attribution,/Terrain Tiles/);
  const lines=graticule();assert.equal(lines.features.length,24+11);assert.ok(lines.features.every(feature=>feature.geometry.coordinates.every(([lng,lat])=>Math.abs(lng)<=180&&Math.abs(lat)<=85)));
  assert.equal(lines.features.filter(feature=>feature.properties.kind==='equator').length,1);
});
test('the guided flight visits every place once, draws no route, and waits for the voice to finish',()=>{
  const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
  const load=name=>{const out=ts.transpileModule(fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const scope={exports:{}};new Function('module','exports',out)(scope,scope.exports);return scope.exports;};
  const {flightStops,flightHold}=load('archive-tour'),{regions}=load('content'),{photoDetails}=load('photo-details'),clips=require('../lib/experience/detail-manifest.json');
  const stops=flightStops(regions,photoDetails);
  assert.equal(stops.length,regions.length);assert.deepEqual(stops.map(stop=>stop.index),regions.map((_,index)=>index));
  for(const stop of stops){const clip=clips.find(item=>item.id===`detail-${stop.detail}`);assert.ok(clip,'every place has a recorded passage');assert.ok(flightHold(true,clip.duration)>=(clip.duration+2.5)*1000,'the flight waits for the whole passage');}
  assert.equal(flightHold(false),11600);assert.equal(flightHold(true,0),flightHold(false),'without a clip it rests as long as the silent flight');
  const globe=fs.readFileSync(path.join(__dirname,'../components/experience/spatial-archive.tsx'),'utf8');
  assert.match(globe,/It is not a route, and not Price’s itinerary/);assert.doesNotMatch(globe,/type:\s*"line"/,'no route line is drawn on the globe');
  assert.match(globe,/Not a camera position/);
});
