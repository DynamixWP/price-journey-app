const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const sharp=require('sharp');
function load(name){const source=fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const scope={exports:{}};new Function('module','exports',output)(scope,scope.exports);return scope.exports;}
const {houseActions,walkingVelocity,viewfinderCrop,discoveryCards,nextDiscovery}=load('chalet-discoveries');
const {findWalkPath,moveInChalet,canWalk,tourStops}=load('chalet-layout');

test('every interactive station is reachable from the entrance and every other station',()=>{
  const places=[...tourStops.map(stop=>stop.point),...Object.values(houseActions).map(action=>action.point)];
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
test('seven distinct discoveries lead to a complete notebook',()=>{assert.equal(new Set(discoveryCards.map(c=>c.id)).size,7);assert.equal(nextDiscovery(discoveryCards.map(c=>c.id)),null);assert.equal(nextDiscovery([]),'lamp');});
test('generated foliage keeps transparency and every sourced PBR map is locally available',async()=>{
  const root=path.join(__dirname,'../public/cinematic/chalet-v2');const fir=await sharp(path.join(root,'alpine-fir.webp')).stats();assert.equal(fir.isOpaque,false);
  const panorama=await sharp(path.join(root,'alpine-panorama.webp')).metadata();assert.equal(panorama.width/panorama.height,2);
  const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json'),'utf8').replace(/^\uFEFF/,''));assert.equal(sources.length,9);
  for(const source of sources){assert.equal(source.license,'CC0');const file=path.join(__dirname,'..',source.file.replace(/\.jpg$/,'.webp'));assert.ok(fs.statSync(file).size>1000);const meta=await sharp(file).metadata();assert.equal(meta.width,1024);}
});
