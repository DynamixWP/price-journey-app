const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const sharp = require('sharp');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'lib/experience/alpine-camera.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { exports: {} };
new Function('module', 'exports', compiled)(scope, scope.exports);
const { alpineFrame, alpinePoints } = scope.exports;

test('Alpine camera never exposes canvas edges at any arrival or detail position', () => {
  for (const [width, height] of [[320,667],[390,844],[834,900],[1440,900],[2560,1080]]) {
    for (const progress of [0,.25,.75,1]) for (const point of alpinePoints) for (const depth of [.35,1,1.6]) for (const detail of [0,1]) {
      const frame = alpineFrame(width,height,progress,depth,[point.x,point.y],detail,[.5,-.5]);
      assert.ok(frame.x <= .001 && frame.y <= .001);
      assert.ok(frame.x + frame.width >= width - .001);
      assert.ok(frame.y + frame.height >= height - .001);
      assert.ok(Math.abs(frame.width / frame.height - 1.5) < .00001);
    }
  }
});

test('optimized Alpine plates retain matching canvases and real cutout transparency', async () => {
  let bytes = 0;
  for (const name of ['valley','village','foreground']) {
    const file = path.join(root,`public/cinematic/alpine/${name}.webp`);
    const metadata = await sharp(file).metadata();
    assert.equal(metadata.width,1536); assert.equal(metadata.height,1024);
    if (name !== 'valley') {
      assert.equal(metadata.hasAlpha,true);
      const stats = await sharp(file).stats();
      assert.equal(stats.isOpaque,false);
      assert.equal(stats.channels[3].min,0);
      assert.ok(stats.channels[3].max >= 250);
    }
    bytes += fs.statSync(file).size;
  }
  assert.ok(bytes < 1_000_000, 'three on-screen plates should total less than 1 MB');
});

test('new scene and both discoveries have local narration with synchronized, complete captions', () => {
  const script = require('../lib/experience/cinematic-script.json');
  const manifest = require('../lib/experience/cinematic-manifest.json');
  assert.equal(manifest.length,3);
  manifest.forEach((clip,index) => {
    assert.equal(clip.text,script[index].text);
    assert.ok(fs.statSync(path.join(root,'public',clip.audio)).size > 10_000);
    assert.ok(clip.duration > 10 && clip.duration < 30);
    assert.ok(clip.cues.length >= 3);
    clip.cues.forEach((cue,i) => { assert.ok(cue.start < cue.end && cue.end <= clip.duration); if(i) assert.ok(cue.start >= clip.cues[i-1].end); });
  });
});
