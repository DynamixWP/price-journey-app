const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const sharp=require('sharp');
function load(name){const source=fs.readFileSync(path.join(__dirname,'../lib/experience',name+'.ts'),'utf8');const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const scope={exports:{}};new Function('module','exports',output)(scope,scope.exports);return scope.exports;}
const {houseActions,walkingVelocity,viewfinderCrop,discoveryCards,nextDiscovery,guidedPace,walkBob,spinDecay,lookAngle,churchSight}=load('chalet-discoveries');
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
test('sixteen distinct discoveries lead to a complete notebook',()=>{assert.equal(new Set(discoveryCards.map(c=>c.id)).size,16);for(const id of ['maps','negatives','loaf','portrait'])assert.ok(discoveryCards.some(c=>c.id===id));assert.ok(discoveryCards.some(c=>c.id==='church'));assert.equal(nextDiscovery(discoveryCards.map(c=>c.id)),null);assert.equal(nextDiscovery([]),'price');});
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
test('guided walks ease in, settle at the destination and never overshoot the cruising pace',()=>{
  for(const fps of [30,60,144]){let pace=0,remaining=6,peak=0,frames=0;
    while(remaining>.045&&frames<fps*30){pace=guidedPace(pace,remaining,1/fps);const step=Math.min(remaining,pace/fps);remaining-=step;peak=Math.max(peak,pace);frames++;}
    assert.ok(remaining<=.045,'arrives');assert.ok(peak<=1.6001&&peak>1.4,'reaches a walking pace');assert.ok(pace<.7,'slows before stopping');assert.ok(frames/fps<8,'does not crawl');}
  assert.ok(guidedPace(0,6,1/60)<.1,'starts from a standstill');
});
test('the walking rhythm is small, bounded and disappears at rest',()=>{
  for(let phase=0;phase<20;phase+=.13){const bob=walkBob(phase,1.3);assert.ok(bob.lift<=0&&bob.lift>=-.0221);assert.ok(Math.abs(bob.sway)<=.0033);}
  assert.deepEqual(walkBob(1.2,0),{lift:-0,sway:0});
});
test('a held object keeps turning briefly after a drag, then comes to rest without reversing',()=>{
  for(const fps of [30,120]){let spin=5,turned=0;for(let i=0;i<fps*2;i++){turned+=spin/fps;const next=spinDecay(spin,1/fps);assert.ok(next>=0&&next<spin);spin=next;}assert.ok(spin<.001);assert.ok(Math.abs(turned-5/5.5)<.09,'carry '+turned);}
});
test('the view of the church is tied to its source and stays labelled as a recreation',async()=>{
  assert.match(churchSight.text,/Figure 1/);assert.match(churchSight.text,/John Siegen/);assert.match(churchSight.text,/recreation/);assert.match(churchSight.text,/not the church in the photograph/);
  const {photoDetails}=load('photo-details');assert.ok(photoDetails.some(detail=>detail.id==='church'&&detail.image===4),'the photograph has a church detail to open');
  const village=await sharp(path.join(__dirname,'../public/cinematic/alpine/village.webp')).stats();assert.equal(village.isOpaque,false);
  const {getAlpinePlace}=load('alpine-places');assert.ok(getAlpinePlace('chapel'));
});
test('the exterior uses locally stored CC0 scans with a recorded source for every file',async()=>{
  const root=path.join(__dirname,'../public/cinematic/chalet-v3');const sources=JSON.parse(fs.readFileSync(path.join(root,'sources.json'),'utf8'));assert.equal(sources.length,12);
  assert.equal(new Set(sources.map(source=>source.asset)).size,4);
  for(const source of sources){assert.equal(source.license,'CC0');assert.match(source.url,/^https:\/\/dl\.polyhaven\.org\//);assert.match(source.source,/^https:\/\/polyhaven\.com\/a\//);const file=path.join(__dirname,'..',source.file);assert.ok(fs.statSync(file).size>1000);const meta=await sharp(file).metadata();assert.equal(meta.width,1024);assert.equal(meta.height,1024);}
  assert.equal(fs.readdirSync(root).filter(name=>name.endsWith('.webp')).length,12,'no unrecorded texture');
});
test('the approach starts far enough back to see the whole house and stays walkable to the door',()=>{
  const arrival=tourStops[0].point;assert.ok(arrival.z>10.5&&canWalk(arrival,true));assert.ok(findWalkPath(arrival,tourStops[1].point).length);
  assert.equal(canWalk({x:2.4,z:3.9},true),false,'firewood is solid');
});
test('the valley is heard through whatever is open, and sounds come from where things are',()=>{
  const {roomMix,soundPlaces}=load('chalet-sound');
  const outside=roomMix(false,false,false),shut=roomMix(true,false,false),airy=roomMix(true,true,true);
  assert.deepEqual([outside.open,outside.window,outside.door],[1,0,0]);assert.equal(shut.open,0);
  assert.ok(airy.window>shut.window*3&&airy.door>shut.door*3,'opening the window or door lets the valley in');
  assert.ok(shut.fire>roomMix(false,false,true).fire&&roomMix(false,false,true).fire>outside.fire,'the fire is muffled by the wall and the closed door');
  assert.ok(shut.bell<airy.bell&&outside.bell===1);
  const [x,,z]=soundPlaces.stove;assert.ok(Math.abs(x)<3.8&&z>-4&&z<3.5,'the stove sounds from inside the room');
  assert.ok(Math.hypot(soundPlaces.church[0],soundPlaces.church[2])>35,'the bell comes from far away');
  assert.ok(Math.abs(soundPlaces.window[0]-3.8)<.4&&Math.abs(soundPlaces.door[2]-3.5)<.2);
});
test('the home opening uses the supplied animated portrait and says what it is',()=>{
  const video=path.join(__dirname,'../public/cinematic/home/price-living-portrait.mp4');const size=fs.statSync(video).size;assert.ok(size>100000&&size<4000000);
  const home=fs.readFileSync(path.join(__dirname,'../components/experience/photo-journey.tsx'),'utf8');
  assert.match(home,/price-living-portrait\.mp4/);assert.match(home,/Portrait animated with AI from the supplied photograph/);assert.match(home,/Not archival footage/);assert.match(home,/Skip the opening/);
});
test('story sheets are real supplied images with a source, and nothing unidentified is given a place',async()=>{
  const {routeMaps,openNegatives,storyStations,ryeTable}=load('story-content');
  assert.equal(routeMaps.length,3);assert.equal(openNegatives.length,2);
  for(const sheet of [...routeMaps,...openNegatives]){assert.ok(sheet.title&&sheet.kind&&sheet.source&&sheet.local&&sheet.text.length>80);const file=path.join(__dirname,'../public',sheet.image);const meta=await sharp(file).metadata();assert.ok(Math.abs(meta.width/meta.height-sheet.aspect)<.01,sheet.id+' aspect');assert.ok(fs.statSync(file).size<400000);}
  for(const map of routeMaps){assert.match(map.source,/Nutrition and Physical Degeneration · Map (II|V|VI)\b/);assert.match(map.local,/^NPD 300_Map_[256]\.tiff$/);assert.ok(map.url);}
  assert.match(routeMaps[1].text,/Rotarua/);assert.match(routeMaps[0].text,/does not say where any single photograph was taken/);
  for(const negative of openNegatives){assert.match(negative.text,/not identified/);assert.equal(negative.url,null);}
  assert.match(ryeTable.text,/Price writes/);assert.match(ryeTable.text,/whole rye bread/);assert.match(ryeTable.text,/not objects from the archive/);assert.match(ryeTable.text,/not dietary advice/);
  for(const station of Object.values(storyStations)){assert.ok(canWalk(station.point,true));assert.ok(findWalkPath(tourStops[1].point,station.point).length);}
  const loaf=chaletObjectsList().find(object=>object.id==='loaf');assert.equal(loaf.text,ryeTable.text,'the held text and the checked account are the same words');
});
function chaletObjectsList(){return load('chalet-layout').chaletObjects;}
test('captured mouse look is gentle, bounded per movement and ignores the huge jumps browsers sometimes report',()=>{
  assert.ok(lookAngle(100,true)<lookAngle(100,false),'calmer than dragging');
  assert.ok(Math.abs(lookAngle(10,true)-.014)<1e-9);assert.equal(lookAngle(10,true),-lookAngle(-10,true));
  assert.equal(lookAngle(200,true),lookAngle(55,true),'one movement can only turn the view so far');
  assert.equal(lookAngle(900,true),0);assert.equal(lookAngle(-2000,true),0);
  assert.ok(lookAngle(55,true)<.08,'never more than a few degrees in a single event');
  assert.equal(lookAngle(10,true,2),lookAngle(10,true)*2,'the sensitivity setting still scales it');
});
test('the living portrait says its movement is generated and points back to the unchanged original',()=>{
  const {livingPortrait}=load('story-content');const {libraryRecords}=load('library-content');
  assert.match(livingPortrait.text,/set in motion with an AI tool/);assert.match(livingPortrait.text,/The movement is generated/);assert.match(livingPortrait.text,/It is not film of Price/);assert.match(livingPortrait.text,/have not been confirmed/);
  assert.ok(fs.statSync(path.join(__dirname,'../public',livingPortrait.video)).size>100000);
  assert.equal(libraryRecords[2].id,'portrait','the note leads to the original portrait record');
  assert.ok(canWalk(livingPortrait.station.point,true)&&findWalkPath(tourStops[1].point,livingPortrait.station.point).length);
  const world=fs.readFileSync(path.join(__dirname,'../lib/experience/chalet-stories.ts'),'utf8');assert.match(world,/PORTRAIT ANIMATED WITH AI · NOT ARCHIVAL FOOTAGE/,'the frame carries the label in the room itself');
});
