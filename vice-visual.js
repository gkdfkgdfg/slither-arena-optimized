/* Original procedural match artwork. Rendering only: never writes to game objects. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.ViceVisual=factory()})(typeof globalThis!=='undefined'?globalThis:this,()=>{
 'use strict';
 const collections=[
  {name:'VICE CITY',a:'#fb549f',b:'#47dfd6',dark:'#441d50'},
  {name:'NEON NIGHTS',a:'#a47aff',b:'#528eff',dark:'#241e59'},
  {name:'SUNSET',a:'#ffad65',b:'#f45b9b',dark:'#571d47'},
  {name:'MIAMI ICE',a:'#80f5ef',b:'#4fa6f5',dark:'#123d59'},
  {name:'GOLD COAST',a:'#ffe2a1',b:'#e9a866',dark:'#4d3340'}
 ];
 const textures=new Map(),heads=new Map(),orbs=new Map(),coinThemes=new WeakMap();let floor,playerCollection=null;
 try{const saved=localStorage.getItem('arena-vice-collection');if(saved!==null&&collections[Number(saved)])playerCollection=Number(saved)}catch{}
 const hash=text=>{let n=0;for(const c of String(text))n=(n*31+c.charCodeAt(0))>>>0;return n};
 const themeIndex=s=>s.id===0?(playerCollection??hash(s.skin||'neon')%5):Math.abs(s.id-1)%5;
 const theme=s=>collections[themeIndex(s)];
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c}
 function texture(s){
  const index=themeIndex(s),variant=hash(s.skin||'neon')%3,key=index+':'+variant;
  if(textures.has(key))return textures.get(key);
  const c=canvas(512,128),g=c.getContext('2d'),p=collections[index];c.viceKey=key;
  const base=g.createLinearGradient(0,0,0,128);
  for(const [at,color] of [[0,p.dark],[.09,p.a],[.24,p.a],[.45,p.b],[.72,p.a],[.95,p.dark],[1,'#10132b']])base.addColorStop(at,color);
  g.fillStyle=base;g.fillRect(0,0,512,128);
  // Broad, repeating shapes survive mipmap filtering; no fine moving noise.
  g.globalAlpha=.28;g.fillStyle=p.dark;
  for(let x=-128;x<640;x+=128){g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+120,38,x-10,84,x+105,128);g.lineTo(x+153,128);g.bezierCurveTo(x+25,76,x+140,40,x+45,0);g.fill()}
  g.globalAlpha=.5;g.strokeStyle=p.b;g.lineWidth=variant===1?9:4;
  for(const y of [19,101]){g.beginPath();g.moveTo(0,y);g.lineTo(512,y);g.stroke()}
  if(variant===2){g.globalAlpha=.32;g.strokeStyle='#fff7ec';g.lineWidth=3;for(let x=0;x<512;x+=64){g.beginPath();g.moveTo(x,36);g.lineTo(x+16,50);g.lineTo(x,64);g.stroke()}}
  const shade=g.createLinearGradient(0,0,0,128);shade.addColorStop(0,'#05091c99');shade.addColorStop(.16,'#ffffff00');shade.addColorStop(.3,'#ffffff4a');shade.addColorStop(.44,'#ffffff00');shade.addColorStop(.8,'#06091a36');shade.addColorStop(1,'#030714bb');
  g.globalAlpha=1;g.fillStyle=shade;g.fillRect(0,0,512,128);
  g.fillStyle='#fff9f06b';g.fillRect(0,27,512,2);textures.set(key,c);return c;
 }
 function head(s){
  const index=themeIndex(s);if(heads.has(index))return heads.get(index);
  const p=collections[index],c=canvas(192,192),g=c.getContext('2d');g.translate(96,96);
  // Sculpted visor follows the real head; no spawn circle or oversized decoration.
  const a=g.createLinearGradient(-40,-60,30,60);a.addColorStop(0,'#f5fbff');a.addColorStop(.12,p.a);a.addColorStop(.5,p.b);a.addColorStop(1,p.dark);
  g.fillStyle=a;g.beginPath();g.ellipse(0,0,66,62,0,0,Math.PI*2);g.fill();g.strokeStyle=p.b;g.lineWidth=3;g.stroke();
  g.fillStyle='#10182d';g.beginPath();g.roundRect(8,-43,36,86,17);g.fill();
  for(const side of [-1,1]){g.fillStyle='#f2ffff';g.beginPath();g.ellipse(26,side*25,15,13,0,0,7);g.fill();g.fillStyle='#19233c';g.beginPath();g.ellipse(32,side*25,7,8,0,0,7);g.fill();g.fillStyle=p.b;g.fillRect(29,side*25-3,4,4)}
  g.strokeStyle='#fff5ef9a';g.lineWidth=4;g.beginPath();g.ellipse(-15,-6,41,35,0,Math.PI,Math.PI*1.6);g.stroke();
  g.strokeStyle=p.dark;g.lineWidth=3;g.beginPath();g.moveTo(47,-6);g.quadraticCurveTo(55,0,47,6);g.stroke();heads.set(index,c);return c;
 }
 function drawHead(g,s){s.renderX=s.x;s.renderY=s.y;s.renderRadius=s.radius;g.save();g.translate(s.x,s.y);g.rotate(s.a||0);const r=s.radius*1.43;g.drawImage(head(s),-r,-r,r*2,r*2);g.restore()}
 function prepare(roster){for(const s of roster){texture(s);head(s)}floorTile();for(let i=0;i<5;i++)orb(i)}
 function floorTile(){
  if(floor)return floor;floor=canvas(1024,1024);const g=floor.getContext('2d');g.fillStyle='#0c1222';g.fillRect(0,0,1024,1024);
  const pool=(x,y,color)=>{const a=g.createRadialGradient(x,y,0,x,y,490);a.addColorStop(0,color);a.addColorStop(1,'#10132400');g.fillStyle=a;g.fillRect(0,0,1024,1024)};
  pool(230,230,'#58244e34');pool(780,720,'#17425238');
  g.strokeStyle='#63769813';g.lineWidth=1;g.beginPath();for(let n=0;n<=1024;n+=64){g.moveTo(n,0);g.lineTo(n,1024);g.moveTo(0,n);g.lineTo(1024,n)}g.stroke();
  // Quiet outlines of city blocks and canal-like strips, in world coordinates.
  for(let y=0;y<1024;y+=256)for(let x=0;x<1024;x+=256){
   g.strokeStyle='#879ec214';g.lineWidth=2;g.beginPath();g.roundRect(x+27,y+27,202,202,18);g.stroke();
   g.fillStyle='#6f88a016';for(const [dx,dy] of [[12,12],[244,244]]){g.fillRect(x+dx-2,y+dy-2,4,4)}
  }
  g.fillStyle='#f66fab24';g.fillRect(58,27,86,2);g.fillRect(539,826,2,94);g.fillStyle='#5ae8e024';g.fillRect(795,539,88,2);g.fillRect(228,331,2,64);
  // One restrained palm shadow per tile, no raster photographs or noisy textures.
  g.save();g.translate(751,277);g.strokeStyle='#4255721e';g.lineCap='round';g.lineWidth=4;g.beginPath();g.moveTo(-7,67);g.quadraticCurveTo(1,30,0,0);g.stroke();
  g.lineWidth=3;for(let i=0;i<7;i++){const a=i*.72-3;g.beginPath();g.moveTo(0,0);g.quadraticCurveTo(Math.cos(a)*32,Math.sin(a)*16-17,Math.cos(a)*49,Math.sin(a)*33+2);g.stroke()}g.restore();return floor;
 }
 function arena(g,left,top,vw,vh,soft=false){
  const tile=floorTile();g.save();g.fillStyle='#0c1222';g.fillRect(left,top,vw+120,vh+120);
  for(let x=Math.floor(left/1024)*1024;x<left+vw+120;x+=1024)for(let y=Math.floor(top/1024)*1024;y<top+vh+120;y+=1024)g.drawImage(tile,x,y,1024,1024);
  if(soft){g.fillStyle='#090c21aa';g.fillRect(left,top,vw+120,vh+120)}g.restore();
 }
 const energy=['#ff68bc','#62b1ff','#b68aff','#57e5db','#ffad70'];
 function coinIndex(c){let n=coinThemes.get(c);if(n===undefined){n=Math.floor((c.phase||0)*19)%5;coinThemes.set(c,n)}return n}
 function coinColor(c){return energy[c.loot?4:coinIndex(c)]}
 function orb(index){
  if(orbs.has(index))return orbs.get(index);const c=canvas(64,64),g=c.getContext('2d'),color=energy[index];
  const glow=g.createRadialGradient(32,32,4,32,32,31);glow.addColorStop(0,color+'aa');glow.addColorStop(.32,color+'77');glow.addColorStop(1,color+'00');g.fillStyle=glow;g.fillRect(0,0,64,64);
  const a=g.createRadialGradient(28,26,0,32,32,12);a.addColorStop(0,'#fff5ff');a.addColorStop(.28,color);a.addColorStop(1,color+'99');g.fillStyle=a;g.beginPath();g.arc(32,32,11,0,7);g.fill();g.fillStyle='#ffffffbb';g.beginPath();g.arc(28,27,2,0,7);g.fill();orbs.set(index,c);return c;
 }
 function food(g,c,time,animate){const index=c.loot?4:coinIndex(c),radius=c.loot?c.r:7.5,pulse=animate?1+Math.sin(time*2.3+c.phase)*.075:1,r=radius*2*pulse;g.drawImage(orb(index),c.x-r,c.y-r,r*2,r*2)}
 function outlines(g,snakes,zoom,effects,reduced){
  g.save();g.lineJoin=g.lineCap='round';
  for(const s of snakes){const p=theme(s);g.strokeStyle=p.a;g.globalAlpha=effects&&s.boosting&&!reduced?.46:.16;g.lineWidth=s.radius*2+3/zoom;g.beginPath();
   const stride=Math.max(2,Math.floor(s.points.length/100));s.points.forEach((p,i)=>{if(i%stride&&i!==s.points.length-1)return;i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y)});g.stroke();
  }g.restore();
 }
 function ranking(snakes,player){return snakes.filter(s=>s.alive).slice().sort((a,b)=>b.value-a.value||a.id-b.id).map((s,i)=>({id:s.id,name:s.name,value:s.value,rank:i+1,own:s===player,color:theme(s).a}))}
 function createHUD({tr,format}){
  const $=id=>document.getElementById(id),nodes=new Map(),records=Object.create(null);let lastSave=0;
  try{Object.assign(records,JSON.parse(localStorage.getItem('arena-vice-records')||'{}'))}catch{}
  const persist=()=>{try{localStorage.setItem('arena-vice-records',JSON.stringify(records))}catch{}};
  addEventListener('pagehide',persist);document.addEventListener('visibilitychange',()=>{if(document.hidden)persist()});
  $('matchCollection').onchange=()=>{const n=Number($('matchCollection').value);if(!collections[n])return;playerCollection=n;try{localStorage.setItem('arena-vice-collection',String(n))}catch{}};
  const write=(id,text)=>{const el=$(id);if(el.textContent!==String(text))el.textContent=text};
  function update({snakes,player,currency,showCurrency,time,kills}){
   const rows=ranking(snakes,player),own=rows.find(r=>r.own),unit=showCurrency?' '+currency:'';
   $('matchCollection').value=String(themeIndex(player));
   write('matchPopulation',rows.length);write('matchKills',kills);write('matchLength',Math.floor(player.len));
   const prior=Number(records[currency])||0;records[currency]=Math.max(prior,player.value);write('matchRecord',format(records[currency])+unit);
   if(records[currency]>prior&&performance.now()-lastSave>5000){lastSave=performance.now();persist()}
   write('matchTime',time);write('rankPosition',own?'#'+own.rank:'—');
   const visible=rows.slice(0,3);if(own&&!visible.includes(own))visible.push(own);
   const visibleIds=new Set(visible.map(r=>r.id));for(const [id,node] of nodes)if(!visibleIds.has(id)){node.remove();nodes.delete(id)}
   visible.forEach((row,index)=>{let el=nodes.get(row.id);if(!el){el=document.createElement('div');el.className='viceRankRow';for(const cls of ['rankNo','rankName','rankMoney']){const span=document.createElement('span');span.className=cls;el.append(span)}nodes.set(row.id,el);$('liveRanks').append(el)}
    el.style.transform=`translateY(${index*30}px)`;el.classList.toggle('own',row.own);el.style.setProperty('--rival',row.color);
    const texts=[String(row.rank).padStart(2,'0'),row.name+(row.own?' · '+tr('you'):''),format(row.value)];for(let i=0;i<3;i++)if(el.children[i].textContent!==texts[i])el.children[i].textContent=texts[i];
   });$('liveRanks').style.height=visible.length*30+'px';
  }
  return {update};
 }
 return {collections,theme,texture,drawHead,prepare,arena,food,coinColor,outlines,ranking,createHUD,diagnostics:()=>({textures:textures.size,heads:heads.size,orbs:orbs.size,floor:!!floor})};
});
