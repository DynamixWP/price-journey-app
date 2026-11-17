const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const sharp=require('sharp');
function load(name){const source=fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const scope={exports:{}};new Function('module','exports',output)(scope,scope.exports);return scope.exports;}
const {houseActions,walkingVelocity,viewfinderCrop,discoveryCards,nextDiscovery}=load('chalet-discoveries');
const {findWalkPath,moveInChalet,canWalk,tourStops}=load('chalet-layout');
const {libraryStations,libraryRecords,libraryPages,wrapLibraryIndex}=load('library-content');

test('every interactive station is reachable from the entrance and every other station',()=>{
  const places=[...tourStops.map(stop=>stop.point),...Object.values(houseActions).map(action=>action.point),...Object.values(libraryStations).map(station=>station.point)];
  for(const from of places)for(const to of places){assert.ok(canWalk(to,true));const route=findWalkPath(from,to);assert.ok(route.length);let current=from;for(const step of route){current=moveInChalet(current,step.x-current.x,step.z-current.z,true);assert.ok(Math.hypot(current.x-step.x,current.z-step.z)<.01);}}
});
test('keyboard acceleration is stable at different frame rates and releases promptly',()=>{
  function simulate(fps){let speed=0;for(let i=0;i<fps;i++)speed=walkingVelocity(speed,1.7,1/fps);return speed;}
  assert.ok(Math.abs(simulate(30)-simulate(120))<.0001);
  let speed=1.7;for(let i=0;i<30;i++)speed=walkingVelocity(speed,0,1/60);assert.ok(speed<.001);
});
test('viewfinder exports the exact centered 3:2 composition within the viewport',()=>{
  for(const [w,h] of [[1920,1080],[1440,900],[1280,720],[390,844]]){const crop=viewfinderCrop(w,h);assert.equal(crop.width/crop.height,1.5);assert.ok(crop.x>=0&&crop.y>=0);assert.ok(crop.x+crop.width<=w&&crop.y+crop.height<=h);assert.ok(Math.abs(crop.x*2+crop.width-w)<.0001);}
});
test('eleven distinct discoveries lead to a complete notebook',()=>{assert.equal(new Set(discoveryCards.map(c=>c.id)).size,11);assert.equal(nextDiscovery(discoveryCards.map(c=>c.id)),null);assert.equal(nextDiscovery([]),'price');});
test('generated foliage keeps transparency and every sourced PBR map is locally available',async()=>{
  const root=path.join(__dirname,'../public/cinematic/chalet-v2');const fir=await sharp(path.join(root,'alpine-fir.webp')).stats();assert.equal(fir.isOpaque,false);
  const panorama=await sharp(path.join(root,'alpine-panorama.webp')).metadata();assert.equal(panorama.width/panorama.height,2);
  const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json'),'utf8').replace(/^\uFEFF/,''));assert.equal(sources.length,9);
  for(const source of sources){assert.equal(source.license,'CC0');const file=path.join(__dirname,'..',source.file.replace(/\.jpg$/,'.webp'));assert.ok(fs.statSync(file).size>1000);const meta=await sharp(file).metadata();assert.equal(meta.width,1024);}
});

test('archive plates keep source records and remain bounded across previous/next navigation',async()=>{
  assert.equal(wrapLibraryIndex(-1,libraryRecords.length),libraryRecords.length-1);
  assert.equal(wrapLibraryIndex(libraryRecords.length,libraryRecords.length),0);
  assert.ok(libraryPages.every(page=>page.detail&&page.lines.length));
  for(const record of libraryRecords){assert.ok(record.source&&record.local&&record.kind);const image=await sharp(path.join(__dirname,'../public',record.image)).metadata();assert.ok(Math.abs(image.width/image.height-record.aspect)<.015,record.id+' aspect ratio');}
  const figure=await sharp(path.join(__dirname,'../public/library/price-seated-recreation.webp')).stats();assert.equal(figure.isOpaque,false);
});

test('optional library readings match every topic, plate and book page and have playable local assets',()=>{
  const {libraryTopics}=load('library-content');const manifest=require('../lib/experience/library-manifest.json');
  const texts=[...libraryTopics.map(topic=>topic.text),...libraryRecords.map(record=>record.text),...libraryPages.map(page=>page.lines.join(' ')+' '+page.detail)];
  assert.equal(manifest.length,texts.length);
  for(const text of texts){const clip=manifest.find(item=>item.text===text);assert.ok(clip);assert.ok(fs.statSync(path.join(__dirname,'../public',clip.audio)).size>10000);assert.ok(clip.cues.length);for(let i=0;i<clip.cues.length;i++){const cue=clip.cues[i];assert.ok(cue.end>cue.start&&cue.end<=clip.duration);if(i)assert.ok(cue.start>=clip.cues[i-1].end);}}
});
