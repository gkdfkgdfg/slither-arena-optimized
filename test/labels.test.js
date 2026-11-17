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

test('screen cards avoid clipping, HUD and nearby labels with stable lanes',()=>{
 const cards=[{id:0,x:195,y:422,r:15,w:170,h:55,own:true,priority:100},
  {id:1,x:208,y:390,r:14,w:130,h:35,own:false,priority:70},
  {id:2,x:345,y:430,r:20,w:140,h:35,own:false,priority:300},
  {id:3,x:20,y:45,r:12,w:140,h:35,own:false,priority:20}];
 const obstacles=[{x:0,y:0,w:390,h:56},{x:0,y:56,w:112,h:54}];
 const result=labels.layout(cards,390,844,obstacles);
 const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 assert.equal(result[0].id,0,'player has priority');
 for(const card of result){assert.ok(card.x>=8&&card.x+card.w<=382);assert.ok(card.y>=8&&card.y+card.h<=836);assert.ok(!obstacles.some(b=>overlaps(card,b)))}
 for(let i=0;i<result.length;i++)for(let j=i+1;j<result.length;j++)assert.ok(!overlaps(result[i],result[j]));
 const again=labels.layout(cards.map(c=>({...c,lane:result.find(p=>p.id===c.id).lane})),390,844,obstacles);
 assert.deepEqual(again.map(c=>[c.id,c.lane]),result.map(c=>[c.id,c.lane]));
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
