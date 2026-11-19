/* Bounded, event-driven effects. No camera shake or changes to gameplay time. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./arena-i18n'));else root.ArenaEffects=factory(root.ArenaI18n)})(typeof globalThis!=='undefined'?globalThis:this,I18n=>{
 'use strict';
 function create({translate=I18n.create('ru').t,mobile=false}={}){
  const rings=[],labels=[],sparks=[];let enabled=true,showMultipliers=true,time=0,combo=0,lastKill=-100,pickupAt=-1,stage=1,unlocked=false,boostGlow=0,banner=null,sparkAt=0;
  const ring=(x,y,color,r=30)=>{if(rings.length<14)rings.push({x,y,color,r,age:0})};
  const label=(x,y,text,color)=>{if(labels.length>=8)labels.shift();labels.push({x,y,text,color,age:0})};
  const announce=(title,sub,color)=>{if(enabled)banner={title,sub,color,age:0}};
  function setEnabled(value){enabled=value!==false;if(!enabled){rings.length=labels.length=sparks.length=0;banner=null;boostGlow=0;combo=0;lastKill=-100}}
  function setShowMultipliers(value){const next=value!==false;if(next!==showMultipliers){labels.length=0;banner=null}showMultipliers=next}
  function reset(){rings.length=labels.length=sparks.length=0;time=0;combo=0;lastKill=-100;pickupAt=-1;stage=1;unlocked=false;boostGlow=0;banner=null;sparkAt=0}
  function update(dt,player,boost){
   time+=dt;if(!enabled)return;boostGlow+=(Number(boost&&player.alive)-boostGlow)*(1-Math.exp(-dt*7));
   for(let i=rings.length-1;i>=0;i--)if((rings[i].age+=dt)> .75)rings.splice(i,1);
   for(let i=labels.length-1;i>=0;i--)if((labels[i].age+=dt)>1.1)labels.splice(i,1);
   if(banner&&(banner.age+=dt)>2)banner=null;
   for(let i=sparks.length-1;i>=0;i--){const p=sparks[i];p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.age>.45)sparks.splice(i,1)}
   if(boost&&player.alive&&time-sparkAt>(mobile?.1:.045)){sparkAt=time;const r=player.radius||15,a=player.a||0;for(const side of [-1,1])if(sparks.length<(mobile?24:60)){const x=player.x-Math.cos(a)*r-Math.sin(a)*r*side,y=player.y-Math.sin(a)*r+Math.cos(a)*r*side;sparks.push({x,y,vx:-Math.cos(a)*80,vy:-Math.sin(a)*80,age:0,color:side===1?'#68e3da':'#f277b7'})}}
  }
  function kill(x,y,value,stake){
   if(!enabled)return;
   combo=time-lastKill<7?combo+1:1;lastKill=time;
   ring(x,y,'#f48dc1',55);ring(x,y,'#6de5db',20);
   label(x,y,showMultipliers?translate('loot',{multiplier:(value/stake).toFixed(1)}):translate('lootPlain'),'#ffe28b');
   announce(combo>1?(showMultipliers?translate('combo',{count:combo}):translate('comboPlain')):translate('cutOff'),translate(combo>1?'anotherRival':'collectLoot'),'#ffe28b');
  }
  function pickup(x,y,value,stake,color='#79e4db'){if(!enabled||time-pickupAt<.12)return;pickupAt=time;ring(x,y,color,12);if(showMultipliers&&value>=stake*.35)label(x,y,'+'+(value/stake).toFixed(1)+'×',color)}
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
    const gradient=g.createLinearGradient(-player.radius,-0,-player.radius-110,0);gradient.addColorStop(0,'#82ece5');gradient.addColorStop(1,'#ef7dbc00');
    g.strokeStyle=gradient;g.lineWidth=3/zoom;g.lineCap='round';
    for(const side of [-1,1]){g.beginPath();g.moveTo(-player.radius*.7,side*player.radius*.75);g.lineTo(-player.radius-105,side*(player.radius+9));g.stroke()}g.restore();
   }
   for(const r of rings){g.globalAlpha=(1-r.age/.75)*.7;g.strokeStyle=r.color;g.lineWidth=2/zoom;g.beginPath();g.arc(r.x,r.y,r.r+r.age*110,0,Math.PI*2);g.stroke()}
   for(const p of sparks){g.globalAlpha=(1-p.age/.45)*.7;g.fillStyle=p.color;g.fillRect(p.x,p.y,3/zoom,1.5/zoom)}
   g.restore();
  }
  function floatingLabels(g,zoom,reduced){
   if(!enabled||reduced)return;g.save();g.textAlign='center';g.font='700 '+Math.min(30,15/zoom)+'px Rubik,Arial,sans-serif';g.lineJoin='round';g.lineWidth=4/zoom;
   for(const l of labels){g.globalAlpha=Math.min(1,(1.1-l.age)*3);g.strokeStyle='#101c2b';g.fillStyle=l.color;const y=l.y-65/zoom-l.age*65;g.strokeText(l.text,l.x,y);g.fillText(l.text,l.x,y)}g.restore();
  }
  function screen(g,w,h,reduced){
   if(!enabled||!banner||reduced)return;g.save();const a=banner.age,fade=Math.min(1,a*8,(2-a)*3);g.globalAlpha=fade;
   const size=Math.min(27,w*.057),y=w<700?Math.max(310,h*.39):h*.25;
   g.textAlign='center';g.font='800 '+size+'px Rubik,Arial,sans-serif';g.lineJoin='round';g.strokeStyle='#0b1527';g.lineWidth=5;g.fillStyle=banner.color;
   g.strokeText(banner.title,w/2,y);g.fillText(banner.title,w/2,y);
   g.font='500 '+Math.min(11,w*.025)+'px Rubik,Arial,sans-serif';g.fillStyle='#d1d5e8';g.fillText(banner.sub,w/2,y+23);g.restore();
  }
  return {reset,setEnabled,setShowMultipliers,update,kill,pickup,progress,world,floatingLabels,screen,diagnostics:()=>({enabled,showMultipliers,rings:rings.length,labels:labels.length,sparks:sparks.length,combo,stage,unlocked})};
 }
 return {create};
});
