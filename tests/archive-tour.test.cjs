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
