import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function codec(page) {
  const html=fs.readFileSync(new URL(`../${page}`,import.meta.url),'utf8');
  const start=html.indexOf('const TPQ=480, USQ=500000;');
  const end=html.indexOf('/* 書き出すファイル名。',start);
  const code=html.slice(start,end>start?end:html.indexOf('/* ===== 操作バー',start));
  assert.ok(start>0 && code.includes('function datedMidName()'));
  const context=vm.createContext({DataView,Uint8Array,Date,Math,Number,Error,String,Blob});
  vm.runInContext(code+'\nthis.codec={toSMF,fromSMF,datedMidName};',context);
  return context.codec;
}

const main=codec('index.html'), keys=codec('keys.html');
const take={dur:800,events:[
  {t:0,k:'on',a:60,b:72},
  {t:100,k:'cc',a:64,b:95},
  {t:250,k:'off',a:60,b:0},
  {t:300,k:'cc',a:64,b:0},
  {t:400,k:'cc',a:66,b:127},
  {t:450,k:'cc',a:67,b:32},
]};
for(const [writer,reader] of [[main,main],[main,keys],[keys,main],[keys,keys]]) {
  const bytes=writer.toSMF(take);
  const restored=reader.fromSMF(bytes.buffer,'my_recording.mid');
  assert.equal(restored.name,'my_recording.mid');
  assert.equal(restored.dur,take.dur);
  assert.deepEqual(JSON.parse(JSON.stringify(restored.events)),take.events);
}

const old=main.toSMF({...take,dur:450}); // 旧版は最後のイベント直後に演奏終了を置く
assert.equal(keys.fromSMF(old.buffer,'old.mid').dur,450);

const unsupported=main.toSMF(take);
unsupported[9]=1; // format 1 はこのアプリの書き出しではない
assert.throws(()=>keys.fromSMF(unsupported.buffer,'other.mid'));
assert.match(main.datedMidName(),/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.mid$/);
console.log('MIDI round trips: OK');
