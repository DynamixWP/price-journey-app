const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const sharp=require('sharp');
const root=path.join(__dirname,'..');
const source=fs.readFileSync(path.join(root,'lib/experience/alpine-places.ts'),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const scope={exports:{}};new Function('module','exports',compiled)(scope,scope.exports);
const {alpinePlaces,getAlpinePlace,placeLayers,explorationFrame}=scope.exports;

test('all five places can be reached on foot and every interior has an exit',()=>{
  const seen=new Set(),queue=['overlook'];
  while(queue.length){const id=queue.shift();if(seen.has(id))continue;seen.add(id);const place=getAlpinePlace(id);assert.ok(place,`missing destination ${id}`);for(const point of place.points){assert.ok(point.x>=0&&point.x<=1&&point.y>=0&&point.y<=1);if(point.target)queue.push(point.target);}}
  assert.equal(seen.size,5);
  for(const id of ['chapel','home'])assert.ok(getAlpinePlace(id).points.some(point=>point.target==='lane'));
});
test('every exploration camera fills phone and desktop viewports while panning and approaching',()=>{
  for(const [width,height] of [[320,667],[390,844],[1280,720],[1920,1080]])for(const place of alpinePlaces)for(const focus of [place.focus,...place.points.map(point=>[point.x,point.y])])for(const approach of [0,.78,1])for(const x of [-1,0,1])for(const depth of [.35,1,1.6]){
    const frame=explorationFrame(width,height,{x,y:x,approach},focus,depth);
    assert.ok(frame.x<=.001&&frame.y<=.001);assert.ok(frame.x+frame.width>=width-.001&&frame.y+frame.height>=height-.001);
  }
});
test('all places have matching local voice descriptions and optimized image assets',async()=>{
  const clips=require('../lib/experience/exploration-manifest.json');
  assert.equal(clips.length,alpinePlaces.length);
  for(const place of alpinePlaces){
    const clip=clips.find(clip=>clip.id===`explore-${place.id}`);assert.equal(clip.text,place.description);
    assert.ok(fs.statSync(path.join(root,'public',clip.audio)).size>10000);
    clip.cues.forEach((cue,index)=>{assert.ok(cue.end>cue.start&&cue.end<=clip.duration);if(index)assert.ok(cue.start>=clip.cues[index-1].end);});
    for(const layer of placeLayers(place)){const file=path.join(root,'public',layer.src);const metadata=await sharp(file).metadata();assert.equal(metadata.width,1536);assert.equal(metadata.height,1024);assert.ok(fs.statSync(file).size<600000);}
  }
});
