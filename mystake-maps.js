'use strict';
// Static, seamless world-space tiles; one rasterization per selected theme.
const ARENA_MAPS=[
 {id:'pumpkin_garden',name:'Тыквенный двор',detail:'Светящиеся тыквы, резные лозы и осенний камень',group:'halloween'},
 {id:'haunted_crypt',name:'Призрачный склеп',detail:'Лунный камень, духи и бирюзовое свечение',group:'halloween'},
 {id:'witch_den',name:'Логово ведьмы',detail:'Зелья, кристаллы и серебряная паутина',group:'halloween'},
 {id:'vid_wall',name:'Карибские обои · Венесуэла',detail:'Волны, пальмы, ракушки и звёздные арки',group:'latam',light:.82,size:1000},
 {id:'vid_world',name:'Венесуэла · как в видео',detail:'Тёмное море, камень с флагами, сваи, острова, водопады',group:'latam',light:1},
 {id:'vid_falls',name:'Водопады тепуи · Венесуэла',detail:'Тёмный камень, водопады, орнамент и звёзды',group:'latam',light:.95,size:1000},
 {id:'la_angel',name:'Сальто Анхель · Венесуэла',detail:'Тепуи, бирюзовая вода и водопады',group:'latam',light:.5},
 {id:'la_losroques',name:'Лос-Рокес · Венесуэла',detail:'Белый песок, лагуна и кораллы',group:'latam',light:.5},
 {id:'la_flordemayo',name:'Флор-де-Майо · Венесуэла',detail:'Орхидеи каттлея на светлом камне',group:'latam',light:.5},
 {id:'la_araguaney',name:'Цветущий араугуаней · Венесуэла',detail:'Золотые цветы и птицы турпиал',group:'latam',light:.5},
 {id:'la_kukulkan',name:'Пернатый змей · Мексика',detail:'Кукулькан, известняк и нефрит',group:'latam',light:.44},
 {id:'la_muertos',name:'День мёртвых · Мексика',detail:'Сахарные черепа, бархатцы и керамика',group:'latam',light:.53},
 {id:'la_inca',name:'Золото инков · Перу',detail:'Кладка Куско и диск солнца Инти',group:'latam',light:.58},
 {id:'la_nazca',name:'Линии Наска · Перу',detail:'Колибри, обезьяна и паук в песчанике',group:'latam',light:.46},
 {id:'la_amazonia',name:'Амазония · Бразилия',detail:'Кувшинки Виктория, листья и речные камни',group:'latam',light:.71},
 {id:'la_copacabana',name:'Копакабана · Бразилия',detail:'Волны мостовой и ракушки',group:'latam',light:.42},
 {id:'la_fileteado',name:'Филетеадо · Аргентина',detail:'Завитки танго на тёмном дереве',group:'latam',light:.63},
 {id:'la_galapagos',name:'Галапагосы · Эквадор',detail:'Вулканический камень, черепахи и игуаны',group:'latam',light:.66},
 {id:'la_havana',name:'Плитка Гаваны · Куба',detail:'Цементная плитка в стиле ар-деко',group:'latam',light:.42},
 {id:'la_rapanui',name:'Рапа-Нуи · Чили',detail:'Моаи и древние петроглифы',group:'latam',light:.65},
 {id:'clockwork',name:'Часовой механизм',detail:'Медные шестерни и механические рельефы'},
 {id:'pirate',name:'Пиратский храм',detail:'Компас, якоря и затонувшие сокровища'},
 {id:'mycelium',name:'Светящийся лес',detail:'Грибы, серебряные корни и волшебный мох'},
 {id:'sugar',name:'Леденцовый мир',detail:'Мятные спирали, карамель и шоколад'},
 {id:'gothic',name:'Готический собор',detail:'Витражные розы и резной тёмный камень'},
 {id:'original',name:'Оригинал',detail:'Тёмный камень · классическая арена'},
 {id:'venezuela',name:'Венесуэла · Карибы',detail:'Флаги, тепуи, водопады и орхидеи'},
 {id:'lunar',name:'Лунная керамика',detail:'Лунные фазы, кратеры и созвездия'},
 {id:'neon',name:'Неоновый город',detail:'Реакторы, металл и неоновые панели'},
 {id:'sakura',name:'Сакура',detail:'Карпы кои, резной камень и цветы'},
 {id:'ocean',name:'Глубокий океан',detail:'Затонувший храм и рельеф осьминога'},
 {id:'magma',name:'Обсидиан и огонь',detail:'Драконьи рельефы и вулканический камень'},
 {id:'amethyst',name:'Аметистовая пещера',detail:'Крупные аметисты и небесная резьба'},
 {id:'emerald',name:'Храм джунглей',detail:'Каменные маски и древние орнаменты'},
 {id:'golden',name:'Золотые дюны',detail:'Египетский скарабей и золотые рельефы'},
 {id:'frost',name:'Полярное сияние',detail:'Ледяные розетки и замёрзшие папоротники'}
];
let arenaMap='vid_world';try{if(localStorage.getItem('slither-vid-map')!=='2'){localStorage.setItem('slither-vid-map','2');localStorage.setItem('slither-mystake-map','vid_world')}const v=localStorage.getItem('slither-mystake-map');if(ARENA_MAPS.some(m=>m.id===v))arenaMap=v}catch{}
// Locally served artwork; only the selected full-size floor is decoded.
const arenaArtwork=new Map();
const MAP_LIGHT={pumpkin_garden:.62,haunted_crypt:.64,witch_den:.60,clockwork:.60,pirate:.63,mycelium:.61,sugar:.48,gothic:.68,venezuela:.52,lunar:.46,neon:.76,sakura:.58,ocean:.64,magma:.65,amethyst:.52,emerald:.70,golden:.58,frost:.5};
// Map brightness after dimming: per-map 'light' field wins over the table.
function mapLight(id){const m=ARENA_MAPS.find(m=>m.id===id);return m&&m.light||MAP_LIGHT[id]||.6}
function requestArenaArtwork(id){
 if(arenaArtwork.has(id))return arenaArtwork.get(id);
 const entry={image:new Image(),ready:false};arenaArtwork.set(id,entry);
 // Finish decoding before the first draw so picking a map does not stall a frame.
 entry.image.onload=()=>{const done=()=>{entry.ready=true};entry.image.decode?entry.image.decode().then(done,done):done()};entry.image.onerror=()=>{arenaArtwork.delete(id)};
 entry.image.src='maps/'+id+'.webp?v=33';
 // Keep at most two decoded full-resolution backgrounds.
 for(const key of arenaArtwork.keys())if(arenaArtwork.size>2&&key!==id)arenaArtwork.delete(key);
 return entry;
}
// ---- World map of the reference videos ----
// Measured: most of the arena is a flat dark navy sea (#0f212c) with red dots; painted Venezuelan regions
// (cracked stone with flag tiles, stilt houses, rocky islands, a faded flag, waterfalls, wave wallpaper)
// lie on it as large islands with soft ragged edges.
const WORLD_SEA='#0f212c';
// Weighted by how often each look appears in the videos (patterned/stone floors dominate, water regions are rarer).
const WORLD_IMAGES=['reg_stoneflags','reg_stoneflags','reg_stilts','reg_rocks','reg_stripes','vid_falls','vid_falls','vid_wall','vid_wall','vid_wall','vid_wall','vid_wall'];
const WORLD_LAYOUT=(()=>{let s=7;const rnd=()=>(s=(s*16807)%2147483647)/2147483647,out=[],cells=6,span=4600/cells;
 for(let cx=0;cx<cells;cx++)for(let cy=0;cy<cells;cy++){if(rnd()<.13)continue;// leave some open sea (≈25% of frames are pure sea)
  // Measured scale in the videos: flag tiles ≈490 units wide, stilt houses ≈300 units.
  const img=WORLD_IMAGES[Math.floor(rnd()*WORLD_IMAGES.length)],k={reg_stoneflags:2.2,reg_stilts:2.1,vid_falls:1.7,vid_wall:1.7}[img]||1.8;
  out.push({img,x:-2300+(cx+.5)*span+(rnd()-.5)*span*.5,y:-2300+(cy+.5)*span+(rnd()-.5)*span*.5,size:span*k*(1+rnd()*.3),rot:img==='reg_rocks'?Math.floor(rnd()*4)*Math.PI/2:0,flip:img==='reg_stripes'||img==='reg_stoneflags'?false:rnd()<.5,/* flags stay upright as in the videos */seed:1+Math.floor(rnd()*2)*7919})}/* two mask shapes per image keep memory small */
 return out})();
// Luminance gain so each region matches the brightness measured in the videos (wall 31, falls 32, flag stone 40).
const WORLD_GAIN={vid_wall:1.05,vid_falls:1.2,reg_stoneflags:1.15};
const worldPieces=new Map(),worldImages=new Map();let onWorldImage=null;
// Composed pieces are cached; the source image is no longer needed after composing.
function preloadVideoWorld(){for(const p of WORLD_LAYOUT)worldPiece(p.img,p.seed)}
function worldPiece(name,seed){
 const key=name+':'+seed;if(worldPieces.has(key))return worldPieces.get(key);
 let entry=worldImages.get(name);if(!entry){entry={image:new Image(),ready:false};worldImages.set(name,entry);entry.image.onload=()=>{entry.ready=true;if(typeof onWorldImage==='function')onWorldImage()};entry.image.src='maps/'+name+'.webp?v=33'}if(!entry.ready)return null;
 const n=640,c=document.createElement('canvas');c.width=c.height=n;const g=c.getContext('2d');
 // Ragged blob mask, feathered by stacking shrinking copies (no canvas filter: iOS lacks it).
 let s=seed||1;const rnd=()=>(s=(s*16807)%2147483647)/2147483647,K=56,ph=[rnd()*6.3,rnd()*6.3,rnd()*6.3],rad=[];
 for(let k=0;k<K;k++){const a=k/K*Math.PI*2;rad.push(.80+.08*Math.sin(a*2+ph[0])+.06*Math.sin(a*3+ph[1])+.035*Math.sin(a*7+ph[2])+(rnd()-.5)*.05)}
 // Image first, brightened to the measured video luminance, then cut by the mask.
 g.drawImage(entry.image,0,0,n,n);const gain=WORLD_GAIN[name]||1;if(gain>1){g.globalCompositeOperation='lighter';g.globalAlpha=gain-1;g.drawImage(entry.image,0,0,n,n)}
 // Video regions read warmer (more red) than the generated art: add a small warm lift.
 g.globalCompositeOperation='lighter';g.globalAlpha=1;g.fillStyle='rgb(7,2,0)';g.fillRect(0,0,n,n);g.globalCompositeOperation='source-over';
 const m=document.createElement('canvas');m.width=m.height=n;const mg=m.getContext('2d'),steps=14;mg.fillStyle='#fff';
 for(let i=0;i<steps;i++){const f=1-i/steps*.42;mg.globalAlpha=1/steps*1.6;mg.beginPath();for(let k=0;k<=K;k++){const a=k/K*Math.PI*2,r=rad[k%K]*f*n/2;k?mg.lineTo(n/2+Math.cos(a)*r,n/2+Math.sin(a)*r):mg.moveTo(n/2+Math.cos(a)*r,n/2+Math.sin(a)*r)}mg.fill()}
 g.globalAlpha=1;g.globalCompositeOperation='destination-in';g.drawImage(m,0,0);
 worldPieces.set(key,c);return c;
}
function drawVideoWorld(g,left,top,vw,vh){
 g.fillStyle=WORLD_SEA;g.fillRect(left,top,vw+120,vh+120);
 for(const p of WORLD_LAYOUT){const h=p.size/2;if(p.x+h<left||p.x-h>left+vw+120||p.y+h<top||p.y-h>top+vh+120)continue;
  const c=worldPiece(p.img,p.seed);if(!c)continue;g.save();g.translate(p.x,p.y);g.rotate(p.rot);if(p.flip)g.scale(-1,1);g.drawImage(c,-h,-h,p.size,p.size);g.restore()}
}
function drawArenaMap(g,left,top,vw,vh,id=arenaMap){
 if(id==='vid_world'){drawVideoWorld(g,left,top,vw,vh);return}
 if(id!=='original'){
  const entry=requestArenaArtwork(id);g.fillStyle='#101b25';g.fillRect(left,top,vw+120,vh+120);
  if(entry.ready){const size=(ARENA_MAPS.find(m=>m.id===id)||{}).size||900;
   // Mirror decorative floors at edges; keep national flag mosaics upright.
   for(let col=Math.floor(left/size);col*size<left+vw+120;col++)for(let row=Math.floor(top/size);row*size<top+vh+120;row++){
    const flipX=Math.abs(col%2)===1,flipY=id!=='venezuela'&&Math.abs(row%2)===1;
    g.save();g.translate(col*size+(flipX?size:0),row*size+(flipY?size:0));g.scale(flipX?-1:1,flipY?-1:1);g.drawImage(entry.image,-.25,-.25,size+.5,size+.5);g.restore();
   }
   g.fillStyle='rgba(2,8,16,'+(1-mapLight(id))+')';g.fillRect(left,top,vw+120,vh+120);
  }
  return;
 }
 const stepX=63,stepY=72;
 for(let col=Math.floor(left/stepX)-1;col<(left+vw+100)/stepX;col++)for(let row=Math.floor(top/stepY)-1;row<(top+vh+100)/stepY;row++){
  const x=col*stepX,y=row*stepY+(col%2)*stepY/2,variant=Math.round((Math.sin(col*17+row*23)+1)*4);g.drawImage(tileSprite(variant),x-50,y-50);
 }
}
function initArenaMaps(){
 const button=document.getElementById('chooseMap'),dialog=document.getElementById('mapDialog');
 const syncMap=()=>{document.getElementById('mapName').textContent=ARENA_MAPS.find(m=>m.id===arenaMap).name;document.getElementById('mapThumb').style.backgroundImage=arenaMap==='original'?'':arenaMap==='vid_world'?'url(maps/reg_stoneflags.webp?v=33)':'url(maps/'+arenaMap+'-thumb.webp?v=33)';document.querySelectorAll('.arenaMapChoice').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===arenaMap)))};
 button.onclick=()=>{dialog.showModal();syncMap()};document.getElementById('closeMaps').onclick=()=>dialog.close();
 let previousMapGroup=null;
 for(const map of ARENA_MAPS){
  const group=map.group||'regular';if(group!==previousMapGroup){const heading=document.createElement('h3'),count=ARENA_MAPS.filter(m=>(m.group||'regular')===group).length;heading.className='collectionHeading'+(group!=='regular'?' '+group+'Heading':'');heading.textContent=group==='halloween'?'🎃 Хэллоуин · '+count+' карты':group==='latam'?'🌎 Латинская Америка · '+count+' карт':'Все остальные карты';document.getElementById('arenaMapList').append(heading);previousMapGroup=group;}
  const b=document.createElement('button');b.type='button';b.className='arenaMapChoice';b.dataset.map=map.id;
  let preview;
  if(map.id==='original'){preview=document.createElement('canvas');preview.width=440;preview.height=240;const g=preview.getContext('2d');g.fillStyle='#070f18';g.fillRect(0,0,440,240);g.scale(.65,.65);drawArenaMap(g,0,0,440/.65,240/.65,'original')}
  else if(map.id==='vid_world'){preview=document.createElement('canvas');preview.width=440;preview.height=240;const g=preview.getContext('2d'),paint=()=>{preloadVideoWorld();g.setTransform(1,0,0,1,0,0);g.fillStyle=WORLD_SEA;g.fillRect(0,0,440,240);const k=440/2400;g.setTransform(k,0,0,k,220,120);drawVideoWorld(g,-1200,-660,2280,1200)};paint();const prev=onWorldImage;onWorldImage=()=>{if(prev)prev();paint()}}
  else{preview=document.createElement('img');preview.src='maps/'+map.id+'-thumb.webp?v=33';preview.alt=map.name;preview.loading='lazy';preview.width=440;preview.height=240;preview.style.filter='brightness('+mapLight(map.id)+')'}
  const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=map.name;detail.textContent=map.detail;b.append(preview,title,detail);
  b.onclick=()=>{arenaMap=map.id;if(arenaMap==='vid_world')preloadVideoWorld();else if(arenaMap!=='original')requestArenaArtwork(arenaMap);try{localStorage.setItem('slither-mystake-map',arenaMap)}catch{}syncMap();dialog.close()};document.getElementById('arenaMapList').append(b);
 }syncMap();
}
