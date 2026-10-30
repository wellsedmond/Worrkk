import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from './harness.js';
const game=()=>createGame().run;
test('map has five continuous zones, safe gaps and all mandatory events',()=>{
 const run=game();assert.equal(run('LEVEL1.zones.length'),5);assert.equal(run('LEVEL1.items.filter(i=>i.type==="fang").length'),3);
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
 const run=game();run('enemies=[];traps=[];const moving=ledgePlatforms.find(p=>p.kind==="moving");player.x=moving[0]+20;player.y=moving[1]-80;player.support=moving.id;player.ground=true;const offset=player.x-moving[0];for(let i=0;i<60;i++)update(1/120)');assert.ok(Math.abs(run('player.x-moving[0]-offset'))<.01);assert.equal(run('player.ground'),true);
 run('const crumble=ledgePlatforms.find(p=>p.kind==="crumble");player.x=crumble[0]+20;player.y=crumble[1]-80;player.vy=0;player.ground=true;update(1/120);for(let i=0;i<90;i++)update(1/120)');assert.equal(run('crumble.active'),true);
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
test('all fangs can be collected and the forest wall must be broken first',()=>{
 const run=game();run('const fang=items.find(i=>i.id==="fang-forest");player.x=fang.x-20;player.y=350;updateEvents(0)');assert.equal(run('fangs.size'),0);
 run('player.x=3450;player.face=1;punch();player.cooldown=0;punch();player.x=3560;player.y=350;updateEvents(0)');assert.equal(run('fangs.size'),1);
 run('for(const id of ["fang-cemetery","fang-tower"]){const i=items.find(i=>i.id===id);player.x=i.x-20;player.y=i.y-40;updateEvents(0)}');assert.equal(run('fangs.size'),3);
});
test('checkpoint restores only its snapshot, prevents farming, preserves run time and damage',()=>{
 const run=game();run('score=5;coins[0].taken=true;player.x=29600;player.y=350;updateEvents(0);score=50;clock=123;damageTaken=1;hit();hit();resumeCheckpoint()');assert.equal(run('player.x'),29600);assert.equal(run('score'),5);assert.equal(run('coins[0].taken'),true);assert.equal(run('clock'),123);assert.ok(run('damageTaken')>0);assert.equal(run('player.hp'),3);
});
test('tower lever requires height, opens gate and starts generous escape timer',()=>{
 const run=game();run('player.x=53000;player.y=350;updateEvents(0)');assert.equal(run('leverOpen'),false);
 run('player.y=-370;updateEvents(0)');assert.equal(run('leverOpen'),true);assert.equal(run('escapeLeft'),45);
 run('player.x=57100;updateEvents(0)');assert.equal(run('escapeLeft'),0);
});
test('boss fires three shots per phase; rage cannot bypass reload windows',()=>{
 const run=game();run('player.x=58000;updateBoss(0);updateBoss(3.1);updateBoss(2.1)');assert.equal(run('boss.shots'),1);assert.equal(run('projectiles[0].type'),'stake');
 run('for(let i=0;i<10&&boss.mode!=="reload";i++)updateBoss(6.1)');assert.equal(run('boss.mode'),'reload');
 for(let hp=2;hp>=0;hp--){
  run('player.x=boss.x-50;player.y=350;player.face=1;player.rage=10;player.cooldown=0;punch()');assert.equal(run('boss.hp'),hp);
  if(hp){run('player.cooldown=0;punch()');assert.equal(run('boss.hp'),hp);run('boss.timer=0;updateBoss(0)');assert.equal(run('projectiles.at(-1).type'),hp===2?'garlic':'stake');run('for(let i=0;i<10&&boss.mode!=="reload";i++)updateBoss(6.1)');assert.equal(run('boss.mode'),'reload');}
 }
 assert.equal(run('boss.mode'),'defeated');run('updateBoss(2)');assert.equal(run('state'),'cutscene');run('updateCutscene(12)');assert.equal(run('state'),'win');
});
test('progress persists across sessions, sanitizes malformed data and handles blocked storage',()=>{
 const storage=new Map();const first=createGame(storage);first.run('progressStore.save({time:350,score:100,fangs:3,damage:0})');const second=createGame(storage);assert.equal(second.run('progressStore.load().completed'),true);assert.equal(second.run('progressStore.load().fangs'),3);assert.equal(second.run('progressStore.load().achievements[0]'),'НЕПРОКУСИМЫЙ');second.run('progressStore.save({time:390,score:90,fangs:1,damage:3})');assert.equal(second.run('progressStore.load().bestTime'),350);
 storage.set('upyr-run.progress.v1','broken');assert.equal(second.run('progressStore.load().completed'),false);second.run('localStorage.setItem=()=>{throw Error("blocked")};progressStore.save({time:1,score:1,fangs:0,damage:1})');assert.equal(second.run('progressStore.available'),false);
});

test('complete five-zone route collects all fangs, defeats boss and persists progress without cheats',()=>{
 const run=game();run(readFileSync(new URL('./route-agent.js',import.meta.url),'utf8'));const result=run('driveLevel(60000)');assert.equal(result.state,'win');assert.equal(result.fangs,3);assert.equal(result.bossHp,0);assert.equal(result.continues,0);assert.equal(result.visited.length,5);assert.ok(result.seconds>=300&&result.seconds<=420);assert.equal(run('progressStore.load().completed'),true);
});

test('tower gate cannot be bypassed before lever, pause does not advance physics',()=>{
 const run=game();run('player.x=53450;player.y=-370;player.vx=245;keys.right=true;for(let i=0;i<60;i++)update(1/120)');assert.ok(run('player.x+player.w')<=53500);assert.equal(run('leverOpen'),false);
 run('const beforeTime=clock;const beforeX=player.x;paused=true;for(let i=0;i<120;i++)update(1/120)');assert.equal(run('clock'),run('beforeTime'));assert.equal(run('player.x'),run('beforeX'));
});

test('phase-three retreat is an animated backward jump',()=>{
 const run=game();run('player.x=58000;boss.mode="attack";boss.phase=3;boss.timer=0;updateBoss(0);const initialBossX=boss.x;updateBoss(.25)');assert.ok(run('boss.x')>run('initialBossX'));assert.ok(run('boss.y')<310);run('updateBoss(.4)');assert.equal(run('boss.y'),310);
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
