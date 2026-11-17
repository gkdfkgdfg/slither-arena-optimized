/* Bounded, event-driven effects. No camera shake or changes to gameplay time. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./arena-i18n'));else root.ArenaEffects=factory(root.ArenaI18n)})(typeof globalThis!=='undefined'?globalThis:this,I18n=>{
 'use strict';
 function create({translate=I18n.create('ru').t}={}){
  const rings=[],labels=[];let enabled=true,showMultipliers=true,time=0,combo=0,lastKill=-100,pickupAt=-1,stage=1,unlocked=false,boostGlow=0,banner=null;
  const ring=(x,y,color,r=30)=>{if(rings.length<14)rings.push({x,y,color,r,age:0})};
  const label=(x,y,text,color)=>{if(labels.length>=8)labels.shift();labels.push({x,y,text,color,age:0})};
  const announce=(title,sub,color)=>{if(enabled)banner={title,sub,color,age:0}};
  function setEnabled(value){enabled=value!==false;if(!enabled){rings.length=labels.length=0;banner=null;boostGlow=0;combo=0;lastKill=-100}}
  function setShowMultipliers(value){const next=value!==false;if(next!==showMultipliers){labels.length=0;banner=null}showMultipliers=next}
  function reset(){rings.length=labels.length=0;time=0;combo=0;lastKill=-100;pickupAt=-1;stage=1;unlocked=false;boostGlow=0;banner=null}
  function update(dt,player,boost){
   time+=dt;if(!enabled)return;boostGlow+=(Number(boost&&player.alive)-boostGlow)*(1-Math.exp(-dt*7));
   for(let i=rings.length-1;i>=0;i--)if((rings[i].age+=dt)> .75)rings.splice(i,1);
   for(let i=labels.length-1;i>=0;i--)if((labels[i].age+=dt)>1.1)labels.splice(i,1);
   if(banner&&(banner.age+=dt)>2)banner=null;
  }
  function kill(x,y,value,stake){
   if(!enabled)return;
   combo=time-lastKill<7?combo+1:1;lastKill=time;
   ring(x,y,'#ffe28b',55);ring(x,y,'#a6fff0',20);
   label(x,y,showMultipliers?translate('loot',{multiplier:(value/stake).toFixed(1)}):translate('lootPlain'),'#ffe28b');
   announce(combo>1?(showMultipliers?translate('combo',{count:combo}):translate('comboPlain')):translate('cutOff'),translate(combo>1?'anotherRival':'collectLoot'),'#ffe28b');
  }
  function pickup(x,y,value,stake){if(!enabled||time-pickupAt<.12)return;pickupAt=time;ring(x,y,'#ffe891',12);if(showMultipliers&&value>=stake*.35)label(x,y,'+'+(value/stake).toFixed(1)+'×','#fff1ae')}
  function progress(mult,open){
   const next=[1,2,5,10,20,40,60,100].filter(v=>mult>=v).at(-1)||1;
   if(open&&!unlocked){unlocked=true;announce(translate('exitBanner'),translate('boundaryHint'),'#8dffae')}
   else if(showMultipliers&&next>stage&&next>=2)announce('×'+next,translate('newStage'),'#a5fff0');
   stage=Math.max(stage,next);
  }
  function world(g,player,zoom,reduced){
   if(!enabled||reduced)return;
   g.save();
   if(boostGlow>.04&&player.alive){
    // Two short tapered exhaust streaks behind the head, with no circle around it.
    g.save();g.translate(player.x,player.y);g.rotate(player.a);g.globalAlpha=boostGlow*.45;
    const gradient=g.createLinearGradient(-player.radius,-0,-player.radius-110,0);gradient.addColorStop(0,'#acfff1');gradient.addColorStop(1,'#7dfff000');
    g.strokeStyle=gradient;g.lineWidth=3/zoom;g.lineCap='round';
    for(const side of [-1,1]){g.beginPath();g.moveTo(-player.radius*.7,side*player.radius*.75);g.lineTo(-player.radius-105,side*(player.radius+9));g.stroke()}g.restore();
   }
   for(const r of rings){g.globalAlpha=(1-r.age/.75)*.7;g.strokeStyle=r.color;g.lineWidth=2/zoom;g.beginPath();g.arc(r.x,r.y,r.r+r.age*110,0,Math.PI*2);g.stroke()}
   g.restore();
  }
  function floatingLabels(g,zoom,reduced){
   if(!enabled||reduced)return;g.save();g.textAlign='center';g.font='900 '+Math.min(32,18/zoom)+'px system-ui';g.lineJoin='round';g.lineWidth=4/zoom;
   for(const l of labels){g.globalAlpha=Math.min(1,(1.1-l.age)*3);g.strokeStyle='#101c2b';g.fillStyle=l.color;const y=l.y-65/zoom-l.age*65;g.strokeText(l.text,l.x,y);g.fillText(l.text,l.x,y)}g.restore();
  }
  function screen(g,w,h,reduced){
   if(!enabled||!banner||reduced)return;g.save();const a=banner.age,fade=Math.min(1,a*8,(2-a)*3);g.globalAlpha=fade;
   const size=Math.min(34,w*.066),y=Math.max(90,h*.19)-Math.max(0,.15-a)*35;
   g.textAlign='center';g.font='900 '+size+'px system-ui';g.lineJoin='round';g.strokeStyle='#0b182b';g.lineWidth=5;g.fillStyle=banner.color;
   g.strokeText(banner.title,w/2,y);g.fillText(banner.title,w/2,y);
   g.font='700 '+Math.min(12,w*.025)+'px system-ui';g.fillStyle='#e2f5ff';g.fillText(banner.sub,w/2,y+25);g.restore();
  }
  return {reset,setEnabled,setShowMultipliers,update,kill,pickup,progress,world,floatingLabels,screen,diagnostics:()=>({enabled,showMultipliers,rings:rings.length,labels:labels.length,combo,stage,unlocked})};
 }
 return {create};
});
