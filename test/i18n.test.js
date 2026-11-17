'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const I18n=require('../arena-i18n'),FX=require('../arena-effects'),labels=require('../arena-labels');

test('round languages cover every message and normalize shared-link language codes',()=>{
 assert.equal(I18n.normalize('cs-CZ'),'cs');assert.equal(I18n.normalize('cz'),'cs');
 assert.equal(I18n.normalize('sr-Latn-RS'),'sr');assert.equal(I18n.normalize('en_US'),'en');
 assert.equal(I18n.normalize('unsupported'),'ru');
 const values={amount:'12 000,00 zł',time:'1:23',kills:4,balance:'500,00 zł',multiplier:'×20',count:3};
 for(const language of I18n.languages){
  const {t}=I18n.create(language);
  for(const key of I18n.keys){
   const text=t(key,values);
   assert.notEqual(text,key,`${language}: missing ${key}`);
   assert.doesNotMatch(text,/\{\w+\}/,`${language}: unresolved ${key}`);
   if(language!=='ru')assert.doesNotMatch(text,/[А-Яа-яЁё]/,`${language}: Russian fallback in ${key}`);
  }
 }
});

test('real effect drawing uses the selected round language for loot, combo and exit',()=>{
 for(const language of ['cs','sr','it','en']){
  const translator=I18n.create(language),fx=FX.create({translate:translator.t}),painted=[];
  const g={save(){},restore(){},strokeText(){},fillText(text){painted.push(text)}};
  fx.kill(0,0,50,10);fx.floatingLabels(g,1,false);fx.screen(g,390,844,false);
  assert.ok(painted.includes(translator.t('loot',{multiplier:'5.0'})));
  assert.ok(painted.includes(translator.t('cutOff')));
  fx.kill(0,0,50,10);fx.screen(g,390,844,false);
  assert.ok(painted.includes(translator.t('combo',{count:2})));
  fx.progress(20,true);fx.screen(g,390,844,false);
  assert.ok(painted.includes(translator.t('exitBanner')));
  assert.ok(painted.includes(translator.t('boundaryHint')));
  assert.ok(painted.every(text=>!/[А-Яа-яЁё]/.test(text)));
  fx.setEnabled(false);const count=painted.length;fx.screen(g,390,844,false);
  assert.equal(painted.length,count);
 }
});

test('actual cashout and death messages localize without changing money or payouts',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../mystake.js'),'utf8');
 const finish=source.slice(source.indexOf('function finish('),source.indexOf("$('winOverlay').onclick"));
 for(const language of I18n.languages)for(const success of [false,true]){
  const t=I18n.create(language).t,nodes=new Map();
  const $=id=>{if(!nodes.has(id))nodes.set(id,{style:{},focus(){},showModal(){}});return nodes.get(id)};
  const state={$ ,tr:t,ArenaLabels:labels,mode:'play',paused:false,exitUnlocked:true,player:{value:12500},sessionStake:500,
   prefs:{balance:1000,currency:'zł',showCurrency:true},W:390,elapsed:83,kills:4,
   arenaFX:FX.create(),save(){},tone(){},fmt:value=>labels.amount(value)+' zł',clock:()=> '1:23'};
  state.arenaFX.kill(0,0,50,10);vm.createContext(state);vm.runInContext(finish,state);state.finish(success,true);
  assert.equal(state.arenaFX.diagnostics().labels,0,'result clears frozen floating labels');
  assert.equal(state.mode,'result');assert.equal(state.prefs.balance,success?13500:1000);
  if(success){
   assert.equal($('winNumber').textContent,'12 500,00');assert.equal($('winCurrency').textContent,'zł');
   assert.equal(nodes.has('winProfit'),false,'cashout only writes the amount and currency');
   assert.equal(nodes.has('winMultiplier'),false);
  }else{
   assert.equal($('resultTitle').textContent,t('died'));
   assert.equal($('resultInfo').textContent,t('deathInfo',{time:'1:23',kills:4,balance:'1 000,00 zł'}));
  }
 }
});
