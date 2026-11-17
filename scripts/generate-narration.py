"""Generate local demo audio from editorial, non-confidential narration only."""
import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.tools' / 'tts'))
import edge_tts

async def generate(stem):
    script = json.loads((ROOT / ('lib/experience/' + stem + '-script.json')).read_text(encoding='utf-8-sig'))
    manifest_path = ROOT / ('lib/experience/' + stem + '-manifest.json')
    existing = {item['id']: item for item in json.loads(manifest_path.read_text(encoding='utf-8-sig'))} if manifest_path.exists() else {}
    manifest = []
    for scene in script:
        destination = ROOT / 'public/narration' / (scene['id'] + '.mp3')
        if scene['id'] in existing and existing[scene['id']]['text'] == scene['text'] and destination.exists() and destination.stat().st_size > 10000:
            manifest.append(existing[scene['id']])
            continue
        cues = []
        communicate = edge_tts.Communicate(scene['text'], 'en-GB-RyanNeural', rate='-12%', boundary='SentenceBoundary')
        with destination.open('wb') as output:
            async for chunk in communicate.stream():
                if chunk['type'] == 'audio':
                    output.write(chunk['data'])
                elif chunk['type'] == 'SentenceBoundary':
                    start = chunk['offset'] / 10_000_000
                    cues.append({'start': round(start, 3), 'end': round(start + chunk['duration'] / 10_000_000, 3), 'text': chunk['text']})
        for index in range(len(cues) - 1):
            cues[index]['end'] = min(cues[index]['end'], cues[index + 1]['start'])
        manifest.append({**scene, 'audio': '/narration/' + destination.name, 'duration': round(cues[-1]['end'] + .024, 3) if cues else 24, 'cues': cues})
        print(scene['id'], destination.stat().st_size, 'bytes', flush=True)
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')

async def main():
    for stem in sys.argv[1:] or ['narration', 'detail']:
        await generate(stem)

asyncio.run(main())
