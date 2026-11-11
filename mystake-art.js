'use strict';
// Reference-mode materials only. A single cylindrical surface, including caps,
// carries the pattern all the way around a curved, continuous body.
const REFERENCE_SKINS=[
 {id:'hw_pumpkin',name:'Тыквенный король',color:'#ef861f',group:'halloween'},
 {id:'hw_ghost',name:'Привидение',color:'#c3f6f0',group:'halloween'},
 {id:'hw_mummy',name:'Древняя мумия',color:'#cebe91',group:'halloween'},
 {id:'hw_vampire',name:'Граф Дракула',color:'#ae2452',group:'halloween'},
 {id:'hw_spider',name:'Паучья королева',color:'#9558db',group:'halloween'},
 {id:'la_quetzal',name:'Кетцалькоатль · Мексика',color:'#2f8a72',group:'latam'},
 {id:'la_calavera',name:'Калавера · Мексика',color:'#4a2a45',group:'latam'},
 {id:'la_inti',name:'Инти · Перу',color:'#a8582f',group:'latam'},
 {id:'la_jaguar',name:'Ягуар Амазонии · Бразилия',color:'#2c4a2e',group:'latam'},
 {id:'la_hummingbird',name:'Колибри · Колумбия',color:'#2a6c8a',group:'latam'},
 {id:'la_tango',name:'Танго · Аргентина',color:'#2a0e14',group:'latam'},
 {id:'la_maya',name:'Майя · Гватемала',color:'#a39a85',group:'latam'},
 {id:'la_carnival',name:'Карнавал · Бразилия',color:'#1f5e48',group:'latam'},
 {id:'la_turpial',name:'Турпиал · Венесуэла',color:'#4b3721',group:'latam'},
 {id:'la_orchid',name:'Орхидея · Венесуэла',color:'#9f4a93',group:'latam'},
 {id:'la_diablos',name:'Дьяволы Яре · Венесуэла',color:'#8b3b1f',group:'latam'},
 {id:'la_arepa',name:'Арепа · Венесуэла',color:'#dc991e',group:'latam'},
 {id:'plasma_blue',name:'Голубая плазма',color:'#3999ff'},
 {id:'plasma_rose',name:'Малиновая плазма',color:'#ef419c'},
 {id:'lava_core',name:'Лавовое ядро',color:'#ff681e'},
 {id:'glacial',name:'Ледяные прожилки II',color:'#7be5f4'},
 {id:'emerald_arc',name:'Изумрудный разряд',color:'#41ef9c'},
 {id:'copper',name:'Часовой дракон',color:'#c98a46'},
 {id:'shark',name:'Тигровая акула',color:'#5995a9'},
 {id:'chrome',name:'Жидкий хром',color:'#c1dce7'},
 {id:'ruby',name:'Рубиновая броня',color:'#db2859'},
 {id:'jellyfish',name:'Медузы в стекле',color:'#7469ea'},
 {id:'opal',name:'Живой опал',color:'#7bded3'},
 {id:'obsidian',name:'Обсидиан',color:'#242538'},
 {id:'koi',name:'Карп кои',color:'#efbda3'},
 {id:'circuit',name:'Неоновый чип',color:'#10a99b'},
 {id:'prism',name:'Радужный кристалл',color:'#ab79ef'},
 {id:'dna',name:'ДНК в кристалле',color:'#339aab'},
 {id:'goldscale',name:'Золотая чешуя',color:'#d7a63f'},
 {id:'pearl',name:'Перламутр',color:'#b7e8ed'},
 {id:'bee',name:'Шмель',color:'#ffc52d'},
 {id:'mosaic',name:'Мозаика',color:'#28b9c4'},
 {id:'mahjong',name:'Нефритовая керамика',color:'#e4e9c3'},
 {id:'slots',name:'Семёрки',color:'#a82b23'},
 {id:'hazard',name:'Радиация',color:'#e2d527'},
 {id:'autumn',name:'Осенние листья',color:'#bd5e19'},
 {id:'ornament',name:'Золотой орнамент',color:'#972716'},
 {id:'festive',name:'Гирлянда',color:'#155d42'},
 {id:'wrapped',name:'Леденцы',color:'#79d541'},
 {id:'frost',name:'Ледяные прожилки',color:'#40adb1'}
];
const ENERGY_MATERIALS={
 plasma_blue:{base:[5,15,49],cloud:[22,65,137],light:[51,159,255],core:[211,246,255],phase:.7},
 plasma_rose:{base:[29,5,33],cloud:[94,18,83],light:[248,55,160],core:[255,222,247],phase:2.4},
 lava_core:{base:[24,8,5],cloud:[51,13,5],light:[255,77,8],core:[255,229,137],phase:1.3},
 glacial:{base:[12,43,63],cloud:[27,81,100],light:[94,211,236],core:[230,255,255],phase:3.7},
 emerald_arc:{base:[4,26,24],cloud:[12,77,51],light:[36,231,143],core:[217,255,232],phase:5.1}
};
const referenceMaterials=new Map();
function skinHash(x,y=0){const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n)}
function skinNoise(x,y){const ix=Math.floor(x),iy=Math.floor(y),sx=x-ix,sy=y-iy,u=sx*sx*(3-2*sx),v=sy*sy*(3-2*sy);return (skinHash(ix,iy)*(1-u)+skinHash(ix+1,iy)*u)*(1-v)+(skinHash(ix,iy+1)*(1-u)+skinHash(ix+1,iy+1)*u)*v}
function skinTexture(id,color){
 if(id.startsWith("flag_"))return countryTexture(id.slice(5));
 const key=id+color;if(referenceMaterials.has(key))return referenceMaterials.get(key);
 if(typeof VIDEO_SKIN_PAINT!=='undefined'&&VIDEO_SKIN_PAINT[id]){const t=videoSkinTexture(id);referenceMaterials.set(key,t);return t}
 if(typeof STATIC_TEXTURE_BUILD==='undefined'){
  const fallback=document.createElement('canvas');fallback.width=768;fallback.height=128;
  const f=fallback.getContext('2d'),shade=f.createLinearGradient(0,0,0,128);shade.addColorStop(0,'#111c23');shade.addColorStop(.35,color||'#79cba6');shade.addColorStop(1,'#111c23');f.fillStyle=shade;f.fillRect(0,0,768,128);referenceMaterials.set(key,fallback);
  // Decode off the main thread so a newly seen skin does not stall a frame.
  const img=new Image();img.onload=()=>{const ready=bmp=>{referenceMaterials.set(key,bmp);refresh()};if(typeof createImageBitmap==='function')createImageBitmap(img).then(ready,()=>ready(img));else ready(img)};
  const refresh=()=>{if(typeof previewSnake==='function')for(const c of document.querySelectorAll('canvas[data-skin]'))if(c.dataset.skin===id){const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);previewSnake(g,id,c.width,c.height)}};img.src='skins/'+id+(id==='neon'?'-'+color.slice(1):'')+'.png?v=31';return fallback;
 }
 const c=document.createElement('canvas');c.width=1536;c.height=256;const g=c.getContext('2d'),W=768,H=128;g.scale(2,2);
 const fill=(c,x=0,y=0,w=W,h=H)=>{g.fillStyle=c;g.fillRect(x,y,w,h)};
 const line=(points,c,w=1)=>{g.strokeStyle=c;g.lineWidth=w;g.beginPath();points.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke()};
 const oval=(x,y,rx,ry,c)=>{g.fillStyle=c;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()};
 const glow=(x,y,r,c)=>{const a=g.createRadialGradient(x,y,0,x,y,r);a.addColorStop(0,c);a.addColorStop(1,'#0000');g.fillStyle=a;g.fillRect(x-r,y-r,r*2,r*2)};
 const rect=(x,y,w,h,r,c,edge)=>{g.beginPath();g.roundRect(x,y,w,h,r);g.fillStyle=c;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=1.4;g.stroke()}};
 const scales=(base,light,dark,size=16)=>{fill(base);for(let y=-size;y<144;y+=size*.76)for(let x=-size;x<784;x+=size){const xx=x+(Math.round(y/(size*.76))%2)*size*.5;const a=g.createLinearGradient(xx,y,xx+size*.3,y+size);a.addColorStop(0,light);a.addColorStop(.4,base);a.addColorStop(1,dark);g.fillStyle=a;g.beginPath();g.moveTo(xx,y);g.quadraticCurveTo(xx+size*.65,y-size*.15,xx+size,y+size*.2);g.quadraticCurveTo(xx+size*.9,y+size*.8,xx+size*.5,y+size);g.quadraticCurveTo(xx+size*.05,y+size*.65,xx,y);g.fill();g.strokeStyle=dark;g.lineWidth=1.2;g.stroke();line([[xx+2,y+1],[xx+size*.55,y+2],[xx+size*.8,y+size*.2]],light,.8)}};
 fill(color||'#236850');
 if(id==='hw_pumpkin'){
  scales('#163b26','#729647','#071b16',20);
  for(let x=48;x<W;x+=96){const a=g.createRadialGradient(x-10,44,2,x,64,48);a.addColorStop(0,'#ffe389');a.addColorStop(.32,'#f99723');a.addColorStop(.76,'#b8470e');a.addColorStop(1,'#471b0c');oval(x,64,37,48,a);for(let j=-2;j<=2;j++){g.beginPath();g.ellipse(x+j*9,64,11,44,0,-Math.PI/2,Math.PI/2);g.strokeStyle='#63240677';g.lineWidth=2;g.stroke()}line([[x-9,43],[x-18,55],[x-3,55],[x-9,43]],'#ffe790',3);line([[x+12,43],[x+3,55],[x+19,55],[x+12,43]],'#ffe790',3);line([[x-17,74],[x-9,83],[x-2,76],[x+6,84],[x+17,73]],'#ffe69e',4);}
 }else if(id==='hw_ghost'){
  fill('#629ba9');for(let lane=0;lane<6;lane++){const ps=[];for(let x=0;x<=W;x+=2)ps.push([x,12+lane*22+Math.sin(x*Math.PI/96+lane)*14]);line(ps,lane%2?'#ecffff90':'#bee9f5aa',16)}
  for(let x=40;x<W;x+=96){glow(x,62,42,'#edffff90');g.fillStyle='#e6fffb';g.beginPath();g.moveTo(x-19,78);g.bezierCurveTo(x-29,25,x+27,25,x+20,78);g.lineTo(x+10,70);g.lineTo(x+2,82);g.lineTo(x-7,72);g.closePath();g.fill();oval(x-6,54,3,5,'#335175');oval(x+7,54,3,5,'#335175');oval(x+1,68,3,4,'#527a90');}
 }else if(id==='hw_mummy'){
  fill('#332a25');for(let x=-100;x<W+100;x+=34){g.save();g.translate(x,64);g.rotate(-.24);const a=g.createLinearGradient(-14,0,17,0);a.addColorStop(0,'#73654c');a.addColorStop(.15,'#ddcda0');a.addColorStop(.5,'#eddfb8');a.addColorStop(1,'#9b8c6b');rect(-15,-85,31,170,2,a,'#504536');for(let j=-12;j<15;j+=3)line([[j,-85],[j,85]],'#766c5128',.7);line([[-13,-85],[-13,85]],'#fff4cf99',1);g.restore()}
  for(let i=0;i<170;i++){const x=skinHash(i,4)*W,y=skinHash(i,8)*H;line([[x,y],[x+4,y+1]],'#564a3433',.7)}for(let x=60;x<W;x+=192){rect(x,48,28,31,3,'#292b23');glow(x+14,64,15,'#8ed03966');oval(x+8,64,3,6,'#d7fc6d');oval(x+21,64,3,6,'#d7fc6d');}
 }else if(id==='hw_vampire'){
  fill('#280b20');for(let lane=0;lane<5;lane++){const ps=[];for(let x=0;x<=W;x+=3)ps.push([x,8+lane*28+Math.sin(x*Math.PI/48)*7]);line(ps,'#8a1f4377',13);line(ps,'#ee76913a',1)}
  for(let x=48;x<W;x+=96){g.fillStyle='#0d1220';g.beginPath();g.moveTo(x,66);g.bezierCurveTo(x-14,24,x-29,35,x-40,28);g.lineTo(x-27,58);g.lineTo(x-17,53);g.lineTo(x-10,70);g.lineTo(x,75);g.lineTo(x+10,70);g.lineTo(x+17,53);g.lineTo(x+27,58);g.lineTo(x+40,28);g.bezierCurveTo(x+29,35,x+14,24,x,66);g.fill();g.strokeStyle='#df8a9a88';g.lineWidth=1;g.stroke();const a=g.createRadialGradient(x-2,57,1,x,64,12);a.addColorStop(0,'#ffebeb');a.addColorStop(.3,'#ec3864');a.addColorStop(1,'#5c0724');oval(x,64,8,12,a)}
 }else if(id==='hw_spider'){
  fill('#21112f');for(let x=48;x<W;x+=128){glow(x,64,66,'#8447b24a');for(let j=0;j<12;j++){const a=j*Math.PI/6;line([[x,64],[x+Math.cos(a)*74,64+Math.sin(a)*74]],'#c4b4e480',.8)}for(let r=14;r<75;r+=14){const ps=[];for(let j=0;j<=12;j++){const a=j*Math.PI/6;ps.push([x+Math.cos(a)*r,64+Math.sin(a)*r])}line(ps,'#e0d1ff88',.8)}for(const side of [-1,1])for(let j=0;j<4;j++)line([[x,61+j*3],[x+side*(14+j*2),48+j*8],[x+side*(27+j*2),43+j*13]],'#0d091b',3);oval(x,70,12,16,'#0b0a18');oval(x,53,8,8,'#171326');oval(x-4,65,4,6,'#baa6d044');line([[x-5,65],[x+5,65],[x-5,76],[x+5,76],[x-5,65]],'#ff4569',2);oval(x-3,51,1.6,1.6,'#ff918d');oval(x+3,51,1.6,1.6,'#ff918d')}
 }else if(ENERGY_MATERIALS[id]){drawEnergyMaterial(g,id,W,H);
 }else if(id==='copper'){
  scales('#80512c','#efc78a','#291f1a',20);
  for(let x=48;x<W;x+=96){
   oval(x,64,42,42,'#231e1b');oval(x,64,37,37,'#d59b56');oval(x,64,30,30,'#5d3b25');
   for(let j=0;j<12;j++){g.save();g.translate(x,64);g.rotate(j*Math.PI/6);rect(-4,-41,8,14,2,'#d6a565','#ffe0a0');g.restore()}
   oval(x,64,24,24,'#162e33');for(let j=0;j<6;j++){const a=j*Math.PI/3;line([[x+Math.cos(a)*9,64+Math.sin(a)*9],[x+Math.cos(a)*27,64+Math.sin(a)*27]],'#e6b66d',5)}
   oval(x,64,10,10,'#fad19a');oval(x,64,5,5,'#557f83');glow(x-3,60,8,'#b8fffca0');
  }
 }else if(id==='shark'){
  const a=g.createLinearGradient(0,0,0,H);a.addColorStop(0,'#102736');a.addColorStop(.3,'#508da4');a.addColorStop(.56,'#90bdc5');a.addColorStop(1,'#f0e9cf');fill(a);
  for(let i=0;i<1700;i++){const x=skinHash(i,2)*W,y=skinHash(i,4)*H;oval(x,y,.6,.6,'#d5f7f51c')}
  for(let x=0;x<W;x+=64){g.fillStyle='#183b50';g.beginPath();g.moveTo(x,0);g.bezierCurveTo(x+32,25,x+15,46,x+34,70);g.bezierCurveTo(x+5,51,x+16,22,x-12,0);g.fill();for(let j=0;j<3;j++)line([[x+36+j*6,67],[x+31+j*6,83]],'#40697688',2)}
 }else if(id==='chrome'){
  const a=g.createLinearGradient(0,0,0,H);for(const [t,c] of [[0,'#152536'],[.18,'#50768c'],[.29,'#f1ffff'],[.36,'#ffffff'],[.43,'#7eabbf'],[.52,'#162f45'],[.7,'#82a7c0'],[.83,'#d8e5ed'],[1,'#233847']])a.addColorStop(t,c);fill(a);
  for(let lane=0;lane<4;lane++){const ps=[];for(let x=0;x<=W;x+=2)ps.push([x,25+lane*22+Math.sin(x*Math.PI/128+lane)*8]);line(ps,lane%2?'#071b3855':'#e4ffff99',4);line(ps,'#d4f6ff55',1)}
 }else if(id==='ruby'){
  scales('#a5113e','#ffb2c0','#290d29',26);
  for(let x=32;x<W;x+=64){g.beginPath();g.moveTo(x-25,64);g.lineTo(x,27);g.lineTo(x+25,64);g.lineTo(x,101);g.closePath();const a=g.createLinearGradient(x-25,27,x+25,101);a.addColorStop(0,'#ffdbe8');a.addColorStop(.23,'#f66088');a.addColorStop(.5,'#bd124c');a.addColorStop(1,'#470b35');g.fillStyle=a;g.fill();g.strokeStyle='#ffc4d6';g.lineWidth=1;g.stroke();line([[x,27],[x-7,64],[x,101]],'#ff85b0',2);line([[x-25,64],[x-7,64],[x+25,64]],'#ffb5cb',1);glow(x-5,52,12,'#ffc0e155')}
 }else if(id==='jellyfish'){
  fill('#091c39');for(let x=48;x<W;x+=128){glow(x,57,57,'#5651b580');
   for(let j=0;j<7;j++){const ps=[];for(let t=0;t<40;t++)ps.push([x-19+j*6+Math.sin(t*.12+j)*6,60+t]);line(ps,j%2?'#53dff6aa':'#e89effaa',2);line(ps,'#e5ffff77',.6)}
   const a=g.createRadialGradient(x-8,38,1,x,48,28);a.addColorStop(0,'#f5e7ff');a.addColorStop(.25,'#b79cff');a.addColorStop(.7,'#6554bdaa');a.addColorStop(1,'#52e2f390');g.fillStyle=a;g.beginPath();g.ellipse(x,52,28,24,0,Math.PI,Math.PI*2);g.quadraticCurveTo(x+16,66,x,60);g.quadraticCurveTo(x-16,66,x-28,52);g.fill();g.strokeStyle='#bcefff';g.lineWidth=1;g.stroke();oval(x-9,38,8,3,'#fff9');
  }for(let i=0;i<60;i++)oval(skinHash(i,1)*W,skinHash(i,7)*H,1,1,'#bdf4ff90');
 }else if(id==='opal'){
  fill('#467f9a');for(let x=-40;x<W+80;x+=40){glow(x,50+Math.sin(x*.035)*28,66,['#bafff4dd','#ffd4f2bb','#b5baffcc','#fff4b7aa'][Math.abs(Math.round(x/40))%4]);}for(let lane=0;lane<4;lane++){const ps=[];for(let x=0;x<W;x+=3)ps.push([x,20+lane*26+Math.sin(x*.03+lane)*9]);line(ps,'#dfffff50',2)}for(let i=0;i<150;i++)oval(skinHash(i,2)*W,skinHash(i,3)*H,.8,.8,'#ffffffaa');
 }else if(id==='prism'){
  fill('#15374b');for(let y=-24;y<150;y+=24)for(let x=-30;x<W+30;x+=36){const xx=x+(Math.round(y/24)%2)*18,hue=(x*.65+y*2)%360;const a=g.createLinearGradient(xx,y,xx+36,y+30);a.addColorStop(0,`hsl(${hue},85%,88%)`);a.addColorStop(.35,`hsl(${hue+45},75%,60%)`);a.addColorStop(1,`hsl(${hue+100},65%,24%)`);g.fillStyle=a;g.beginPath();g.moveTo(xx,y+12);g.lineTo(xx+18,y);g.lineTo(xx+36,y+12);g.lineTo(xx+28,y+31);g.lineTo(xx+8,y+31);g.closePath();g.fill();g.strokeStyle='#d9ffff88';g.lineWidth=.8;g.stroke();if(id==='prism')line([[xx+18,y],[xx+21,y+19],[xx+8,y+31]],'#ffffffb0',1.2);else glow(xx+15,y+12,18,'#fcffff60');}
 }else if(id==='obsidian'){
  fill('#14141f');for(let y=-15;y<145;y+=28)for(let x=-20;x<W+30;x+=45){const xx=x+Math.sin(y)*14;g.fillStyle=['#1f2335','#313344','#111725'][Math.abs(Math.round(x+y))%3];g.beginPath();g.moveTo(xx,y);g.lineTo(xx+36,y-6);g.lineTo(xx+50,y+21);g.lineTo(xx+17,y+33);g.closePath();g.fill();g.strokeStyle='#ae7d35';g.lineWidth=2;g.stroke();line([[xx,y],[xx+36,y-6],[xx+50,y+21]],'#ffe0a0',.7)}
 }else if(id==='koi'){
  scales('#ece5d4','#ffffff','#b7afa0',12);for(let i=0;i<58;i++){const x=skinHash(i,1)*W,y=skinHash(i,2)*128;g.save();g.translate(x,y);g.rotate(skinHash(i,4)*6);oval(0,0,12+skinHash(i,5)*24,8+skinHash(i,8)*13,i%3?'#e54b22':'#151d27');oval(-4,-3,7,3,'#ffffff15');g.restore()}
 }else if(id==='circuit'){
  fill('#072c2b');for(let x=0;x<W;x+=96){rect(x+27,34,42,60,7,'#10202b','#5ec2b6');for(let k=0;k<4;k++)for(const side of [-1,1]){const y=42+k*14;line([[x+48+side*22,y],[x+48+side*32,y],[x+48+side*40,y+(k%2?13:-13)]],'#36dbae',2);oval(x+48+side*40,y+(k%2?13:-13),3,3,'#c0fff1')}rect(x+35,43,26,42,3,'#1b6470','#91ffff');glow(x+48,64,18,'#28fff455');line([[x+37,48],[x+57,48]],'#e4ffff',2)}
 }else if(['lava','lightning','galaxy','nebula','aurora','frost'].includes(id)){
  fill('#090c19');const im=g.getImageData(0,0,W,H);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const n=skinNoise(x/25,y/17)*.55+skinNoise(x/8,y/6)*.3+skinNoise(x/3,y/3)*.15;
   const ridge=Math.pow(Math.max(0,1-Math.abs(n-.51)*7),5),k=(y*W+x)*4;let rgb;
   if(id==='lava')rgb=[30+ridge*210,8+ridge*104,3+ridge*18];
   else if(id==='frost')rgb=[12+ridge*92,57+ridge*132,63+ridge*145];
   else if(id==='aurora')rgb=[9+n*23,25+ridge*138,44+ridge*99];
   else if(id==='galaxy')rgb=[8+n*17+ridge*14,18+n*30+ridge*30,42+n*75+ridge*67];
   else rgb=[12+n*40+ridge*30,8+n*25+ridge*20,30+n*65+ridge*58];
   for(let j=0;j<3;j++)im.data[k+j]=rgb[j];
  }const noiseCanvas=document.createElement('canvas');noiseCanvas.width=W;noiseCanvas.height=H;noiseCanvas.getContext('2d').putImageData(im,0,0);g.drawImage(noiseCanvas,0,0);
  if(id==='lava'||id==='lightning'||id==='frost'){
   for(let lane=(id==='lightning'?0:-1);lane<=(id==='lightning'?0:1);lane++){
    const ps=[];for(let x=-5;x<780;x+=3)ps.push([x,64+lane*24+Math.sin(x*.034+lane)*11+(skinNoise(x*.12,lane+5)-.5)*23]);
    const colors=id==='lava'?['#ff420030','#ff751570','#ffc354','#fff2bf']:id==='frost'?['#35e5d830','#6ce5e070','#c7fffc','#ffffff']:['#933bdf30','#bd63ff70','#e8b6ff','#fff1ff'];
    [18,8,3,1.2].forEach((w,i)=>line(ps,colors[i],w));
    for(let j=4;j<ps.length-10;j+=8){const [x,y]=ps[j],side=j%3?1:-1;line([[x,y],[x+5,y+side*9],[x+1,y+side*19],[x+14,y+side*27]],colors[2],1)}
   }
  }else{
   for(let x=55;x<W+60;x+=150){for(let arm=0;arm<2;arm++){const ps=[];for(let j=0;j<100;j++){const a=j*.095+arm*Math.PI,r=j*.53;ps.push([x+Math.cos(a)*r*1.3,64+Math.sin(a)*r*.65])}line(ps,id==='aurora'?'#37e8b51a':'#6a8aff24',15);line(ps,id==='aurora'?'#65ffd14a':'#a5b6ff55',4)}glow(x,64,24,id==='nebula'?'#dd9effcc':'#b6eaffee');oval(x,64,2,2,'#fff')}
   for(let i=0;i<280;i++){const x=skinHash(i,5)*W,y=skinHash(i,9)*128;oval(x,y,i%19?.6:1.6,i%19?.6:1.6,i%5?'#d8eaff':'#b67bf8')}
  }
 }else if(['goldscale','dragon','pearl','neon'].includes(id)){
  const p=id==='goldscale'?['#bc8b29','#ffe6a0','#4a2a0d']:id==='dragon'?['#b83218','#ffb34e','#390a0b']:id==='pearl'?['#b7dce0','#f0ffff','#6b9ba3']:[color||'#439c4a','#d9ffa2','#183c20'];scales(...p,id==='pearl'?11:18);
  if(id==='neon')for(let x=0;x<W;x+=32)line([[x,64],[x+16,42],[x+32,64],[x+16,86],[x,64]],'#e2ffc2',3);
 }else if(id==='skeleton'){
  fill('#0c141d');for(let x=-10;x<W;x+=22){for(const side of [-1,1]){g.beginPath();g.moveTo(x+4,64+side*3);g.bezierCurveTo(x-11,64+side*12,x-14,64+side*38,x+2,64+side*52);g.strokeStyle='#756f60';g.lineWidth=9;g.stroke();g.strokeStyle='#ddd8c5';g.lineWidth=6;g.stroke();g.strokeStyle='#fff9e7';g.lineWidth=2;g.stroke()}rect(x-5,57,16,14,4,'#f7efd7','#8b8370');line([[x-3,59],[x+8,59]],'#fff',1)}
 }else if(id==='tiger'||id==='leopard'){
  fill('#e59024');const a=g.createLinearGradient(0,0,0,128);a.addColorStop(0,'#a74e10');a.addColorStop(.36,'#ffcf74');a.addColorStop(.5,'#fff3d8');a.addColorStop(.64,'#ffcf74');a.addColorStop(1,'#a74e10');fill(a);
  if(id==='tiger')for(let x=-20;x<W;x+=27)for(const side of [-1,1]){g.fillStyle='#17120e';g.beginPath();g.moveTo(x,64+side*64);g.bezierCurveTo(x+3,64+side*42,x+19,64+side*25,x+9,64+side*5);g.bezierCurveTo(x+32,64+side*20,x+10,64+side*45,x+21,64+side*64);g.fill()}
  else for(let i=0;i<180;i++){const x=skinHash(i)*W,y=skinHash(i,2)*128;g.strokeStyle='#2e1a0c';g.lineWidth=4;g.beginPath();g.ellipse(x,y,6+skinHash(i,4)*4,5+skinHash(i,3)*5,skinHash(i)*3,0,5.5);g.stroke();oval(x,y,3,3,'#a66120')}
 }else if(id==='goldbar'){
  // A visible golden body connects close-fitting bevelled armour plates.
  scales('#c19424','#ffe695','#6d4914',12);
  for(let x=5;x<W;x+=112){const a=g.createLinearGradient(0,13,0,115);a.addColorStop(0,'#9b6917');a.addColorStop(.18,'#fff0a3');a.addColorStop(.4,'#e5b237');a.addColorStop(.64,'#ffe781');a.addColorStop(1,'#946414');rect(x,13,102,102,15,a,'#ffe8a0');rect(x+7,21,88,86,11,'#e7b84255','#fff0af');g.strokeStyle='#9d691b';g.lineWidth=4;g.beginPath();g.arc(x+51,64,20,0,7);g.stroke();g.strokeStyle='#ffe79a';g.lineWidth=1.3;g.stroke();g.beginPath();for(let j=0;j<10;j++){const a=j*Math.PI/5-Math.PI/2,r=j%2?8:17;j?g.lineTo(x+51+Math.cos(a)*r,64+Math.sin(a)*r):g.moveTo(x+51+Math.cos(a)*r,64+Math.sin(a)*r)}g.closePath();g.fillStyle='#bd841e';g.fill();g.strokeStyle='#fff2bb';g.stroke();line([[x+15,30],[x+68,30]],'#fffbd6',2)}
 }else if(id==='ice'||id==='robot'){
  fill('#1d3543');for(let x=-20;x<W;x+=90){fill('#0b1721',x,0,10,128);const a=g.createLinearGradient(0,0,0,128);a.addColorStop(0,'#243a49');a.addColorStop(.3,'#b6d3df');a.addColorStop(.5,'#587b91');a.addColorStop(.74,'#829fac');a.addColorStop(1,'#132939');g.fillStyle=a;g.beginPath();g.moveTo(x+14,14);g.lineTo(x+64,6);g.lineTo(x+83,30);g.lineTo(x+72,64);g.lineTo(x+83,98);g.lineTo(x+64,122);g.lineTo(x+14,114);g.lineTo(x+21,64);g.closePath();g.fill();g.strokeStyle='#bddce6';g.lineWidth=2;g.stroke();line([[x+25,18],[x+32,42],[x+23,64],[x+32,87],[x+25,110]],'#42e5eb',2);glow(x+53,64,25,'#12efff80');oval(x+53,64,15,15,'#193f53');oval(x+53,64,10,10,'#65ffff');oval(x+51,61,5,5,'#d9ffff');for(const y of [22,106])oval(x+57,y,3,3,'#122e3c')}
 }else if(id==='watermelon'){
  fill('#235532');for(let x=0;x<W;x+=22)fill('#6ab638',x,0,10,128);fill('#d9f291',0,20,W,88);fill('#f2646c',0,28,W,72);fill('#ff9295',0,34,W,8);for(let x=9;x<W;x+=22)for(let row=0;row<3;row++){oval(x+row%2*11,46+row*18,2.3,4,'#412c23');oval(x+row%2*11-.6,45+row*18,.6,1,'#eee2aa')}
 }else if(id==='candy'||id==='wrapped'||id==='dna'){
  drawEncasedMaterial(g,id,W,H);
 }else if(id==='bee'||id==='hazard'){
  fill('#131d19');for(let x=0;x<W;x+=id==='bee'?76:150){fill('#f8cf26',x+4,0,id==='bee'?36:124,128);if(id==='hazard'){g.save();g.translate(x+65,64);oval(0,0,9,9,'#1c2821');for(let j=0;j<3;j++){g.beginPath();g.arc(0,0,36,j*2.094,j*2.094+1.05);g.arc(0,0,15,j*2.094+1.05,j*2.094,true);g.closePath();g.fill()}g.restore();}}
  if(id==='bee')for(let i=0;i<1900;i++){const x=skinHash(i)*W,y=skinHash(i,1)*128;line([[x,y],[x+2,y+4]],'#fff4b71c',.7)}
 }else if(id==='mosaic'){
  fill('#113a35');const colors=['#e0bc22','#da4b32','#37a49f','#3488b3','#5baf43'];for(let y=0;y<H;y+=16)for(let x=0;x<W;x+=16){const col=colors[Math.floor(skinHash(x/16,y/16)*5)];rect(x+1,y+1,14,14,1,col,'#162b2922');line([[x+2,y+13],[x+2,y+2],[x+13,y+2]],'#fff7',.7)}
 }else if(id==='mahjong'||id==='slots'){
  fill(id==='slots'?'#652b1f':'#769c80');for(let x=3;x<W;x+=86){rect(x,5,79,118,9,'#e8e8c9','#fffbe1');rect(x+5,12,69,104,5,'#eee8ca',id==='slots'?'#9c241d':'#578d72');g.save();g.translate(x+40,64);g.rotate(Math.PI/2);g.font='bold 39px serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#9b3024';if(id==='slots')g.fillText('7',0,0);else{g.strokeStyle='#a53226';g.lineWidth=3;g.strokeRect(-13,-10,26,17);g.beginPath();g.moveTo(0,-22);g.lineTo(0,22);g.moveTo(-18,-17);g.lineTo(18,-17);g.moveTo(-10,14);g.lineTo(11,14);g.stroke();}g.restore();for(const y of [17,107]){line([[x+13,y],[x+65,y]],'#307d62',3);for(let j=0;j<4;j++)fill('#448666',x+15+j*13,y+3,7,3)}}
 }else if(id==='autumn'){
  fill('#5e2812');for(let i=0;i<130;i++){g.save();g.translate(skinHash(i)*W,skinHash(i,3)*128);g.rotate(skinHash(i,4)*7);g.fillStyle=['#d68022','#a74314','#e8aa3b','#bf571c'][i%4];g.beginPath();g.moveTo(0,-17);g.lineTo(5,-8);g.lineTo(12,-13);g.lineTo(11,-3);g.lineTo(19,-1);g.lineTo(9,6);g.lineTo(10,13);g.lineTo(0,9);g.lineTo(-10,13);g.lineTo(-9,6);g.lineTo(-19,-1);g.lineTo(-11,-3);g.lineTo(-12,-13);g.lineTo(-5,-8);g.closePath();g.fill();line([[0,14],[0,-12]],'#ffcd6260',1);g.restore()}
 }else if(id==='ornament'||id==='racing'){
  fill('#8d2115');for(const y of [12,20,108,116])line([[0,y],[W,y]],'#f5c26f',2);for(let x=0;x<W;x+=18){rect(x,49,12,30,3,'#ae621e','#ffe6a1');rect(x+3,54,6,20,1,'#701e12','#ffeac1');}if(id==='racing')for(let x=0;x<W;x+=145){fill('#1d282a',x,0,12,128);line([[x+2,0],[x+2,128]],'#babca7',2)}
 }else if(id==='festive'){
  fill('#124432');for(let i=0;i<800;i++){const x=skinHash(i)*W,y=20+skinHash(i,2)*88;line([[x,y],[x+7,y-5]],i%2?'#51a16a':'#9baf52',1)}for(let i=0;i<180;i++){const x=skinHash(i,7)*W,y=25+skinHash(i,6)*78;oval(x,y,3,3,i%3?'#df3444':'#f3df78');oval(x-1,y-1,1,1,'#fff2bb')}

 }
 if(id==='aurora'){
  fill('#09252b');for(let band=0;band<5;band++){const ps=[];for(let x=-5;x<780;x+=3)ps.push([x,30+band*15+Math.sin(x*.02+band*.6)*19]);line(ps,['#14ca5f50','#34fbaa70','#73e6ed90','#b5ffeccc','#c493ff66'][band],18-band*2);line(ps,'#d6ffeb65',1.4)}
  for(let i=0;i<100;i++)oval(skinHash(i,4)*W,skinHash(i,8)*H,.7,.7,'#defaff');
 }
 if(id==='nebula'){for(let i=0;i<17;i++){const x=i*49,y=45+Math.sin(i*2.1)*24;glow(x,y,34,i%2?'#cf46f64a':'#3595ef50');}for(let i=0;i<80;i++){const x=skinHash(i,8)*W,y=skinHash(i,9)*H;oval(x,y,1,1,'#f8daff');}}
 if(id==='ice'){
  fill('#164556');for(let y=-20;y<140;y+=30)for(let x=-15;x<W;x+=42){const xx=x+(Math.round(y/30)%2)*21;g.beginPath();g.moveTo(xx,y);g.lineTo(xx+21,y-8);g.lineTo(xx+40,y+8);g.lineTo(xx+30,y+28);g.lineTo(xx+7,y+30);g.closePath();g.fillStyle=['#3c95ab','#76becd','#b2e5ec'][Math.abs(Math.round(x+y))%3];g.fill();g.strokeStyle='#143847';g.lineWidth=3;g.stroke();line([[xx+2,y+1],[xx+20,y-5],[xx+35,y+8]],'#d7ffff',1.6);line([[xx+20,y-5],[xx+22,y+16],[xx+7,y+27]],'#65e7f288',1.5)}
 }
 // Bake cylindrical lighting once, avoiding per-segment gradients on mobile.
 g.save();g.setTransform(1,0,0,1,0,0);const im=g.getImageData(0,0,W*2,H*2);for(let y=0;y<H*2;y++){const v=(y-127.5)/128,round=Math.sqrt(Math.max(0,1-v*v)),shade=.18+.82*Math.pow(round,.7),shine=Math.exp(-Math.pow((v+.34)/.12,2))*.36;for(let x=0;x<W*2;x++){const k=(y*W*2+x)*4;for(let j=0;j<3;j++)im.data[k+j]=Math.min(255,im.data[k+j]*shade+shine*100);im.data[k+3]=255}}g.putImageData(im,0,0);g.restore();
 if(['candy','wrapped','dna','skeleton','jellyfish'].includes(id))finishGlass(g,W,H);
 referenceMaterials.set(key,c);return c;
}
// Periodic fields share identical edge values. Bake the expensive detail once;
// the running game draws these textures with its existing continuous body mesh.
function drawEnergyMaterial(g,id,W,H){
 const p=ENERGY_MATERIALS[id],c=document.createElement('canvas');c.width=W*2;c.height=H*2;const q=c.getContext('2d'),im=q.createImageData(c.width,c.height),TAU=Math.PI*2;
 const wave=(x,y)=>Math.sin(x*TAU/W*7+Math.sin(y*.083+p.phase)*1.8)+.5*Math.sin(x*TAU/W*19-y*.15+p.phase)+.22*Math.sin(x*TAU/W*43+y*.39);
 for(let yy=0;yy<c.height;yy++)for(let xx=0;xx<c.width;xx++){
  const x=xx/2,y=yy/2,t=x*TAU/W,warp=wave(x,y),cloud=.5+.25*Math.sin(t*5+y*.071+warp)+.18*Math.cos(t*13-y*.11+warp),noise=.5+.5*Math.sin(t*97+Math.sin(y*.9)*3)*Math.cos(y*1.1+t*61);
  let d;
  if(id==='glacial')d=Math.min(Math.abs(warp+.35*Math.sin(t*37-y*.24)),Math.abs(wave(x+93,y*1.37+31)))*18;
  else if(id==='lava_core')d=Math.abs(Math.sin(t*10+y*.095+warp*.9))*19;
  else {const vein=64+Math.sin(t*5+p.phase)*13+Math.sin(t*17)*4+Math.sin(t*49)*2;d=Math.min(Math.abs(y-vein),Math.abs(y-(64+Math.sin(t*7-p.phase)*31+Math.sin(t*29)*4)))*.7;d+=Math.abs(warp)*.6;}
  const bloom=Math.exp(-d*.22),hot=Math.exp(-d*d*1.8),crust=id==='lava_core'?.35+.65*noise:1;
  const k=(yy*c.width+xx)*4;for(let j=0;j<3;j++){const body=(p.base[j]+p.cloud[j]*cloud*.7)*crust;im.data[k+j]=Math.min(255,body+p.light[j]*bloom*.55+(p.core[j]-body)*hot*.9)}im.data[k+3]=255;
 }
 q.putImageData(im,0,0);g.drawImage(c,0,0,W,H);
 const stroke=(ps,col,w)=>{g.beginPath();ps.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=col;g.lineWidth=w;g.stroke()};
 if(id!=='lava_core'&&id!=='glacial')for(let lane=0;lane<3;lane++){
  const ps=[];for(let x=0;x<=W;x+=1){const t=x*TAU/W;ps.push([x,64+Math.sin(t*(5+lane*2)+p.phase)* (lane?27:13)+Math.sin(t*31+lane)*3+Math.sin(t*73)*1.2])}
  const rgb=p.light.join(',');stroke(ps,'rgba('+rgb+',.12)',12);stroke(ps,'rgba('+rgb+',.6)',3);stroke(ps,'rgba('+p.core.join(',')+',.95)',.85);
  for(let i=24;i<ps.length-30;i+=47){const [x,y]=ps[i],side=i%2?1:-1;stroke([[x,y],[x+7,y+side*8],[x+3,y+side*16],[x+14,y+side*22]],'rgba('+rgb+',.8)',.8)}
 }
 if(id==='lava_core')for(let i=0;i<160;i++){const x=skinHash(i,8)*W,y=skinHash(i,9)*H;g.fillStyle=i%5?'#ff8e2355':'#fff0b4';g.fillRect(x,y,i%5?1:2,1)}
 if(id==='glacial')for(let i=0;i<110;i++){const x=skinHash(i,3)*W,y=skinHash(i,7)*H;stroke([[x-3,y],[x+3,y]],'#efffff88',.7);stroke([[x,y-3],[x,y+3]],'#efffff88',.7)}
}
// The internal objects are lit independently before the outer glass surface.
function drawEncasedMaterial(g,id,W,H){
 const bg=g.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#07121c');bg.addColorStop(.3,'#224657');bg.addColorStop(.58,'#102a36');bg.addColorStop(1,'#030c13');g.fillStyle=bg;g.fillRect(0,0,W,H);
 const orb=(x,y,r,c)=>{const a=g.createRadialGradient(x-r*.32,y-r*.4,r*.03,x,y,r);a.addColorStop(0,'#ffffff');a.addColorStop(.19,c);a.addColorStop(.64,c);a.addColorStop(1,'#102334');g.fillStyle=a;g.beginPath();g.arc(x,y,r,0,7);g.fill()};
 if(id==='dna'){
  // Back portions first, then transverse base pairs, then the front helix.
  const pos=(x,strand)=>{const t=x*Math.PI/128+strand*Math.PI;return {y:64+Math.sin(t)*34,z:Math.cos(t)}};
  const helix=(front)=>{for(let strand=0;strand<2;strand++)for(let x=-2;x<W;x+=2){const p=pos(x,strand),q=pos(x+2,strand);if((p.z>=0)!==front)continue;g.strokeStyle=front?(strand?'#ff8ad4':'#6deaff'):(strand?'#663c67':'#24526b');g.lineWidth=front?10:6;g.lineCap='round';g.beginPath();g.moveTo(x,p.y);g.lineTo(x+2,q.y);g.stroke();if(front){g.strokeStyle='#e5ffffa0';g.lineWidth=2;g.beginPath();g.moveTo(x,p.y-2);g.lineTo(x+2,q.y-2);g.stroke()}}};
  helix(false);
  for(let x=0;x<W;x+=12){const p=pos(x,0),q=pos(x,1),middle=(p.y+q.y)/2;g.lineWidth=5;g.lineCap='round';for(const [y1,y2,c] of [[p.y,middle,'#5fdac1'],[middle,q.y,'#f4c978']]){g.strokeStyle=c;g.beginPath();g.moveTo(x,y1);g.lineTo(x,y2);g.stroke()}orb(x,p.y,4,p.z>0?'#5eebff':'#23546a');orb(x,q.y,4,q.z>0?'#ffa5df':'#693d65')}
  helix(true);
 }else{
  for(let x=-24;x<W+96;x+=128){
   g.save();g.translate(x+64,64);g.rotate(id==='wrapped'?.12:-.15);
   // Soft contact shadow separates the sweet from the clear outer body.
   const sh=g.createRadialGradient(3,12,4,3,12,58);sh.addColorStop(0,'#000b');sh.addColorStop(1,'#0000');g.fillStyle=sh;g.fillRect(-60,-48,120,112);
   if(id==='wrapped')for(const side of [-1,1]){g.beginPath();g.moveTo(side*32,-12);g.lineTo(side*54,-28);g.lineTo(side*51,0);g.lineTo(side*56,26);g.lineTo(side*32,12);g.closePath();const foil=g.createLinearGradient(0,-28,0,28);foil.addColorStop(0,'#afffd6');foil.addColorStop(.22,'#169367');foil.addColorStop(.44,'#dcfff3');foil.addColorStop(.57,'#34b47a');foil.addColorStop(1,'#073a39');g.fillStyle=foil;g.fill();}
   g.save();g.beginPath();g.roundRect(-37,-32,74,64,24);g.clip();const body=g.createLinearGradient(0,-32,0,32);body.addColorStop(0,'#732746');body.addColorStop(.25,'#ffbad5');body.addColorStop(.5,'#ef487f');body.addColorStop(.8,'#b41b53');body.addColorStop(1,'#481225');g.fillStyle=body;g.fillRect(-40,-33,80,66);
   for(let k=-3;k<4;k++){g.beginPath();g.moveTo(k*24-22,-34);g.bezierCurveTo(k*24+9,-17,k*24-9,17,k*24+22,34);g.strokeStyle=id==='candy'?'#fff4d9':'#c7ed62';g.lineWidth=11;g.stroke();g.strokeStyle='#ffffff77';g.lineWidth=2;g.stroke()}
   const vol=g.createLinearGradient(0,-32,0,32);vol.addColorStop(0,'#13031999');vol.addColorStop(.3,'#ffffff40');vol.addColorStop(.54,'#0000');vol.addColorStop(1,'#12041aba');g.fillStyle=vol;g.fillRect(-40,-33,80,66);g.restore();g.strokeStyle='#ffcfeb99';g.lineWidth=1;g.beginPath();g.roundRect(-37,-32,74,64,24);g.stroke();g.fillStyle='#fff6';g.beginPath();g.ellipse(-12,-17,16,4,-.1,0,7);g.fill();g.restore();
  }
 }
 // Fine suspended bubbles make the transparent material readable at close range.
 for(let i=0;i<32;i++){const x=skinHash(i,2)*W,y=14+skinHash(i,7)*100,r=1+skinHash(i,8)*2;g.strokeStyle='#bceeff40';g.lineWidth=.7;g.beginPath();g.arc(x,y,r,0,7);g.stroke()}
}
function finishGlass(g,W,H){
 const coat=g.createLinearGradient(0,0,0,H);coat.addColorStop(0,'#bdeeff80');coat.addColorStop(.035,'#071522a0');coat.addColorStop(.1,'#81d9ff20');coat.addColorStop(.22,'#ffffff04');coat.addColorStop(.7,'#0000');coat.addColorStop(.91,'#a2eaff22');coat.addColorStop(.97,'#dcffff66');coat.addColorStop(1,'#102d4260');g.fillStyle=coat;g.fillRect(0,0,W,H);
 for(let x=-30;x<W;x+=160){g.fillStyle='#f0ffff50';g.beginPath();g.roundRect(x,21,102,5,3);g.fill();g.fillStyle='#fff9';g.beginPath();g.roundRect(x+8,22,66,1.7,1);g.fill();}
}
// Local flag images are loaded once, then baked onto the cylindrical body.
function countryTexture(code){
 const key='flag_'+code;if(referenceMaterials.has(key))return referenceMaterials.get(key);
 const c=document.createElement('canvas');c.width=1536;c.height=256;const g=c.getContext('2d');g.fillStyle='#334651';g.fillRect(0,0,c.width,c.height);referenceMaterials.set(key,c);
 // Venezuela-style flag body (video-look.js): stripes along the body, emblem as stars/dots.
 if(code==='ve'){flagStyleTexture('ve',null,c);return c}
 const img=new Image();img.onload=()=>{g.clearRect(0,0,c.width,c.height);try{flagStyleTexture(code,img,c)}catch(e){const tile=384;for(let x=0;x<c.width;x+=tile)g.drawImage(img,x,0,tile,c.height)}if(typeof drawSkin==='function')drawSkin()};img.src='flags/'+code+'.png';return c;
}
function originalPath(g,ps){g.beginPath();ps.forEach((p,i)=>i?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y))}
// Visible world rectangle set by render(); body pieces outside it are skipped.
let snakeView=null;
// Reused scratch buffers so drawing a snake allocates nothing per frame.
let snakeBuf={idx:new Int32Array(1024),arc:new Float32Array(1024),nx:new Float32Array(1024),ny:new Float32Array(1024),sp:new Float32Array(1024),sm:new Float32Array(1024),pts:[]};
function snakeBuffers(n){if(snakeBuf.idx.length<n){const m=Math.max(n,snakeBuf.idx.length*2);snakeBuf={idx:new Int32Array(m),arc:new Float32Array(m),nx:new Float32Array(m),ny:new Float32Array(m),sp:new Float32Array(m),sm:new Float32Array(m),pts:snakeBuf.pts}}return snakeBuf}
const SKIN_GLINT=new Set(['galaxy','nebula','pearl','ice','robot','goldscale','opal','prism','obsidian','circuit','chrome','ruby','jellyfish','copper']);
const jointCache=new WeakMap();
function bodyJoint(tex,u){
 let cache=jointCache.get(tex);if(!cache){cache=new Map();jointCache.set(tex,cache)}
 const phase=((Math.round(u/48)%16)+16)%16;if(cache.has(phase))return cache.get(phase);
 const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d'),scale=tex.width/768,center=phase*48;
 g.beginPath();g.arc(64,64,64,0,Math.PI*2);g.clip();
 for(let at=0;at<128;){const x=((center-64+at)%768+768)%768,w=Math.min(128-at,768-x);g.drawImage(tex,x*scale,0,w*scale,tex.height,at,0,w,128);at+=w}
 cache.set(phase,c);return c;
}
function drawOriginalSnake(g,s,alpha=1){
 const raw=s.points,n=raw.length;if(n<2)return;const B=snakeBuffers(n+1),pts=B.pts,arc=B.arc,previous=s.previousPoints?.length===n?s.previousPoints:null;
 const blend=typeof renderAlpha==='number'&&typeof mode!=='undefined'&&mode==='play'&&!paused?renderAlpha:1;
 const r=(s.previousRadius??s.radius)+(s.radius-(s.previousRadius??s.radius))*blend;
 const quality=typeof qualityMode==='string'?qualityMode:'balanced',step=Math.max(7,r*(quality==='high'?.45:quality==='low'?.95:.7)),step2=step*step;
 let m=0,lx=Infinity,ly=Infinity;
 for(let i=0;i<n;i++){const q=raw[i],old=previous?.[i],x=old?old.x+(q.x-old.x)*blend:q.x,y=old?old.y+(q.y-old.y)*blend:q.y;if(i&&i<n-1&&(x-lx)**2+(y-ly)**2<step2)continue;let p=pts[m];if(!p)p=pts[m]={x,y};else{p.x=x;p.y=y}arc[m]=m?arc[m-1]+Math.hypot(x-lx,y-ly):0;lx=x;ly=y;m++}
 if(m<2)return;
 const tex=skinTexture(s.skin,s.color),scale=128/(r*2),sourceScale=tex.width/768,v=snakeView,pad=r+16;
 const off=(p,q)=>v&&((p.x<v.l-pad&&q.x<v.l-pad)||(p.x>v.r+pad&&q.x>v.r+pad)||(p.y<v.t-pad&&q.y<v.t-pad)||(p.y>v.b+pad&&q.y>v.b+pad));
 g.save();g.globalAlpha=1;g.lineCap='round';g.lineJoin='round';g.strokeStyle='#030810';g.lineWidth=r*2+1;g.beginPath();
 for(let k=1,pen=false;k<m;k++){const p=pts[k-1],q=pts[k];if(off(p,q)){pen=false;continue}if(!pen){g.moveTo(p.x,p.y);pen=true}g.lineTo(q.x,q.y)}g.stroke();
 for(let k=m-1;k>0;k--){const p=pts[k-1],q=pts[k];if(off(p,q))continue;const dx=q.x-p.x,dy=q.y-p.y,len=Math.hypot(dx,dy);if(len<1e-5)continue;
  const a=Math.atan2(dy,dx),u=64+arc[k]*scale;g.save();g.translate(q.x,q.y);g.rotate(a);g.drawImage(bodyJoint(tex,u),-r,-r,r*2,r*2);g.restore();
  g.save();g.translate(p.x,p.y);g.rotate(a);let at=0;while(at<len){const u=((64+(arc[k-1]+at)*scale)%768+768)%768,w=Math.min((len-at)*scale,768-u),world=w/scale;if(w<1e-5)break;g.drawImage(tex,u*sourceScale,0,w*sourceScale,tex.height,at-.3,-r,world+.6,r*2);at+=world}g.restore();
 }
 const head=pts[0],a=(s.previousA??s.a)+Math.atan2(Math.sin((s.a||0)-(s.previousA??s.a??0)),Math.cos((s.a||0)-(s.previousA??s.a??0)))*blend;
 g.save();g.translate(head.x,head.y);g.rotate(Math.atan2(pts[1].y-head.y,pts[1].x-head.x));g.drawImage(bodyJoint(tex,64),-r,-r,r*2,r*2);g.restore();
 s.renderX=head.x;s.renderY=head.y;s.renderRadius=r;
 if(s.grace>0&&s.id!==undefined){g.strokeStyle='#d9ffee';g.lineWidth=1.6;g.setLineDash([5,7]);g.beginPath();g.arc(head.x,head.y,r+6,0,Math.PI*2);g.stroke();g.setLineDash([])}
 g.globalAlpha=alpha;if(s.skin==='hw_pumpkin'||s.skin==='hw_ghost')drawHalloweenHead(g,s.skin,head.x,head.y,a||0,r);else if(headSprite(s.skin))drawSpriteHead(g,s.skin,head.x,head.y,a||0,r);else{eyes(g,head.x,head.y,a||0,r*1.24);if(s.skin==='hw_vampire')drawVampireFangs(g,head.x,head.y,a||0,r)}g.restore();
}

// Decorative heads are cached once, then rotated with the snake heading.
const halloweenHeads=new Map();
function drawHalloweenHead(g,id,x,y,a,r){
 if(!halloweenHeads.has(id)){
  const c=document.createElement('canvas');c.width=192;c.height=192;const h=c.getContext('2d');h.translate(96,96);h.scale(2,2);
  const oval=(x,y,rx,ry,color)=>{h.fillStyle=color;h.beginPath();h.ellipse(x,y,rx,ry,0,0,7);h.fill()};
  if(id==='hw_pumpkin'){
   h.strokeStyle='#68894a';h.lineWidth=5;h.lineCap='round';h.beginPath();h.moveTo(-17,-21);h.quadraticCurveTo(-29,-34,-20,-38);h.stroke();
   const body=h.createRadialGradient(-12,-15,1,0,0,36);body.addColorStop(0,'#ffe59b');body.addColorStop(.32,'#ffa52c');body.addColorStop(.7,'#d7680b');body.addColorStop(1,'#632606');oval(0,0,32,30,body);
   for(let k=-2;k<=2;k++){h.beginPath();h.ellipse(k*8,0,12,28,0,-Math.PI/2,Math.PI/2);h.strokeStyle='#80300c88';h.lineWidth=1.5;h.stroke()}
   // Face is oriented toward +x, the direction of travel.
   h.shadowColor='#ffba20';h.shadowBlur=8;h.fillStyle='#fff29e';for(const side of [-1,1]){h.beginPath();h.moveTo(2,side*7);h.lineTo(5,side*21);h.lineTo(17,side*12);h.closePath();h.fill()}
   h.beginPath();h.moveTo(19,-16);h.lineTo(25,-10);h.lineTo(21,-6);h.lineTo(28,-1);h.lineTo(22,5);h.lineTo(25,10);h.lineTo(19,16);h.lineTo(18,9);h.lineTo(20,4);h.lineTo(17,-2);h.closePath();h.fill();
  }else{
   const body=h.createRadialGradient(-5,-10,1,0,0,35);body.addColorStop(0,'#ffffff');body.addColorStop(.6,'#dcfff9');body.addColorStop(1,'#81c8d5');h.fillStyle=body;h.beginPath();h.moveTo(-29,-21);h.bezierCurveTo(8,-44,36,-20,29,0);h.bezierCurveTo(36,20,8,44,-29,21);h.lineTo(-19,12);h.lineTo(-31,3);h.lineTo(-21,-7);h.closePath();h.fill();oval(10,-11,5,7,'#233c60');oval(10,11,5,7,'#233c60');oval(23,0,4,5,'#416a85');oval(9,-13,1.5,2,'#c5f9ff');oval(9,9,1.5,2,'#c5f9ff');
  }halloweenHeads.set(id,c);
 }
 g.save();g.translate(x,y);g.rotate(a);g.drawImage(halloweenHeads.get(id),-r*1.8,-r*1.8,r*3.6,r*3.6);g.restore();
}
// Painted heads (skins/<id>_head.png): snout faces +x, image height = head width across.
// size: head width in body radii; nose: how far it reaches ahead of the head point (default: centred, like the pumpkin).
const SPRITE_HEADS={la_quetzal:{},la_calavera:{},la_inti:{},la_jaguar:{},la_hummingbird:{},la_tango:{},la_maya:{},la_carnival:{},la_turpial:{},la_orchid:{},la_diablos:{},la_arepa:{}};
const headSprites=new Map();
function headSprite(id){const cfg=SPRITE_HEADS[id];if(!cfg)return null;let h=headSprites.get(id);
 if(!h){h={ready:false,img:null};headSprites.set(id,h);const img=new Image();img.onload=()=>{const done=b=>{h.img=b;h.ready=true;if(typeof previewSnake==='function')for(const c of document.querySelectorAll('canvas[data-skin]'))if(c.dataset.skin===id){const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);previewSnake(g,id,c.width,c.height)}};if(typeof createImageBitmap==='function')createImageBitmap(img).then(done,()=>done(img));else done(img)};img.src='skins/'+id+'_head.png?v=3'}
 return h.ready?h:null}
function drawSpriteHead(g,id,x,y,a,r){const h=headSprites.get(id),cfg=SPRITE_HEADS[id],H=r*(cfg.size||2.6),W=H*h.img.width/h.img.height,nose=cfg.nose!=null?r*cfg.nose:W/2;
 g.save();g.translate(x,y);g.rotate(a);g.drawImage(h.img,nose-W,-H/2,W,H);g.restore()}
function drawVampireFangs(g,x,y,a,r){g.save();g.translate(x,y);g.rotate(a);g.fillStyle='#fbf6df';for(const side of [-1,1]){g.beginPath();g.moveTo(r*.73,side*r*.23);g.lineTo(r*1.14,side*r*.27);g.lineTo(r*.76,side*r*.43);g.closePath();g.fill()}g.restore()}
