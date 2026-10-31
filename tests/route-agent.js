/* Reads the same visible tells as a player and writes input keys only. */
function fightInquisitor(){
 for(const k in keys)keys[k]=false;
 const b=boss,center=player.x+player.w/2,side=center<b.x+b.w/2?-1:1,near=b.state==='RECOVERY'||b.state==='STUNNED'||b.state==='HIT'||b.state==='ATTACK'&&b.attack==='charge';
 let distance=near?60:220;
 if(b.state==='ATTACK'&&b.attack==='volley')distance=b.lane<360?60:170;
 if(b.state==='ATTACK'&&['dash','combo','feint','frenzy'].includes(b.attack))distance=320;
 let target=b.x+(side<0?-distance:b.w+distance-player.w),jump=false,crouch=false;
 const threats=[...projectiles,...b.projectiles];
 for(const p of threats){const approaching=p.vx<0?p.x+p.w>=player.x&&p.x<player.x+230:p.vx>0?p.x<=player.x+player.w&&p.x+p.w>player.x-190:false;
  if(!approaching)continue;
  if((p.kind==='bolt'||p.type==='stake')&&p.y<360)crouch=true;
  if((p.kind==='bolt'&&p.y>=360||p.kind==='energy')&&Math.abs(p.x-center)<180)jump=true;
 }
 if(b.state==='ATTACK'&&b.attack==='volley'&&b.lane>360){for(const t of [.85,1.95,3.05]){const time=t-b.stateTime,travel=Math.max(0,Math.abs((b.x+36+b.dir*56)-center)/260);if(time+travel>.06&&time+travel<.25)jump=true;}}
 const dashNow=b.state==='ATTACK'&&(b.attack==='dash'&&b.stateTime>=1&&b.stateTime<1.6||b.attack==='combo'&&b.stateTime>=2.3&&b.stateTime<2.9||b.attack==='frenzy'&&b.stateTime>=.8&&b.stateTime<1.4);
 if(dashNow&&Math.abs(b.x-player.x)<240)jump=true;
 if(b.projectiles.some(p=>p.kind==='garlic'&&Math.abs(p.x-center)<300))target=player.x;
 const dangerous=b.zones.filter(z=>z.age<z.warning+z.activeTime+.2&&['beam','rain','uv','trap'].includes(z.kind));
 for(const z of dangerous){
  if(z.kind==='beam'||z.kind==='rain'){
   if(player.x+player.w>z.x-18&&player.x<z.x+z.w+18){
    const choices=[-300,-210,-140,-90,90,140,210,300].map(d=>player.x+d).filter(x=>x>b.arenaStart+25&&x<b.arenaEnd-70&&!dangerous.some(q=>['beam','rain'].includes(q.kind)&&x+player.w>q.x-20&&x<q.x+q.w+20));
    choices.sort((a,c)=>Math.abs(a-player.x)+Math.abs(a-target)*.08-Math.abs(c-player.x)-Math.abs(c-target)*.08);if(choices.length)target=choices[0];
   }
  }else if(z.kind==='uv'){
   if(player.x+player.w<=z.x)target=Math.min(target,z.x-player.w-15);
   else if(player.x>=z.x+z.w)target=Math.max(target,z.x+z.w+15);
   else target=center<z.x+z.w/2?z.x-player.w-25:z.x+z.w+25;
  }else if(Math.abs(center-(z.x+z.w/2))<90&&(target>player.x+5&&z.x+z.w>player.x||target<player.x-5&&z.x<player.x+player.w)){
   jump=true;const predicted={x:player.x+Math.sign(target-player.x)*18,y:player.y,w:player.w,h:player.h};
   if(overlap(predicted,z)&&player.y+player.h>z.y-4&&player.vy<=0)target=player.x;
  }
 }
 if(b.state==='ATTACK'&&b.attack==='charge')crouch=false;
 keys.right=player.x<target-3;keys.left=player.x>target+3;
 keys.jump=jump&&player.ground;keys.crouch=crouch&&!jump&&player.ground;
 const box=attackBox(),deflect=threats.some(p=>((p.kind==='garlic'||p.kind==='bolt')||p.type==='garlic')&&overlap(box,p));
 if(near&&Math.abs(player.x-target)<6&&Math.abs(target-(b.x+(side<0?-60:b.w+60-player.w)))<10){keys.right=side<0;keys.left=side>0;}
 keys.attack=player.cooldown<=0&&!keys.crouch&&(deflect||near&&Math.abs(center-(b.x+b.w/2))<125);
}

/* Test-only input driver. Never changes health, positions, timers, damage or map data. */
function driveLevel(maxSteps=100000){
 const visited=new Set();let continues=0,steps=0,gapIntent=false;const trace=[];
 for(;steps<maxSteps&&state!=='win';steps++){
  if(state==='lost'){if(continues++>=8)break;resumeCheckpoint();gapIntent=false;}
  if(state==='cutscene'){updateCutscene(1/120);continue;}
  if(state!=='playing')break;
  visited.add(zoneIndex);
  if(boss.engaged){fightInquisitor();update(1/120);atmosphere.tick(1/120);continue;}
  if(steps%1200===0)trace.push({x:Math.round(player.x),y:Math.round(player.y),hp:player.hp,t:Math.round(clock),boss:boss.mode,kills,sword});
  for(const k in keys)keys[k]=false;
  if(player.ground)gapIntent=false;
  let target=LEVEL1.width;
  const fighting=['intro','attack','reload'].includes(boss.mode);
  if(fighting)target=boss.x-50;
  keys.right=player.x<target-3;keys.left=player.x>target+3&&target!==LEVEL1.width;
  const box=attackBox();
  const danger=projectiles.some(p=>p.type==='stake'&&p.x+48>player.x-30&&p.x<player.x+230&&Math.abs(p.y-(player.y+player.h-73))<25);
  const readyStake=fighting&&boss.mode!=='reload'&&(boss.phase===1||boss.phase===3&&boss.shots%2===0&&boss.timer<1.3);
  keys.crouch=player.ground&&(danger||readyStake);
  keys.attack=player.cooldown<=0&&(enemies.some(e=>!e.dead&&CombatGeometry.touches(box,CombatGeometry.enemy(e,clock)))||projectiles.some(p=>overlap(box,p))||boss.mode==='reload'&&overlap(box,boss));
  if(!fighting){
   const floor=groundPlatforms.find(p=>player.x>=p[0]&&player.x<p[0]+p[2]);
   const end=floor?floor[0]+floor[2]:0;
   const gap=floor&&!groundPlatforms.some(p=>p!==floor&&Math.abs(p[0]-end)<.01);
   const nearGap=gap&&player.x>end-65;
   const higher=ledgePlatforms.some(p=>p.active&&!p.optional&&p[1]<player.y+player.h-2&&p[1]>=player.y+player.h-96&&p[0]-player.x<100&&p[0]+p[2]>player.x+50);
   const fire=traps.some(t=>t.type==='fire'&&t.x>player.x&&t.x-player.x<105&&player.y+player.h>t.y);
   const helmet=enemies.some(e=>!e.dead&&e.type==='helmet'&&e.x>player.x&&e.x-player.x<120&&player.y+player.h>e.y);
   keys.jump=player.ground&&!keys.crouch&&(nearGap||higher||fire||helmet);
   if(keys.jump&&nearGap)gapIntent=true;
   if(!player.ground&&!gapIntent&&gap&&player.x>end-85)keys.right=false;
  }
  update(1/120);atmosphere.tick(1/120);
 }
 return {state,steps,seconds:clock,continues,visited:[...visited],kills,sword,swordRewards,hp:player.hp,bossHp:boss.hp,leverOpen,trace};
}
