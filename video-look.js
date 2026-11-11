'use strict';
// Snake materials copied from the reference video (1.mp4).
// Texture layout matches mystake-art.js: 768×128 strip, x = along the body, y = across it.
const VIDEO_SKINS=[
 {id:'v_vzla',name:'Венесуэла',color:'#f5d000',group:'video'},
 // Rival skins generated with the generator from video frames (generation/skins_video.py -> skins/vb_*.png).
 {id:'vb_leo',name:'Леопард',color:'#e0a040',group:'video'},
 {id:'vb_teal',name:'Бирюзовый меандр',color:'#2a9a80',group:'video'},
 {id:'vb_pink',name:'Малиновая вязка',color:'#c8204e',group:'video'},
 {id:'vb_corn',name:'Золотая вязка',color:'#d8a040',group:'video'},
 {id:'vb_rainbow',name:'Радужная чешуя',color:'#c050c0',group:'video'},
 {id:'vb_tiger',name:'Тигровая',color:'#e8d020',group:'video'},
 {id:'vb_green',name:'Зелёная сетка',color:'#2f9a4a',group:'video'},
 {id:'vb_eyes',name:'Глазастая',color:'#c06a28',group:'video'},
 {id:'vb_sky',name:'Небесная',color:'#a9d4ec',group:'video'}
];
function videoHash(a,b=0){const n=Math.sin(a*127.1+b*311.7)*43758.5453;return n-Math.floor(n)}
const VIDEO_SKIN_PAINT={
 v_vzla(g,W,H){
  const band=H/3,cols=['#f7d100','#1f3fd0','#e3132b'];
  cols.forEach((c,i)=>{g.fillStyle=c;g.fillRect(0,i*band,W,band+1)});
  // Small scale teeth along both colour borders, like the video.
  for(let k=1;k<3;k++){const y=k*band;g.fillStyle=cols[k-1];g.beginPath();for(let x=0;x<W;x+=6){g.moveTo(x,y-.5);g.lineTo(x+3,y+3);g.lineTo(x+6,y-.5)}g.fill()}
  // White stars scattered along the blue band in two staggered rows.
  const star=(x,y,r)=>{g.beginPath();for(let j=0;j<10;j++){const a=-Math.PI/2+j*Math.PI/5,rr=j%2?r*.42:r;j?g.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):g.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr)}g.closePath();g.fill()};
  g.fillStyle='#ffffff';for(let row=0;row<2;row++)for(let x=row*19;x<W;x+=38){const jx=(videoHash(x,row)-.5)*8,jy=(videoHash(x,row+5)-.5)*5;star(x+jx,band+band*(row?.68:.32)+jy,4)}
 },
 v_knit_green(g,W,H){videoMesh(g,W,H,'#3fae4a','#0f4a1e','#8fe07a')},
 v_knit_tan(g,W,H){videoMesh(g,W,H,'#d7a35c','#7a4f22','#f5d496')},
 v_knit_orange(g,W,H){videoMesh(g,W,H,'#e0702a','#5a1f0b','#ffb070')},
 v_knit_teal(g,W,H){videoMesh(g,W,H,'#1f8f7a','#0a3a33','#5fd0b6')},
 v_leopard(g,W,H){
  g.fillStyle='#d39a4f';g.fillRect(0,0,W,H);
  for(let i=0;i<420;i++){const x=videoHash(i,1)*W,y=videoHash(i,2)*H,r=2.4+videoHash(i,3)*2.8;g.fillStyle='#3a2010';g.beginPath();g.ellipse(x,y,r*1.2,r,videoHash(i,4)*3,0,7);g.fill();g.fillStyle='#9a5a22';g.beginPath();g.ellipse(x,y,r*.5,r*.4,0,0,7);g.fill()}
 },
 v_ocelot(g,W,H){
  g.fillStyle='#9a5a24';g.fillRect(0,0,W,H);
  for(let i=0;i<70;i++){const x=(i%35)*22+(i<35?0:11),y=i<35?40:88;g.save();g.translate(x,y);g.rotate(.3);g.fillStyle='#4a2810';g.beginPath();g.ellipse(0,0,9,13,0,0,7);g.fill();g.fillStyle='#e8a54a';g.beginPath();g.ellipse(0,0,6.5,10,0,0,7);g.fill();g.fillStyle='#5a3012';g.beginPath();g.ellipse(0,1,2.4,4,0,0,7);g.fill();g.restore()}
 },
 v_magenta(g,W,H){
  g.fillStyle='#c2185b';g.fillRect(0,0,W,H);
  for(let i=0;i<300;i++){const x=videoHash(i,6)*W,y=videoHash(i,7)*H;g.fillStyle='#3a0a22';for(let j=0;j<4;j++){const a=j*Math.PI/2+videoHash(i,8);g.beginPath();g.ellipse(x+Math.cos(a)*2.4,y+Math.sin(a)*2.4,2.1,1.3,a,0,7);g.fill()}}
  for(let i=0;i<220;i++){g.fillStyle='#ff7fb0';g.beginPath();g.arc(videoHash(i,9)*W,videoHash(i,10)*H,1,0,7);g.fill()}
 },
 v_sky(g,W,H){
  // Video: sky-blue body, a soft white band down the middle, golden dots in a single row on it.
  const b=g.createLinearGradient(0,0,0,H);b.addColorStop(0,'#4f8fc8');b.addColorStop(.18,'#8cc0ea');b.addColorStop(.36,'#e8f5ff');b.addColorStop(.5,'#ffffff');b.addColorStop(.64,'#e8f5ff');b.addColorStop(.82,'#8cc0ea');b.addColorStop(1,'#4f8fc8');g.fillStyle=b;g.fillRect(0,0,W,H);
  for(let x=24;x<W;x+=96){const d=g.createRadialGradient(x-2,62,1,x,64,13);d.addColorStop(0,'#f6c45a');d.addColorStop(.7,'#d99a2e');d.addColorStop(1,'#d99a2e00');g.fillStyle=d;g.beginPath();g.ellipse(x,64,15,11,0,0,7);g.fill()}
 },
 v_wasp(g,W,H){
  g.fillStyle='#141414';g.fillRect(0,0,W,H);
  g.fillStyle='#f3d21a';for(let x=0;x<W;x+=64){g.beginPath();g.moveTo(x,0);g.lineTo(x+22,0);g.lineTo(x+34,H);g.lineTo(x+12,H);g.closePath();g.fill()}
 },
 v_scales(g,W,H){
  g.fillStyle='#7a3fb0';g.fillRect(0,0,W,H);
  for(let y=0;y<=H;y+=9)for(let x=(y/9%2)*5;x<W;x+=10){g.fillStyle=(Math.abs(y-64)>44)?'#5fd34a':'#4fbf3e';g.beginPath();g.arc(x,y,2.3,0,7);g.fill();g.fillStyle='#c48af0';g.beginPath();g.arc(x-1,y-1,.8,0,7);g.fill()}
 }
};
// Knitted honeycomb: a light lattice with dark holes (the green / tan / orange bots in the video).
function videoMesh(g,W,H,lattice,hole,light){
 g.fillStyle=lattice;g.fillRect(0,0,W,H);const s=8;
 for(let row=0,y=0;y<H+s;row++,y+=s*.86)for(let x=(row%2)*s/2;x<W+s;x+=s){
  g.fillStyle=hole;g.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3+Math.PI/6,px=x+Math.cos(a)*s*.38,py=y+Math.sin(a)*s*.38;k?g.lineTo(px,py):g.moveTo(px,py)}g.closePath();g.fill();
  g.strokeStyle=light;g.globalAlpha=.35;g.lineWidth=.8;g.beginPath();g.arc(x,y,s*.47,Math.PI*1.1,Math.PI*1.7);g.stroke();g.globalAlpha=1;
 }
}
function videoSkinTexture(id){
 const c=document.createElement('canvas');c.width=1536;c.height=256;const g=c.getContext('2d');g.scale(2,2);
 VIDEO_SKIN_PAINT[id](g,768,128);videoShade(c,id==='v_vzla');return c;
}
// Soft roundness only: the video bodies read almost flat, the flag even flatter.
function videoShade(c,flat){
 const g=c.getContext('2d');g.save();g.setTransform(1,0,0,1,0,0);const w=c.width,h=c.height,im=g.getImageData(0,0,w,h);
 for(let y=0;y<h;y++){const v=(y-(h-1)/2)/(h/2),round=Math.sqrt(Math.max(0,1-v*v)),shade=flat?.8+.2*Math.pow(round,.5):.55+.45*Math.pow(round,.6),shine=flat?0:Math.exp(-Math.pow((v+.35)/.14,2))*.12;
  for(let x=0;x<w;x++){const k=(y*w+x)*4;for(let j=0;j<3;j++)im.data[k+j]=Math.min(255,im.data[k+j]*shade+shine*255);im.data[k+3]=255}}
 g.putImageData(im,0,0);g.restore();
}

// ---- Flags in the Venezuela style ----
// Any flag becomes stripes running along the body (rows or columns of the flag, whichever reads cleaner),
// with small scale teeth between colours and the flag's own emblem repeated along its band.
function flagStyleTexture(code,img,c){
 const g=c.getContext('2d'),W=768,H=128;
 if(code==='ve'){g.save();g.scale(c.width/W,c.height/H);VIDEO_SKIN_PAINT.v_vzla(g,W,H);g.restore();videoShade(c,true);return}
 if(code==='gb'){// Union Jack has no stripes to read; its crosses become blue · white · red · white · blue.
  g.save();g.scale(c.width/W,c.height/H);let y=0;const cols=[['#012169',.3],['#ffffff',.12],['#c8102e',.16],['#ffffff',.12],['#012169',.3]];cols.forEach(([col,h],i)=>{g.fillStyle=col;g.fillRect(0,y*H,W,h*H+1);if(i){g.fillStyle=cols[i-1][0];g.beginPath();for(let x=0;x<W;x+=6){g.moveTo(x,y*H-.5);g.lineTo(x+3,y*H+3);g.lineTo(x+6,y*H-.5)}g.fill()}y+=h});
  g.restore();videoShade(c,true);return}
 if(code==='us'){// 13 thin stripes read as noise on a body: blue star band + five stripes.
  g.save();g.scale(c.width/W,c.height/H);let y=0;for(const [col,h] of [['#3c3b6e',.34],['#b22234',.132],['#ffffff',.132],['#b22234',.132],['#ffffff',.132],['#b22234',.132]]){g.fillStyle=col;g.fillRect(0,y*H,W,h*H+1);y+=h}
  g.fillStyle='#ffffff';for(let row=0;row<2;row++)for(let x=row*19;x<W;x+=38){const jx=(videoHash(x,row+3)-.5)*8;const yy=H*.34*(row?.68:.32);g.beginPath();for(let j=0;j<10;j++){const t=-Math.PI/2+j*Math.PI/5,rr=j%2?1.7:4;j?g.lineTo(x+jx+Math.cos(t)*rr,yy+Math.sin(t)*rr):g.moveTo(x+jx+Math.cos(t)*rr,yy+Math.sin(t)*rr)}g.closePath();g.fill()}
  g.restore();videoShade(c,true);return}
 const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height,a=document.createElement('canvas');a.width=iw;a.height=ih;const q=a.getContext('2d',{willReadFrequently:true});q.drawImage(img,0,0);const px=q.getImageData(0,0,iw,ih).data;
 const key=(x,y)=>{const k=(y*iw+x)*4;return ((px[k]>>4)<<8)|((px[k+1]>>4)<<4)|(px[k+2]>>4)};
 const colorOf=new Map();for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){const kk=key(x,y);if(!colorOf.has(kk)){const k=(y*iw+x)*4;colorOf.set(kk,[px[k],px[k+1],px[k+2]])}}
 // Mode colour of each line, and how much of the line it covers.
 const scan=(rows)=>{const n=rows?ih:iw,m=rows?iw:ih,modes=[],cov=[];let score=0;
  for(let i=0;i<n;i++){const cnt=new Map();for(let j=0;j<m;j++){const kk=rows?key(j,i):key(i,j);cnt.set(kk,(cnt.get(kk)||0)+1)}let best=0,bk=0;for(const [k,v] of cnt)if(v>best){best=v;bk=k}modes.push(bk);cov.push(best/m);score+=best/m}
  return {modes,cov,score:score/n,n,m}};
 const hs=scan(true),vs=scan(false),s=hs.score>=vs.score?hs:vs;
 // Clean anti-aliasing: a line takes the majority colour of its neighbourhood.
 let modes=s.modes.map((k,i)=>{const cnt=new Map();for(let j=Math.max(0,i-3);j<=Math.min(s.n-1,i+3);j++)cnt.set(s.modes[j],(cnt.get(s.modes[j])||0)+1);let b=0,bk=k;for(const [kk,v] of cnt)if(v>b){b=v;bk=kk}return bk});
 const bands=[];for(let i=0;i<modes.length;i++){if(bands.length&&bands.at(-1).k===modes[i])bands.at(-1).e=i+1;else bands.push({k:modes[i],s:i,e:i+1})}
 for(let i=bands.length-1;i>=0;i--)if(bands.length>1&&bands[i].e-bands[i].s<s.n*.035){if(bands[i-1])bands[i-1].e=bands[i].e;else bands[i+1].s=bands[i].s;bands.splice(i,1)}
 // A "band" mostly made of emblem (Japan's disc, Canada's leaf) is emblem, not stripe: it takes the colour around it.
 for(let i=0;i<bands.length;i++){const b=bands[i];let c=0;for(let j=b.s;j<b.e;j++)c+=s.cov[j];if(bands.length>1&&c/(b.e-b.s)<.65){const L=bands[i-1],R=bands[i+1],nb=!L?R:!R?L:(L.e-L.s>=R.e-R.s?L:R);b.k=nb.k}}
 for(let i=bands.length-1;i>0;i--)if(bands[i].k===bands[i-1].k){bands[i-1].e=bands[i].e;bands.splice(i,1)}
 for(const b of bands)for(let j=b.s;j<b.e;j++)modes[j]=b.k;
 const rgb=k=>{const c=colorOf.get(k);return 'rgb('+c.join(',')+')'};
 g.save();g.scale(c.width/W,c.height/H);
 for(const b of bands){g.fillStyle=rgb(b.k);g.fillRect(0,b.s/s.n*H,W,(b.e-b.s)/s.n*H+1)}
 for(let i=1;i<bands.length;i++){const y=bands[i].s/s.n*H;g.fillStyle=rgb(bands[i-1].k);g.beginPath();for(let x=0;x<W;x+=6){g.moveTo(x,y-.5);g.lineTo(x+3,y+3);g.lineTo(x+6,y-.5)}g.fill()}
 // Emblem (sun, leaf, eagle, stars…): pixels that differ from their stripe are cut out of the flag
 // and repeated along the body at the flag's own scale.
 const rows=s===hs,lineMode=new Array(s.n);modes.forEach((k,i)=>lineMode[i]=colorOf.get(k));
 const mask=new Float32Array(iw*ih);for(let y=0;y<ih;y++)for(let x=0;x<iw;x++){const k=(y*iw+x)*4,m=lineMode[rows?y:x],d=Math.hypot(px[k]-m[0],px[k+1]-m[1],px[k+2]-m[2]);mask[y*iw+x]=Math.max(0,Math.min(1,(d-45)/55))}
 const seen=new Uint8Array(iw*ih),comps=[];for(let i=0;i<iw*ih;i++){if(seen[i]||mask[i]<.5)continue;const st=[i];seen[i]=1;let n=0,x0=iw,y0=ih,x1=0,y1=0;while(st.length){const j=st.pop(),x=j%iw,y=(j/iw)|0;n++;if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y;for(const t of [j-1,j+1,j-iw,j+iw]){if(t<0||t>=iw*ih||seen[t]||mask[t]<.5)continue;if((t===j-1&&x===0)||(t===j+1&&x===iw-1))continue;seen[t]=1;st.push(t)}}const thin=rows?(x1-x0>iw*.8&&y1-y0<ih*.06):(y1-y0>ih*.8&&x1-x0<iw*.06);if(n>=6&&!thin)comps.push({n,x0,y0,x1,y1})}
 if(comps.length){comps.sort((a,b)=>b.n-a.n);const big=comps[0],keep=comps.filter(c=>c.n>=big.n*.02);let bx0=iw,by0=ih,bx1=0,by1=0;for(const c of keep){bx0=Math.min(bx0,c.x0);by0=Math.min(by0,c.y0);bx1=Math.max(bx1,c.x1);by1=Math.max(by1,c.y1)}
  if((bx1-bx0)*(by1-by0)>iw*ih*.85){bx0=big.x0;by0=big.y0;bx1=big.x1;by1=big.y1}
  const bw=bx1-bx0+1,bh=by1-by0+1;
  // Big emblems (Brazil's diamond) are fine; one that fills the whole flag (UK crosses) is not an emblem.
  if(bw*bh<=iw*ih*.85&&!(bw>iw*.9&&bh>ih*.9)&&bw>=3&&bh>=3){
   const e=document.createElement('canvas');e.width=bw;e.height=bh;const eg=e.getContext('2d'),ed=eg.createImageData(bw,bh);
   for(let y=0;y<bh;y++)for(let x=0;x<bw;x++){const si=((by0+y)*iw+bx0+x),k=si*4,o=(y*bw+x)*4;ed.data[o]=px[k];ed.data[o+1]=px[k+1];ed.data[o+2]=px[k+2];ed.data[o+3]=Math.round(mask[si]*255)}eg.putImageData(ed,0,0);
   // Across the body = the flag's scan axis; rows keep the emblem upright, columns turn it a quarter.
   const k=H/(rows?ih:iw),across=(rows?bh:bw)*k,along=(rows?bw:bh)*k,mid=(rows?by0+bh/2:bx0+bw/2)*k,count=Math.max(1,Math.round(W/Math.max(48,along*2.4))),gap=W/count;
   g.imageSmoothingEnabled=true;g.imageSmoothingQuality='high';
   for(let j=0;j<count;j++){const cx=gap*j+gap/2;g.save();g.translate(cx,mid);if(!rows)g.rotate(Math.PI/2);rows?g.drawImage(e,-along/2,-across/2,along,across):g.drawImage(e,-across/2,-along/2,across,along);g.restore()}
  }
 }
 g.restore();videoShade(c,true);
}
