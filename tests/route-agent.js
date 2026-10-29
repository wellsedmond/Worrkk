/* Test-only input driver. Never changes health, positions, timers, damage or map data. */
function driveLevel(maxSteps=100000){
 const visited=new Set();let continues=0,steps=0,gapIntent=false;const trace=[];
 for(;steps<maxSteps&&state!=='win';steps++){
  if(state==='lost'){if(continues++>=8)break;resumeCheckpoint();gapIntent=false;}
  if(state==='cutscene'){updateCutscene(1/120);continue;}
  if(state!=='playing')break;
  visited.add(zoneIndex);
  if(steps%1200===0)trace.push({x:Math.round(player.x),y:Math.round(player.y),hp:player.hp,t:Math.round(clock),boss:boss.mode,fangs:fangs.size});
  for(const k in keys)keys[k]=false;
  if(player.ground)gapIntent=false;
  let target=LEVEL1.width;
  const cemetery=items.find(i=>i.id==='fang-cemetery'),tower=items.find(i=>i.id==='fang-tower');
  if(!cemetery.taken&&player.x>20200&&player.x<21000)target=cemetery.x-20;
  if(!tower.taken&&player.x>50800&&player.x<51400)target=tower.x-20;
  const fighting=['intro','attack','reload'].includes(boss.mode);
  if(fighting)target=boss.x-50;
  keys.right=player.x<target-3;keys.left=player.x>target+3&&target!==LEVEL1.width;
  const box=attackBox();
  const danger=projectiles.some(p=>p.type==='stake'&&p.x+48>player.x-30&&p.x<player.x+230&&Math.abs(p.y-(player.y+player.h-73))<25);
  const readyStake=fighting&&boss.mode!=='reload'&&(boss.phase===1||boss.phase===3&&boss.shots%2===0&&boss.timer<1.3);
  keys.crouch=player.ground&&(danger||readyStake);
  keys.attack=player.cooldown<=0&&(enemies.some(e=>!e.dead&&overlap(box,e))||walls.some(w=>w.hp>0&&overlap(box,w))||projectiles.some(p=>overlap(box,p))||boss.mode==='reload'&&overlap(box,boss));
  if(!fighting){
   const floor=groundPlatforms.find(p=>player.x>=p[0]&&player.x<p[0]+p[2]);
   const end=floor?floor[0]+floor[2]:0;
   const gap=floor&&!groundPlatforms.some(p=>p!==floor&&Math.abs(p[0]-end)<.01);
   const nearGap=gap&&player.x>end-65;
   const higher=ledgePlatforms.some(p=>p.active&&p[1]<player.y+player.h-2&&p[1]>=player.y+player.h-96&&p[0]-player.x<100&&p[0]+p[2]>player.x+50);
   const fire=traps.some(t=>t.type==='fire'&&t.x>player.x&&t.x-player.x<105&&player.y+player.h>t.y);
   const helmet=enemies.some(e=>!e.dead&&e.type==='helmet'&&e.x>player.x&&e.x-player.x<120&&player.y+player.h>e.y);
   keys.jump=player.ground&&!keys.crouch&&(nearGap||higher||fire||helmet);
   if(keys.jump&&nearGap)gapIntent=true;
   if(!player.ground&&!gapIntent&&gap&&player.x>end-85)keys.right=false;
  }
  update(1/120);atmosphere.tick(1/120);
 }
 return {state,steps,seconds:clock,continues,visited:[...visited],fangs:fangs.size,hp:player.hp,bossHp:boss.hp,leverOpen,trace};
}
