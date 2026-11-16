const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const source = fs.readFileSync(require('node:path').join(__dirname, '../lib/experience/scroll-story.ts'), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const scope = { exports: {} };
new Function('module', 'exports', compiled)(scope, scope.exports);
const { cameraFrame, beatAt, storyBeats } = scope.exports;

test('camera fills portrait and landscape screens at every focal target without exposing an edge', () => {
  for (const [width, height] of [[1440,1024],[390,844],[320,667],[1920,1080]]) {
    for (const beat of storyBeats) {
      for (const zoom of [1, 1.3, beat.zoom, 3]) {
        const frame = cameraFrame(width, height, beat.focus, zoom, beat.side);
        assert.ok(frame.x <= .001 && frame.y <= .001);
        assert.ok(frame.x + frame.imageWidth * zoom >= width - .001);
        assert.ok(frame.y + frame.imageHeight * zoom >= height - .001);
      }
    }
  }
});
test('scrolling backwards restores the previous narrative beat at a boundary', () => {
  storyBeats.slice(1).forEach((beat, offset) => {
    assert.equal(beatAt(beat.start), offset + 1);
    assert.equal(beatAt(beat.start - .0001), offset);
  });
  assert.equal(beatAt(1), storyBeats.length - 1);
});

test('historical images preserve their native aspect ratio while filling the stage',()=>{
 for(const aspect of [1328/728,1328/807]) {
  const f=cameraFrame(1440,1024,[61,70],1.7,'left',aspect);
  assert.ok(Math.abs(f.imageWidth/f.imageHeight-aspect)<.0001);
  assert.ok(f.x+f.imageWidth*f.zoom>=1440-.001);
  assert.ok(f.y+f.imageHeight*f.zoom>=1024-.001);
 }
});
