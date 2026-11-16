const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const clips=require('../lib/experience/narration-manifest.json');
const script=require('../lib/experience/narration-script.json');
test('every narrated scene has a local audio file and matching transcript',()=>{
 assert.equal(clips.length,8);
 for(let i=0;i<clips.length;i++){
  const clip=clips[i]; assert.equal(clip.id,script[i].id); assert.equal(clip.text,script[i].text);
  assert.ok(fs.statSync(path.join(__dirname,'../public',clip.audio)).size>10000);
  assert.ok(clip.duration>10 && clip.duration<40);
 }
});
test('interactive details have matching recorded audio and a readable transcript',()=>{
 const details=require('../lib/experience/detail-manifest.json');
 const text=require('../lib/experience/detail-script.json');
 assert.equal(details.length,text.length);
 assert.ok(details.length>=11);
 assert.equal(new Set(details.map(clip=>clip.id)).size,details.length);
 for(let i=0;i<details.length;i++) {
  assert.equal(details[i].text,text[i].text);
  assert.ok(fs.statSync(path.join(__dirname,'../public',details[i].audio)).size>10000);
  assert.ok(details[i].duration>10);
 }
});
test('subtitle intervals are ordered, non-overlapping, and stay inside the clip',()=>{
 for(const clip of [...clips,...require('../lib/experience/detail-manifest.json')]){
  let previousEnd=0;
  for(const cue of clip.cues){assert.ok(cue.start>=previousEnd);assert.ok(cue.end>cue.start);assert.ok(cue.end<=clip.duration);previousEnd=cue.end;}
  assert.ok(clip.cues.length>2);
 }
});
