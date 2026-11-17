'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const labels=require('../arena-labels');
const FX=require('../arena-effects');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');

test('amounts preserve tiny entry targets and use one readable format',()=>{
 assert.equal(labels.amount(.01*37.5),'0,375');
 assert.equal(labels.amount(.000001),'0,000001');
 assert.equal(labels.amount(15000.5),'15 000,50');
 assert.equal(labels.amount(0),'0,00');
 assert.equal(labels.amount(1000000000000),'1 000 000 000 000,00');
 const data=labels.details(12500,500,'zł',true,true,false);
 assert.equal(data.unit,'zł');assert.equal(data.profit,'+12 000,00');assert.equal(data.multiplier,'×25,0');
 assert.equal(data.open,false,'having a displayed gain does not mark the exit as open');
 assert.equal(labels.details(400,500,'RUB',false,true,false).profit,'−100,00');
 assert.equal(labels.details(400,500,'RUB',false,true,false).unit,'');
});

test('turning effects off immediately clears highlights and blocks all decoration drawing',()=>{
 const fx=FX.create();fx.kill(0,0,50,10);fx.update(.2,{alive:true},true);
 assert.ok(fx.diagnostics().rings>0);fx.setEnabled(false);
 fx.kill(0,0,50,10);fx.pickup(0,0,5,10);fx.progress(20,true);fx.update(.5,{alive:true},true);
 assert.equal(fx.diagnostics().rings,0);assert.equal(fx.diagnostics().labels,0);assert.equal(fx.diagnostics().combo,0);
 const neverDraw=new Proxy({},{get(){throw Error('disabled effects tried to draw')}});
 fx.world(neverDraw,{},1,false);fx.floatingLabels(neverDraw,1,false);fx.screen(neverDraw,390,844,false);
 fx.setEnabled(true);fx.progress(20,true);assert.equal(fx.diagnostics().rings,0,'re-enabling never replays stale highlights');
 fx.kill(0,0,50,10);assert.ok(fx.diagnostics().rings>0);
 fx.reset();assert.equal(fx.diagnostics().enabled,true);
});

test('currency settings cannot race an asynchronous round start',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../mystake.js'),'utf8');
 const start=source.indexOf('function configure('),end=source.indexOf("$('settingsForm')",start);
 const context={mode:'loading',prefs:{currency:'USD',balance:100},save(){},sync(){}};vm.createContext(context);vm.runInContext(source.slice(start,end),context);
 assert.throws(()=>context.configure('RUB',9999),/между раундами/);assert.equal(context.prefs.balance,100);
 context.mode='menu';context.configure('RUB',9999);assert.equal(context.prefs.currency,'RUB');assert.equal(context.prefs.balance,9999);
});

test('hiding multipliers clears existing text and keeps loot and exit effects without ratios',()=>{
 const fx=FX.create(),painted=[];
 const g={save(){},restore(){},strokeText(){},fillText(text){painted.push(text)}};
 fx.kill(0,0,50,10);fx.progress(20,false);fx.setShowMultipliers(false);
 fx.floatingLabels(g,1,false);fx.screen(g,390,844,false);
 assert.deepEqual(painted,[],'already queued multiplier text disappears immediately');
 fx.kill(0,0,50,10);fx.kill(0,0,50,10);fx.pickup(0,0,5,10);
 fx.floatingLabels(g,1,false);fx.screen(g,390,844,false);
 assert.ok(painted.includes('ДОБЫЧА'));assert.ok(painted.includes('КОМБО'));
 assert.ok(painted.every(text=>!/[×xх]/.test(text)));
 fx.progress(40,true);fx.screen(g,390,844,false);
 assert.ok(painted.includes('ВЫХОД ОТКРЫТ'));
 assert.equal(fx.diagnostics().unlocked,true);
 fx.reset();assert.equal(fx.diagnostics().showMultipliers,false);
 fx.setShowMultipliers(true);painted.length=0;fx.kill(0,0,50,10);fx.floatingLabels(g,1,false);
 assert.ok(painted.some(text=>text.includes('×5.0')),'switching back restores ratios for new effects');
});
