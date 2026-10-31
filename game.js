const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),hud=document.querySelector('#hud'),overlay=document.querySelector('#overlay');
const heroImage=new Image(), garlicImage=new Image();
heroImage.src='assets/hero.png'; garlicImage.src='assets/garlic.svg';
let assetsReady=false;
Promise.all([heroImage.decode(),heroAnimator.ready,garlicImage.decode(),atmosphere.ready,levelArt.ready,InquisitorArt.ready,document.fonts?.load('32px UpyrGothic')||Promise.resolve()]).then(()=>{assetsReady=true;atmosphere.prepare(platforms,statues);document.querySelector('#play').disabled=false;configureBossMenu();}).catch(()=>{overlay.hidden=false;overlay.querySelector('p').textContent='Не удалось загрузить графику. Откройте игру через npm start или используйте автономный HTML-файл.';});
document.querySelector('#play').disabled=true;
const keys={left:false,right:false,jump:false,attack:false,crouch:false};
const toPlatform=p=>Object.assign([p.x,p.y,p.w,p.h],{id:p.id,kind:p.type,baseX:p.x,baseY:p.y,...p,active:true,collapse:-1,restore:0,dx:0,dy:0});
let groundPlatforms=[],ledgePlatforms=[],platforms=[];
let player,coins,enemies,traps,items,projectiles=[],boss,checkpoint,snapshot,coffinStates=[],statues=[];
let bossDifficulty=progressStore.load().bossDifficulty;
let camera=0,cameraY=0,state='menu',score=0,last=0,clock=0,jumpHeld=false,attackHeld=false;
let kills=0,sword=0,swordRewards=0,damageTaken=0,leverOpen=false,escapeLeft=0,towerTimer=null,towerPassed=false,zoneIndex=0;
let achievementClock=0,safeIdle=0,deathNumber=0,projectileNumber=0,jumpFires=new Set(),achievementJump=false;
let banner={text:'',left:0},cutsceneTime=0,victoryTime=0,paused=false,tutorialDone=new Set();
const ui={zone:document.querySelector('#zone-name'),timer:document.querySelector('#time-count'),kills:document.querySelector('#kill-count'),sword:document.querySelector('#sword-hud'),hint:document.querySelector('#tutorial'),banner:document.querySelector('#banner'),boss:document.querySelector('#boss-hud'),rage:document.querySelector('#rage-meter')};
// One reusable bitmap: transitions never accumulate old frames.
const pageTurn={active:false,elapsed:0,duration:3.6,to:0,snapshot:document.createElement('canvas'),reduced:false};
function clearPageTurn(){pageTurn.active=false;pageTurn.elapsed=0;pageTurn.snapshot.width=pageTurn.snapshot.height=1;}
function beginPageTurn(to){
 pageTurn.snapshot.width=canvas.width;pageTurn.snapshot.height=canvas.height;
 pageTurn.snapshot.getContext('2d').drawImage(canvas,0,0);
 pageTurn.to=to;pageTurn.elapsed=0;pageTurn.reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 pageTurn.duration=3.6;pageTurn.active=true;
}
function drawPageTurn(){
 if(!pageTurn.active)return;
 const t=Math.min(1,pageTurn.elapsed/pageTurn.duration),ease=t*t*(3-2*t),old=pageTurn.snapshot;
 ctx.save();
 if(pageTurn.reduced){ctx.globalAlpha=1-ease;ctx.drawImage(old,0,0,960,510);ctx.globalAlpha=1;}
 if(!pageTurn.reduced){
 const fold=960*(1-ease),curl=Math.sin(Math.PI*t)*155;
 if(fold>0)ctx.drawImage(old,0,0,old.width*fold/960,old.height,0,0,fold,510);
 const shadow=ctx.createLinearGradient(fold,0,Math.min(960,fold+curl+55),0);
 shadow.addColorStop(0,'#000a');shadow.addColorStop(1,'#0000');ctx.fillStyle=shadow;ctx.fillRect(fold,0,curl+55,510);
 if(curl>1){
  // The warm reverse of the leaf bends around the moving spine.
  ctx.beginPath();ctx.moveTo(fold,0);ctx.quadraticCurveTo(fold+curl*.7,35,fold+curl,70*t);ctx.lineTo(fold+curl,510-70*t);ctx.quadraticCurveTo(fold+curl*.7,475,fold,510);ctx.closePath();
  const paper=ctx.createLinearGradient(fold,0,fold+curl,0);paper.addColorStop(0,'#635249');paper.addColorStop(.22,'#d6c4a1');paper.addColorStop(.72,'#eee0bd');paper.addColorStop(1,'#8b7560');ctx.fillStyle=paper;ctx.fill();
  ctx.strokeStyle='#f5e3b980';ctx.lineWidth=1;ctx.stroke();
 }
 }
 const alpha=Math.min(1,t*12,(1-t)*12);ctx.globalAlpha=alpha;ctx.fillStyle='#100d16c9';ctx.fillRect(210,207,540,88);ctx.strokeStyle='#a98a60';ctx.strokeRect(214,211,532,80);
 ctx.fillStyle='#e8d5b0';ctx.textAlign='center';ctx.font='16px UpyrGothic, Georgia';ctx.fillText('СТРАНИЦА '+(pageTurn.to+1),480,237);ctx.font='30px UpyrGothic, Georgia';ctx.fillText(LEVEL1.zones[pageTurn.to].name,480,270,510);ctx.restore();
}
function notify(text,seconds=3){banner={text,left:seconds};}
function makeWorld(){
 groundPlatforms=LEVEL1.ground.map(toPlatform);ledgePlatforms=LEVEL1.ledges.map(toPlatform);platforms=[...groundPlatforms,...ledgePlatforms];
 coins=LEVEL1.coins.map(c=>({...c,taken:false}));items=LEVEL1.items.map(c=>({...c,taken:false}));
 enemies=LEVEL1.enemies.map(e=>({...e,origin:e.x,baseY:e.y,w:38,h:42,dir:1,hp:e.type==='helmet'?2:1,dead:false,death:0,hurt:0,vy:0}));
 traps=LEVEL1.traps.map(t=>({...t,phase:0,active:t.type==='fire',warn:false,shotTime:-1}));
 boss=Inquisitor.create(LEVEL1.boss,bossDifficulty);projectiles=[];statues=Relics.create(LEVEL1);
}
function reset(){
 clearPageTurn();
 atmosphere.reset();heroAnimator.reset();makeWorld();coffinStates=[{id:'start',x:30,y:430,spawnX:70},...LEVEL1.checkpoints.map(cp=>({...cp,spawnX:cp.x}))].map(cp=>({...cp,opened:false,openTime:0}));player={x:70,y:330,w:40,h:80,vx:0,vy:0,ground:false,hp:3,inv:0,face:1,rage:0,attack:0,cooldown:0,support:null,swingSword:false,swordBroke:false};
 score=0;camera=0;cameraY=0;clock=0;jumpHeld=false;attackHeld=false;kills=0;sword=0;swordRewards=0;damageTaken=0;leverOpen=false;escapeLeft=0;towerTimer=null;towerPassed=false;zoneIndex=0;cutsceneTime=0;paused=false;tutorialDone=new Set();
 for(const k in keys)keys[k]=false;checkpoint={id:'start',x:70,y:430};captureCheckpoint();atmosphere.prepare(platforms,statues);notify('Пора вернуть своё!',3);
}
function captureCheckpoint(){snapshot={score,coins:coins.filter(c=>c.taken).map(c=>c.id),items:items.filter(c=>c.taken).map(c=>c.id),kills,sword,swordRewards,enemies:enemies.filter(e=>e.dead).map(e=>e.id),leverOpen,statues:statues.map(s=>({...s,hurt:0}))};}
function restoreRelics(saved){
 statues=Relics.restore(saved,LEVEL1)||statues;
 for(const s of statues)if(s.hp===0&&!items.some(i=>i.id==='blood-'+s.id))items.push(Relics.drop(s));
}
function resumeCheckpoint(){
 if(!assetsReady)return;clearPageTurn();safeIdle=0;achievementJump=false;jumpFires.clear();gameAudio.activate();const saved=snapshot;makeWorld();score=saved.score;kills=saved.kills;sword=saved.sword;swordRewards=saved.swordRewards;leverOpen=saved.leverOpen;restoreRelics(saved.statues);
 for(const c of coins)c.taken=saved.coins.includes(c.id);for(const c of items)c.taken=saved.items.includes(c.id);for(const e of enemies)e.dead=saved.enemies.includes(e.id);
 Object.assign(player,{x:checkpoint.x,y:checkpoint.y-80,h:80,hp:3,vx:0,vy:0,ground:false,inv:2,rage:0,attack:0,cooldown:0,support:null,swingSword:false,swordBroke:false});
 escapeLeft=leverOpen?LEVEL1.escapeSeconds:0;towerTimer=null;towerPassed=checkpoint.x>=LEVEL1.timedSection.end;projectiles=[];camera=Math.max(0,player.x-260);cameraY=Math.min(0,player.y-250);state='playing';paused=false;
 for(const k in keys)keys[k]=false;jumpHeld=false;attackHeld=false;atmosphere.reset();heroAnimator.reset();atmosphere.prepare(platforms,statues);overlay.hidden=true;if(checkpoint.id==='inquisitor-entry'){Inquisitor.engage(boss,true);player.x=boss.arenaStart+45;zoneIndex=4;camera=boss.arenaStart;}notify(checkpoint.id==='inquisitor-entry'?'ПОВТОРИТЬ БОЙ · ИНКВИЗИТОР':'Пробуждение у контрольной точки');
}
function start(){if(!assetsReady)return;progressStore.clearBossCheckpoint();configureBossMenu();menuReturnState=null;document.querySelector('#menu-resume').hidden=true;gameAudio.activate();reset();achievementSystem.start();achievementClock=0;safeIdle=0;deathNumber=0;projectileNumber=0;achievementJump=false;jumpFires.clear();state='playing';overlay.classList.remove('defeat');overlay.hidden=true;document.querySelector('#continue').hidden=true;document.querySelector('#main-menu').hidden=true;}
function finish(win){
 menuReturnState=null;document.querySelector('#menu-resume').hidden=true;
 if(state==='win'||state==='lost')return;
 if(!win&&checkpoint.id==='inquisitor-entry'){persistActiveBoss();Inquisitor.clear(boss);}
 achievementSystem.emit('player_moved',{x:player.x,safeSeconds:safeIdle});
 if(win)achievementSystem.emit('level_completed',{level:'level1'});else achievementSystem.emit('player_died',{id:'death-'+(++deathNumber),elapsed:clock});
 achievementSystem.emit('run_finished',{completed:win});achievementSystem.persist();
 state=win?'win':'lost';banner.left=0;overlay.hidden=false;overlay.classList.toggle('defeat',!win);overlay.querySelector('.eyebrow').textContent=win?'LEVEL 1 — ПРОКЛЯТАЯ ДОРОГА К СКА АРЕНЕ':'НОЧЬ НЕ ПРОЩАЕТ ОШИБОК';overlay.querySelector('h2').textContent=win?'ОХОТА ОКОНЧЕНА':'ВАМПИР ПАЛ!';
 let text=(win?'ОХОТА ОКОНЧЕНА. ТЕПЕРЬ ОХОТНИК — ТЫ. ':'')+`Монеты: ${score}. Побеждено: ${kills}. `;
 if(win){const record=progressStore.save({time:victoryTime||clock,score,kills,damage:damageTaken});text+=`Время: ${formatTime(victoryTime||clock)}. LEVEL 2 — СКОРО.`;if(damageTaken===0)text+=' Достижение: НЕПРОКУСИМЫЙ!';if(!progressStore.available)text+=' Браузер запретил сохранение.';}
 else text+=checkpoint.id==='inquisitor-entry'?'Повтори бой у входа на арену. Инквизитор восстановлен; вступление пропускается.':'Продолжи у гроба или начни новый забег.';
 overlay.querySelector('p').textContent=text;document.querySelector('#play').textContent='Повторить уровень';document.querySelector('#continue').textContent=checkpoint.id==='inquisitor-entry'?'ПОВТОРИТЬ БОЙ':'Продолжить у гроба';document.querySelector('#continue').hidden=win;configureBossMenu();document.querySelector('#main-menu').hidden=false;
}
let menuReturnState=null;
function mainMenu(){if(state==='playing'||state==='cutscene')menuReturnState=state;document.querySelector('#menu-resume').hidden=!menuReturnState;state='menu';paused=false;overlay.hidden=false;overlay.classList.remove('defeat');overlay.querySelector('.eyebrow').textContent='КУБОК ВЕЧНОЙ НОЧИ ЖДЁТ';overlay.querySelector('h2').textContent='UPYR RUN';const p=progressStore.load();overlay.querySelector('p').textContent='Охотники украли Кубок Вечной Ночи. Пройди лес, кладбище, аллею и башню, чтобы открыть ворота СКА Арены.'+(p.completed?` Рекорд: ${p.maxScore}. Лучшее время: ${formatTime(p.bestTime)}.`:'');document.querySelector('#play').textContent='▶ Новая игра';document.querySelector('#continue').hidden=true;document.querySelector('#main-menu').hidden=true;}
function formatTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function hit(){if(player.inv>0||state!=='playing')return;damageTaken++;achievementSystem.emit('player_damaged');safeIdle=0;jumpFires.clear();player.hp--;gameAudio.effect('hurt');player.inv=1.6;atmosphere.burst(player.x+20,player.y+25,'sparks');player.vy=-330;if(player.hp<=0)finish(false);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function activeNear(x,range=1250){return Math.abs(x-player.x)<range;}
function solidRects(){return [...groundPlatforms.filter(p=>activeNear(p[0]+p[2]/2,p[2]+160)).map(p=>({x:p[0],y:p[1],w:p[2],h:p[3]})),...(!leverOpen?[LEVEL1.gate]:[])];}
function setCrouch(){const feet=player.y+player.h;const height=keys.crouch&&player.ground?44:80;if(height===80&&player.h===44&&solidRects().some(r=>overlap({x:player.x,y:feet-80,w:player.w,h:80},r)))return;player.h=height;player.y=feet-height;}
function updatePlatforms(dt){for(const p of ledgePlatforms){const oldX=p[0],oldY=p[1];if(p.kind==='moving'){const offset=Math.sin(clock*Math.PI*2/p.period)*p.amplitude;p[0]=p.baseX+(p.axis==='x'?offset:0);p[1]=p.baseY+(p.axis==='y'?offset:0);}
 if(p.collapse>=0){p.collapse+=dt;if(p.collapse>=.8){p.active=false;p.restore+=dt;if(p.restore>4){p.active=true;p.collapse=-1;p.restore=0;}}}p.dx=p[0]-oldX;p.dy=p[1]-oldY;}}
function attackBox(){const armed=player.attack>0?player.swingSword:sword>0;const reach=armed?96:63;return {x:player.face>0?player.x+player.w-5:player.x-reach+5,y:player.y+8,w:reach,h:Math.max(40,player.h-12)};}
function recordKill(){kills++;if(kills%10===0){sword=5;swordRewards++;notify('Меч получен! Прочность: 5/5');}}
function defeatEnemy(e){if(e.dead)return;e.dead=true;e.death=e.type==='helmet'?.8:.5;e.hurt=0;score+=e.type==='helmet'?3:1;achievementSystem.emit('enemy_killed',{id:e.id});if(e.type==='garlic')achievementSystem.emit('garlic_destroyed',{id:e.id});achievementSystem.emit('coin_collected',{id:'kill-'+e.id,amount:e.type==='helmet'?3:1});recordKill();atmosphere.burst(e.x+19,e.y+20,'garlic');}
function hurtEnemy(e,damage){if(e.dead)return;e.hp-=damage;e.hurt=.3;if(e.hp<=0)defeatEnemy(e);}
function swordHit(target){if(!player.swingSword||sword<=0)return false;sword--;score+=5;achievementSystem.emit('coin_collected',{id:'sword-'+target,amount:5});if(sword===0){player.swordBroke=true;atmosphere.burst(player.x+player.face*50,player.y+35,'sparks');}return true;}
function punch(){
 if(player.cooldown>0||player.h<80)return;
 player.attack=.36;player.swordBroke=false;player.swingSword=sword>0;heroAnimator.strike(player.swingSword,player.rage>0);achievementSystem.emit('player_attacked');safeIdle=0;gameAudio.effect('hit');player.cooldown=.42;tutorialDone.add('attack');const box=attackBox();
 atmosphere.burst(box.x+box.w/2,box.y+20,'sparks');
 for(const s of statues)if(s.hp>0&&overlap(box,Relics.body(s))&&Relics.strike(s)){atmosphere.burst(s.x+s.w/2,s.y-60,'sparks');if(s.hp===0){items.push(Relics.drop(s));notify('Статуэтка разрушена · забери кровь',2);}else notify('Статуэтка · прочность '+s.hp+'/5',.8);}
 for(const e of enemies)if(!e.dead&&CombatGeometry.touches(box,CombatGeometry.enemy(e,clock))){const armed=swordHit(e.id+'-'+e.hp);hurtEnemy(e,armed?2:e.type==='helmet'?1:player.rage>0?2:1);}
 if(Inquisitor.vulnerable(boss)&&overlap(box,boss)){const armed=swordHit('inquisitor-'+boss.hp);const result=Inquisitor.strike(boss,armed?2:1);if(result.killed)recordBossVictory();if(result.phaseChanged)notify(Inquisitor.warning(boss));if(result.interrupted)notify('АТАКА ПРЕРВАНА · ИНКВИЗИТОР ОГЛУШЁН',3);}
 if(player.swordBroke&&sword===0)notify(`Меч сломан. До следующего: ${10-kills%10} побед`);
}
function spawnProjectile(type,x,y,dir=-1,source='trap'){if(projectiles.length>=48)projectiles.shift();projectiles.push({id:'projectile-'+(++projectileNumber),type,x,y,w:type==='stake'?48:32,h:type==='stake'?8:32,vx:dir*(source==='boss'?210:230),life:0,source});}
function updateTraps(dt){
 for(const t of traps){if(!activeNear(t.x))continue;
  if(t.type==='fire'){t.active=!t.cycle||(clock%t.cycle)<t.cycle*.55;if(t.active&&CombatGeometry.touches(player,CombatGeometry.fire(t)))hit();}
  if(t.type==='stake'){
   if(t.shotTime>=0){t.shotTime+=dt;if(t.shotTime>=.6)t.shotTime=-1;}
   const previous=t.phase;t.phase=(t.phase+dt)%t.period;t.warn=t.phase<t.warning;
   if(previous<t.warning&&t.phase>=t.warning){t.shotTime=0;spawnProjectile('stake',t.x-48,t.y,-1);}
  }
  if(t.type==='pendulum'){t.headX=t.x+Math.sin(clock*Math.PI*2/t.period)*145;t.headY=t.y+Math.cos(Math.sin(clock*Math.PI*2/t.period)*.6)*t.length;const box={x:t.headX-t.radius,y:t.headY-t.radius,w:t.radius*2,h:t.radius*2};if(overlap(player,box))hit();}
 }
 for(const p of projectiles){const beforeX=p.x;p.life+=dt;p.x+=p.vx*dt;if(p.type==='garlic')p.y+=Math.sin(p.life*5)*14*dt;
  const contour=p.type==='stake'?CombatGeometry.bolt(p):null;
  if(player.attack>0&&(contour?CombatGeometry.touches(attackBox(),contour):overlap(attackBox(),p))){p.dead=true;atmosphere.burst(p.x+16,p.y+16,p.type==='garlic'?'garlic':'sparks');tutorialDone.add('attack');}
  else if(contour?CombatGeometry.touches(player.h===80?{x:player.x,y:player.y-12,w:player.w,h:player.h+12}:player,contour):overlap(player,p)){p.dead=true;hit();}
  if(!p.dead&&p.type==='stake'&&Math.abs(p.y-player.y)<150){if(p.x<player.x+player.w&&p.x+p.w>player.x)p.dodgeCandidate=true;const passed=p.vx<0?beforeX+p.w>=player.x&&p.x+p.w<player.x:beforeX<=player.x+player.w&&p.x>player.x+player.w;if(passed&&p.dodgeCandidate&&!p.dodgeCounted){p.dodgeCounted=true;achievementSystem.emit('stake_dodged',{id:p.id});}}
 }
 projectiles=projectiles.filter(p=>!p.dead&&p.life<5&&Math.abs(p.x-player.x)<1400);
}
function updateEnemies(dt,prevBottom){for(const e of enemies){e.hurt=Math.max(0,(e.hurt||0)-dt);if(e.dead){e.death=Math.max(0,e.death-dt);continue;}if(!activeNear(e.origin))continue;
 e.x+=e.dir*(e.type==='helmet'?75:65)*dt;if(Math.abs(e.x-e.origin)>e.range)e.dir*=-1;
 if(e.flying)e.y=e.baseY+Math.sin(clock*2.2+e.origin)*20;
 if(e.type==='helmet'){e.y=e.baseY-Math.max(0,Math.sin(clock*1.8+e.origin))*28;}
 const contour=CombatGeometry.enemy(e,clock),body=CombatGeometry.bounds(contour);
 const touching=CombatGeometry.touches(player,contour);
 if(!touching)e.stompProtected=false;
 if(touching&&!e.stompProtected){if(player.vy>0&&prevBottom<body.y+12){e.stompProtected=true;if(e.type==='helmet')hurtEnemy(e,1);else defeatEnemy(e);player.y=Math.min(player.y,body.y-player.h);player.vy=-370;}else hit();}
}}
function saveBossEntry(){
 checkpoint={id:'inquisitor-entry',x:57400,y:430};captureCheckpoint();achievementSystem.persist();
 const saved=progressStore.saveBossCheckpoint({version:1,level:'level1',checkpoint,snapshot,clock,damage:damageTaken,difficulty:bossDifficulty,achievementRun:achievementSystem.runId,coffins:coffinStates.filter(c=>c.opened).map(c=>c.id)});
 player.hp=3;player.inv=Math.max(player.inv,1.5);notify(saved?'Контрольная точка достигнута':'Контрольная точка достигнута · хранилище недоступно, не закрывайте игру',4);configureBossMenu();
}
function persistActiveBoss(){
 const saved=progressStore.load().bossCheckpoint;if(!saved||checkpoint.id!=='inquisitor-entry'||boss.dead)return;
 saved.clock=clock;saved.damage=damageTaken;achievementSystem.persist();progressStore.saveBossCheckpoint(saved);
}
function configureBossMenu(){
 const p=progressStore.load();document.querySelector('#resume-boss').hidden=!p.bossCheckpoint;
 document.querySelector('#replay-boss').hidden=!p.boss.defeated;document.querySelector('#replay-boss').textContent='Инквизитор · '+Inquisitor.difficulties[bossDifficulty].label;document.querySelector('#boss-difficulty').value=bossDifficulty;
}
function restoreBossEntry(replay=false,mode=null){
 if(!assetsReady)return;const p=progressStore.load(),entry=replay?p.bossEntry:p.bossCheckpoint;if(!entry)return;
 bossDifficulty=mode||bossDifficulty||entry.difficulty;progressStore.setBossDifficulty(bossDifficulty);reset();
 checkpoint={...entry.checkpoint};snapshot=entry.snapshot;clock=entry.clock;damageTaken=entry.damage;
 for(const c of coffinStates)if(entry.coffins.includes(c.id)){c.opened=true;c.openTime=.8;}
 if(replay)achievementSystem.start();else achievementSystem.resume(entry.achievementRun);
 entry.difficulty=bossDifficulty;entry.achievementRun=achievementSystem.runId;progressStore.saveBossCheckpoint(entry);resumeCheckpoint();configureBossMenu();
}
function recordBossVictory(){
 if(boss.rewardHandled)return;boss.rewardHandled=true;
 const claimed=achievementSystem.state.stats.inquisitorWins>0;
 const first=progressStore.completeBoss(boss.difficulty,claimed);if(first){score+=1000;bossDifficulty=progressStore.setBossDifficulty(boss.difficulty==='easy'?'normal':'hard');}
 achievementSystem.emit('enemy_killed',{id:'boss-inquisitor'});achievementSystem.emit('boss_defeated',{id:'hunter'});achievementSystem.emit('inquisitor_defeated',{difficulty:boss.difficulty});achievementSystem.emit('level_completed',{level:'level1'});achievementSystem.persist();
 recordKill();victoryTime=clock;progressStore.save({time:clock,score,kills,damage:damageTaken});configureBossMenu();
 notify(first?'ИНКВИЗИТОР ПОВЕРЖЕН · +1000 МОНЕТ · ПОСЛЕДНИЙ УПЫРЬ':'ИНКВИЗИТОР ПОВЕРЖЕН · награда за первую победу уже получена',4);
}
function completeBossBattle(){
 if(boss.victoryHandled)return;boss.victoryHandled=true;recordBossVictory();Inquisitor.clear(boss);projectiles=[];state='cutscene';cutsceneTime=0;
}
function updateBoss(dt){
 if(boss.state==='WAITING'&&player.x>=boss.arenaStart){if(checkpoint.id!=='inquisitor-entry')saveBossEntry();Inquisitor.engage(boss);player.x=Math.max(player.x,boss.arenaStart+45);notify(progressStore.available?'Контрольная точка достигнута · бой сохранён':'Контрольная точка в памяти · хранилище недоступно',2);}
 if(!boss.engaged)return;
 Inquisitor.step(boss,dt,{player,inputs:keys,attackBox:attackBox(),hit,notify,burst:(x,y,kind)=>atmosphere.burst(x,y,kind),paused});
 player.x=Math.max(boss.arenaStart+15,Math.min(boss.arenaEnd-player.w-15,player.x));
 if(boss.state==='VICTORY')completeBossBattle();
}
function updateEvents(dt){
 const current=LEVEL1.zones.findIndex(z=>player.x>=z.start&&player.x<z.end);if(current>=0&&current!==zoneIndex){beginPageTurn(current);zoneIndex=current;notify(LEVEL1.zones[current].name);}
 for(const cp of coffinStates){
  if(cp.opened){cp.openTime=Math.min(.8,cp.openTime+dt);continue;}
  if(Math.abs(player.x-cp.x)<70&&Math.abs(player.y+player.h-cp.y)<22){
   cp.opened=true;cp.openTime=0;
   if(cp.spawnX>=checkpoint.x){checkpoint={id:cp.id,x:cp.spawnX,y:cp.y};captureCheckpoint();notify('ГРОБ ОТКРЫТ · ПРОБУЖДЕНИЕ СОХРАНЕНО');}
  }
 }
 for(const c of coins)if(!c.taken&&!(boss.engaged&&c.x>=boss.arenaStart&&c.x<boss.arenaEnd)&&activeNear(c.x)&&Math.hypot(player.x+20-c.x,player.y+player.h/2-c.y)<35){c.taken=true;score++;achievementSystem.emit('coin_collected',{id:'pickup-'+c.id,amount:1});}
 for(const item of items)if(!item.taken&&activeNear(item.x)&&Math.hypot(player.x+20-item.x,player.y+player.h/2-item.y)<42){item.taken=true;player.rage=10;notify('КРОВАВАЯ ЯРОСТЬ — 10 секунд');}
 if(!towerPassed&&player.x>LEVEL1.timedSection.start&&player.x<LEVEL1.timedSection.end&&player.y<-150&&towerTimer===null){towerTimer=LEVEL1.timedSection.seconds;notify('Механизм запущен! Пройди галерею за 24 секунды.');}
 if(towerTimer!==null){towerTimer-=dt;if(player.x>=LEVEL1.timedSection.end){towerPassed=true;towerTimer=null;}else if(towerTimer<=0){damageTaken++;finish(false);}}
 const l=LEVEL1.lever;if(!leverOpen&&Math.abs(player.x-l.x)<70&&Math.abs(player.y+player.h-l.y)<25){leverOpen=true;escapeLeft=LEVEL1.escapeSeconds;notify('Ворота открыты! Башня рушится — к выходу!',4);}
 if(escapeLeft>0){if(player.x>=LEVEL1.zones[4].start){escapeLeft=0;notify('Ты выбрался из башни!');}else{escapeLeft-=dt;if(escapeLeft<=0){damageTaken++;finish(false);}}}
 if(player.x>=57400&&boss.state==='WAITING'&&checkpoint.id!=='inquisitor-entry')saveBossEntry();
 if(player.x>150)tutorialDone.add('move');if(player.vy<0)tutorialDone.add('jump');if(keys.crouch&&player.ground)tutorialDone.add('crouch');
}
function update(dt){
 if(state!=='playing'||paused)return;
 if(pageTurn.active){pageTurn.elapsed+=dt;if(pageTurn.elapsed>=pageTurn.duration)clearPageTurn();return;}
 for(const s of statues)s.hurt=Math.max(0,s.hurt-dt);
 clock+=dt;banner.left=Math.max(0,banner.left-dt);player.inv=Math.max(0,player.inv-dt);player.rage=Math.max(0,player.rage-dt);player.attack=Math.max(0,player.attack-dt);player.cooldown=Math.max(0,player.cooldown-dt);
 updatePlatforms(dt);if(player.ground&&player.support){const p=platforms.find(p=>p.id===player.support);if(p?.active){player.x+=p.dx;player.y+=p.dy;}else{player.ground=false;player.support=null;}}
 setCrouch();const travelStartX=player.x;player.vx=(boss.state==='INTRO'?0:((keys.right?1:0)-(keys.left?1:0)))*(player.h<80?125:245);if(player.vx)player.face=Math.sign(player.vx);
 if(boss.state!=='INTRO'&&keys.jump&&!jumpHeld&&player.ground&&!keys.crouch){achievementJump=true;jumpFires.clear();player.vy=-590;player.ground=false;player.support=null;}jumpHeld=keys.jump;
 if(boss.state!=='INTRO'&&keys.attack&&!attackHeld)punch();attackHeld=keys.attack;
 player.x=Math.max(0,Math.min(LEVEL1.width-player.w,player.x+player.vx*dt));
 if(['intro','attack','reload'].includes(boss.mode))player.x=Math.max(LEVEL1.boss.arenaStart,Math.min(LEVEL1.boss.arenaEnd-player.w,player.x));
 for(const r of solidRects())if(overlap(player,r)){if(player.vx>0)player.x=r.x-player.w;if(player.vx<0)player.x=r.x+r.w;}
 const wasGrounded=player.ground,prevBottom=player.y+player.h;player.vy+=1550*dt;player.y+=player.vy*dt;player.ground=false;player.support=null;
 if(player.vy>=0){let landing=null,landingY=Infinity;
  for(const p of platforms){if(!p.active)continue;const [x,y,w]=p;if(player.x+player.w>x&&player.x<x+w&&prevBottom<=y-p.dy+.01&&player.y+player.h>=y&&y<landingY){landing=p;landingY=y;}}
  if(landing){player.y=landingY-player.h;player.vy=0;player.ground=true;player.support=landing.id;if(landing.kind==='crumble'&&landing.collapse<0)landing.collapse=0;if(!wasGrounded)atmosphere.burst(player.x+20,landingY,'landing');}
 }else{for(const r of solidRects())if(overlap(player,r)){player.y=r.y+r.h;player.vy=0;}}
 updateEnemies(dt,prevBottom);updateTraps(dt);if(state!=='playing')return;updateEvents(dt);updateBoss(dt);
 if(player.y>600){damageTaken++;finish(false);}trackAchievements(dt,travelStartX,wasGrounded);heroAnimator.update(dt,player.h<80,{ground:player.ground,vy:player.vy,travel:player.x-travelStartX,sword:sword>0,rage:player.rage>0});updateCamera(dt);
}
function trackAchievements(dt,startX,wasGrounded){
 if(state!=='playing')return;
 const stationary=Math.abs(player.x-startX)<.001&&player.ground&&!keys.attack&&player.inv<=0;
 const safe=stationary&&!enemies.some(e=>!e.dead&&Math.abs(e.x-player.x)<260)&&!traps.some(t=>Math.abs(t.x-player.x)<300)&&!projectiles.some(p=>Math.abs(p.x-player.x)<350)&&boss.mode==='waiting';
 safeIdle=safe?safeIdle+dt:0;achievementClock+=dt;
 if(achievementClock>=1){achievementClock=0;achievementSystem.emit('player_moved',{x:player.x,safeSeconds:safeIdle});}
 if(achievementJump&&!player.ground){for(const fire of traps)if(fire.type==='fire'&&fire.active){const b=CombatGeometry.bounds(CombatGeometry.fire(fire));if(player.x+player.w>b.x&&player.x<b.x+b.w&&player.y+player.h<b.y+3)jumpFires.add(fire.id);}}
 if(player.ground&&!wasGrounded){for(const id of jumpFires){const fire=traps.find(t=>t.id===id);if(fire&&player.x>=fire.x+fire.w)achievementSystem.emit('bonfire_jumped',{id});}jumpFires.clear();achievementJump=false;}
}
function updateCamera(dt){camera=boss.engaged?Math.max(boss.arenaStart,Math.min(boss.arenaEnd-960,player.x-380)):Math.max(0,Math.min(LEVEL1.width-960,player.x-260));const target=Math.min(0,player.y-230);cameraY+=(target-cameraY)*Math.min(1,dt*7);}
function updateCutscene(dt){
 const startX=player.x;cutsceneTime+=dt;player.y=430-player.h;
 if(cutsceneTime>1&&cutsceneTime<4){const destination=boss.x-90;player.x+=(Math.sign(destination-player.x))*Math.min(Math.abs(destination-player.x),120*dt);}
 player.face=boss.x>player.x?1:-1;player.vx=(player.x-startX)/Math.max(dt,.001);
 if(cutsceneTime>3)notify('ОХОТА ОКОНЧЕНА. ТЕПЕРЬ ОХОТНИК — ТЫ',.3);
 updateCamera(dt);heroAnimator.update(dt,false,{ground:true,vy:0,travel:player.x-startX,sword:sword>0,rage:player.rage>0});if(cutsceneTime>7.5)finish(true);
}
function shape(path,fill,stroke='#485346',width=2){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.fill(path);if(stroke)ctx.stroke(path);}
function rounded(x,y,w,h,r,fill,stroke){const path=new Path2D();path.roundRect(x,y,w,h,r);shape(path,fill,stroke,2);}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function character(){
 heroAnimator.setState({sword:sword>0,rage:player.rage>0});
 ctx.save();ctx.translate(player.x+20,player.y+player.h);
 const animated=heroAnimator.pose().phase!=='stand';
 const bounce=animated?0:Math.sin(clock*3)*.6;
 ctx.scale(player.face,1);
 if(player.inv>0&&Math.floor(clock*14)%2)ctx.globalAlpha=.35;
 ellipse(0,-1,25,4,'#100b20aa');
 ctx.translate(0,bounce);
 if(!heroAnimator.draw(ctx)&&heroImage.complete&&heroImage.naturalWidth)ctx.drawImage(heroImage,-34,-92,68,92);
 ctx.save();ctx.translate(0,heroAnimator.effectOffset());levelArt.heroEffects(ctx,player,clock,cutsceneTime,state,sword);ctx.restore();
 ctx.restore();
}
function drawGarlic(e){
 const pose=CombatGeometry.garlicPose(e,clock);
 ctx.save();ctx.translate(pose.x,pose.y);ctx.rotate(pose.angle);
 levelArt.garlic(ctx,-24,-25,48,50,clock,e.dir);
 ctx.restore();
}
function draw(){
 ctx.setTransform(canvas.width/960,0,0,canvas.height/510,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 atmosphere.background(ctx,camera,zoneIndex,cameraY);if(boss.engaged)InquisitorArt.background(ctx,boss,clock);levelArt.background(ctx,zoneIndex,camera,cameraY,clock,cutsceneTime);
 ctx.save();if(escapeLeft>0){ctx.translate(Math.sin(clock*32)*1.5,Math.cos(clock*27)*1.2);}ctx.translate(0,-cameraY);
 atmosphere.worldDecor(ctx,camera);ctx.save();ctx.translate(-camera,0);atmosphere.platforms(ctx,camera,cameraY);if(boss.engaged)InquisitorArt.floor(ctx,boss,camera);
 levelArt.world(ctx,{player,camera,cameraY,clock,traps,projectiles,items,checkpoint,coffins:coffinStates,statues,leverOpen,escapeLeft,boss,state,cutsceneTime});
 for(const c of coins){if(c.taken||boss.engaged&&c.x>=boss.arenaStart&&c.x<boss.arenaEnd||c.x<camera-30||c.x>camera+990)continue;const y=c.y+Math.sin(clock*4+c.x)*3;levelArt.coin(ctx,c.x,y,clock);}
 for(const e of enemies)if(activeNear(e.x,1200)&&(!e.dead||e.death>0)){if(e.type==='helmet')levelArt.enemy(ctx,e,clock);else if(!e.dead)drawGarlic(e);}
 character();if(window.debugHitboxes){for(const e of enemies)if(!e.dead&&activeNear(e.x))CombatGeometry.draw(ctx,CombatGeometry.enemy(e,clock),'#7aff82');for(const t of traps)if(t.type==='fire'&&t.active)CombatGeometry.draw(ctx,CombatGeometry.fire(t),'#ffdf5d');for(const p of [...projectiles,...boss.projectiles])if(p.type==='stake'||p.kind==='bolt'||p.kind==='rain')CombatGeometry.draw(ctx,CombatGeometry.bolt(p),'#5deaff');}ctx.restore();atmosphere.effects(ctx,camera);ctx.restore();
 atmosphere.hud(hud,player,score,state==='win'?100:Math.min(100,Math.floor(player.x/LEVEL1.width*100)));renderStatus();drawPageTurn();
}
function renderStatus(){
 ui.zone.textContent=`${zoneIndex+1}/5 · ${LEVEL1.zones[zoneIndex].name}`;ui.timer.textContent=formatTime(clock);ui.kills.textContent=kills;ui.sword.textContent=sword>0?`Меч: ${sword}/5 · +5 монет за попадание`:`До меча: ${10-kills%10} врагов`;
 ui.banner.textContent=banner.left>0?banner.text:'';ui.banner.hidden=banner.left<=0||pageTurn.active;ui.rage.hidden=player.rage<=0;ui.rage.textContent=`Кровавая ярость: ${Math.ceil(player.rage)} с`;
 const hints=[['move','← → / A D — двигайся',0,700],['jump','Пробел / ↑ — перепрыгни яму',700,1350],['attack','F — ударь чеснок',1350,2200],['crouch','↓ / S — присядь под колом',2200,3100]];
 const hint=hints.find(([key,text,a,b])=>!tutorialDone.has(key)&&player.x>=a&&player.x<b);ui.hint.textContent=hint?.[1]||'';ui.hint.hidden=!hint;
 ui.boss.hidden=!boss.engaged||state!=='playing';
 document.querySelector('#boss-health').max=boss.maxHp;document.querySelector('#boss-health').value=boss.hp;
 document.querySelector('#boss-health-value').textContent=`${boss.hp} / ${boss.maxHp} · ФАЗА ${boss.phase} · ${Inquisitor.difficulties[boss.difficulty].label}`;
 document.querySelector('#boss-warning').textContent=Inquisitor.warning(boss);
 document.querySelector('#hunter-attention').value=boss.attention*100;document.querySelector('#hunter-attention-value').textContent=`ВНИМАНИЕ ОХОТНИКА ${Math.floor(boss.attention*100)}%`;
 ui.boss.dataset.vulnerable=String(Inquisitor.vulnerable(boss));

 document.querySelector('#escape-timer').textContent=escapeLeft>0?`Побег: ${Math.ceil(escapeLeft)} с`:towerTimer!==null?`Галерея: ${Math.ceil(towerTimer)} с`:'';
 document.querySelector('#pause').textContent=paused?'Продолжить':'Пауза';
}
let accumulator=0;
function frame(t){const dt=Math.min((t-last)/1000||0,.1);last=t;achievementSystem.tick(dt);if(typeof achievementUI!=='undefined')achievementUI.tick(dt);if(!paused){atmosphere.tick(dt);levelArt.tick(dt);accumulator=Math.min(accumulator+dt,.12);while(accumulator>=1/120){if(state==='playing')update(1/120);else if(state==='cutscene')updateCutscene(1/120);accumulator-=1/120;}}gameAudio.tick(dt,!paused&&!pageTurn.active&&state==='playing',player.ground&&Math.abs(player.vx)>0);draw();requestAnimationFrame(frame);}
function resize(){canvas.width=960*Math.min(devicePixelRatio||1,2);canvas.height=510*Math.min(devicePixelRatio||1,2);}resize();window.addEventListener('resize',resize);
const physicalKeys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyF:'attack',ArrowDown:'crouch',KeyS:'crouch'};
const mapping={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'jump',ArrowUp:'jump',w:'jump',W:'jump',f:'attack',F:'attack',ArrowDown:'crouch',s:'crouch'};
function releaseKeys(){for(const key in keys)keys[key]=false;}
window.addEventListener('keydown',e=>{if(!document.querySelector('#achievements-panel').hidden||!document.querySelector('#settings-panel').hidden)return;if(e.target.matches?.('button,input,textarea')&&e.key===' ')return;const key=physicalKeys[e.code]||mapping[e.key];if(key){e.preventDefault();keys[key]=true;}if(e.code==='Escape'&&state==='playing')paused=!paused;});
window.addEventListener('keyup',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key)keys[key]=false;});
window.addEventListener('blur',()=>{releaseKeys();if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){persistActiveBoss();releaseKeys();if(state==='playing')paused=true;}});
for(const b of document.querySelectorAll('[data-key]')){const pointers=new Set();b.addEventListener('pointerdown',e=>{e.preventDefault();pointers.add(e.pointerId);b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{pointers.delete(e.pointerId);keys[b.dataset.key]=pointers.size>0;});}
document.querySelector('#play').onclick=start;document.querySelector('#reset').onclick=start;document.querySelector('#continue').onclick=resumeCheckpoint;document.querySelector('#main-menu').onclick=mainMenu;document.querySelector('#pause').onclick=()=>{if(state==='playing'){paused=!paused;releaseKeys();}};
document.querySelector('#sound').onclick=gameAudio.toggle;gameAudio.syncButton();
try{window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();}catch{}reset();requestAnimationFrame(frame);

// Menu controls share the existing game and audio state.
document.querySelector('#menu-open').onclick=()=>{releaseKeys();mainMenu();};
document.querySelector('#menu-resume').onclick=()=>{if(menuReturnState){state=menuReturnState;menuReturnState=null;paused=false;overlay.hidden=true;releaseKeys();}};
let settingsPaused=false;
document.querySelector('#settings-open').onclick=()=>{settingsPaused=paused;paused=true;releaseKeys();document.querySelector('#settings-panel').hidden=false;document.querySelector('#settings-close').focus?.();};
function closeSettings(){document.querySelector('#settings-panel').hidden=true;paused=settingsPaused;document.querySelector('#settings-open').focus?.();}
document.querySelector('#settings-close').onclick=closeSettings;
document.querySelector('#settings-sound').onclick=gameAudio.toggle;
document.querySelector('#settings-panel').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeSettings();}if(e.key==='Tab'){const controls=[...document.querySelector('#settings-panel').querySelectorAll('button,select')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});

window.addEventListener('pagehide',persistActiveBoss);
document.querySelector('#resume-boss').onclick=()=>restoreBossEntry(false);
document.querySelector('#replay-boss').onclick=()=>restoreBossEntry(true,bossDifficulty);
document.querySelector('#boss-difficulty').value=bossDifficulty;
document.querySelector('#boss-difficulty').onchange=e=>{bossDifficulty=progressStore.setBossDifficulty(e.target.value);if(!boss.engaged)boss=Inquisitor.create(LEVEL1.boss,bossDifficulty);configureBossMenu();};
