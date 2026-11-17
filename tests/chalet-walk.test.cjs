const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ts=require('typescript');
const root=path.join(__dirname,'..');
const compiled=ts.transpileModule(fs.readFileSync(path.join(root,'lib/experience/chalet-layout.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const scope={exports:{}};new Function('module','exports',compiled)(scope,scope.exports);
const {canWalk,moveInChalet,findWalkPath,tourStops,chaletObjects}=scope.exports;

test('closed door and furniture block movement, even with large frame steps',()=>{
  assert.ok(moveInChalet({x:0,z:5.35},0,-5,false).z>3.8);
  assert.ok(moveInChalet({x:0,z:5.35},0,-3.35,true).z<2.01);
  assert.ok(moveInChalet({x:0,z:2},0,-6,true).z>-.44);
  assert.ok(moveInChalet({x:0,z:2},8,0,true).x<2.69);
});
test('guided visits resume from all stops and free-walk aisles without crossing obstacles',()=>{
  for(const from of [...tourStops.map(s=>s.point),{x:-1.7,z:-2.5},{x:2.7,z:-3},{x:-2,z:1}])for(const stop of tourStops){
    const route=findWalkPath(from,stop.point);assert.ok(route.length,'missing route');
    let position=from;
    for(const point of route){assert.ok(canWalk(point,true));const next=moveInChalet(position,point.x-position.x,point.z-position.z,true);assert.ok(Math.hypot(next.x-point.x,next.z-point.z)<.01,`blocked route ${JSON.stringify({from,stop:stop.id,position,point,next})}`);position=next;}
    assert.ok(Math.hypot(position.x-stop.point.x,position.z-stop.point.z)<.01);
  }
});
test('every inspectable object has an available matching optional narration and ordered cues',()=>{
  const clips=require('../lib/experience/chalet-manifest.json');assert.equal(clips.length,3);
  for(const object of chaletObjects){const clip=clips.find(c=>c.id===`chalet-${object.id}`);assert.equal(clip.text,object.text);assert.ok(fs.statSync(path.join(root,'public',clip.audio)).size>10000);clip.cues.forEach((cue,i)=>{assert.ok(cue.end>cue.start&&cue.end<=clip.duration);if(i)assert.ok(cue.start>=clip.cues[i-1].end);});}
});

