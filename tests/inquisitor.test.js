import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {createGame} from './harness.js';
function machine(mode='normal'){
 const c={};vm.createContext(c);vm.runInContext(readFileSync(new URL('../inquisitor.js',import.meta.url),'utf8'),c);const api=vm.runInContext('Inquisitor',c),b=api.create({},mode);let hits=0;
 const player={x:57600,y:350,w:40,h:80,attack:0};const ctx={player,inputs:{},hit:()=>hits++};api.engage(b,true);
 return {api,b,player,ctx,get hits(){return hits;},step(n){for(let i=0;i<Math.ceil(n*120);i++)api.step(b,1/120,ctx);}};
}
test('difficulty HP and phase thresholds preserve health and clear hazards',()=>{
 for(const [mode,hp] of [['easy',18],['normal',25],['hard',35]]){
  const {api,b}=machine(mode);assert.equal(b.hp,hp);
  for(const threshold of [.7,.35]){while(b.hp/hp>threshold){api.enter(b,'RECOVERY',2);b.inv=0;b.projectiles=[{kind:'bolt'}];b.zones=[{}];api.strike(b,1);}assert.equal(b.state,'PHASE_TRANSITION');assert.equal(b.projectiles.length,0);assert.equal(b.zones.length,0);assert.equal(b.phase,threshold===.7?2:3);}
 }
});
test('every attack has a finite timeline and leaves a reachable safe region',()=>{
 for(const kind of ['volley','garlic','trap','dash','grenade','combo','feint','beam','rain','frenzy','charge']){
  const t=machine();t.api.beginAttack(t.b,kind,t.player);const width=t.b.zones.reduce((s,z)=>s+z.w,0);assert.ok(width<t.b.arenaEnd-t.b.arenaStart-200,kind);
  t.step(t.api.attacks[kind]+.04);assert.equal(t.b.state,'RECOVERY',kind);assert.ok(t.b.timer>=1.3,kind);
  assert.ok(t.b.projectiles.length<=32&&t.b.zones.length<=16);
 }
});
test('telegraph zones do not deal global damage; beam/UV/trap damage requires active overlap',()=>{
 const t=machine();t.api.beginAttack(t.b,'beam',t.player);t.step(.8);assert.equal(t.hits,0);t.player.x+=220;t.step(.8);assert.equal(t.hits,0,'outside beam remains safe');
 const z={kind:'uv',x:t.player.x,y:410,w:100,h:20,warning:1,activeTime:3,age:0};t.b.zones=[z];t.api.enter(t.b,'RECOVERY',5);t.step(.8);assert.equal(t.hits,0);t.step(.3);assert.ok(t.hits>0);
 t.player.y=250;const before=t.hits;t.step(.1);assert.equal(t.hits,before,'jumping over floor field is safe');
});
test('charged final shot can be interrupted, grants 3-second stun and cleans active hazards',()=>{
 const t=machine();t.b.phase=3;t.b.hp=8;t.api.beginAttack(t.b,'charge',t.player);t.step(3.8);assert.equal(t.b.projectiles.length,0);
 const result=t.api.strike(t.b,1);assert.equal(result.interrupted,true);assert.equal(t.b.state,'STUNNED');assert.equal(t.b.timer,3);t.step(.8);assert.equal(t.b.projectiles.length,0);assert.equal(t.b.hp,7);
 const other=machine();other.api.beginAttack(other.b,'charge',other.player);other.step(4.05);assert.equal(other.b.projectiles[0].kind,'energy');
});
test('attention freezes in intro, stun and pause; standing/repetition trigger a warned phase attack',()=>{
 const t=machine();t.api.enter(t.b,'STUNNED',3);t.b.attention=.5;t.step(1);assert.equal(t.b.attention,.5);t.ctx.paused=true;t.step(1);assert.equal(t.b.attention,.5);t.ctx.paused=false;
 t.api.enter(t.b,'IDLE',100);t.b.attention=.99;t.step(.3);assert.equal(t.b.state,'ATTACK');assert.equal(t.b.forced,true);assert.ok(t.api.warning(t.b).includes('ПРИВЫЧКУ'));
});
test('persistent arena checkpoint restores inventory/progress after a new page and skips intro',()=>{
 const g=createGame();g.run('score=37;sword=3;kills=12;coins[0].taken=true;leverOpen=true;player.x=57400;player.y=350;updateEvents(0)');
 assert.equal(g.run('progressStore.load().bossCheckpoint.snapshot.score'),37);const next=createGame(g.storage,{start:false});next.run('restoreBossEntry()');
 assert.equal(next.run('score'),37);assert.equal(next.run('sword'),3);assert.equal(next.run('coins[0].taken'),true);assert.equal(next.run('boss.hp'),25);assert.equal(next.run('boss.phase'),1);assert.equal(next.run('boss.state'),'IDLE');assert.equal(next.run('player.hp'),3);assert.ok(next.run('player.x')>57500);
 next.run('boss.projectiles=[{}];boss.zones=[{}];boss.hp=2;player.hp=1;player.inv=0;hit();resumeCheckpoint()');assert.equal(next.run('boss.projectiles.length'),0);assert.equal(next.run('boss.zones.length'),0);assert.equal(next.run('boss.hp'),25);assert.equal(next.run('score'),37);
});
test('first victory grants 1000 coins and achievement once, clears checkpoint and survives replay/reload',()=>{
 const g=createGame();g.run("player.x=57400;player.y=350;updateEvents(0);score=20;boss.engaged=true;Inquisitor.enter(boss,'VICTORY');boss.hp=0;completeBossBattle()");
 assert.equal(g.run('score'),1020);assert.equal(g.run('progressStore.load().bossCheckpoint'),null);assert.equal(g.run('progressStore.load().boss.defeated'),true);assert.ok(g.run('achievementSystem.state.unlocked.lastvampire'));
 const coins=g.run('achievementSystem.state.stats.coins');g.run('completeBossBattle()');assert.equal(g.run('score'),1020);assert.equal(g.run('achievementSystem.state.stats.coins'),coins);
 const next=createGame(g.storage);next.run("restoreBossEntry(true,'hard');const beforeReward=score;boss.engaged=true;boss.hp=0;Inquisitor.enter(boss,'VICTORY');completeBossBattle()");assert.equal(next.run('score'),next.run('beforeReward'));assert.equal(next.run('boss.maxHp'),35);assert.equal(next.run('achievementSystem.state.stats.coins'),coins);
});
test('local storage failure retains a working session checkpoint and signals unavailable persistence',()=>{
 const g=createGame();g.run('localStorage.setItem=()=>{throw Error("blocked")};player.x=57400;player.y=350;updateEvents(0)');assert.equal(g.run('progressStore.available'),false);g.run('resumeCheckpoint()');assert.equal(g.run('boss.hp'),25);assert.equal(g.run('player.hp'),3);
});

test('pre-checkpoint enemy/coin journal remains deduplicated after page restoration',()=>{
 const g=createGame();g.run('defeatEnemy(enemies[0]);player.x=57400;player.y=350;updateEvents(0)');const runId=g.run('achievementSystem.runId'),coins=g.run('achievementSystem.state.stats.coins'),kills=g.run('achievementSystem.state.stats.kills');
 const next=createGame(g.storage,{start:false});next.run('restoreBossEntry();defeatEnemy(enemies[0]);achievementSystem.emit("coin_collected",{id:"kill-"+enemies[0].id,amount:1})');
 assert.equal(next.run('achievementSystem.runId'),runId);assert.equal(next.run('achievementSystem.state.stats.coins'),coins);assert.equal(next.run('achievementSystem.state.stats.kills'),kills);
});
test('airborne UV grenade does not hurt; its floor area still requires a warning',()=>{
 const t=machine();t.api.enter(t.b,'RECOVERY',5);t.b.projectiles=[{id:'test',kind:'grenade',x:t.player.x,y:t.player.y,vx:0,vy:0,w:30,h:30,age:0}];t.step(.1);assert.equal(t.hits,0);
 t.b.projectiles[0].y=401;t.step(.01);assert.equal(t.hits,0);assert.equal(t.b.zones[0].kind,'uv');assert.ok(t.b.zones[0].warning>=1);
});
test('all difficulty modes can be completed using only normal game inputs during combat',()=>{
 const results=[];
 for(const mode of ['easy','normal','hard']){
  const g=createGame();g.run(readFileSync(new URL('./route-agent.js',import.meta.url),'utf8'));
  // Isolated boss scenario: inventory and entry position are set once before entering combat.
  g.run(`bossDifficulty=progressStore.setBossDifficulty('${mode}');start();sword=5;player.x=57400;player.y=350;player.ground=true;leverOpen=true;updateEvents(0)`);
  const r=g.run('driveLevel(30000)');assert.equal(r.state,'win',mode);assert.equal(r.continues,0,mode);assert.equal(r.bossHp,0,mode);results.push({mode,seconds:r.seconds});
 }
});

test('lethal hit persists victory before the death animation can be interrupted by closing the app',()=>{
 const g=createGame();g.run("player.x=57400;player.y=350;updateEvents(0);boss.engaged=true;boss.hp=1;boss.inv=0;Inquisitor.enter(boss,'RECOVERY',2);player.x=boss.x-50;player.y=350;player.face=1;sword=0;player.cooldown=0;punch()");
 assert.equal(g.run('boss.state'),'DEATH');assert.equal(g.run('progressStore.load().boss.defeated'),true);assert.equal(g.run('progressStore.load().bossCheckpoint'),null);assert.equal(g.run('score'),1000);
 const next=createGame(g.storage,{start:false});assert.equal(next.run('progressStore.load().boss.firstRewardClaimed'),true);assert.ok(next.run('achievementSystem.state.unlocked.lastvampire'));
});
