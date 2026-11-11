'use strict';
// Bots forage and avoid bodies; no scheduled suicides or free kills.
function botHeading(s,dt){
 s.routeTimer-=dt;s.weavePhase+=dt*1.3;s.coilCooldown=Math.max(0,(s.coilCooldown||0)-dt);
 // Straight runs broken by sharp right-angle turns (the pink "M" snake in the video).
 if(s.behavior==='square'){s.squareTimer=(s.squareTimer??rand(.8,2))-dt;if(s.squareTimer<=0){s.squareTimer=rand(.9,2.2);s.routeAngle=s.a+(Math.random()<.5?1:-1)*Math.PI/2;s.routeTimer=Math.max(s.routeTimer,3)}}
 if(Math.max(Math.abs(s.x),Math.abs(s.y))>R-270){s.coilTime=0;s.routeAngle=Math.atan2(-s.y,-s.x);s.routeTimer=4}
 else if(s.behavior==='coiler'&&s!==player&&mode==='play'&&player.alive&&boost&&s.coilCooldown===0&&!s.coilTime){
  const dx=player.x-s.x,dy=player.y-s.y,along=dx*Math.cos(s.a)+dy*Math.sin(s.a),side=-dx*Math.sin(s.a)+dy*Math.cos(s.a);
  if(along<15&&along>-190&&Math.abs(side)<95&&Math.cos(player.a-s.a)>.5){s.coilTime=3.8;s.coilCooldown=18;s.coilDir=side>0?-1:1;s.coilCenter={x:s.x-Math.sin(s.a)*75*s.coilDir,y:s.y+Math.cos(s.a)*75*s.coilDir}}
 }
 if(s.routeTimer<=0){s.routeTimer=rand(3,6);s.routeAngle=s.a+rand(-.28,.28);let best=450*450,food=null;for(let j=0;j<coins.length;j+=5){const c=coins[j],dx=c.x-s.x,dy=c.y-s.y,d2=dx*dx+dy*dy,a=Math.atan2(dy,dx),delta=Math.atan2(Math.sin(a-s.a),Math.cos(a-s.a));if(d2<best&&Math.abs(delta)<.6){best=d2;food=c}}if(food)s.routeAngle=Math.atan2(food.y-s.y,food.x-s.x)}
 // 'wiggle' slithers in a wide sine wave (the spotted snakes in the video).
 let route=s.routeAngle+(s.behavior==='zigzag'?Math.sin(s.weavePhase)*.2:s.behavior==='wiggle'?Math.sin(s.weavePhase*2.4)*.95:0);
 if(s.coilTime>0){s.coilTime=Math.max(0,s.coilTime-dt);const a=Math.atan2(s.y-s.coilCenter.y,s.x-s.coilCenter.x)+s.coilDir*.65;route=Math.atan2(s.coilCenter.y+Math.sin(a)*75-s.y,s.coilCenter.x+Math.cos(a)*75-s.x);if(s.coilTime===0){s.routeAngle=s.a;s.routeTimer=4}}
 // Look along possible forward paths. A snake beside or behind us is not a reason to reverse.
 // Look-ahead distances were tuned for speed 112; scale them so reaction time stays the same.
 const k=Math.max(1,(s.velocity||112)/112),look=240*k,far=200*k;
 const nearby=[];
 // Bodies are solid: a rival steers clear of every body, and of the player's body (plus the path its fast
 // head is about to sweep) with an extra margin, turning hard or even back when it has to.
 for(const other of snakes){if(other===s||!other.alive)continue;const mine=other===player,safe=s.radius+other.radius+(mine?40:16),w=mine?2.5:1;
  for(let i=0;i<other.points.length;i+=mine?3:5){const p=other.points[i],dx=p.x-s.x,dy=p.y-s.y;if(dx*dx+dy*dy<look*look)nearby.push({dx,dy,safe,w})}
  if(mine&&mode==='play'){const v=other.velocity||300;for(let t=.1;t<=.7;t+=.1){const dx=other.x+Math.cos(other.a)*v*t-s.x,dy=other.y+Math.sin(other.a)*v*t-s.y;if(dx*dx+dy*dy<look*look)nearby.push({dx,dy,safe,w:3})}}}
 if(!nearby.length)return route;
 let bestAngle=route,bestScore=Infinity;
 for(const offset of [0,.28,-.28,.55,-.55,.85,-.85,1.1,-1.1,1.5,-1.5,2,-2,2.6,-2.6,Math.PI]){const a=route+offset,ux=Math.cos(a),uy=Math.sin(a);let score=Math.abs(offset)*25+Math.abs(Math.atan2(Math.sin(a-s.a),Math.cos(a-s.a)))*9;
 for(const p of nearby){const ahead=p.dx*ux+p.dy*uy;if(ahead<-p.safe*.5||ahead>far)continue;const side=Math.abs(-p.dx*uy+p.dy*ux);if(side<p.safe){score+=(1-Math.max(0,ahead)/look)*(p.safe-side)/p.safe*400*p.w}else if(side<p.safe+16)score+=2}
 if(score<bestScore){bestScore=score;bestAngle=a}}
 return bestAngle;
}
