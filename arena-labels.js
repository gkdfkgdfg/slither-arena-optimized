(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ArenaLabels=factory()})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const regular=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
 const small=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:6});
 const ratio=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:1,maximumFractionDigits:2});
 const clean=text=>text.replace(/\s/g,' ');
 function amount(value){const n=Number.isFinite(value)?value:0;return clean((Math.abs(n)<1?small:regular).format(Object.is(n,-0)?0:n))}
 function details(value,stake,currency,showCurrency,own,open){
  const profit=value-stake;
  return {amount:amount(value),unit:showCurrency?String(currency):'',multiplier:'×'+clean(ratio.format(stake>0?value/stake:0)),
   profit:own?(profit<-.0000005?'−':'+')+amount(Math.abs(profit)):'',positive:profit>=-.0000005,own,open:!!open};
 }
 const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
 // Screen-space cards keep legible text at every camera zoom. Stable lanes prevent flicker.
 function layout(cards,width,height,obstacles=[]){
  const placed=[],heads=cards.map(c=>({x:c.x-c.r-3,y:c.y-c.r-3,w:(c.r+3)*2,h:(c.r+3)*2}));
  for(const c of [...cards].sort((a,b)=>(b.own-a.own)||(b.priority-a.priority)||a.id-b.id)){
   if(c.x<0||c.x>width||c.y<0||c.y>height)continue;
   const candidates=[[-c.w/2,-c.r-c.h-12],[-c.w/2,-c.r-c.h*2-22],[-c.w/2,c.r+14],
    [-c.w/2,c.r+c.h+24],[c.r+12,-c.h/2],[-c.r-c.w-12,-c.h/2],[-c.w/2,-c.r-c.h*3-32]];
   let best=null,bestScore=Infinity;
   candidates.forEach(([dx,dy],lane)=>{
    const box={x:Math.max(8,Math.min(width-c.w-8,c.x+dx)),y:Math.max(8,Math.min(height-c.h-8,c.y+dy)),w:c.w,h:c.h};
    let score=lane*9+(lane===c.lane?-6:0)+Math.abs(box.x-c.x-dx)+Math.abs(box.y-c.y-dy);
    for(const b of [...placed,...obstacles,...heads])score+=overlap({...box,x:box.x-3,y:box.y-3,w:box.w+6,h:box.h+6},b)*30;
    if(score<bestScore){bestScore=score;best={...c,...box,lane}}
   });
   placed.push(best);
  }
  return placed;
 }
 return {amount,details,layout};
});
