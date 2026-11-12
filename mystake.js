'use strict';
const $=id=>document.getElementById(id),canvas=$('arena'),ctx=canvas.getContext('2d');
const spriteCache=new Map(),amountCache=new Map();
const numberFormatter=new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const targetNumbers=new Intl.NumberFormat('en-US',{maximumFractionDigits:6});
const mobileRenderer=matchMedia('(pointer:coarse)').matches;
const QUALITY={auto:1.5,high:2,balanced:1.5,low:1};
let qualityMode='auto';try{qualityMode=localStorage.getItem('arena-quality')||'auto'}catch{}if(!(qualityMode in QUALITY))qualityMode='auto';
let renderScale=QUALITY[qualityMode];
const STEP=1/60,MAX_COINS=3200,coinGrid=new ArenaCore.SpatialGrid(96),coinCandidates=[];
let coinStamp=0,coinChecks=0,lastCoinChecks=0,debugFrames=0,debugTime=0,frameFPS=60;
const diagnostics={updateMs:0,renderMs:0};
window.gameDiagnostics=()=>{const rivals=snakes.filter(s=>s!==player&&s.alive);return {mode,paused,elapsed,fps:frameFPS,dpr,renderScale,qualityMode,difficulty:roundDifficulty,exitMultiplier:roundExitX,exitTarget:ArenaCore.cashoutTarget(sessionStake,roundExitX),botMix:rivals.reduce((out,s)=>(out[s.brain?.kind||'regular']=(out[s.brain?.kind||'regular']||0)+1,out),{}),botStats:{large:rivals.filter(s=>s.radius>=34).length,giant:rivals.filter(s=>s.radius>=42).length,maxValue:rivals.reduce((m,s)=>Math.max(m,s.value),0),maxRadius:rivals.reduce((m,s)=>Math.max(m,s.radius),0)},coins:coins.length,coinChecks:lastCoinChecks,snakes:snakes.filter(s=>s.alive).length,renderer:arenaRibbon?.diagnostics()??{ready:false,mode:'canvas'},...diagnostics};};
const COLORS=['#37dc77','#36bbef','#b280fa','#f3719c','#f3bf4c'];
const SKINS=[{id:'neon',name:'Неон',color:'#37dc77'},{id:'skeleton',name:'Скелет',color:'#14202a'},{id:'ice',name:'Ледяная броня',color:'#258ca7'},{id:'lava',name:'Лава',color:'#58120d'},{id:'lightning',name:'Плазма',color:'#4b2469'},{id:'leopard',name:'Леопард',color:'#b49250'},{id:'goldbar',name:'Золотые слитки',color:'#edbc30'},{id:'racing',name:'Гоночный',color:'#ed4538'},{id:'tiger',name:'Золотые полосы',color:'#f6bd28'},{id:'galaxy',name:'Космос',color:'#572887'},{id:'candy',name:'Карамель',color:'#f15794'},...EXTRA_SKINS,...REFERENCE_SKINS,...VIDEO_SKINS];
const countryNames=new Intl.DisplayNames(['ru'],{type:'region'});
const countrySkins=Object.entries(FLAG_COUNTRIES).map(([code,en])=>({id:'flag_'+code,name:countryNames.of(code.toUpperCase())||en,color:'#dcecf3',code,en})).sort((a,b)=>(b.code==='ve')-(a.code==='ve')||a.name.localeCompare(b.name,'ru'));
SKINS.push(...countrySkins);
const BOT_SKINS=SKINS.filter(s=>!s.id.startsWith('flag_'));
const BOT_COUNT=9;
let exitUnlocked=false,deathTrails=[],rivalTiers=[],botKinds=[],roundDifficulty='easy';
const originalNumbers=new Intl.NumberFormat('en-US',{maximumFractionDigits:0});
let prefs={currency:'USD',balance:1000,stake:10,name:'Player',color:0,sound:true,showCurrency:true,skin:'lava',difficulty:'easy'};
try{Object.assign(prefs,JSON.parse(localStorage.getItem('slither-demo-v1')||'{}'))}catch{}
prefs.currency=String(prefs.currency||'USD').slice(0,12);prefs.balance=Math.max(0,Math.min(1e12,Number(prefs.balance)||0));prefs.stake=Math.max(.01,Math.min(1e9,Number(prefs.stake)||10));prefs.color=Math.abs(Number(prefs.color)||0)%COLORS.length;
prefs.difficulty=BotAI.normalize(prefs.difficulty);prefs.exitX=ArenaCore.normalizeExitMultiplier(prefs.exitX);
// Venezuela (Flags tab) is the default; the old hidden video skins map onto it.
try{prefs.skin=localStorage.getItem('slither-mystake-skin')||'flag_ve';if(prefs.skin.startsWith('v_')||!localStorage.getItem('slither-video-look2')){prefs.skin='flag_ve';localStorage.setItem('slither-video-look2','1');localStorage.setItem('slither-mystake-skin','flag_ve')}}catch{prefs.skin='flag_ve'}
if(!SKINS.some(s=>s.id===prefs.skin))prefs.skin='neon';
let W=innerWidth,H=innerHeight,dpr=1,mode='menu',paused=false,elapsed=0,kills=0,player,snakes=[],coins=[],particles=[],camera={x:0,y:0},aim={x:1,y:0},boost=false,last=0,acc=0,hudTick=0,zoom=1,sessionStake=10,roundExitX=ArenaCore.DEFAULT_EXIT_MULTIPLIER,touchOrigin=null,audioCtx;
const R=2200,rand=(a,b)=>a+Math.random()*(b-a),dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),money=n=>numberFormatter.format(n),fmt=n=>originalNumbers.format(n)+(prefs.showCurrency?' '+prefs.currency:'');
function save(){try{localStorage.setItem('slither-mystake-skin',prefs.skin);const shared=JSON.parse(localStorage.getItem('slither-demo-v1')||'{}');localStorage.setItem('slither-demo-v1',JSON.stringify({...prefs,skin:shared.skin||'neon'}))}catch{}}
function resize(){const v=window.visualViewport;W=Math.round(v?.width||innerWidth);H=Math.round(v?.height||innerHeight);dpr=Math.min(devicePixelRatio||1,renderScale,Math.sqrt(2500000/Math.max(1,W*H)));dpr=Math.max(.5,dpr);if(canvas.width!==Math.round(W*dpr)||canvas.height!==Math.round(H*dpr)){canvas.width=Math.round(W*dpr);canvas.height=Math.round(H*dpr);}canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality=qualityMode==='high'?"high":"low";document.documentElement.style.setProperty('--view-width',W+'px');document.documentElement.style.setProperty('--view-height',H+'px');document.documentElement.style.setProperty('--view-top',(v?.offsetTop||0)+'px');document.documentElement.style.setProperty('--view-left',(v?.offsetLeft||0)+'px')}addEventListener('resize',resize);window.visualViewport?.addEventListener('resize',resize);window.visualViewport?.addEventListener('scroll',resize);resize();
function syncDifficulty(){ $('difficulty').value=prefs.difficulty;$('difficultyHint').textContent=prefs.difficulty==='hard'?'Больше внимательных соперников и быстрых реакций.':'Больше рассеянных соперников — легче подрезать.'}
function exitLabel(x){return '×'+String(x).replace('.',',')}
function syncExitMultiplier(){prefs.exitX=ArenaCore.normalizeExitMultiplier(prefs.exitX);$('exitMultiplier').value=String(prefs.exitX);$('exitTargetLabel').textContent=exitLabel(prefs.exitX)}
function sync(){ syncDifficulty();syncExitMultiplier();$('sound').textContent=prefs.sound?'♪':'♪ ×';$('sound').setAttribute('aria-pressed',String(prefs.sound));$('toggleCurrency').setAttribute('aria-pressed',String(prefs.showCurrency));$('currencyState').textContent=prefs.showCurrency?'ВКЛ':'ВЫКЛ';$('nickname').value=prefs.name;if(document.activeElement!==$('currency'))$('currency').value=prefs.currency;$('balanceText').textContent=fmt(prefs.balance);$('stake').value=prefs.stake;document.querySelectorAll('.unit').forEach(x=>x.textContent=prefs.showCurrency?prefs.currency:'');document.querySelectorAll('[data-stake]').forEach(b=>{b.textContent=b.dataset.stake+(prefs.showCurrency?' '+prefs.currency:'');b.classList.toggle('selected',Number(b.dataset.stake)===prefs.stake)});goalHint();drawSkin();}
function fmtTarget(n){return targetNumbers.format(n)+(prefs.showCurrency?' '+prefs.currency:'')}
function goalHint(){const n=Number($('stake').value),x=ArenaCore.normalizeExitMultiplier($('exitMultiplier')?.value??prefs.exitX);$('goalValue').textContent=n>0&&n<=1e9?fmtTarget(ArenaCore.cashoutTarget(n,x)):'—';if($('exitTargetLabel'))$('exitTargetLabel').textContent=exitLabel(x);document.querySelectorAll('[data-stake]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.stake)===n))}
// Menu showcase: the chosen skin slithers in place.
const stillMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
function paintShowcase(){const c=$('skinPreview'),g=c.getContext('2d'),w=c.width,h=c.height,t=stillMotion?0:performance.now()/1000,skin=SKINS.find(s=>s.id===prefs.skin),points=[];for(let i=0;i<112;i++)points.push({x:w*.9-i*w*.0072,y:h*.5+Math.sin(i/15-t*1.5)*h*.2*Math.min(1,.45+i/60)});const a=Math.atan2(points[0].y-points[1].y,points[0].x-points[1].x);g.clearRect(0,0,w,h);drawOriginalSnake(g,{x:points[0].x,y:points[0].y,a,points,radius:h*.15,color:prefs.skin==='neon'?COLORS[prefs.color]:skin.color,skin:prefs.skin},1)}
function drawSkin(){paintShowcase();$('skinName').textContent=SKINS.find(s=>s.id===prefs.skin).name;document.querySelectorAll('.skinChoice,#flagList .countryOption').forEach(b=>{const selected=b.dataset.skin===prefs.skin;b.classList.toggle('active',selected);b.setAttribute('aria-pressed',String(selected))})}
function previewSnake(g,id,w,h){const skin=SKINS.find(s=>s.id===id),color=id==='neon'?COLORS[prefs.color]:skin.color,points=[];for(let i=0;i<65;i++)points.push({x:w*.84-i*w*.0105,y:h*.5+Math.sin(i/11)*h*.15});drawOriginalSnake(g,{x:points[0].x,y:points[0].y,a:0,points,radius:h*.16,color,skin:id},1)}
const skinObserver=typeof IntersectionObserver!=='undefined'?new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){const c=e.target;previewSnake(c.getContext('2d'),c.dataset.skin,c.width,c.height);skinObserver.unobserve(c)}},{rootMargin:'100px'}):null;
const skinGroup=s=>s.group||'regular';
// Skin sections: one tab is shown at a time. Add a section here and give skins a matching group.
const SKIN_TABS=[{id:'halloween',label:'🎃 Хэллоуин'},{id:'latam',label:'🌎 Лат. Америка'},{id:'regular',label:'Скины'},{id:'flags',label:'⚑ Флаги'}];
const orderedSkins=SKIN_TABS.flatMap(t=>BOT_SKINS.filter(s=>skinGroup(s)===t.id));
function skinTabOf(id){if(id.startsWith('flag_'))return'flags';const s=BOT_SKINS.find(s=>s.id===id);return s?skinGroup(s):'regular'}
let skinTab=skinTabOf(prefs.skin);
function showSkinTab(tab){skinTab=tab;document.querySelectorAll('#skinTabs button').forEach(b=>{const on=b.dataset.tab===tab;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});
 const flags=tab==='flags';$('skinChoices').hidden=flags;$('flagPane').hidden=!flags;$('neonTools').hidden=tab!=='regular';
 if(flags)renderFlagPane();else document.querySelectorAll('.skinChoice').forEach(b=>b.hidden=b.dataset.group!==tab)}
function renderFlagPane(){const query=$('flagSearch').value.trim().toLocaleLowerCase('ru'),matches=countrySkins.filter(s=>(s.name+' '+s.en+' '+s.code).toLocaleLowerCase('ru').includes(query)),list=$('flagList');list.replaceChildren();
 for(const s of matches){const b=document.createElement('button');b.type='button';b.className='countryOption';b.dataset.skin=s.id;b.setAttribute('aria-pressed',String(prefs.skin===s.id));const image=document.createElement('img');image.src='flags/'+s.code+'.png';image.alt='';image.loading='lazy';image.width=48;image.height=32;const label=document.createElement('span');label.textContent=s.name;b.append(image,label);b.onclick=()=>{prefs.skin=s.id;save();drawSkin();$('skinDialog').close()};list.append(b)}
 $('flagEmpty').hidden=matches.length>0}
$('flagSearch').oninput=renderFlagPane;
for(const skin of orderedSkins){const b=document.createElement('button');b.className='skinChoice';b.dataset.skin=skin.id;b.dataset.group=skinGroup(skin);b.type='button';b.setAttribute('aria-label',skin.name);const c=document.createElement('canvas');c.width=240;c.height=106;c.dataset.skin=skin.id;if(skinObserver)skinObserver.observe(c);else setTimeout(()=>previewSnake(c.getContext('2d'),skin.id,240,106),0);const title=document.createElement('span');const [skinTitle,country]=skin.name.split(' · ');title.textContent=skinTitle;if(country){const c2=document.createElement('small');c2.className='skinCountry';c2.textContent=country;title.append(c2)}b.append(c,title);b.onclick=()=>{prefs.skin=skin.id;save();drawSkin();$('skinDialog').close()};$('skinChoices').append(b)}
for(const t of SKIN_TABS){const count=t.id==='flags'?countrySkins.length:BOT_SKINS.filter(s=>skinGroup(s)===t.id).length,b=document.createElement('button');b.type='button';b.role='tab';b.dataset.tab=t.id;b.className=t.id+'Tab';b.innerHTML=t.label+' <small>'+count+'</small>';b.onclick=()=>showSkinTab(t.id);$('skinTabs').append(b)}
showSkinTab(skinTab);

COLORS.forEach((color,i)=>{const b=document.createElement('button');b.style.setProperty('--c',color);b.setAttribute('aria-label',['Зелёный','Голубой','Фиолетовый','Розовый','Золотой'][i]);b.classList.toggle('active',i===prefs.color);b.onclick=()=>{prefs.color=i;prefs.skin='neon';save();document.querySelectorAll('#swatches button').forEach((b,n)=>b.classList.toggle('active',n===i));drawSkin()};$('swatches').append(b)});
$('toggleCurrency').onclick=()=>{prefs.showCurrency=!prefs.showCurrency;save();sync()};
$('editSettings').onclick=()=>{$('balance').value=prefs.balance;$('settings').showModal()};$('closeSettings').onclick=()=>$('settings').close();
$('chooseSkin').onclick=()=>{showSkinTab(skinTabOf(prefs.skin));$('skinDialog').showModal()};$('closeSkins').onclick=()=>$('skinDialog').close();
$('howTo').onclick=()=>$('howDialog').showModal();$('closeHow').onclick=$('howDone').onclick=()=>$('howDialog').close();
// A tap outside a gallery or form window closes it.
for(const id of ['skinDialog','mapDialog','howDialog','settings'])$(id).addEventListener('click',e=>{const d=e.currentTarget,r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()});
function configure(currency,balance){currency=String(currency).trim();balance=Number(balance);if(!currency||currency.length>12||!Number.isFinite(balance)||balance<0||balance>1e12)throw Error('Проверь валюту и баланс');if(mode==='play')throw Error('Настройки доступны между раундами');prefs.currency=currency;prefs.balance=balance;save();sync();return {currency,balance}}
$('settingsForm').onsubmit=e=>{e.preventDefault();configure(prefs.currency,$('balance').value);$('settings').close()};
// The label updates everywhere as you type; an empty field falls back to the last valid one.
$('currency').oninput=()=>{const c=$('currency').value.trim();if(c){prefs.currency=c;save();sync()}};$('currency').onblur=sync;
document.querySelectorAll('[data-stake]').forEach(b=>b.onclick=()=>{prefs.stake=Number(b.dataset.stake);save();sync()});$('stake').oninput=goalHint;$('stake').onchange=()=>{const n=Number($('stake').value);if(n>0&&n<=1e9){prefs.stake=n;save();sync()}};$('nickname').onchange=()=>{prefs.name=$('nickname').value.trim()||'Player';save();sync()};
let lastPickupTone=0;function tone(f,d=.06){if(!prefs.sound)return;const now=performance.now();if(d<.05&&now-lastPickupTone<65)return;if(d<.05)lastPickupTone=now;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();const o=audioCtx.createOscillator(),g=audioCtx.createGain();o.frequency.value=f;o.type='sine';g.gain.setValueAtTime(.035,audioCtx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioCtx.currentTime+d);o.connect(g);g.connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+d)}catch{}}
let crashNoise=null,lastCrashSound=-1;
function crashSound(volume=1){if(!prefs.sound)return;try{audioCtx??=new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});const t=audioCtx.currentTime;if(t-lastCrashSound<.075)return;lastCrashSound=t;
// Short bass impact with a crisp, descending crackle.
const impact=audioCtx.createOscillator(),low=audioCtx.createGain();impact.type='triangle';impact.frequency.setValueAtTime(260,t);impact.frequency.exponentialRampToValueAtTime(48,t+.22);low.gain.setValueAtTime(.0001,t);low.gain.exponentialRampToValueAtTime(.18*volume,t+.008);low.gain.exponentialRampToValueAtTime(.0001,t+.28);impact.connect(low);low.connect(audioCtx.destination);impact.start(t);impact.stop(t+.3);
if(!crashNoise){crashNoise=audioCtx.createBuffer(1,Math.ceil(audioCtx.sampleRate*.32),audioCtx.sampleRate);const data=crashNoise.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*(1-i/data.length)}
const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),gain=audioCtx.createGain();noise.buffer=crashNoise;filter.type='lowpass';filter.frequency.setValueAtTime(6500,t);filter.frequency.exponentialRampToValueAtTime(600,t+.24);gain.gain.setValueAtTime(.13*volume,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.3);noise.connect(filter);filter.connect(gain);gain.connect(audioCtx.destination);noise.start(t);noise.stop(t+.32);
}catch{}}
function releaseCoins(s){if(s.pulledCoins){for(const c of s.pulledCoins)c.pull=null;s.pulledCoins.clear()}}
function removeCoin(c){if(ArenaCore.removeIndexed(coins,c)){coinGrid.remove(c);if(c.pull?.pulledCoins)c.pull.pulledCoins.delete(c)}}
function spawnCoin(x,y,value){
 if(coins.length>=MAX_COINS){let oldest=null;for(const c of coins)if(!c.pull&&(c.loot||c.boostDrop)&&(!oldest||c.born<oldest.born))oldest=c;if(oldest)removeCoin(oldest);else return null}
 const c={x:x??rand(-R+70,R-70),y:y??rand(-R+70,R-70),value:value??0,r:rand(2.8,5),h:value!==undefined?46:0,phase:rand(0,6.3),slot:coins.length,born:elapsed,pull:null};coins.push(c);coinGrid.insert(c);return c;
}
// Match the current round only when a new rival enters the arena.
function shuffleRivalTiers(){rivalTiers=ArenaCore.rivalRoster()}
// Food and boost are fixed shares of the entry amount; loot keeps its face value.
function lenForValue(v){return 26+65*Math.log2(Math.max(1,v/sessionStake))}
// The player fattens with winnings while the camera stays put (measured from the reference video:
// width ×1.4 at ×4, ×1.8 at ×16, ×2.7 at ×96). Rivals keep the thickness of their spawn tier.
// zoom/minZoom: the camera backs off only slightly as the player fattens, so the snake stays big on screen.
// Videos 1-10: the camera never zooms; it shows ~860 world units across the short side. The player starts at
// ~3.5% of the screen width and is ×4.5 thicker at ×46 (radius ∝ value^.39).
const GROWTH={base:15,power:.42,max:100,ease:3,view:860};
function viewZoom(){return Math.min(W,H)/GROWTH.view}
// Measured body radius in the videos (units): ×1 ≈16, ×10 ≈75, ×31 ≈86, ×57 ≈97 — fast early growth, then a plateau.
function playerRadius(v){const x=Math.max(1,v/sessionStake);return Math.min(GROWTH.max,16+64*(1-Math.exp(-(x-1)/5))+Math.max(0,5.5*Math.log2(x/10)))}
// Rival values depend on their size tier and round time, never on a promised player score.
function rivalSpawnProfile(){if(!rivalTiers.length)shuffleRivalTiers();return ArenaCore.rivalProfile(sessionStake,rivalTiers.pop(),elapsed)}
// Heading whose straight body (laid out behind the head, up to ~2200 units) stays inside the arena.
function fitHeading(x,y){let best=rand(-Math.PI,Math.PI),bestOut=1e9;for(let k=0;k<24;k++){const h=rand(-Math.PI,Math.PI),tx=x-Math.cos(h)*2200,ty=y-Math.sin(h)*2200,out=Math.max(0,Math.abs(tx)-(R-80))+Math.max(0,Math.abs(ty)-(R-80));if(out<bestOut){bestOut=out;best=h}if(out===0)break}return best}
function makeSnake(i){const a=rand(0,6.28),r=i===0?0:rand(400,R-200),x=Math.cos(a)*r,y=Math.sin(a)*r,heading=i===0?0:fitHeading(x,y),profile=i===0?{value:sessionStake,len:26,radius:15}:rivalSpawnProfile(),value=profile.value,len=profile.len,appearance=VIDEO_SKINS[Math.floor(Math.random()*VIDEO_SKINS.length)],p=[];for(let n=0;n<len;n++)p.push({x:x-Math.cos(heading)*n*3,y:y-Math.sin(heading)*n*3});return {id:i,brain:i===0?null:BotAI.createBrain(botKinds[i-1]||'regular'),x,y,a:heading,behavior:['wiggle','square','cruiser','coiler','wiggle','zigzag'][i%6],routeAngle:heading,routeTimer:rand(5,9),weavePhase:rand(0,Math.PI*2),points:p,len,radius:profile.radius,skin:i===0?prefs.skin:appearance.id,color:i===0?(prefs.skin==='neon'?COLORS[prefs.color]:SKINS.find(s=>s.id===prefs.skin).color):appearance.color,name:i===0?prefs.name:['Neon','Mamba','Lucky','Orbit','Sonic','Nova','Ghost','Cobra','Pixel','Venom','Luna','Viper','Ace','Storm'][(i-1)%14],value,target:{x:rand(-R,R),y:rand(-R,R)},nextTurn:0,alive:true,grace:0,drop:0}}
let crowdTimer=0;
function commitSpawn(s,x,y,a){
 s.x=x;s.y=y;s.a=a;s.routeAngle=a;s.routeTimer=rand(5,9);
 s.points=Array.from({length:Math.ceil(bodyPoints(s))},(_,i)=>({x:x-Math.cos(a)*i*PHYS.pitch,y:y-Math.sin(a)*i*PHYS.pitch}));
 s.body=null;s.bodyAcc=0;s.collisionX=x;s.collisionY=y;s.target={x:player.x+rand(-110,110),y:player.y+rand(-110,110)};
 s.nextTurn=3;s.grace=0;s.nearEncounter=false;s.tailRun=0;return true;
}
function trySpawn(s,x,y,a){
 const L=(Math.ceil(bodyPoints(s))-1)*PHYS.pitch,tx=x-Math.cos(a)*L,ty=y-Math.sin(a)*L,margin=s.radius+45;
 if(Math.max(Math.abs(x),Math.abs(y),Math.abs(tx),Math.abs(ty))>R-margin)return false;
 // Keep an opening ahead of the player, including clearance for moving, thick tails.
 if(mode==='play'&&elapsed<.05&&player&&s!==player&&SnakeCollision.segmentDistance2(x,y,tx,ty,player.x,player.y,player.x+650,player.y)<(s.radius+player.radius+170)**2)return false;
 // Test the entire body, not only the head. New snakes are solid immediately.
 if(collisionWorld.hitSegment(x,y,tx,ty,s.radius+30,s))return false;
 return commitSpawn(s,x,y,a);
}
function placeNearby(s,initial=false,slot=0){
 collisionWorld.rebuild(snakes);
 const halfW=W/(2*zoom),halfH=H/(2*zoom),base=initial?slot/5*Math.PI*2:rand(0,Math.PI*2);
 for(let attempt=0;attempt<60;attempt++){
  const a=base+attempt*.31,x=player.x+Math.cos(a)*(initial?Math.max(180,halfW*.78):halfW+170),y=player.y+Math.sin(a)*(initial?Math.max(230,halfH*.76):halfH+170);
  const heading=Math.atan2(player.y-y,player.x-x)+(attempt%2?1:-1)*rand(1.05,1.45);
  if(trySpawn(s,x,y,heading))return true;
 }
 return false;
}
function placeAnywhere(s){
 collisionWorld.rebuild(snakes);
 for(let attempt=0;attempt<180;attempt++)if(trySpawn(s,rand(-R+150,R-150),rand(-R+150,R-150),rand(-Math.PI,Math.PI)))return true;
 return false;
}
function maintainCrowd(dt){crowdTimer-=dt;if(crowdTimer>0)return;crowdTimer=1.2;
// Loot from rivals dying far away piles up (thousands of balls slow phones down): drop distant chains.
for(let i=coins.length-1;i>=0;i--){const c=coins[i];if((c.loot||c.boostDrop)&&!c.pull&&elapsed-c.born>90)removeCoin(c)}const near=snakes.filter(s=>s!==player&&s.alive&&Math.abs(s.x-player.x)<W/(2*zoom)+130&&Math.abs(s.y-player.y)<H/(2*zoom)+130);if(near.length>=2)return;let need=Math.min(1,2-near.length);for(const s of snakes){if(need===0)break;if(s===player||!s.alive||s.tailRun>0||dist(s,player)<650)continue;const offscreen=s.points.every(p=>Math.abs(p.x-camera.x)>W/(2*zoom)+100||Math.abs(p.y-camera.y)>H/(2*zoom)+100);if(offscreen){const newcomer=makeSnake(s.id);if(placeNearby(newcomer,false,s.id)){releaseCoins(s);snakes[snakes.indexOf(s)]=newcomer;need--}}}}
let approachCount=0,tailCrashCooldown=0;
function seed(){player=null;roundDifficulty=prefs.difficulty;roundExitX=ArenaCore.normalizeExitMultiplier(prefs.exitX);botKinds=BotAI.roster(roundDifficulty);shuffleRivalTiers();exitUnlocked=false;deathTrails=[];crowdTimer=0;approachCount=0;tailCrashCooldown=0;snakes=[];coins=[];coinGrid.clear();collisionWorld.clear();amountCache.clear();particles=[];player=makeSnake(0);player.points=Array.from({length:Math.ceil(BODY.start)},(_,i)=>({x:-i*PHYS.pitch,y:0}));snakes.push(player);for(let i=1;i<=BOT_COUNT;i++){const s=makeSnake(i);if(!(i<=3&&placeNearby(s,true,i))&&!placeAnywhere(s)){s.alive=false;s.respawn=.75}snakes.push(s)}for(let n=0;n<900;n++)spawnCoin();/* A small food patch ahead gives the first seconds visible progress. */for(let n=0;n<36;n++){const a=rand(-1.1,1.1),r=rand(60,480);spawnCoin(Math.cos(a)*r,Math.sin(a)*r)}camera={x:player.x,y:player.y}}
function start(){const stake=Number($('stake').value);if(!Number.isFinite(stake)||stake<.01||stake>1e9){$('error').textContent='Укажи сумму входа от 0.01 до 1 000 000 000.';return false}if(stake>prefs.balance){$('error').textContent='Недостаточно баланса. Нажми на него вверху, чтобы изменить.';return false}prefs.difficulty=BotAI.normalize($('difficulty').value);prefs.exitX=ArenaCore.normalizeExitMultiplier($('exitMultiplier').value);prefs.stake=stake;prefs.name=$('nickname').value.trim()||'Player';sessionStake=stake;roundExitX=prefs.exitX;prefs.balance=Math.round((prefs.balance-stake)*1000000)/1000000;save();mode='play';touchPoints.clear();steerPointer=null;touchOrigin=null;paused=false;elapsed=0;kills=0;boost=false;aim={x:1,y:0};zoom=viewZoom();acc=0;last=performance.now();seed();player.a=0;player.points=Array.from({length:Math.ceil(bodyPoints(player))},(_,i)=>({x:-i*PHYS.pitch,y:0}));$('lobby').hidden=true;$('hud').hidden=false;$('error').textContent='';$('result').close();$('winOverlay').hidden=true;tone(500,.12);renderHUD();return true}
$('play').onclick=start;$('again').onclick=()=>{if(!start()){ $('result').close();home()}};
function home(){ $('winOverlay').hidden=true;mode='menu';paused=false;boost=false;$('hud').hidden=true;$('lobby').hidden=false;$('result').close();$('pauseDialog').close();sync();sessionStake=prefs.stake;seed()}
$('home').onclick=home;$('leave').onclick=home;
function finish(success,manual=false){if(mode!=='play'||paused)return;if(success&&(!exitUnlocked||(!manual&&Math.max(Math.abs(player.x),Math.abs(player.y))<R)))return;mode='result';paused=false;boost=false;touchOrigin=null;if(success){prefs.balance=Math.round((prefs.balance+player.value)*1000000)/1000000;save();tone(850,.25);/* videos: HUD stays, dimmed under the overlay; number like 157,737.46 */$('winNumber').textContent=player.value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});$('winOverlay').hidden=false;$('winOverlay').focus();}else{tone(100,.3);$('resultTitle').textContent='YOU DIED';$('resultAmount').textContent=fmt(0);$('resultInfo').textContent='Добыча осталась на арене. Время: '+clock(elapsed)+' · Убрано: '+kills+'. Баланс: '+fmt(prefs.balance);$('result').showModal()}}
$('winOverlay').onclick=home;
$('result').addEventListener('cancel',e=>{e.preventDefault();home()});
function togglePause(){if(mode!=='play')return;paused=!paused;boost=false;touchPoints.clear();steerPointer=null;touchOrigin=null;if(paused)$('pauseDialog').showModal();else $('pauseDialog').close()}
$('pause').onclick=togglePause;$('resume').onclick=togglePause;$('pauseDialog').addEventListener('cancel',e=>{e.preventDefault();togglePause()});addEventListener('blur',()=>{boost=false;if(mode==='play'&&!paused)togglePause()});$('sound').onclick=()=>{prefs.sound=!prefs.sound;$('sound').textContent=prefs.sound?'♪':'♪ ×';$('sound').setAttribute('aria-pressed',String(prefs.sound));save()};
function requestCashout(){if(mode==='play'&&!paused&&exitUnlocked)finish(true,true)}$('progressValue').onclick=requestCashout;
addEventListener('keydown',e=>{if(mode!=='play'||/INPUT|TEXTAREA/.test(e.target.tagName))return;if(['Space','KeyQ','Escape','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();if(e.code==='Escape'&&!e.repeat)togglePause();if(paused)return;if(e.code==='KeyQ')requestCashout();if(e.code==='Space')boost=true;if(e.code==='ArrowUp')aim={x:0,y:-1};if(e.code==='ArrowDown')aim={x:0,y:1};if(e.code==='ArrowLeft')aim={x:-1,y:0};if(e.code==='ArrowRight')aim={x:1,y:0}});addEventListener('keyup',e=>{if(e.code==='Space')boost=false});
const touchPoints=new Map();let steerPointer=null;
canvas.onpointermove=e=>{if(mode!=='play'||paused)return;if(e.pointerType==='touch'){if(e.pointerId!==steerPointer||!touchOrigin)return;const dx=e.clientX-touchOrigin.x,dy=e.clientY-touchOrigin.y;if(Math.hypot(dx,dy)>5)aim={x:dx,y:dy};touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY})}else aim={x:e.clientX-W/2,y:e.clientY-H/2}};
canvas.onpointerdown=e=>{if(mode!=='play'||paused)return;canvas.setPointerCapture(e.pointerId);if(e.pointerType==='touch'){touchPoints.set(e.pointerId,{x:e.clientX,y:e.clientY});if(steerPointer===null){steerPointer=e.pointerId;touchOrigin={x:e.clientX,y:e.clientY}}boost=touchPoints.size>1}else{boost=true;aim={x:e.clientX-W/2,y:e.clientY-H/2}}};
canvas.onpointerup=canvas.onpointercancel=canvas.onlostpointercapture=e=>{touchPoints.delete(e.pointerId);if(e.pointerId===steerPointer){const next=touchPoints.entries().next().value;steerPointer=next?next[0]:null;touchOrigin=next?next[1]:null}boost=e.pointerType==='touch'&&touchPoints.size>1};
function clock(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0')}
function burst(x,y,color,n=10){if(mobileRenderer&&Math.hypot(x-camera.x,y-camera.y)>Math.hypot(W,H)/zoom)return;n=Math.min(n,Math.max(0,(mobileRenderer?180:450)-particles.length));for(let i=0;i<n;i++)particles.push({x,y,vx:rand(-70,70),vy:rand(-70,70),life:rand(.3,.7),color})}
function die(s,killer){if(!s.alive)return;s.alive=false;releaseCoins(s);deathTrails.push({points:s.points.map(p=>({...p})),radius:s.radius,life:.3});// Loot falls as a dense chain of big glossy yellow balls tracing the body (as in the video).
// Video: one rope of balls along the body, each overlapping the previous by about a third.
// Measured: ball radius ≈11 units at any body size, chain ≈2 balls wide (side by side, slightly staggered), step ≈ one radius.
// Video 3 close-up: balls ~1.25x bigger than ours were, chain ≈2.3 balls wide, loosely staggered with a third ball
// every few steps (ragged edge), not a tight double row.
// Videos: a braided rope — balls alternate left/right of the dead body's line (zig-zag), each step ≈0.55 ball,
// side offset ≈0.5 ball, strong overlap, sizes vary ±10%; now and then a ball sits on the centre line.
// His screenshot: a uniform bumpy band ≈2.3 balls wide — rows of 2 (sometimes 3) equal balls, rows ≈0.55 ball apart,
// each row shifted half a ball against the previous one.
// His screenshot, ball by ball: two neat rows of equal balls (hex packing) — in each row balls stand one diameter
// apart, the two rows are ≈0.6 diameter apart and shifted half a ball. No random scatter, no third balls.
// User's reference (1НАШ.png): a dense rope ≈2.3 balls wide — three interleaved rows (left, centre, right),
// balls ≈3.7x a red dot, each row one diameter apart, centre row shifted half a ball.
const ball=16,dia=ball*1.8,totalPath=s.points.length*PHYS.pitch,step=Math.max(dia*1.05,totalPath/128*4),half=dia*.5,lim=R-25,cl=v=>Math.max(-lim,Math.min(lim,v)),put=[],P=s.points;
{let acc=0,n=0;const pat=[-1,.2,1,-.2];for(let k=1;k<P.length&&put.length<128;k++){const a=P[k-1],b=P[k],seg=Math.hypot(b.x-a.x,b.y-a.y);if(seg<1e-6)continue;const ux=(b.x-a.x)/seg,uy=(b.y-a.y)/seg;
 let t=step/4-acc;while(t<=seg){const x=a.x+ux*t,y=a.y+uy*t,side=pat[n%4]+rand(-.15,.15),j=rand(-.1,.1)*dia;put.push([cl(x-uy*half*side+ux*j),cl(y+ux*half*side+uy*j)]);n++;t+=step/4}acc=seg-(t-step/4)}if(!put.length)put.push([cl(s.x),cl(s.y)])}
{const per=s.value/put.length;for(const [x,y] of put){const c=spawnCoin(x,y,per);if(c){c.h=46;c.loot=true;c.r=ball}}}for(let j=0;j<s.points.length;j+=4){const p=s.points[j];burst(p.x,p.y,j%8?'#d8ffff':'#6fffff',2)}burst(s.x,s.y,'#ffffff',18);if(killer===player){tailCrashCooldown=Math.max(tailCrashCooldown,6);kills++}if(s===player)finish(false);else {s.respawn=rand(2,5);if(mode==='play'&&Math.abs(s.x-camera.x)<W/zoom/2+80&&Math.abs(s.y-camera.y)<H/zoom/2+80)crashSound(killer===player?1:.65)}}
function dropBoostPellet(s){const tail=s.points.at(-1);const pellet=spawnCoin(tail.x,tail.y,s.dropValue);if(pellet){pellet.h=0;pellet.r=3.5;pellet.boostDrop=true;}s.dropValue=0;s.drop=0}
// Exact continuous body capsules, shared by collision checks and safe spawning.
const collisionWorld=new SnakeCollision.World(80);
function update(dt){if(paused)return;const playing=mode==='play';if(mode==='result')return;if(playing){elapsed+=dt;maintainCrowd(dt)}
for(let index=0;index<snakes.length;index++){let s=snakes[index];if(!s.alive){s.respawn-=dt;if(s!==player&&s.respawn<=0){const next=makeSnake(s.id);if(placeNearby(next,false,s.id)||placeAnywhere(next))snakes[index]=next;else s.respawn=.75}continue}s.grace-=dt;let targetAngle;
if(s===player&&playing)targetAngle=Math.atan2(aim.y,aim.x);else {s.thinkIn=(s.thinkIn||0)-dt;s.thinkDt=(s.thinkDt||0)+dt;if(s.thinkIn<=0||s.cachedHeading===undefined){s.cachedHeading=botHeading(s,s.thinkDt);s.thinkDt=0;s.thinkIn=s.brain?.reaction??.26}targetAngle=s.cachedHeading;}
// Head and body motion: original slither model from mystake-physics.js.
const fast=s===player&&playing&&boost&&s.value>sessionStake*.25+1e-6;s.collisionX=s.x;s.collisionY=s.y;physStepHead(s,targetAngle,fast,dt);const reach=bodyPoints(s)*PHYS.pitch+150;physStepBody(s,dt,s!==player&&(Math.abs(s.x-camera.x)>W/(2*zoom)+reach||Math.abs(s.y-camera.y)>H/(2*zoom)+reach));if(fast){let cost=ArenaCore.boostCost(s.value,sessionStake,dt);s.len=Math.max(20,s.len+lenForValue(s.value-cost)-lenForValue(s.value));s.value-=cost;s.dropValue=(s.dropValue||0)+cost;s.drop+=dt;if(s.drop>=.7&&s.dropValue>0){dropBoostPellet(s)}}
// Coins near the head (never the body) are sucked into the mouth faster than the snake moves;
// coins out of reach stay where they are instead of trailing behind.
const suck=s.radius*1.6+35,suck2=suck*suck,pullSpeed=Math.max(112,s.velocity||0)+140;
coinGrid.query(s.x,s.y,suck,coinCandidates);const stamp=++coinStamp;for(const c of coinCandidates)c.checkStamp=stamp;
if(s.pulledCoins)for(const c of s.pulledCoins)if(c.slot>=0&&c.checkStamp!==stamp){c.checkStamp=stamp;coinCandidates.push(c)}
for(const c of coinCandidates){coinChecks++;if(c.slot<0)continue;if(c.pull&&!c.pull.alive){c.pull.pulledCoins?.delete(c);c.pull=null}const mine=c.pull===s,dx=s.x-c.x,dy=s.y-c.y;if(!mine&&(Math.abs(dx)>suck||Math.abs(dy)>suck))continue;const d2=dx*dx+dy*dy;
 if(d2<(s.radius+c.r+5)**2){const natural=c.h===0&&!c.boostDrop,gain=natural?ArenaCore.foodValue(sessionStake):c.value,before=s.value;s.value+=gain;s.len+=lenForValue(s.value)-lenForValue(before);if(s===player&&playing){tone(rand(780,1050),.035);burst(c.x,c.y,c.h===46?'#ffd746':'#ff383c',3)}removeCoin(c);if(natural)spawnCoin()}
 else if(mine||(!c.pull&&d2<suck2)){if(!c.pull){c.pull=s;(s.pulledCoins??=new Set()).add(c)}const d=Math.sqrt(d2);if(d>1e-7){const step=Math.min(d,pullSpeed*dt+d*Math.min(1,dt*3));c.x+=dx/d*step;c.y+=dy/d*step;coinGrid.move(c)}}
}

s.len=Math.min(s.len,650);if(s===player&&playing)s.radius+=(playerRadius(s.value)-s.radius)*Math.min(1,dt*GROWTH.ease);else s.radius=s.baseR??=s.radius;
// Crossing the green exit with the player's head banks the round exactly once.
if(s===player&&playing){if(s.value>=ArenaCore.cashoutTarget(sessionStake,roundExitX))exitUnlocked=true;const out=Math.max(Math.abs(s.x),Math.abs(s.y))-R;if(out>=0){if(!exitUnlocked){die(s,null);return}/* videos: the head slides fully under the void, then the win screen */s.grace=1;if(out>=s.radius*1.3){finish(true);return}}}
if(s!==player&&Math.max(Math.abs(s.x),Math.abs(s.y))>R-s.radius&&s.grace<=0)die(s,null);
}
// Sweep each head across its whole step; grace never makes another body intangible.
const deaths=collisionWorld.headDeaths(snakes);for(const [s,killer] of deaths)die(s,killer);

if(playing&&mode==='play'){zoom=viewZoom();camera.x=player.x;camera.y=player.y}else if(mode==='menu'){camera.x=Math.sin(performance.now()/14000)*200;camera.y=Math.cos(performance.now()/16000)*120;zoom=.72}
let liveTrail=0;for(const t of deathTrails)if((t.life-=dt)>0)deathTrails[liveTrail++]=t;deathTrails.length=liveTrail;for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt}let liveParticle=0;for(const p of particles)if(p.life>0)particles[liveParticle++]=p;particles.length=liveParticle;hudTick+=dt;if(hudTick>.15){hudTick=0;if(mode==='play')renderHUD()}}
// Rasterize expensive gradients once, then reuse small GPU-friendly images.
function cachedSprite(key,size,paint){let c=spriteCache.get(key);if(!c){c=document.createElement('canvas');c.width=c.height=size;paint(c.getContext('2d'),size);spriteCache.set(key,c)}return c}
function segment(g,x,y,r,color,alpha){const c=cachedSprite('body:'+color,64,(g,n)=>{const r=n/2-1,x=n/2,y=n/2,grad=g.createRadialGradient(x-r*.3,y-r*.45,r*.1,x,y,r);grad.addColorStop(0,color);grad.addColorStop(.75,color);grad.addColorStop(1,'#17372f');g.fillStyle=grad;g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill()});g.globalAlpha=alpha;g.drawImage(c,x-r,y-r,r*2,r*2);g.globalAlpha=1}
// Food from the video: small glowing red dots, and glossy yellow balls for loot.
// Videos (pixel-measured): gold ball = flat bright yellow with a soft light top-left, barely darker rim;
// red dot = solid pink-red disc (~#e0386a) with a 1-px soft edge and a faint glow, no bright white core.
// Gold ball sampled from videos 1-10: body #f7c40a (warm golden, not lemon), soft highlight #ffe470 up-left,
// deeper #e3a600 towards the lower-right edge, no outline; a faint contact shadow under it separates overlaps.
// Measured on the user's screenshots (his vs ours): matte golden ball, light top (255,218,80) → body (245,193,26)
// → amber bottom (230,167,0); no white specular dot, no dark outline; the edge is soft and fades out.
function foodSprite(gold){return cachedSprite('food5:'+gold,64,(g,n)=>{const r=n/2;if(gold){
 // Reference: light upper-left, golden body, darker amber rim at the lower right so overlapping balls stay separate.
 const b=g.createRadialGradient(r*.82,r*.72,r*.05,r,r,r);b.addColorStop(0,'#ffe36a');b.addColorStop(.3,'#ffd52e');b.addColorStop(.6,'#f8c414');b.addColorStop(.8,'#e8a600');b.addColorStop(.9,'#d38f00');b.addColorStop(.96,'#c98700aa');b.addColorStop(1,'#c9870000');g.fillStyle=b;g.fillRect(0,0,n,n);return}
 const halo=g.createRadialGradient(r,r,0,r,r,r);halo.addColorStop(0,'#ff4d7c');halo.addColorStop(.4,'#e8386a');halo.addColorStop(.55,'#d8305e');halo.addColorStop(.7,'#d8305e40');halo.addColorStop(1,'#d8305e00');g.fillStyle=halo;g.fillRect(0,0,n,n)})}
function tileSprite(variant){return cachedSprite('tile:'+variant,100,(g,n)=>{const size=34;g.translate(n/2,n/2);g.rotate(.08+variant*.025);g.beginPath();for(let k=0;k<6;k++){const a=k*Math.PI/3;k?g.lineTo(Math.cos(a)*size,Math.sin(a)*size):g.moveTo(Math.cos(a)*size,Math.sin(a)*size)}g.closePath();g.shadowColor='#000c';g.shadowBlur=7;g.shadowOffsetY=5;g.fillStyle='#030b14';g.fill();g.shadowBlur=0;g.shadowOffsetY=0;const tile=g.createLinearGradient(0,-size,0,size);tile.addColorStop(0,'#1c2b3a');tile.addColorStop(.45,'#142231');tile.addColorStop(1,'#101b27');g.fillStyle=tile;g.fill();g.strokeStyle='#040d18';g.lineWidth=2.5;g.stroke();g.beginPath();g.moveTo(-size*.49,-size*.84);g.lineTo(size*.48,-size*.84);g.lineTo(size*.96,0);g.strokeStyle='#36537655';g.lineWidth=1;g.stroke()})}
// Cartoon eyes from the video: big white balls with a thin dark rim and a black pupil looking ahead.
// Videos: eye size grows slower than the body (Ø ≈ 15 + 0.7·r units): big eyes sticking out of a thin snake,
// relatively small ones on a fat snake. `r` arrives as body radius ×1.24.
function eyes(g,x,y,a,r){g.save();g.translate(x,y);g.rotate(a);const rb=r/1.24;for(const sign of [-1,1]){const er=7.5+rb*.35,ex=rb*.3,ey=sign*er*1.02;g.fillStyle='#00000055';g.beginPath();g.arc(ex-er*.08,ey+er*.14,er*1.04,0,7);g.fill();const white=g.createRadialGradient(ex-er*.3,ey-er*.35,er*.1,ex,ey,er);white.addColorStop(0,'#ffffff');white.addColorStop(.75,'#f4f4f4');white.addColorStop(1,'#cfcfcf');g.fillStyle=white;g.beginPath();g.arc(ex,ey,er,0,7);g.fill();g.strokeStyle='#1a1a1a';g.lineWidth=Math.max(.8,er*.1);g.stroke();g.fillStyle='#050505';g.beginPath();g.arc(ex+er*.3,ey,er*.5,0,7);g.fill();g.fillStyle='#ffffff';g.beginPath();g.arc(ex+er*.18,ey-er*.17,er*.15,0,7);g.fill()}g.restore()}
function drawSkinDetails(g,s){const skin=s.skin||'neon',r=s.radius;g.save();g.lineCap='round';g.lineJoin='round';
if(skin==='neon'||skin==='lightning'||skin==='lava'){g.strokeStyle=skin==='lava'?'#ffe56d':skin==='lightning'?'#e0f7ff':'#d9ffe9bb';g.shadowColor=skin==='lava'?'#ff4810':s.color;g.shadowBlur=skin==='neon'?4:8;g.lineWidth=skin==='lava'?2:1.4;for(const side of [-1,1]){g.beginPath();for(let i=5;i<s.points.length-5;i+=3){const p=s.points[i],q=s.points[i-3],a=Math.atan2(p.y-q.y,p.x-q.x)+Math.PI/2,offset=r*(.18+(Math.floor(i/3)%2)*.4)*side;const x=p.x+Math.cos(a)*offset,y=p.y+Math.sin(a)*offset;i===5?g.moveTo(x,y):g.lineTo(x,y)}g.stroke()}}
else{for(let i=s.points.length-5;i>=4;i-=skin==='ice'?10:6){const p=s.points[i],q=s.points[i-3],a=Math.atan2(q.y-p.y,q.x-p.x);g.save();g.translate(p.x,p.y);g.rotate(a);if(skin==='skeleton'){g.strokeStyle='#f0eee0';g.lineWidth=Math.max(1.5,r*.16);g.beginPath();g.moveTo(-5,0);g.lineTo(5,0);g.moveTo(0,-r*.86);g.quadraticCurveTo(-r*.65,0,0,r*.86);g.moveTo(3,-r*.72);g.quadraticCurveTo(-r*.4,0,3,r*.72);g.stroke();g.fillStyle='#fffdf0';g.fillRect(-2,-2,5,4)}else if(skin==='ice'){g.fillStyle='#152f40';g.strokeStyle='#9bdeed';g.lineWidth=1.6;g.beginPath();g.moveTo(-8,-r*.72);g.lineTo(4,-r);g.lineTo(10,-r*.4);g.lineTo(10,r*.4);g.lineTo(4,r);g.lineTo(-8,r*.72);g.lineTo(-4,0);g.closePath();g.fill();g.stroke();g.shadowColor='#08f9ff';g.shadowBlur=8;g.fillStyle='#57faff';g.beginPath();g.arc(2,0,r*.25,0,7);g.fill()}else if(skin==='tiger'){g.strokeStyle='#14100b';g.lineWidth=r*.45;g.beginPath();g.moveTo(-4,-r*.88);g.lineTo(1,-r*.26);g.moveTo(4,r*.88);g.lineTo(0,r*.2);g.stroke()}else if(skin==='candy'){g.strokeStyle='#fff1ed';g.lineWidth=r*.55;g.beginPath();g.moveTo(-5,-r*.86);g.lineTo(5,r*.86);g.stroke()}else if(skin==='galaxy'){g.fillStyle=i%12===0?'#83f3ff':'#fce9ff';g.beginPath();g.arc(Math.sin(i)*4,Math.cos(i*1.3)*r*.65,i%12===0?2:1.2,0,7);g.fill()}g.restore()}}g.restore()}
// The glowing badge is painted once into a sprite and redrawn only when its text changes.
// Amount plate above snakes: glass pill with a green cartoon number (Lilita One, no thousands commas).
// Ours is slightly see-through, other snakes' plates more so.
const plateNumbers=new Intl.NumberFormat('en-US',{maximumFractionDigits:0,useGrouping:false}),PLATE_FONT='"Lilita One","Arial Black",Arial,sans-serif';
if(document.fonts&&document.fonts.load)document.fonts.load('14px "Lilita One"').then(()=>amountCache.clear(),()=>{});
// Plate from the video: small dark-green rectangle, thin light-green rim, white bold text "100 044,59 Bs".
// Always two decimals: trimmed zeros made the plate change width (and jump) every frame while boosting.
const videoPlateNumbers=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
function plateLabel(v){return videoPlateNumbers.format(Math.floor(v*100)/100).replace(/\s/g,' ')+(prefs.showCurrency?' '+prefs.currency:'')}
function drawAmount(s){let cached=amountCache.get(s.id);const now=performance.now();const label=cached&&now-cached.checked<100?cached.label:plateLabel(s.value);if(cached&&now-cached.checked>=100)cached.checked=now;
if(!cached||cached.label!==label){if(!cached){cached={c:document.createElement('canvas'),checked:now};amountCache.set(s.id,cached)}const S=2.5,pad=2,c=cached.c,size=17.5,h=29;let g=c.getContext('2d');g.font='bold '+size+'px Arial,Helvetica,sans-serif';let w=Math.ceil(g.measureText(label).width+16);if(cached.w0&&w<cached.w0&&w>cached.w0-16)w=cached.w0;cached.w0=w;const cw=Math.ceil((w+pad*2)*S),ch=Math.ceil((h+pad*2)*S);if(c.width!==cw||c.height!==ch){c.width=cw;c.height=ch}else{g.setTransform(1,0,0,1,0,0);g.clearRect(0,0,cw,ch)}g=c.getContext('2d');g.scale(S,S);g.translate(pad,pad);
 g.fillStyle='#0a3a12';g.beginPath();g.roundRect(0,0,w,h,2);g.fill();g.strokeStyle='#8fd08a';g.lineWidth=1.4;g.stroke();
 g.font='bold '+size+'px Arial,Helvetica,sans-serif';g.textAlign='center';g.textBaseline='middle';g.fillStyle='#e4f6df';g.fillText(label,w/2,h/2+.5);
 cached.label=label;cached.w=w+pad*2;cached.h=h+pad*2}
// Videos: the plate is ~18% of the screen width wide and floats r·.7+45 above the head centre.
const k=1.55,y=(s.renderY??s.y)-(s.renderRadius??s.radius)*.7-45;ctx.drawImage(cached.c,(s.renderX??s.x)-cached.w*k/2,y-cached.h*k/2,cached.w*k,cached.h*k)}
const viewRect={l:0,t:0,r:0,b:0};
// Outside the arena: the map stays, dimmed, with a glow along the edge.
// Locked exit: pulsing red glow and crawling hazard stripes. Open exit: green glow and
// waves of chevrons streaming outward.
let hazardPattern=null;
function drawOutside(g,left,top,vw,vh){
 const L=left,T=top,Rt=left+vw+120,B=top+vh+120;if(L>-R&&T>-R&&Rt<R&&B<R)return;
 const t=performance.now()/1000,open=exitUnlocked,band=280;
 g.save();g.beginPath();g.rect(L,T,Rt-L,B-T);g.rect(-R,-R,2*R,2*R);g.clip('evenodd');
 // As in the videos: beyond the edge there is no map, only a flat dark void.
 g.fillStyle='#05060e';g.fillRect(L,T,Rt-L,B-T);g.restore();return;
 // Edge glow: one gradient strip per side, pulsing.
 const pulse=.75+.25*Math.sin(t*(open?4:2.4)),rgb=open?'0,255,120':'255,28,48',a=(open?.34:.26)*pulse;
 const sides=[[-R,-R-band,2*R,band,0,-R,0,-R-band],[-R,R,2*R,band,0,R,0,R+band],[-R-band,-R,band,2*R,-R,0,-R-band,0],[R,-R,band,2*R,R,0,R+band,0]];
 for(const [x,y,w,h,x0,y0,x1,y1] of sides){const gr=g.createLinearGradient(x0,y0,x1,y1);gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(.35,'rgba('+rgb+','+a*.35+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(x,y,w,h)}
 // Corners: radial glow so the side strips join without a visible step.
 for(const sx of [-1,1])for(const sy of [-1,1]){const cx=sx*R,cy=sy*R;if(cx+sx*band<L&&sx>0||cx+sx*band>Rt&&sx<0||cy+sy*band<T&&sy>0||cy+sy*band>B&&sy<0)continue;const gr=g.createRadialGradient(cx,cy,0,cx,cy,band);gr.addColorStop(0,'rgba('+rgb+','+a+')');gr.addColorStop(.35,'rgba('+rgb+','+a*.35+')');gr.addColorStop(1,'rgba('+rgb+',0)');g.fillStyle=gr;g.fillRect(sx>0?cx:cx-band,sy>0?cy:cy-band,band,band)}
 if(!open){
  if(!hazardPattern){const c=document.createElement('canvas');c.width=c.height=64;const h=c.getContext('2d');h.strokeStyle='#ff2a3c';h.lineWidth=14;for(let k=-64;k<=128;k+=32){h.beginPath();h.moveTo(k,64);h.lineTo(k+64,0);h.stroke()}hazardPattern=g.createPattern(c,'repeat')}
  hazardPattern.setTransform(new DOMMatrix().translate((t*18)%64,0));g.globalAlpha=.07+.03*Math.sin(t*2.4);g.fillStyle=hazardPattern;g.fillRect(L,T,Rt-L,B-T);g.globalAlpha=1;
 }else{
  // Chevrons pointing out of the arena, moving outward and fading.
  const rows=3,span=300,gap=110,sz=16;g.lineCap='round';g.lineJoin='round';
  for(let k=0;k<rows;k++){const d=((t*120+k*span/rows)%span),alpha=Math.min(1,d/40)*(1-d/span);if(alpha<=.02)continue;g.beginPath();
   for(const sgn of [-1,1]){const yEdge=sgn*R+sgn*(30+d);if(yEdge>T-30&&yEdge<B+30)for(let x=Math.ceil(Math.max(L,-R)/gap)*gap;x<Math.min(Rt,R);x+=gap){g.moveTo(x-sz,yEdge-sgn*sz*.7);g.lineTo(x,yEdge);g.lineTo(x+sz,yEdge-sgn*sz*.7)}
    const xEdge=sgn*R+sgn*(30+d);if(xEdge>L-30&&xEdge<Rt+30)for(let y=Math.ceil(Math.max(T,-R)/gap)*gap;y<Math.min(B,R);y+=gap){g.moveTo(xEdge-sgn*sz*.7,y-sz);g.lineTo(xEdge,y);g.lineTo(xEdge-sgn*sz*.7,y+sz)}}
   g.globalAlpha=alpha*.35;g.strokeStyle='#00ff78';g.lineWidth=11;g.stroke();g.globalAlpha=alpha;g.strokeStyle='#b6ffd0';g.lineWidth=4;g.stroke()}
  g.globalAlpha=1;
 }
 g.restore();
}
function render(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#070f18';ctx.fillRect(0,0,W,H);ctx.save();ctx.translate(W/2,H/2);ctx.scale(zoom,zoom);const cx=camera.x,cy=camera.y;ctx.translate(-cx,-cy);const vw=W/zoom,vh=H/zoom,left=cx-vw/2-60,top=cy-vh/2-60;
drawArenaMap(ctx,left,top,vw,vh);
const drawEdge=()=>{
// Videos 1/9: beyond the line is a flat void drawn OVER bodies and plates, so a snake leaving the arena slides under it.
drawOutside(ctx,left,top,vw,vh);
ctx.beginPath();ctx.rect(-R,-R,R*2,R*2);
// Edge as in the videos: a thin mint line with small ticks pointing into the arena (same before and after unlock).
{const lw=2/zoom,pitch=26,depth=10/zoom*.5;ctx.lineWidth=lw;ctx.strokeStyle=exitUnlocked?'#2af283':'#ff445b';ctx.stroke();
 ctx.beginPath();
 for(let t=-R+pitch/2;t<R;t+=pitch){
  if(t>=left-16&&t<=left+vw+136){for(const side of [-1,1]){const y=side*R;if(y<top-16||y>top+vh+136)continue;ctx.moveTo(t,y);ctx.lineTo(t,y-side*depth)}}
  if(t>=top-16&&t<=top+vh+136){for(const side of [-1,1]){const x=side*R;if(x<left-16||x>left+vw+136)continue;ctx.moveTo(x,t);ctx.lineTo(x-side*depth,t)}}
 }
 ctx.lineWidth=lw*.8;ctx.stroke();}
};
const goldSprite=foodSprite(true),redSprite=foodSprite(false);for(const c of coins){if(c.x<left||c.x>left+vw+120||c.y<top||c.y>top+vh+120)continue;const gold=c.h===46;if(gold){const r=c.loot?c.r:7;ctx.drawImage(goldSprite,c.x-r,c.y-r,r*2,r*2)}else ctx.drawImage(redSprite,c.x-7.5,c.y-7.5,15,15);}
for(const trail of deathTrails){ctx.save();ctx.globalAlpha=trail.life/.3;ctx.lineCap='round';originalPath(ctx,trail.points);ctx.strokeStyle='#9bffff55';ctx.lineWidth=trail.radius*2+8;ctx.stroke();ctx.strokeStyle='#f3ffff';ctx.lineWidth=trail.radius*1.5;ctx.stroke();ctx.restore()}
snakeView=viewRect;viewRect.l=left;viewRect.t=top;viewRect.r=left+vw+120;viewRect.b=top+vh+120;
const shown=[],ordered=snakes.slice().sort((a,b)=>a.len-b.len);for(const s of ordered){if(!s.alive)continue;{const m=s.radius+10;if(s.points.every(p=>p.x<left-m||p.x>left+vw+120+m||p.y<top-m||p.y>top+vh+120+m))continue}shown.push(s)}
drawArenaSnakes(ctx,shown,{width:W,height:H,dpr,zoom,x:cx,y:cy});
// Plates sit above every body, as in the video.
if(mode==='play'||mode==='result')for(const s of shown)drawAmount(s);
snakeView=null;drawEdge();

for(const p of particles){ctx.globalAlpha=Math.min(1,p.life*2);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,2,0,7);ctx.fill()}ctx.globalAlpha=1;ctx.restore();if(mode==='play')drawJoystick();}
function oldDrawMap(){const g=$('map').getContext('2d');g.clearRect(0,0,130,130);g.strokeStyle='#3e604a';g.beginPath();g.arc(65,65,60,0,7);g.stroke();for(const s of snakes){if(!s.alive)continue;g.fillStyle=s===player?'#6dffa4':'#576a5d';g.beginPath();g.arc(65+s.x/R*59,65+s.y/R*59,s===player?3.5:1.8,0,7);g.fill()}}
// Top bar from the video: "100,044.63 Bs" green · progress bar (green, yellow after the goal) · "112,500 Bs" white.
function renderHUD(){const value=Math.max(0,player.value),target=ArenaCore.cashoutTarget(sessionStake,roundExitX),percent=Math.min(100,value/target*100),cur=prefs.showCurrency?' '+prefs.currency:'',left=money(value)+cur+(exitUnlocked?' · ✓':''),right=targetNumbers.format(target)+cur;$('progressValue').textContent=left;$('progressTarget').textContent=right;const longest=left.length+right.length;$('hud').style.setProperty('--amount-font',Math.max(8,Math.min(11.5,(W-110)/(longest*.66)))+'px');$('hud').style.setProperty('--lc',left.length);$('earningsFill').style.width=percent+'%';$('earningsFill').classList.toggle('done',exitUnlocked);$('progressValue').title=exitUnlocked?'Забрать: Q или зелёная граница':'Для выхода нужно '+exitLabel(roundExitX);$('earningsProgress').setAttribute('aria-valuenow',value.toFixed(2));$('earningsProgress').setAttribute('aria-valuemax',target);$('earningsProgress').setAttribute('aria-valuetext',fmt(value)+' / '+fmtTarget(target));$('controlsHint').textContent='Мышь / палец — поворот · Space — ускорение · Esc — пауза · Q — забрать при '+exitLabel(roundExitX);$('time').textContent=clock(elapsed);$('length').textContent=Math.floor(player.len);$('kills').textContent=kills;}
let lastPaint=0,slowFrames=0,lastSkinPreview=0;
function frame(t){let gap=last?Math.max(0,t-last):STEP*1000;last=t;if(document.hidden){acc=0;requestAnimationFrame(frame);return}
 const live=mode==='play'&&!paused;debugFrames++;debugTime+=gap;if(debugTime>=500){frameFPS=debugFrames*1000/debugTime;debugFrames=0;debugTime=0}
 if(live&&qualityMode==='auto'){if(gap>22&&gap<150)slowFrames++;else slowFrames=Math.max(0,slowFrames-2);if(slowFrames>=45&&renderScale>.75){renderScale=Math.max(.75,renderScale-.25);resize();slowFrames=0}}
 const before=performance.now();coinChecks=0;if(live){let remaining=Math.min(gap/1000,.08),steps=0;while(remaining>1e-7&&steps<6&&mode==='play'&&!paused){const dt=Math.min(remaining,STEP);update(dt);remaining-=dt;steps++}}
 diagnostics.updateMs=performance.now()-before;lastCoinChecks=coinChecks;
 if(live||t-lastPaint>=1000/30-.5){const a=performance.now();render();diagnostics.renderMs=performance.now()-a;lastPaint=t;if(mode==='menu'&&!stillMotion&&t-lastSkinPreview>=1000/30&&!document.querySelector('dialog[open]')){paintShowcase();lastSkinPreview=t}}
 requestAnimationFrame(frame)
}
document.addEventListener('visibilitychange',()=>{last=0;acc=0;boost=false;if(document.hidden&&mode==='play'&&!paused)togglePause()});
$('quality').value=qualityMode;$('quality').onchange=()=>{qualityMode=$('quality').value;renderScale=QUALITY[qualityMode];slowFrames=0;try{localStorage.setItem('arena-quality',qualityMode)}catch{}resize()};
$('difficulty').onchange=()=>{if(mode!=='menu')return;prefs.difficulty=BotAI.normalize($('difficulty').value);save();syncDifficulty();seed()};
$('exitMultiplier').onchange=()=>{if(mode!=='menu')return;prefs.exitX=ArenaCore.normalizeExitMultiplier($('exitMultiplier').value);save();goalHint();syncExitMultiplier();seed()};
sync();sessionStake=prefs.stake;seed();requestAnimationFrame(frame);
if(document.modelContext?.registerTool){for(const tool of [{name:'read_demo_state',description:'Read the virtual game balance, currency and current round state.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode,currency:prefs.currency,balance:prefs.balance,stake:prefs.stake,roundValue:mode==='play'?player.value:null})},{name:'configure_demo_currency',description:'Set the custom currency label and virtual balance between rounds. No real money is involved.',inputSchema:{type:'object',properties:{currency:{type:'string',minLength:1,maxLength:12},balance:{type:'number',minimum:0,maximum:1e12}},required:['currency','balance'],additionalProperties:false},execute:({currency,balance})=>configure(currency,balance)}]){try{Promise.resolve(document.modelContext.registerTool(tool)).catch(()=>{})}catch{}}}

function drawBotName(s){const name=s.name+s.id;ctx.save();ctx.font='bold 9px Arial';const w=ctx.measureText(name).width+14;ctx.fillStyle='#09161be6';ctx.strokeStyle='#457d8199';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(s.x-w/2,s.y+s.radius+6,w,15,7);ctx.fill();ctx.stroke();ctx.fillStyle='#edf7fb';ctx.textAlign='center';ctx.fillText(name,s.x,s.y+s.radius+17);ctx.restore()}
function drawMap(){const g=$('map').getContext('2d');g.clearRect(0,0,130,130);g.fillStyle='#04121be6';g.fillRect(0,0,130,130);g.strokeStyle='#138c9f';g.lineWidth=1;g.strokeRect(1,1,128,128);g.fillStyle='#38bbd0';g.font='8px monospace';g.fillText('MAP',7,12);for(const s of snakes){if(!s.alive)continue;g.fillStyle=s===player?'#f7ffac':'#59ccdf';for(let i=0;i<s.points.length;i+=12){const p=s.points[i];g.fillRect(65+p.x/R*58,65+p.y/R*58,2,2)}}g.fillStyle='#a8ffcc';g.beginPath();g.arc(65+player.x/R*58,65+player.y/R*58,3,0,7);g.fill()}
// Joystick from the video: thin faint ring, grey translucent knob always visible.
function drawJoystick(){if(!mobileRenderer)return;const x=touchOrigin?.x??W*.76,y=touchOrigin?.y??H*.77;ctx.save();ctx.strokeStyle='#ffffff38';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(x,y,44,0,7);ctx.stroke();let kx=x,ky=y;if(touchOrigin){const p=touchPoints.get(steerPointer)||touchOrigin,dx=p.x-x,dy=p.y-y,d=Math.max(1,Math.hypot(dx,dy)/34);kx=x+dx/d;ky=y+dy/d}const knob=ctx.createRadialGradient(kx-5,ky-6,2,kx,ky,17);knob.addColorStop(0,'#e9edf0c0');knob.addColorStop(1,'#b9c1c8a0');ctx.fillStyle=knob;ctx.strokeStyle='#ffffff70';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(kx,ky,17,0,7);ctx.fill();ctx.stroke();ctx.restore()}

initArenaMaps();
// Warm every skin texture up front so spawning bots never decode mid-round.
for(const s of VIDEO_SKINS)skinTexture(s.id,s.color);
