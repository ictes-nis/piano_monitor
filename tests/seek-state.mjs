import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const html=fs.readFileSync(new URL('../keys.html',import.meta.url),'utf8');
const start=html.indexOf('function playbackState(');
const end=html.indexOf('/* ---- 内蔵音',start);
assert.ok(start>0&&end>start);
const context=vm.createContext({Map,Set,Object});
vm.runInContext(html.slice(start,end)+'\nthis.playbackState=playbackState;',context);
const state=context.playbackState;

const take={events:[
  {t:0,k:'on',a:60,b:88},
  {t:100,k:'cc',a:64,b:110},
  {t:200,k:'off',a:60,b:0},
  {t:300,k:'cc',a:64,b:0},
]};
assert.equal(state(take,150).held.get(60),88);
assert.equal(state(take,150).cc[64],110);
assert.equal(state(take,250).pedHeld.has(60),true);
assert.equal(state(take,350).pedHeld.has(60),false);
assert.equal(state(take,350).vel.has(60),false);

const sost={events:[
  {t:0,k:'on',a:64,b:72},
  {t:100,k:'cc',a:66,b:127},
  {t:200,k:'off',a:64,b:0},
  {t:300,k:'cc',a:66,b:0},
]};
assert.equal(state(sost,250).pedHeld.has(64),true);
assert.equal(state(sost,350).pedHeld.has(64),false);
console.log('Playback seek state: OK');
