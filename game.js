const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),hud=document.querySelector('#hud'),overlay=document.querySelector('#overlay');
const heroImage=new Image(), garlicImage=new Image();
heroImage.src='assets/hero.png'; garlicImage.src='assets/garlic.svg';
let assetsReady=false;
Promise.all([heroImage.decode(),heroAnimator.ready,garlicImage.decode(),atmosphere.ready,levelArt.ready]).then(()=>{assetsReady=true;document.querySelector('#play').disabled=false;}).catch(()=>{overlay.hidden=false;overlay.querySelector('p').textContent='Не удалось загрузить графику. Откройте игру через npm start или используйте автономный HTML-файл.';});
document.querySelector('#play').disabled=true;
const keys={left:false,right:false,jump:false,attack:false,crouch:false};
const toPlatform=p=>Object.assign([p.x,p.y,p.w,p.h],{id:p.id,kind:p.type,baseX:p.x,baseY:p.y,...p,active:true,collapse:-1,restore:0,dx:0,dy:0});
let groundPlatforms=[],ledgePlatforms=[],platforms=[];
let player,coins,enemies,traps,items,walls,projectiles=[],boss,checkpoint,snapshot;
let camera=0,cameraY=0,state='menu',score=0,last=0,clock=0,jumpHeld=false,attackHeld=false;
let fangs=new Set(),damageTaken=0,leverOpen=false,escapeLeft=0,towerTimer=null,towerPassed=false,zoneIndex=0;
let banner={text:'',left:0},cutsceneTime=0,victoryTime=0,paused=false,tutorialDone=new Set();
const ui={zone:document.querySelector('#zone-name'),timer:document.querySelector('#time-count'),fangs:document.querySelector('#fang-count'),hint:document.querySelector('#tutorial'),banner:document.querySelector('#banner'),boss:document.querySelector('#boss-hud'),rage:document.querySelector('#rage-meter')};
function notify(text,seconds=3){banner={text,left:seconds};}
function makeWorld(){
 groundPlatforms=LEVEL1.ground.map(toPlatform);ledgePlatforms=LEVEL1.ledges.map(toPlatform);platforms=[...groundPlatforms,...ledgePlatforms];
 coins=LEVEL1.coins.map(c=>({...c,taken:false}));items=LEVEL1.items.map(c=>({...c,taken:false}));walls=LEVEL1.walls.map(w=>({...w}));
 enemies=LEVEL1.enemies.map(e=>({...e,origin:e.x,baseY:e.y,w:38,h:42,dir:1,hp:e.type==='helmet'?2:1,dead:false,death:0,vy:0}));
 traps=LEVEL1.traps.map(t=>({...t,phase:0,active:t.type==='fire',warn:false}));
 boss={...LEVEL1.boss,mode:'waiting',phase:1,shots:0,timer:0,dead:false,death:0,inv:0,retreat:0,retreatStart:LEVEL1.boss.x,targetX:LEVEL1.boss.x};projectiles=[];
}
function reset(){
 atmosphere.reset();heroAnimator.reset();makeWorld();player={x:70,y:330,w:40,h:80,vx:0,vy:0,ground:false,hp:3,inv:0,face:1,rage:0,attack:0,cooldown:0,support:null};
 score=0;camera=0;cameraY=0;clock=0;jumpHeld=false;attackHeld=false;fangs=new Set();damageTaken=0;leverOpen=false;escapeLeft=0;towerTimer=null;towerPassed=false;zoneIndex=0;cutsceneTime=0;paused=false;tutorialDone=new Set();
 for(const k in keys)keys[k]=false;checkpoint={id:'start',x:70,y:430};captureCheckpoint();atmosphere.prepare(platforms);notify('Пора вернуть своё!',3);
}
function captureCheckpoint(){snapshot={score,coins:coins.filter(c=>c.taken).map(c=>c.id),items:items.filter(c=>c.taken).map(c=>c.id),fangs:[...fangs],walls:walls.map(w=>[w.id,w.hp]),enemies:enemies.filter(e=>e.dead).map(e=>e.id),leverOpen};}
function resumeCheckpoint(){
 if(!assetsReady)return;gameAudio.activate();const saved=snapshot;makeWorld();score=saved.score;fangs=new Set(saved.fangs);leverOpen=saved.leverOpen;
 for(const c of coins)c.taken=saved.coins.includes(c.id);for(const c of items)c.taken=saved.items.includes(c.id);for(const w of walls)w.hp=saved.walls.find(a=>a[0]===w.id)?.[1]??w.hp;for(const e of enemies)e.dead=saved.enemies.includes(e.id);
 Object.assign(player,{x:checkpoint.x,y:checkpoint.y-80,h:80,hp:3,vx:0,vy:0,ground:false,inv:2,rage:0,attack:0,cooldown:0,support:null});
 escapeLeft=leverOpen?LEVEL1.escapeSeconds:0;towerTimer=null;towerPassed=checkpoint.x>=LEVEL1.timedSection.end;projectiles=[];camera=Math.max(0,player.x-260);cameraY=Math.min(0,player.y-250);state='playing';paused=false;
 for(const k in keys)keys[k]=false;jumpHeld=false;attackHeld=false;atmosphere.reset();heroAnimator.reset();atmosphere.prepare(platforms);overlay.hidden=true;notify('Пробуждение у контрольной точки');
}
function start(){if(!assetsReady)return;gameAudio.activate();reset();state='playing';overlay.classList.remove('defeat');overlay.hidden=true;document.querySelector('#continue').hidden=true;document.querySelector('#main-menu').hidden=true;}
function finish(win){
 state=win?'win':'lost';banner.left=0;overlay.hidden=false;overlay.classList.toggle('defeat',!win);overlay.querySelector('.eyebrow').textContent=win?'LEVEL 1 — ПРОКЛЯТАЯ ДОРОГА К СКА АРЕНЕ':'НОЧЬ НЕ ПРОЩАЕТ ОШИБОК';overlay.querySelector('h2').textContent=win?'LEVEL COMPLETE!':'ВАМПИР ПАЛ!';
 let text=`Монеты: ${score}. Золотые клыки: ${fangs.size}/3. `;
 if(win){const record=progressStore.save({time:victoryTime||clock,score,fangs:fangs.size,damage:damageTaken});text+=`Время: ${formatTime(victoryTime||clock)}. LEVEL 2 — СКОРО.`;if(damageTaken===0)text+=' Достижение: НЕПРОКУСИМЫЙ!';if(!progressStore.available)text+=' Браузер запретил сохранение.';}
 else text+='Продолжи у гроба или начни новый забег.';
 overlay.querySelector('p').textContent=text;document.querySelector('#play').textContent='Повторить уровень';document.querySelector('#continue').hidden=win;document.querySelector('#main-menu').hidden=false;
}
function mainMenu(){state='menu';paused=false;overlay.hidden=false;overlay.classList.remove('defeat');overlay.querySelector('.eyebrow').textContent='КУБОК ВЕЧНОЙ НОЧИ ЖДЁТ';overlay.querySelector('h2').textContent='UPYR RUN';const p=progressStore.load();overlay.querySelector('p').textContent='Охотники украли Кубок Вечной Ночи. Пройди лес, кладбище, аллею и башню, чтобы открыть ворота СКА Арены.'+(p.completed?` Рекорд: ${p.maxScore}. Лучшее время: ${formatTime(p.bestTime)}.`:'');document.querySelector('#play').textContent='Выйти в ночь →';document.querySelector('#continue').hidden=true;document.querySelector('#main-menu').hidden=true;}
function formatTime(t){return Math.floor(t/60)+':'+String(Math.floor(t%60)).padStart(2,'0');}
function hit(){if(player.inv>0||state!=='playing')return;damageTaken++;player.hp--;gameAudio.effect('hurt');player.inv=1.6;atmosphere.burst(player.x+20,player.y+25,'sparks');player.vy=-330;if(player.hp<=0)finish(false);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function activeNear(x,range=1250){return Math.abs(x-player.x)<range;}
function solidRects(){return [...groundPlatforms.filter(p=>activeNear(p[0]+p[2]/2,p[2]+160)).map(p=>({x:p[0],y:p[1],w:p[2],h:p[3]})),...walls.filter(w=>w.hp>0&&activeNear(w.x)),...(!leverOpen?[LEVEL1.gate]:[])];}
function setCrouch(){const feet=player.y+player.h;const height=keys.crouch&&player.ground?44:80;if(height===80&&player.h===44&&solidRects().some(r=>overlap({x:player.x,y:feet-80,w:player.w,h:80},r)))return;player.h=height;player.y=feet-height;}
function updatePlatforms(dt){for(const p of ledgePlatforms){const oldX=p[0],oldY=p[1];if(p.kind==='moving'){const offset=Math.sin(clock*Math.PI*2/p.period)*p.amplitude;p[0]=p.baseX+(p.axis==='x'?offset:0);p[1]=p.baseY+(p.axis==='y'?offset:0);}
 if(p.collapse>=0){p.collapse+=dt;if(p.collapse>=.8){p.active=false;p.restore+=dt;if(p.restore>4){p.active=true;p.collapse=-1;p.restore=0;}}}p.dx=p[0]-oldX;p.dy=p[1]-oldY;}}
function attackBox(){return {x:player.face>0?player.x+player.w-5:player.x-58,y:player.y+8,w:63,h:Math.max(40,player.h-12)};}
function defeatEnemy(e){e.dead=true;e.death=.5;score+=e.type==='helmet'?3:1;atmosphere.burst(e.x+19,e.y+20,'garlic');}
function punch(){
 if(player.cooldown>0||player.h<80)return;player.attack=.23;gameAudio.effect('hit');player.cooldown=.42;tutorialDone.add('attack');const box=attackBox(),power=player.rage>0?2:1;
 atmosphere.burst(box.x+box.w/2,box.y+20,'sparks');
 for(const e of enemies)if(!e.dead&&overlap(box,e)){e.hp-=power;if(e.hp<=0)defeatEnemy(e);}
 for(const w of walls)if(w.hp>0&&overlap(box,w)){w.hp-=power;atmosphere.burst(w.x+14,w.y+40,'landing');if(w.hp<=0)notify('Тайник открыт. Золотой клык твой!');}
 if(boss.mode==='reload'&&boss.inv<=0&&overlap(box,boss)){boss.hp--;boss.inv=1;atmosphere.burst(boss.x+36,boss.y+50,'sparks');if(boss.hp===0){boss.mode='defeated';boss.dead=true;boss.death=1.6;}else{boss.phase=4-boss.hp;boss.mode='attack';boss.shots=0;boss.timer=2.8;notify(`Охотник: фаза ${boss.phase}`);}}
}
function spawnProjectile(type,x,y,dir=-1,source='trap'){if(projectiles.length>=48)projectiles.shift();projectiles.push({type,x,y,w:type==='stake'?48:32,h:type==='stake'?12:32,vx:dir*(source==='boss'?210:230),life:0,source});}
function updateTraps(dt){
 for(const t of traps){if(!activeNear(t.x))continue;
  if(t.type==='fire'){t.active=!t.cycle||(clock%t.cycle)<t.cycle*.55;if(t.active&&overlap(player,t))hit();}
  if(t.type==='stake'){const previous=t.phase;t.phase=(t.phase+dt)%t.period;t.warn=t.phase<t.warning;if(previous<t.warning&&t.phase>=t.warning)spawnProjectile('stake',t.x,t.y,-1);}
  if(t.type==='pendulum'){t.headX=t.x+Math.sin(clock*Math.PI*2/t.period)*145;t.headY=t.y+Math.cos(Math.sin(clock*Math.PI*2/t.period)*.6)*t.length;const box={x:t.headX-t.radius,y:t.headY-t.radius,w:t.radius*2,h:t.radius*2};if(overlap(player,box))hit();}
 }
 for(const p of projectiles){p.life+=dt;p.x+=p.vx*dt;if(p.type==='garlic')p.y+=Math.sin(p.life*5)*14*dt;
  if(player.attack>0&&overlap(attackBox(),p)){p.dead=true;atmosphere.burst(p.x+16,p.y+16,p.type==='garlic'?'garlic':'sparks');tutorialDone.add('attack');}
  else if(overlap(player,p)){p.dead=true;hit();}
 }
 projectiles=projectiles.filter(p=>!p.dead&&p.life<5&&Math.abs(p.x-player.x)<1400);
}
function updateEnemies(dt,prevBottom){for(const e of enemies){if(e.dead){e.death=Math.max(0,e.death-dt);continue;}if(!activeNear(e.origin))continue;
 e.x+=e.dir*(e.type==='helmet'?75:65)*dt;if(Math.abs(e.x-e.origin)>e.range)e.dir*=-1;
 if(e.flying)e.y=e.baseY+Math.sin(clock*2.2+e.origin)*20;
 if(e.type==='helmet'){e.y=e.baseY-Math.max(0,Math.sin(clock*1.8+e.origin))*28;}
 if(overlap(player,e)){if(player.vy>0&&prevBottom<e.y+12){defeatEnemy(e);player.vy=-370;}else hit();}
}}
function updateBoss(dt){
 if(boss.mode==='waiting'&&player.x>=LEVEL1.boss.arenaStart){boss.mode='intro';boss.timer=3;notify('ТЕБЕ ТУДА НЕЛЬЗЯ, УПЫРЬ!',3);}
 if(boss.mode==='waiting')return;
 boss.inv=Math.max(0,boss.inv-dt);
 if(boss.retreat>0){boss.retreat=Math.max(0,boss.retreat-dt);const progress=1-boss.retreat/.55;boss.x=boss.retreatStart+(boss.targetX-boss.retreatStart)*progress;boss.y=LEVEL1.boss.y-Math.sin(progress*Math.PI)*45;}
 if(boss.mode==='defeated'){boss.death-=dt;if(boss.death<=0){victoryTime=clock;state='cutscene';cutsceneTime=0;projectiles=[];}return;}
 if(boss.mode==='reload'){boss.timer-=dt;if(boss.timer<=0){boss.mode='attack';boss.shots=0;boss.timer=2;}return;}
 boss.timer-=dt;
 if(boss.mode==='intro'&&boss.timer<=0){boss.mode='attack';boss.timer=2;}
 if(boss.mode==='attack'&&boss.timer<=0){
  if(boss.shots>=3){boss.mode='reload';boss.timer=6;notify('Перезарядка! Подойди и ударь охотника!',3);}
  else{const type=boss.phase===1?'stake':boss.phase===2?'garlic':boss.shots%2?'garlic':'stake';const dir=player.x<boss.x?-1:1;spawnProjectile(type,boss.x+36,boss.phase===2||type==='garlic'?363:357,dir,'boss');boss.shots++;boss.timer=boss.phase===3?5:6;if(boss.phase===3){boss.retreatStart=boss.x;boss.targetX=Math.min(LEVEL1.boss.arenaEnd-150,boss.x+65);boss.retreat=.55;}}
 }
 if(!boss.dead&&overlap(player,boss)&&boss.mode!=='reload')hit();
}
function updateEvents(dt){
 const current=LEVEL1.zones.findIndex(z=>player.x>=z.start&&player.x<z.end);if(current>=0&&current!==zoneIndex){zoneIndex=current;notify(LEVEL1.zones[current].name);}
 for(const cp of LEVEL1.checkpoints)if(cp.x>checkpoint.x&&Math.abs(player.x-cp.x)<70&&Math.abs(player.y+player.h-cp.y)<22){checkpoint={...cp};captureCheckpoint();notify('ПРОБУЖДЕНИЕ СОХРАНЕНО');}
 for(const c of coins)if(!c.taken&&activeNear(c.x)&&Math.hypot(player.x+20-c.x,player.y+player.h/2-c.y)<35){c.taken=true;score++;}
 for(const item of items)if(!item.taken&&activeNear(item.x)&&(!item.wall||walls.find(w=>w.id===item.wall)?.hp<=0)&&Math.hypot(player.x+20-item.x,player.y+player.h/2-item.y)<42){item.taken=true;if(item.type==='fang'){fangs.add(item.id);score+=10;notify(`Золотой клык: ${fangs.size}/3`);}else{player.rage=10;notify('КРОВАВАЯ ЯРОСТЬ — 10 секунд');}}
 if(!towerPassed&&player.x>LEVEL1.timedSection.start&&player.x<LEVEL1.timedSection.end&&player.y<-150&&towerTimer===null){towerTimer=LEVEL1.timedSection.seconds;notify('Механизм запущен! Пройди галерею за 24 секунды.');}
 if(towerTimer!==null){towerTimer-=dt;if(player.x>=LEVEL1.timedSection.end){towerPassed=true;towerTimer=null;}else if(towerTimer<=0){damageTaken++;finish(false);}}
 const l=LEVEL1.lever;if(!leverOpen&&Math.abs(player.x-l.x)<70&&Math.abs(player.y+player.h-l.y)<25){leverOpen=true;escapeLeft=LEVEL1.escapeSeconds;notify('Ворота открыты! Башня рушится — к выходу!',4);}
 if(escapeLeft>0){if(player.x>=LEVEL1.zones[4].start){escapeLeft=0;notify('Ты выбрался из башни!');}else{escapeLeft-=dt;if(escapeLeft<=0){damageTaken++;finish(false);}}}
 if(player.x>150)tutorialDone.add('move');if(player.vy<0)tutorialDone.add('jump');if(keys.crouch&&player.ground)tutorialDone.add('crouch');
}
function update(dt){
 if(state!=='playing'||paused)return;
 clock+=dt;banner.left=Math.max(0,banner.left-dt);player.inv=Math.max(0,player.inv-dt);player.rage=Math.max(0,player.rage-dt);player.attack=Math.max(0,player.attack-dt);player.cooldown=Math.max(0,player.cooldown-dt);
 updatePlatforms(dt);if(player.ground&&player.support){const p=platforms.find(p=>p.id===player.support);if(p?.active){player.x+=p.dx;player.y+=p.dy;}else{player.ground=false;player.support=null;}}
 setCrouch();const travelStartX=player.x;player.vx=((keys.right?1:0)-(keys.left?1:0))*(player.h<80?125:245);if(player.vx)player.face=Math.sign(player.vx);
 if(keys.jump&&!jumpHeld&&player.ground&&!keys.crouch){player.vy=-590;player.ground=false;player.support=null;}jumpHeld=keys.jump;
 if(keys.attack&&!attackHeld)punch();attackHeld=keys.attack;
 player.x=Math.max(0,Math.min(LEVEL1.width-player.w,player.x+player.vx*dt));
 if(['intro','attack','reload'].includes(boss.mode))player.x=Math.max(LEVEL1.boss.arenaStart,Math.min(LEVEL1.boss.arenaEnd-player.w,player.x));
 for(const r of solidRects())if(overlap(player,r)){if(player.vx>0)player.x=r.x-player.w;if(player.vx<0)player.x=r.x+r.w;}
 const wasGrounded=player.ground,prevBottom=player.y+player.h;player.vy+=1550*dt;player.y+=player.vy*dt;player.ground=false;player.support=null;
 if(player.vy>=0){let landing=null,landingY=Infinity;
  for(const p of platforms){if(!p.active)continue;const [x,y,w]=p;if(player.x+player.w>x&&player.x<x+w&&prevBottom<=y-p.dy+.01&&player.y+player.h>=y&&y<landingY){landing=p;landingY=y;}}
  if(landing){player.y=landingY-player.h;player.vy=0;player.ground=true;player.support=landing.id;if(landing.kind==='crumble'&&landing.collapse<0)landing.collapse=0;if(!wasGrounded)atmosphere.burst(player.x+20,landingY,'landing');}
 }else{for(const r of solidRects())if(overlap(player,r)){player.y=r.y+r.h;player.vy=0;}}
 updateEnemies(dt,prevBottom);updateTraps(dt);if(state!=='playing')return;updateEvents(dt);updateBoss(dt);
 if(player.y>600){damageTaken++;finish(false);}heroAnimator.update(dt,player.h<80,{ground:player.ground,vy:player.vy,travel:player.x-travelStartX});updateCamera(dt);
}
function updateCamera(dt){camera=Math.max(0,Math.min(LEVEL1.width-960,player.x-260));const target=Math.min(0,player.y-230);cameraY+=(target-cameraY)*Math.min(1,dt*7);}
function updateCutscene(dt){
 const travelStartX=player.x;cutsceneTime+=dt;banner.left=Math.max(0,banner.left-dt);
 const destination=LEVEL1.exitX-100;if(cutsceneTime>1&&cutsceneTime<5)player.x=Math.min(destination,player.x+150*dt);
 player.y=430-player.h;player.vx=cutsceneTime<5?100:0;
 if(cutsceneTime<2)notify('Золотой ключ выпал из кармана охотника.',.2);
 else if(cutsceneTime<4)notify('Упырь поднял ключ и поправил кепку.',.2);
 else if(cutsceneTime<7)notify('«Ну что, доигрались? Теперь моя очередь!»',.2);
 else notify('На крыше — оборотень с красной звездой…',.2);
 const target=LEVEL1.width-960;camera+=(target-camera)*Math.min(1,dt*1.5);cameraY+=(0-cameraY)*Math.min(1,dt*5);
 heroAnimator.update(dt,false,{ground:true,vy:0,travel:player.x-travelStartX});if(cutsceneTime>11)finish(true);
}
function shape(path,fill,stroke='#485346',width=2){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.fill(path);if(stroke)ctx.stroke(path);}
function rounded(x,y,w,h,r,fill,stroke){const path=new Path2D();path.roundRect(x,y,w,h,r);shape(path,fill,stroke,2);}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function character(){
 ctx.save();ctx.translate(player.x+20,player.y+player.h);
 const animated=heroAnimator.pose().phase!=='stand';
 const bounce=animated?0:Math.sin(clock*3)*.6;
 ctx.scale(player.face,1);
 if(player.inv>0&&Math.floor(clock*14)%2)ctx.globalAlpha=.35;
 ellipse(0,-1,25,4,'#100b20aa');
 ctx.translate(0,bounce);
 if(!heroAnimator.draw(ctx)&&heroImage.complete&&heroImage.naturalWidth)ctx.drawImage(heroImage,-34,-92,68,92);
 ctx.save();ctx.translate(0,heroAnimator.effectOffset());levelArt.heroEffects(ctx,player,clock,cutsceneTime,state);ctx.restore();
 ctx.restore();
}
function drawGarlic(e){
 ctx.save();ctx.translate(e.x+19,e.y+42);
 const stride=Math.sin(clock*9+e.origin)*2;
 ellipse(0,-1,23,4,'#100b2080');ctx.rotate(stride*.025);
 if(garlicImage.complete&&garlicImage.naturalWidth)ctx.drawImage(garlicImage,-24,-50+stride,48,50);
 ctx.restore();
}
function draw(){
 ctx.setTransform(canvas.width/960,0,0,canvas.height/510,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 atmosphere.background(ctx,camera,zoneIndex,cameraY);levelArt.background(ctx,zoneIndex,camera,cameraY,clock,cutsceneTime);
 ctx.save();if(escapeLeft>0){ctx.translate(Math.sin(clock*32)*1.5,Math.cos(clock*27)*1.2);}ctx.translate(0,-cameraY);
 atmosphere.worldDecor(ctx,camera);ctx.save();ctx.translate(-camera,0);atmosphere.platforms(ctx,camera,cameraY);
 levelArt.world(ctx,{player,camera,cameraY,clock,traps,projectiles,walls,items,checkpoint,leverOpen,escapeLeft,boss,state,cutsceneTime});
 for(const c of coins){if(c.taken||c.x<camera-30||c.x>camera+990)continue;const y=c.y+Math.sin(clock*4+c.x)*3;const gold=ctx.createLinearGradient(c.x-10,y-10,c.x+10,y+10);gold.addColorStop(0,'#fff2ac');gold.addColorStop(.45,'#f5bf47');gold.addColorStop(1,'#bf7e2d');ctx.fillStyle=gold;ctx.strokeStyle='#b98233';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x,y,9,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();}
 for(const e of enemies)if(activeNear(e.x,1200)&&(!e.dead||e.death>0)){if(e.type==='helmet')levelArt.enemy(ctx,e,clock);else if(!e.dead)drawGarlic(e);}
 character();ctx.restore();atmosphere.effects(ctx,camera);ctx.restore();
 atmosphere.hud(hud,player,score,state==='win'?100:Math.min(100,Math.floor(player.x/LEVEL1.width*100)));renderStatus();
}
function renderStatus(){
 ui.zone.textContent=`${zoneIndex+1}/5 · ${LEVEL1.zones[zoneIndex].name}`;ui.timer.textContent=formatTime(clock);ui.fangs.textContent=fangs.size+'/3';
 ui.banner.textContent=banner.left>0?banner.text:'';ui.banner.hidden=banner.left<=0;ui.rage.hidden=player.rage<=0;ui.rage.textContent=`Кровавая ярость: ${Math.ceil(player.rage)} с`;
 const hints=[['move','← → / A D — двигайся',0,700],['jump','Пробел / ↑ — перепрыгни яму',700,1350],['attack','X / J — ударь чеснок',1350,2200],['crouch','↓ / S — присядь под колом',2200,3100]];
 const hint=hints.find(([key,text,a,b])=>!tutorialDone.has(key)&&player.x>=a&&player.x<b);ui.hint.textContent=hint?.[1]||'';ui.hint.hidden=!hint;
 ui.boss.hidden=['waiting','defeated'].includes(boss.mode)||state!=='playing';ui.boss.textContent=`Главный охотник · ${boss.hp}/3 · ${boss.mode==='reload'?'УЯЗВИМ — УДАРЬ!':boss.mode==='intro'?'Приготовься':boss.phase===1?'Присядь под кольями':boss.phase===2?'Ударь чеснок':boss.shots%2?'Далее: чеснок — удар':'Далее: кол — присядь'}`;
 document.querySelector('#escape-timer').textContent=escapeLeft>0?`Побег: ${Math.ceil(escapeLeft)} с`:towerTimer!==null?`Галерея: ${Math.ceil(towerTimer)} с`:'';
 document.querySelector('#pause').textContent=paused?'Продолжить':'Пауза';
}
let accumulator=0;
function frame(t){const dt=Math.min((t-last)/1000||0,.1);last=t;if(!paused){atmosphere.tick(dt);levelArt.tick(dt);accumulator=Math.min(accumulator+dt,.12);while(accumulator>=1/120){if(state==='playing')update(1/120);else if(state==='cutscene')updateCutscene(1/120);accumulator-=1/120;}}gameAudio.tick(dt,!paused&&state==='playing',player.ground&&Math.abs(player.vx)>0);draw();requestAnimationFrame(frame);}
function resize(){canvas.width=960*Math.min(devicePixelRatio||1,2);canvas.height=510*Math.min(devicePixelRatio||1,2);}resize();window.addEventListener('resize',resize);
const physicalKeys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump',KeyX:'attack',KeyJ:'attack',ArrowDown:'crouch',KeyS:'crouch'};
const mapping={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'jump',ArrowUp:'jump',w:'jump',W:'jump',x:'attack',j:'attack',ArrowDown:'crouch',s:'crouch'};
function releaseKeys(){for(const key in keys)keys[key]=false;}
window.addEventListener('keydown',e=>{if(e.target.matches?.('button,input,textarea')&&e.key===' ')return;const key=physicalKeys[e.code]||mapping[e.key];if(key){e.preventDefault();keys[key]=true;}if(e.code==='Escape'&&state==='playing')paused=!paused;});
window.addEventListener('keyup',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key)keys[key]=false;});
window.addEventListener('blur',()=>{releaseKeys();if(state==='playing')paused=true;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){releaseKeys();if(state==='playing')paused=true;}});
for(const b of document.querySelectorAll('[data-key]')){const pointers=new Set();b.addEventListener('pointerdown',e=>{e.preventDefault();pointers.add(e.pointerId);b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,e=>{pointers.delete(e.pointerId);keys[b.dataset.key]=pointers.size>0;});}
document.querySelector('#play').onclick=start;document.querySelector('#reset').onclick=start;document.querySelector('#continue').onclick=resumeCheckpoint;document.querySelector('#main-menu').onclick=mainMenu;document.querySelector('#pause').onclick=()=>{if(state==='playing'){paused=!paused;releaseKeys();}};
document.querySelector('#sound').onclick=gameAudio.toggle;gameAudio.syncButton();
try{window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();}catch{}reset();requestAnimationFrame(frame);
