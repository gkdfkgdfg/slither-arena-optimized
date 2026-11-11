'use strict';
// Movement model ported from prod/backend/src (referencePhysics.ts, steeringPhysics.ts,
// referenceBody.ts). It follows the original slither client: eased speed, size-dependent
// turning and a knot-based body whose old points relax towards the head.
const PHYS=Object.freeze({
 nsp1:5.39,nsp2:.4,nsp3:14,fps:125,       // speed = nsp * fps / 4 → cruise ≈181, boost ≈437 units/s
 mamu:.033,spangdv:4.8,                    // turn cap per logical frame
 accel:-Math.log(.92)*120,                 // speed easing rate, 1/s
 knot:42,relax:.43,correction:52/125,      // body knots, relaxation, cosine correction time
 pitch:112/60                              // spacing of output body points (MyStake's original step)
});
const physScale=s=>Math.min(6,Math.max(1,s.radius/15));
// Measured in videos 1-10 (camera shift from static red dots, 0.3-0.5 s windows; 1 video px = 1.49 units):
// the player runs 180-360 px/s (cruise ≈330, boost ≈540 units/s) and turns up to ~450°/s at any size;
// rivals (tracked by their price plates) move ≈165 px/s ≈ 245 units/s.
const VIDEO_MOVE={cruise:370,boost:540,turn:9,bot:245,botTurn:4.5};
function physCruise(s){return typeof player!=='undefined'&&s===player?VIDEO_MOVE.cruise:VIDEO_MOVE.bot*(s.brain?.speedScale??1)}
function physBoost(){return VIDEO_MOVE.boost}
function physTurnRate(s,boosting){return typeof player!=='undefined'&&s===player?VIDEO_MOVE.turn:VIDEO_MOVE.botTurn*(s.brain?.turnScale??1)}
/** Head integrator: capped shortest turn, eased speed, straight advance. */
function physStepHead(s,targetAngle,boosting,dt){
 const turn=physTurnRate(s,boosting)*dt,da=Math.atan2(Math.sin(targetAngle-s.a),Math.cos(targetAngle-s.a));
 s.a+=Math.max(-turn,Math.min(turn,da));
 const target=boosting?physBoost():physCruise(s);if(s.velocity===undefined)s.velocity=physCruise(s);
 s.velocity+=(target-s.velocity)*(1-Math.exp(-PHYS.accel*dt));
 s.x+=Math.cos(s.a)*s.velocity*dt;s.y+=Math.sin(s.a)*s.velocity*dt;
}

// ---- Reference body (port of referenceBody.ts) ----
const BODY_EPS=1e-7;
function bodyWrite(points,i,x,y){const p=points[i];if(p){p.x=x;p.y=y}else points[i]={x,y}}
function bodyRecycle(st,knot){for(const c of knot.corrections)st.correctionPool.push(c);knot.corrections.length=0;st.knotPool.push(knot)}
function bodyKnot(st,x,y){const k=st.knotPool.pop()||{x,y,ltn:1,corrections:[]};k.x=x;k.y=y;k.ltn=1;return k}
function bodyCorrect(st,knot,dx,dy,event){if(Math.abs(dx)+Math.abs(dy)<BODY_EPS)return;const c=st.correctionPool.pop();if(c){c.dx=dx;c.dy=dy;c.event=event;knot.corrections.push(c)}else knot.corrections.push({dx,dy,event})}
function bodyEmit(st,x,y,time,maxKnots){
 const knot=bodyKnot(st,x,y),prev=st.knots[0];if(prev)knot.ltn=Math.hypot(x-prev.x,y-prev.y)/PHYS.knot;
 st.knots.unshift(knot);const event={time,weight:1};st.events.push(event);
 // Each older point follows the already updated point ahead of it.
 // Relaxing pulls a curved body inwards. A fat body circling in place used to spiral its tail tighter
 // than its own thickness and tear on screen, so a bend already as tight as the body stops relaxing.
 // The brake never lets a knot relax more than the one ahead of it, otherwise it catches up and makes a corner.
 const minR=st.minR||0;let brake=1;
 for(let i=3;i<st.knots.length;i++){const k=st.knots[i],ahead=st.knots[i-1];let amount=PHYS.relax*Math.min(i-2,4)/4;
  const behind=st.knots[i+1];if(minR>0&&behind){const ax=ahead.x-k.x,ay=ahead.y-k.y,bx=behind.x-k.x,by=behind.y-k.y,cx=ahead.x-behind.x,cy=ahead.y-behind.y,area=Math.abs(ax*by-ay*bx),rad=area>1e-6?Math.sqrt((ax*ax+ay*ay)*(bx*bx+by*by)*(cx*cx+cy*cy))/(2*area):1e9;brake=Math.min(brake,Math.max(0,Math.min(1,(rad-minR)/(minR*.6))))}
  amount*=brake;const dx=(ahead.x-k.x)*amount,dy=(ahead.y-k.y)*amount;k.x+=dx;k.y+=dy;bodyCorrect(st,k,dx,dy,event)}
 while(st.knots.length>maxKnots)bodyRecycle(st,st.knots.pop());
}
/** Builds a body from a head-to-tail centreline. */
function createBody(path,head){
 const st={knots:[],head:{x:head.x,y:head.y},time:0,sinceKnot:0,output:[],events:[],correctionPool:[],knotPool:[],controls:[],spans:[],samples:[],neck:{points:[],distances:[]},targetLength:undefined,lengthCorrections:[]};
 st.knots.push(bodyKnot(st,head.x,head.y));let prev=head,carry=0;
 for(const next of path){const dx=next.x-prev.x,dy=next.y-prev.y,d=Math.sqrt(dx*dx+dy*dy);if(d>BODY_EPS){let off=PHYS.knot-carry;while(off<=d+BODY_EPS){const t=Math.min(1,off/d);st.knots.push(bodyKnot(st,prev.x+dx*t,prev.y+dy*t));off+=PHYS.knot}carry=d-(off-PHYS.knot)}prev=next}
 const last=st.knots[st.knots.length-1];if((last.x-prev.x)**2+(last.y-prev.y)**2>BODY_EPS)st.knots.push(bodyKnot(st,prev.x,prev.y));
 if(st.knots.length<2)st.knots.push(bodyKnot(st,head.x-PHYS.knot,head.y));
 for(let i=0;i<st.knots.length-1;i++)st.knots[i].ltn=Math.hypot(st.knots[i].x-st.knots[i+1].x,st.knots[i].y-st.knots[i+1].y)/PHYS.knot;
 return st;
}
/** Advances the body to the new head; returns evenly spaced points, head first (array is reused). */
function updateBody(st,head,dt,segmentCount,pitch){
 const step=Math.max(0,dt),end=st.time+step,targetCount=Math.max(2,segmentCount),P=Math.max(.5,pitch),K=PHYS.knot,D=PHYS.correction;
 // Length changes ease in over the correction time instead of revealing tail at once.
 if(st.targetLength!==undefined&&targetCount!==st.targetLength)st.lengthCorrections.push({delta:targetCount-st.targetLength,time:st.time});
 st.targetLength=targetCount;let count=targetCount,live=0;
 for(const c of st.lengthCorrections){const age=end-c.time;if(age<D){count-=c.delta*.5*(1+Math.cos(Math.PI*age/D));st.lengthCorrections[live++]=c}}st.lengthCorrections.length=live;
 const maxKnots=Math.ceil(Math.max(count,targetCount))+3,dx=head.x-st.head.x,dy=head.y-st.head.y,dist=Math.sqrt(dx*dx+dy*dy);
 if(dist>BODY_EPS){let off=K-st.sinceKnot;while(off<=dist+BODY_EPS){const f=Math.min(1,off/dist);bodyEmit(st,st.head.x+dx*f,st.head.y+dy*f,st.time+step*f,maxKnots);off+=K}st.sinceKnot=dist-(off-K)}
 st.time=end;st.head.x=head.x;st.head.y=head.y;while(st.knots.length>maxKnots)bodyRecycle(st,st.knots.pop());
 live=0;for(const e of st.events){const age=Math.max(0,end-e.time);e.weight=age>=D?0:.5*(1+Math.cos(Math.PI*age/D));if(e.weight>0)st.events[live++]=e}st.events.length=live;
 const tailIndex=Math.max(0,Math.min(st.knots.length-1,count-1-st.sinceKnot/K)),whole=Math.floor(tailIndex),frac=tailIndex-whole;
 const controls=st.controls,spans=st.spans;spans[0]=1;let cc=0;bodyWrite(controls,cc++,head.x,head.y);
 for(let i=0;i<st.knots.length;i++){const k=st.knots[i];let x=k.x,y=k.y,kept=0;const n=k.corrections.length;
  for(let j=0;j<n;j++){const c=k.corrections[j];if(c.event.weight<=0)st.correctionPool.push(c);else{x-=c.dx*c.event.weight;y-=c.dy*c.event.weight;if(kept!==j)k.corrections[kept]=c;kept++}}
  if(kept!==n)k.corrections.length=kept;
  if(i<=whole){const p=controls[cc-1];if((p.x-x)**2+(p.y-y)**2>BODY_EPS){spans[cc]=k.ltn;bodyWrite(controls,cc++,x,y)}}
  else if(i===whole+1&&frac>BODY_EPS){const p=controls[cc-1];bodyWrite(controls,cc++,p.x+(x-p.x)*frac,p.y+(y-p.y)*frac)}
 }
 controls.length=cc;spans.length=cc;
 const out=st.output;let oc=0,carry=0,lx=head.x,ly=head.y;bodyWrite(out,oc++,head.x,head.y);
 const lineTo=(x,y)=>{const ddx=x-lx,ddy=y-ly,d=Math.sqrt(ddx*ddx+ddy*ddy);if(d>BODY_EPS){let off=P-carry;while(off<=d+BODY_EPS){const t=Math.min(1,off/d);bodyWrite(out,oc++,lx+ddx*t,ly+ddy*t);off+=P}carry=d-(off-P)}lx=x;ly=y};
 if(cc===2)lineTo(controls[1].x,controls[1].y);
 else if(cc>2){
  // Quadratic curve through knot midpoints, sampled in knot parameter, then the neck is redistributed.
  const S=st.samples;let used=0;const add=(x,y)=>bodyWrite(S,used++,x,y);add(head.x,head.y);
  const newest=controls[1],d=Math.hypot(head.x-newest.x,head.y-newest.y),nkr=d/K,partial=Math.max(0,1-nkr);
  const px=d>K?newest.x+(head.x-newest.x)/nkr:head.x,py=d>K?newest.y+(head.y-newest.y)/nkr:head.y;
  let sx=(px+newest.x)/2,sy=(py+newest.y)/2;sx+=(px-sx)*partial;sy+=(py-sy)*partial;
  const d2=Math.hypot(head.x-sx,head.y-sy),ps=Math.max(.01,P/36),sp=K*ps;let off=sp;
  while(off<d2){const t=off/d2;add(head.x+(sx-head.x)*t,head.y+(sy-head.y)*t);off+=sp}
  let rem=(off-d2)/K;
  for(let i=1;i<cc-1;i++){const c=controls[i],nx=controls[i+1],ex=(c.x+nx.x)/2,ey=(c.y+nx.y)/2,cx=c.x+(i===1?(ex-c.x)*.5*partial:0),cy=c.y+(i===1?(ey-c.y)*.5*partial:0);
   const span=Math.max(BODY_EPS,i===1?.5+nkr-d2/K:(spans[i-1]??1));
   while(rem<span){const t=Math.max(0,rem/span),u=1-t;add(u*u*sx+2*u*t*cx+t*t*ex,u*u*sy+2*u*t*cy+t*t*ey);rem+=ps}
   rem-=span;sx=ex;sy=ey}
  add(controls[cc-1].x,controls[cc-1].y);S.length=used;
  bodyNeck(S,Math.min(used-1,Math.floor(2/ps+2)),st.neck);
  for(let i=1;i<used;i++)lineTo(S[i].x,S[i].y);
 }
 const tail=controls[cc-1];if(tail&&(out[oc-1].x-tail.x)**2+(out[oc-1].y-tail.y)**2>BODY_EPS)bodyWrite(out,oc++,tail.x,tail.y);
 out.length=oc;return out;
}
/** Redistributes the first samples evenly so a tight neck bend keeps uniform spacing. */
function bodyNeck(points,count,scratch){
 const k=Math.min(count,points.length);if(k<3)return;const orig=scratch.points,dist=scratch.distances;
 for(let i=0;i<k;i++){bodyWrite(orig,i,points[i].x,points[i].y);dist[i]=i?Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y):0}
 let total=0;for(let i=0;i<k-1;i++)total+=dist[i];const spacing=total/(k-2);let res=spacing,seg=1;
 for(let i=1;i<k;i++){while(seg<k&&res>=dist[seg]){res-=dist[seg];seg++}if(seg>=k)break;const a=orig[seg-1],b=orig[seg],t=res/dist[seg],blend=(i/k)**2,x=a.x+(b.x-a.x)*t,y=a.y+(b.y-a.y)*t;points[i].x=x+(orig[i].x-x)*blend;points[i].y=y+(orig[i].y-y)*blend;res+=spacing}
}
/** Knot count giving MyStake's straight body length (`len` points at the original 112/60 spacing).
 * Relaxation settles knot gaps at 42, 42, 37.5, 33, 28.5, then 42·(1−0.43) ≈ 23.9. */
const BODY_GAPS=[42,42,37.5,33,28.5];
function bodyKnots(len){let L=len*PHYS.pitch,c=1;for(const g of BODY_GAPS){if(L<=g)return c+L/g;L-=g;c++}return c+L/(PHYS.knot*(1-PHYS.relax))}
/** Visible body length in points. `len` stays the game metric (value, boost cost, HUD). Only the player's
 * body is stretched: same 26 points at the start, about 2400 units at ×96 as in the reference video. */
const BODY={k:2,start:450};
// Videos 1-10: the player starts about one screen long (~840 units) and reaches ~3000 by ×57.
// Rivals in the videos are 1-2 screens long, so their visible body is twice their `len`.
function bodyPoints(s){return s===player?BODY.start+Math.max(0,s.len-26)*BODY.k:Math.min(1100,s.len*2)}
/** Advances a snake's body; (re)builds it whenever `s.points` was replaced by spawn code. */
function physStepBody(s,dt,far=false){
 // Off-screen bodies refresh at 20 Hz (as in prod); the head still moves every step.
 if(far&&s.body&&s.body.output===s.points){s.bodyAcc=(s.bodyAcc||0)+dt;if(s.bodyAcc<1/20)return;dt=s.bodyAcc}s.bodyAcc=0;
 if(!s.body||s.body.output!==s.points){s.body=createBody(s.points,{x:s.x,y:s.y});s.points=s.body.output;updateBody(s.body,{x:s.x,y:s.y},0,bodyKnots(bodyPoints(s)),PHYS.pitch);s.body.targetLength=undefined;s.body.lengthCorrections.length=0}
 s.body.minR=s===player?s.radius*1.1:0;updateBody(s.body,{x:s.x,y:s.y},dt,bodyKnots(bodyPoints(s)),PHYS.pitch);
}
