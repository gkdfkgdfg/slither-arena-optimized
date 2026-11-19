'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const Vice=require('../vice-visual'),Effects=require('../arena-effects');
test('leaderboard contains only living arena snakes and never changes the roster or values',()=>{
 const player={id:0,name:'Player',value:20,skin:'flag_ve',alive:true};
 const roster=[player,{id:1,name:'Neon',value:80,alive:true},{id:2,name:'Mamba',value:999,alive:false},{id:3,name:'Lucky',value:30,alive:true}];
 const before=structuredClone(roster),rows=Vice.ranking(roster,player);
 assert.deepEqual(rows.map(r=>[r.name,r.rank,r.own]),[['Neon',1,false],['Lucky',2,false],['Player',3,true]]);
 assert.deepEqual(roster,before);assert.deepEqual(rows.map(r=>r.value),[80,30,20]);
 assert.equal(new Set(Array.from({length:5},(_,i)=>Vice.theme({id:i+1}).name)).size,5);
});
test('procedural materials, heads and food reuse bounded caches without changing game objects',()=>{
 const prior=global.document;let allocations=0;
 global.document={createElement(){allocations++;const gradient={addColorStop(){}};const g=new Proxy({createLinearGradient:()=>gradient,createRadialGradient:()=>gradient},{get(o,k){return k in o?o[k]:(()=>{})},set(o,k,v){o[k]=v;return true}});return {width:0,height:0,getContext:()=>g}}};
 try{
  const roster=Array.from({length:200},(_,i)=>({id:i%10,skin:'skin'+i,x:i,y:i,radius:20,value:50,points:[{x:0,y:0},{x:1,y:1}]}));
  const before=structuredClone(roster);Vice.prepare(roster);const count=allocations;Vice.prepare(roster);
  assert.equal(allocations,count);assert.deepEqual(roster,before);
  const cache=Vice.diagnostics();assert.ok(cache.textures<=15);assert.equal(cache.heads,5);assert.equal(cache.orbs,5);
  const c=Object.freeze({x:1,y:2,phase:1.7,r:4,value:99});const color=Vice.coinColor(c);assert.equal(color,Vice.coinColor(c));
  const g={drawImage(){}};Vice.food(g,c,4,true);assert.equal(c.value,99);assert.equal(c.r,4);
 }finally{global.document=prior}
});
test('mobile boost particles have a lower cap and effects off clears them immediately',()=>{
 for(const mobile of [true,false]){
  const fx=Effects.create({mobile}),p={alive:true,x:0,y:0,a:0,radius:30};
  for(let i=0;i<2000;i++)fx.update(.01,p,true);
  assert.ok(fx.diagnostics().sparks>0);assert.ok(fx.diagnostics().sparks<=(mobile?24:60));
  fx.setEnabled(false);assert.equal(fx.diagnostics().sparks,0);
  for(let i=0;i<100;i++)fx.update(.01,p,true);assert.equal(fx.diagnostics().sparks,0);
 }
});
