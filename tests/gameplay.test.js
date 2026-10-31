import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from './harness.js';
const game=()=>createGame().run;
test('map has five continuous zones, safe gaps and all mandatory events',()=>{
 const run=game();assert.equal(run('LEVEL1.zones.length'),5);assert.equal(run('LEVEL1.items.every(i=>i.type==="rage")'),true);assert.ok(run('LEVEL1.enemies.length')>=30);
 assert.equal(run('LEVEL1.zones.every((z,i)=>!i||z.start===LEVEL1.zones[i-1].end)'),true);
 assert.equal(run('LEVEL1.ground.every((p,i,a)=>!i||p.x-(a[i-1].x+a[i-1].w)<=120)'),true);
 assert.ok(run('LEVEL1.width/245')>240);
});
test('one-way tiers remain reachable at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){
  const run=game();run('enemies=[];traps=[]');
  for(const index of [0,1,10]){
   run(`const target${index}=ledgePlatforms[${index}];player.x=target${index}[0]+20;player.y=target${index}[1]+90-player.h;player.vy=0;player.ground=true;keys.jump=true;update(1/${hz});keys.jump=false;`);
   let landed=false;
   for(let i=0;i<hz*2;i++){run(`update(1/${hz})`);if(run('player.ground')){assert.equal(run('player.y+player.h'),run(`target${index}[1]`));landed=true;break;}}
   assert.ok(landed);
  }
 }
});
test('jump, run, crouch and one-way side and underside collisions',()=>{
 const run=game();run('for(let i=0;i<120;i++)update(1/120)');assert.equal(run('player.y'),350);
 run('keys.right=true;update(1/120)');assert.equal(run('player.vx'),245);
 run('keys.jump=true;update(1/120)');assert.ok(run('player.vy')<0);
 run('start();player.x=2650;player.y=350;player.ground=true;keys.crouch=true;update(1/120)');assert.equal(run('player.h'),44);assert.equal(run('player.y+player.h'),430);
 run('keys.crouch=false;update(1/120)');assert.equal(run('player.h'),80);
 run('start();player.x=2650;player.y=350;player.vy=-400;update(1/120)');assert.ok(run('player.vy')<0);
});
test('moving platforms carry their rider; crumble triggers at 0.8s and restores',()=>{
 const run=game();run('enemies=[];traps=[];const moving=ledgePlatforms.find(p=>p.kind==="moving");player.x=moving[0]+20;zoneIndex=LEVEL1.zones.findIndex(z=>player.x>=z.start&&player.x<z.end);player.y=moving[1]-80;player.support=moving.id;player.ground=true;const offset=player.x-moving[0];for(let i=0;i<60;i++)update(1/120)');assert.ok(Math.abs(run('player.x-moving[0]-offset'))<.01);assert.equal(run('player.ground'),true);
 run('const crumble=ledgePlatforms.find(p=>p.kind==="crumble");player.x=crumble[0]+20;clearPageTurn();zoneIndex=LEVEL1.zones.findIndex(z=>player.x>=z.start&&player.x<z.end);player.y=crumble[1]-80;player.vy=0;player.ground=true;update(1/120);for(let i=0;i<90;i++)update(1/120)');assert.equal(run('crumble.active'),true);
 run('for(let i=0;i<12;i++)update(1/120)');assert.equal(run('crumble.active'),false);
 run('for(let i=0;i<600;i++)updatePlatforms(1/120)');assert.equal(run('crumble.active'),true);
});
test('punch destroys garlic; rage increases damage and expires after 10 seconds',()=>{
 const run=game();run('const e=enemies.find(e=>e.type==="garlic");player.x=e.x-50;player.y=e.y;player.face=1;punch()');assert.equal(run('e.dead'),true);
 run('start();const helmet=enemies.find(e=>e.type==="helmet");player.x=helmet.x-50;player.y=350;player.face=1;punch()');assert.equal(run('helmet.hp'),1);assert.equal(run('helmet.dead'),false);
 run('player.cooldown=0;player.rage=10;punch()');assert.equal(run('helmet.dead'),true);
 run('enemies=[];traps=[];player.x=100;player.y=350;for(let i=0;i<1201;i++)update(1/120)');assert.equal(run('player.rage'),0);
});
test('stakes telegraph, crouch avoids a shot; fires cycle',()=>{
 const run=game();run('player.x=2200;player.y=350;player.ground=true;const stake=traps.find(t=>t.type==="stake");updateTraps(.4)');assert.equal(run('stake.warn'),true);assert.equal(run('projectiles.length'),0);
 run('updateTraps(.51)');assert.ok(run('projectiles.length')>0);
 run('projectiles=[];keys.crouch=true;setCrouch();spawnProjectile("stake",player.x,357,0);updateTraps(0)');assert.equal(run('player.hp'),3);
 run('projectiles=[];keys.crouch=false;setCrouch();spawnProjectile("stake",player.x,357,0);updateTraps(0)');assert.equal(run('player.hp'),2);
 run('const fire=traps.find(t=>t.type==="fire"&&t.cycle);player.x=fire.x-100;clock=fire.cycle*.8;updateTraps(0)');assert.equal(run('fire.active'),false);
});
test('ten unique enemy kills award a five-hit sword and every tenth kill renews it',()=>{
 const run=game();run('for(const e of enemies.slice(0,9))defeatEnemy(e)');assert.equal(run('kills'),9);assert.equal(run('sword'),0);
 run('defeatEnemy(enemies[9]);defeatEnemy(enemies[9])');assert.equal(run('kills'),10);assert.equal(run('sword'),5);
 run('sword=1;for(const e of enemies.slice(10,20))defeatEnemy(e)');assert.equal(run('kills'),20);assert.equal(run('sword'),5);assert.equal(run('swordRewards'),2);
});
test('sword misses and invulnerable boss contacts spend nothing; each enemy hit adds five coins',()=>{
 const run=game();run('sword=5;punch()');assert.equal(run('sword'),5);assert.equal(run('score'),0);
 run('const e=enemies.find(e=>e.type==="helmet");player.x=e.x-70;player.y=350;player.face=1;player.cooldown=0;punch()');assert.equal(run('e.dead'),true);assert.equal(run('sword'),4);assert.equal(run('score'),8);
 run('player.x=boss.x-50;player.cooldown=0;Inquisitor.enter(boss,"ATTACK",5);boss.attack="volley";punch()');assert.equal(run('sword'),4);assert.equal(run('boss.hp'),25);
 run('player.cooldown=0;Inquisitor.enter(boss,"RECOVERY",5);boss.inv=0;punch()');assert.equal(run('sword'),3);assert.equal(run('score'),13);assert.equal(run('boss.hp'),23);
});
test('sword breaks after five successful enemy hits; projectiles give no coins or wear',()=>{
 const run=game();run('sword=5;for(const e of enemies.slice(0,5)){player.cooldown=0;player.x=e.x-50;player.y=e.y;player.face=1;punch()}');assert.equal(run('sword'),0);assert.equal(run('kills'),5);
 run('sword=5;player.x=100;player.y=350;player.cooldown=0;punch();const before=score;spawnProjectile("garlic",attackBox().x,player.y+20,0);updateTraps(0)');assert.equal(run('score'),run('before'));assert.equal(run('sword'),5);
});
test('checkpoint restores kill counter and sword without duplicating rewards',()=>{
 const run=game();run('for(const e of enemies.slice(0,10))defeatEnemy(e);sword=3;player.x=29600;player.y=350;updateEvents(0);sword=0;for(const e of enemies.slice(10,12))defeatEnemy(e);resumeCheckpoint()');assert.equal(run('kills'),10);assert.equal(run('sword'),3);assert.equal(run('swordRewards'),1);run('defeatEnemy(enemies[0])');assert.equal(run('kills'),10);
});
test('checkpoint restores only its snapshot, prevents farming, preserves run time and damage',()=>{
 const run=game();run('score=5;coins[0].taken=true;player.x=29600;player.y=350;updateEvents(0);score=50;clock=123;damageTaken=1;hit();hit();resumeCheckpoint()');assert.equal(run('player.x'),29600);assert.equal(run('score'),5);assert.equal(run('coins[0].taken'),true);assert.equal(run('clock'),123);assert.ok(run('damageTaken')>0);assert.equal(run('player.hp'),3);
});
test('tower lever requires height, opens gate and starts generous escape timer',()=>{
 const run=game();run('player.x=53000;player.y=350;updateEvents(0)');assert.equal(run('leverOpen'),false);
 run('player.y=-370;updateEvents(0)');assert.equal(run('leverOpen'),true);assert.equal(run('escapeLeft'),45);
 run('player.x=57100;updateEvents(0)');assert.equal(run('escapeLeft'),0);
});
test('Inquisitor telegraphs a three-bolt volley and exposes a real recovery window',()=>{
 const run=game();run('player.x=58000;player.y=350;updateBoss(0)');assert.equal(run('boss.state'),'INTRO');
 run('updateBoss(2.1);updateBoss(3.6)');assert.equal(run('boss.attack'),'volley');assert.equal(run('boss.projectiles.length'),0);
 run('updateBoss(.9)');assert.equal(run('boss.projectiles.length'),1);assert.equal(run('boss.projectiles[0].kind'),'bolt');
 run('updateBoss(1.1);updateBoss(1.1);updateBoss(.2)');assert.equal(run('boss.state'),'RECOVERY');assert.equal(run('boss.shots'),3);
 run('player.x=boss.x-50;player.y=350;player.face=1;player.rage=10;player.cooldown=0;sword=0;punch()');assert.equal(run('boss.hp'),24);
 run('player.cooldown=0;punch()');assert.equal(run('boss.hp'),24,'invulnerability rejects repeated same-frame hits');
});
test('progress persists across sessions, sanitizes malformed data and handles blocked storage',()=>{
 const storage=new Map();const first=createGame(storage);first.run('progressStore.save({time:350,score:100,kills:30,damage:0})');const second=createGame(storage);assert.equal(second.run('progressStore.load().completed'),true);assert.equal(second.run('progressStore.load().maxKills'),30);assert.equal(second.run('progressStore.load().achievements[0]'),'НЕПРОКУСИМЫЙ');second.run('progressStore.save({time:390,score:90,kills:10,damage:3})');assert.equal(second.run('progressStore.load().bestTime'),350);
 storage.set('upyr-run.progress.v1','broken');assert.equal(second.run('progressStore.load().completed'),false);second.run('localStorage.setItem=()=>{throw Error("blocked")};progressStore.save({time:1,score:1,kills:0,damage:1})');assert.equal(second.run('progressStore.available'),false);
});

test('complete denser level unlocks swords, defeats boss and persists progress without cheats',()=>{
 const run=game();run(readFileSync(new URL('./route-agent.js',import.meta.url),'utf8'));const result=run('driveLevel(60000)');assert.equal(result.state,'win');assert.ok(result.kills>=10);assert.ok(result.swordRewards>=1);assert.equal(result.bossHp,0);assert.equal(result.continues,0);assert.equal(result.visited.length,5);assert.ok(result.seconds>=270&&result.seconds<=420);assert.equal(run('progressStore.load().completed'),true);
});

test('tower gate cannot be bypassed before lever, pause does not advance physics',()=>{
 const run=game();run('player.x=53450;player.y=-370;player.vx=245;keys.right=true;for(let i=0;i<60;i++)update(1/120)');assert.ok(run('player.x+player.w')<=53500);assert.equal(run('leverOpen'),false);
 run('const beforeTime=clock;const beforeX=player.x;paused=true;for(let i=0;i<120;i++)update(1/120)');assert.equal(run('clock'),run('beforeTime'));assert.equal(run('player.x'),run('beforeX'));
});

test('Inquisitor retreat jump keeps a bounded arc and returns to the floor',()=>{
 const run=game();run('player.x=58080;player.y=350;boss.x=58150;boss.phase=3;Inquisitor.engage(boss,true);updateBoss(.1)');
 assert.ok(run('boss.jumpLeft')>0);assert.ok(run('boss.y')<290);const x=run('boss.x');run('updateBoss(.15)');assert.ok(run('boss.x')>x);
 run('updateBoss(.4)');assert.equal(run('boss.y'),290);
});
test('crouch animation descends, holds, rises and reverses without changing physics',()=>{
 const run=game();run('for(let i=0;i<120;i++)update(1/120);const feet=player.y+player.h;keys.crouch=true;update(1/120)');assert.equal(run('heroAnimator.pose().phase'),'down');assert.equal(run('player.h'),44);assert.equal(run('player.y+player.h'),run('feet'));
 run('for(let i=0;i<60;i++)update(1/120)');assert.equal(run('heroAnimator.pose().phase'),'hold');
 run('keys.crouch=false;update(1/120)');assert.equal(run('heroAnimator.pose().phase'),'up');assert.equal(run('player.h'),80);assert.equal(run('player.y+player.h'),run('feet'));
 run('keys.crouch=true;update(1/120)');assert.ok(run('heroAnimator.pose().depth')>.9);
 run('keys.crouch=false;for(let i=0;i<60;i++)update(1/120)');assert.equal(run('heroAnimator.pose().phase'),'stand');
 run('keys.crouch=true;for(let i=0;i<60;i++)update(1/120);paused=true;const depthBefore=heroAnimator.pose().depth;update(1)');assert.equal(run('heroAnimator.pose().depth'),run('depthBefore'));
 run('start()');assert.equal(run('heroAnimator.pose().phase'),'stand');
});

test('crouch sprite frames use one uniform scale and a fixed foot baseline',()=>{
 const run=game();let expectedBaseline=null;const ratios=[];
 for(const crouching of [true,false])for(let i=0;i<50;i++){
  run(`heroAnimator.update(1/120,${crouching})`);const g=run('heroAnimator.geometry()');if(!g)continue;
  if(expectedBaseline===null)expectedBaseline=g.dy+g.dh;
  assert.ok(Math.abs(g.dy+g.dh-expectedBaseline)<1e-8);assert.ok(Math.abs(g.dw/g.sw-g.dh/g.sh)<1e-8);ratios.push(g.dw/g.sw);
 }
 assert.ok(ratios.length>10);assert.ok(ratios.every(r=>Math.abs(r-ratios[0])<1e-8));
});

test('running frames follow distance and stop on idle or blocked movement',()=>{
 const run=game();run('heroAnimator.update(.1,false,{ground:true,vy:0,travel:0})');assert.equal(run('heroAnimator.pose().phase'),'stand');
 run('heroAnimator.update(.1,false,{ground:true,vy:0,travel:24.5});const firstRunFrame=heroAnimator.pose().frame');assert.equal(run('heroAnimator.pose().phase'),'run');
 run('heroAnimator.update(.1,false,{ground:true,vy:0,travel:-24.5})');assert.notEqual(run('heroAnimator.pose().frame'),run('firstRunFrame'));
 run('heroAnimator.update(.1,false,{ground:true,vy:0,travel:0})');assert.equal(run('heroAnimator.pose().phase'),'stand');
 run('heroAnimator.reset();for(let i=0;i<60;i++)heroAnimator.update(1/60,false,{ground:true,vy:0,travel:245/60});const at60=heroAnimator.pose().frame;heroAnimator.reset();for(let i=0;i<120;i++)heroAnimator.update(1/120,false,{ground:true,vy:0,travel:245/120})');assert.equal(run('heroAnimator.pose().frame'),run('at60'));
});
test('jump poses track real vertical velocity, landing and immediate repeat jumps',()=>{
 const run=game();run('heroAnimator.update(1/120,false,{ground:false,vy:-575,travel:2})');assert.equal(run('heroAnimator.pose().phase'),'takeoff');
 run('heroAnimator.update(.1,false,{ground:false,vy:-250,travel:20})');assert.equal(run('heroAnimator.pose().phase'),'rise');
 run('heroAnimator.update(.1,false,{ground:false,vy:0,travel:20})');assert.equal(run('heroAnimator.pose().phase'),'apex');
 run('heroAnimator.update(.1,false,{ground:false,vy:250,travel:20})');assert.equal(run('heroAnimator.pose().phase'),'fall');
 run('heroAnimator.update(1/120,false,{ground:true,vy:0,travel:2})');assert.equal(run('heroAnimator.pose().phase'),'land');
 run('heroAnimator.update(1/120,false,{ground:false,vy:-575,travel:2})');assert.equal(run('heroAnimator.pose().phase'),'takeoff');
 run('heroAnimator.update(.4,false,{ground:true,vy:0,travel:0});heroAnimator.update(.2,false,{ground:true,vy:0,travel:0})');assert.equal(run('heroAnimator.pose().phase'),'stand');
});
test('run and jump sprite geometry stays uniformly scaled with valid frame crops',()=>{
 const run=game();
 for(const sample of ['{ground:true,vy:0,travel:20}','{ground:false,vy:-500,travel:2}','{ground:false,vy:0,travel:2}','{ground:false,vy:500,travel:2}','{ground:true,vy:0,travel:0}']){
  run(`heroAnimator.update(.1,false,${sample})`);const g=run('heroAnimator.geometry()');assert.ok(g);assert.ok(g.sw>0&&g.sh>0);assert.ok(Math.abs(g.dw/g.sw-g.dh/g.sh)<1e-8);assert.ok(g.dh>=60&&g.dh<=110);
 }
});

test('attack reference poses play once and then return to locomotion',()=>{
 const run=game();run('heroAnimator.strike()');assert.equal(run('heroAnimator.pose().phase'),'attack');assert.equal(run('heroAnimator.pose().frame'),0);
 run('heroAnimator.update(.15,false,{ground:true,vy:0,travel:0})');assert.equal(run('heroAnimator.pose().frame'),3);
 run('heroAnimator.update(.25,false,{ground:true,vy:0,travel:0})');assert.equal(run('heroAnimator.pose().phase'),'stand');
});
test('old saved records migrate without the removed collectible field',()=>{
 const store=new Map([['upyr-run.progress.v1',JSON.stringify({version:1,completed:true,bestTime:350,maxScore:120,fangs:3,achievements:[]})]]);const run=createGame(store).run;
 assert.equal(run('progressStore.load().completed'),true);assert.equal(run('progressStore.load().maxScore'),120);assert.equal(run('"fangs" in progressStore.load()'),false);assert.equal(run('progressStore.load().version'),2);
});
test('parallax keeps visible tiles and unique objects continuous across old wrap boundaries',()=>{
 const run=game();
 for(const [speed,period]of [[.22,1080],[.43,31],[.43,560],[.45,280],[.4,1000]]){
  const boundary=period/speed;const left=JSON.parse(run(`JSON.stringify(parallax.tiles(${boundary}-.01,${speed},${period}))`)),right=JSON.parse(run(`JSON.stringify(parallax.tiles(${boundary}+.01,${speed},${period}))`));
  for(const tile of left){const match=right.find(t=>t.index===tile.index);if(match)assert.ok(Math.abs(match.x-tile.x)<.03);}
  const screen=right.filter(t=>t.x+period>=0&&t.x<=960).sort((a,b)=>a.x-b.x);assert.ok(screen[0].x<=0);assert.ok(screen.at(-1).x+period>=960);for(let i=1;i<screen.length;i++)assert.ok(Math.abs(screen[i].x-screen[i-1].x-period)<1e-7);
 }
 for(const boundary of [160/.035,160/.11,320/.035]){assert.ok(Math.abs(run(`parallax.moonX(${boundary}+.01)-parallax.moonX(${boundary}-.01)`))<.01);assert.ok(Math.abs(run(`parallax.palaceX(${boundary}+.01)-parallax.palaceX(${boundary}-.01)`))<.01);}
});

test('sword locomotion follows equipment, direction and physics without replacing unarmed clips',()=>{
 const run=game();
 run('heroAnimator.reset();heroAnimator.update(.1,false,{ground:true,vy:0,travel:30,sword:false})');
 assert.equal(run('heroAnimator.pose().clip'),'run');
 run('heroAnimator.update(.1,false,{ground:true,vy:0,travel:30,sword:true})');
 assert.equal(run('heroAnimator.pose().clip'),'swordRun');
 const frames=new Set();for(let i=0;i<8;i++){run('heroAnimator.update(.01,false,{ground:true,vy:0,travel:24.5,sword:true})');frames.add(run('heroAnimator.pose().frame'));}assert.equal(frames.size,8);
 run('heroAnimator.update(.1,false,{ground:false,vy:-500,travel:2,sword:true})');assert.equal(run('heroAnimator.pose().clip'),'swordJump');
 run('heroAnimator.update(.1,false,{ground:false,vy:200,travel:2,sword:false})');assert.equal(run('heroAnimator.pose().clip'),'jump');
 run('heroAnimator.update(.4,true,{ground:true,vy:0,travel:0,sword:true})');assert.equal(run('heroAnimator.pose().clip'),'swordCrouch');
 run('heroAnimator.update(.01,true,{ground:true,vy:0,travel:0,sword:false})');assert.equal(run('heroAnimator.pose().clip'),'crouch');
 run('heroAnimator.strike(true)');assert.equal(run('heroAnimator.pose().clip'),'sword');
 run('heroAnimator.reset()');assert.equal(run('heroAnimator.pose().phase'),'stand');
});

test('crossbows launch head-height bolts at release and crouched artwork clears the flight lane',()=>{
 const run=game();
 run('enemies=[];player.x=2200;const bow=traps.find(t=>t.type==="stake");traps=[bow];bow.phase=bow.warning-1/120;updateTraps(1/120)');
 assert.equal(run('bow.shotTime'),0);assert.equal(run('projectiles.length'),1);
 assert.equal(run('projectiles[0].y'),run('LEVEL1.stakeY'));
 assert.ok(run('projectiles[0].x+projectiles[0].w<=bow.x'));
 for(const armed of [false,true]){
  run(`player.x=500;player.y=350;player.h=80;player.ground=true;player.hp=3;player.inv=0;keys.crouch=true;setCrouch();heroAnimator.reset();heroAnimator.update(.4,true,{ground:true,vy:0,travel:0,sword:${armed}});traps=[];projectiles=[];spawnProjectile('stake',player.x,LEVEL1.stakeY,0)`);
  assert.ok(run('projectiles[0].y+projectiles[0].h/2+8 < player.y+player.h+heroAnimator.geometry().dy'),'complete arrow artwork clears crouched head');
  run('updateTraps(0)');assert.equal(run('player.hp'),3);
 }
 run("projectiles=[];keys.crouch=false;setCrouch();player.inv=0;spawnProjectile('stake',player.x,LEVEL1.stakeY,0);updateTraps(0)");assert.equal(run('player.hp'),2,'standing visible head is vulnerable');
 run('makeWorld()');assert.equal(run('traps.filter(t=>t.type==="stake").every(t=>t.shotTime===-1)'),true);
});

test('coffins open and save once on first nearby pass, stay open on respawn, reset for a new run',()=>{
 const run=game();
 assert.equal(run('coffinStates.every(c=>!c.opened)'),true);
 run('player.x=29600;player.y=200;score=7;updateEvents(.1)');assert.equal(run('coffinStates[1].opened'),false,'passing above does not activate');
 run('player.y=350;updateEvents(0)');assert.equal(run('coffinStates[1].opened'),true);assert.equal(run('coffinStates[1].openTime'),0);assert.equal(run('snapshot.score'),7);
 run('score=99;updateEvents(.4)');assert.equal(run('snapshot.score'),7,'standing nearby does not overwrite save');assert.equal(run('coffinStates[1].openTime'),.4);
 run('player.x=29200;updateEvents(.4);player.x=29600;updateEvents(.1)');assert.equal(run('coffinStates[1].openTime'),.8);assert.equal(run('snapshot.score'),7);
 run('resumeCheckpoint()');assert.equal(run('score'),7);assert.equal(run('player.x'),29600);assert.equal(run('coffinStates[1].opened'),true);
 run('start()');assert.equal(run('coffinStates.every(c=>!c.opened)'),true);
 run('player.y=350;updateEvents(0)');assert.equal(run('coffinStates[0].opened'),true);assert.equal(run('checkpoint.x'),70);
});

test('helmet garlic needs two ordinary hits even in rage, or one sword hit; a stomp cannot bypass armor',()=>{
 const run=game();
 run('const armored=enemies.find(e=>e.type==="helmet");player.x=armored.x-50;player.y=350;player.face=1;player.rage=10;punch()');
 assert.equal(run('armored.hp'),1);assert.equal(run('armored.dead'),false);assert.ok(run('armored.hurt')>0);
 run('player.cooldown=0;punch()');assert.equal(run('armored.dead'),true);assert.equal(run('armored.death'),.8);
 run('start();const armedTarget=enemies.find(e=>e.type==="helmet");player.x=armedTarget.x-50;player.y=350;player.face=1;sword=5;punch()');assert.equal(run('armedTarget.dead'),true);assert.equal(run('sword'),4);
 run('start();const stompTarget=enemies.find(e=>e.type==="helmet");enemies=[stompTarget];player.x=stompTarget.x;player.y=stompTarget.y-70;player.vy=200;updateEnemies(0,stompTarget.y-1)');assert.equal(run('stompTarget.hp'),1);assert.equal(run('stompTarget.dead'),false);assert.equal(run('player.vy'),-370);
});

test('rage locomotion tracks sword inventory and expires cleanly; equipped idle holds one sword',()=>{
 const run=game();
 for(const armed of [false,true]){
  run(`heroAnimator.reset();heroAnimator.update(.1,false,{ground:true,vy:0,travel:25,sword:${armed},rage:true})`);
  assert.equal(run('heroAnimator.pose().clip'),armed?'rageSwordRun':'rageRun');
  run(`heroAnimator.update(.1,false,{ground:false,vy:-500,travel:2,sword:${armed},rage:true})`);assert.equal(run('heroAnimator.pose().clip'),armed?'rageSwordJump':'rageJump');
  run(`heroAnimator.update(.4,true,{ground:true,vy:0,travel:0,sword:${armed},rage:true})`);assert.equal(run('heroAnimator.pose().clip'),armed?'rageSwordCrouch':'rageCrouch');
  run(`heroAnimator.update(.01,true,{ground:true,vy:0,travel:0,sword:${armed},rage:false})`);assert.equal(run('heroAnimator.pose().clip'),armed?'swordCrouch':'crouch');
 }
 run('heroAnimator.reset();heroAnimator.setState({sword:true,rage:false})');assert.equal(run('heroAnimator.pose().phase'),'stand');assert.equal(run('heroAnimator.pose().clip'),'swordIdle');assert.ok(run('heroAnimator.geometry().dw')>0);
 run('heroAnimator.setState({sword:false,rage:false})');assert.equal(run('heroAnimator.pose().clip'),null);
 run('heroAnimator.setState({sword:true,rage:true});heroAnimator.strike(true)');assert.equal(run('heroAnimator.pose().clip'),'sword');
 run('heroAnimator.reset()');assert.equal(run('heroAnimator.pose().clip'),null);
});

test('fist attacks play 8 normal or 10 rage frames once, preserving the selected attack and sword animation',()=>{
 const run=game();
 for(const [rage,count,clip] of [[false,8,'attack'],[true,10,'ragePunch']]){
  run(`heroAnimator.reset();heroAnimator.strike(false,${rage})`);const frames=[];
  for(let i=0;i<count;i++){assert.equal(run('heroAnimator.pose().clip'),clip);frames.push(run('heroAnimator.pose().frame'));run(`heroAnimator.update(${.36/count},false)`);}
  assert.deepEqual(frames,Array.from({length:count},(_,i)=>i));run('heroAnimator.update(.01,false)');assert.equal(run('heroAnimator.pose().phase'),'stand');
 }
 run('heroAnimator.strike(false,true);heroAnimator.setState({sword:false,rage:false})');assert.equal(run('heroAnimator.pose().clip'),'ragePunch','finish the attack selected at its start');
 run('heroAnimator.reset();heroAnimator.strike(true,true)');assert.equal(run('heroAnimator.pose().clip'),'sword');
 run('heroAnimator.reset();sword=0;player.rage=10;player.cooldown=0;punch()');assert.equal(run('heroAnimator.pose().clip'),'ragePunch');assert.equal(run('player.cooldown'),.42);
});
