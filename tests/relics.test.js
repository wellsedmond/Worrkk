import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './harness.js';
test('each zone has one randomly chosen safe relic and new runs can change its position',()=>{
 const {run}=createGame();assert.equal(run('statues.length'),5);
 for(const value of [0,.2,.5,.9,.999]){run(`const layout${String(value).replace('.','_')}=Relics.create(LEVEL1,()=>${value});`);}
 assert.equal(run('Relics.create(LEVEL1,()=>0).every((s,i)=>s.zone===i&&s.hp===5&&Relics.candidates(LEVEL1,i).includes(s.x))'),true);
 assert.notEqual(run('Relics.create(LEVEL1,()=>0)[0].x'),run('Relics.create(LEVEL1,()=>.999)[0].x'));
});
test('five separate hits break a relic, with no extra strength from sword or rage',()=>{
 const {run}=createGame();run('const target=statues[0];player.x=target.x-52;player.y=350;player.face=1;sword=5;player.rage=10');
 for(let hit=1;hit<=5;hit++){run('player.cooldown=0;punch();punch()');assert.equal(run('target.hp'),5-hit);assert.equal(run('sword'),5);assert.equal(run('items.filter(i=>i.id==="blood-"+target.id).length'),hit===5?1:0);}
 run('player.cooldown=0;punch()');assert.equal(run('items.filter(i=>i.id==="blood-"+target.id).length'),1);
});
test('hidden blood is only available after destruction and only collected once',()=>{
 const {run}=createGame();run('const target=statues[0];player.x=target.x;player.y=350;player.rage=0;updateEvents(0)');assert.equal(run('player.rage'),0);
 run('while(target.hp)Relics.strike(target);items.push(Relics.drop(target));updateEvents(0)');assert.equal(run('player.rage'),10);
 run('player.rage=7;updateEvents(0)');assert.equal(run('player.rage'),7);
});
test('checkpoint restores damaged statues, dropped blood and collected flags without farming',()=>{
 const {run}=createGame();run('const a=statues[0],b=statues[1];Relics.strike(a);while(b.hp)Relics.strike(b);items.push(Relics.drop(b));items.at(-1).taken=true;checkpoint={id:"test",x:29600,y:430};captureCheckpoint();const location=a.x;statues[0].hp=0;resumeCheckpoint()');
 assert.equal(run('statues[0].hp'),4);assert.equal(run('statues[0].x'),run('location'));assert.equal(run('statues[1].hp'),0);assert.equal(run('items.find(i=>i.id==="blood-relic-1").taken'),true);assert.equal(run('items.filter(i=>i.id==="blood-relic-1").length'),1);
});
test('persistent arena entry keeps all statue positions and damage through page reload',()=>{
 const first=createGame();first.run('Relics.strike(statues[0]);statues[1].hp=0;items.push(Relics.drop(statues[1]));items.at(-1).taken=true;saveBossEntry()');const saved=first.run('JSON.stringify(statues.map(s=>({zone:s.zone,x:s.x,hp:s.hp})))');
 const second=createGame(first.storage,{start:false});second.run('restoreBossEntry()');assert.equal(second.run('JSON.stringify(statues.map(s=>({zone:s.zone,x:s.x,hp:s.hp})))'),saved);assert.equal(second.run('items.find(i=>i.id==="blood-relic-1").taken'),true);
});
test('armored garlic cannot hurt the player during a valid rebound at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){const {run}=createGame();run('enemies=[enemies.find(e=>e.type==="helmet")];const e=enemies[0];e.x=500;e.origin=0;e.baseY=388;e.y=388;e.range=999;traps=[];player.x=500;player.y=315;player.vy=100;player.ground=false;updateEnemies(0,385)');assert.equal(run('e.hp'),1);
  for(let i=0;i<Math.ceil(hz*.18);i++)run(`update(1/${hz})`);assert.equal(run('player.hp'),3,'rebound at '+hz+' Hz');assert.equal(run('e.hp'),1);
 }
});
test('side contact with armored garlic still causes damage',()=>{
 const {run}=createGame();run('enemies=[enemies.find(e=>e.type==="helmet")];const e=enemies[0];e.x=500;e.origin=0;e.baseY=388;e.y=388;e.range=999;player.x=500;player.y=350;player.vy=-20;updateEnemies(0,430)');assert.equal(run('player.hp'),2);assert.equal(run('e.hp'),2);
});
test('extra optional tiers are reachable and contain three coins each',()=>{
 const {run}=createGame();assert.ok(run('LEVEL1.ledges.filter(p=>p.optional).length')>=50);assert.equal(run('LEVEL1.ledges.filter(p=>p.optional).every(p=>[340,250,160,70].includes(p.y)&&LEVEL1.coins.filter(c=>c.y===p.y-40&&c.x>p.x&&c.x<p.x+p.w).length>=3)'),true);
});
