import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './harness.js';
test('boss camera and arena remain fixed when player crosses either side or jumps',()=>{
 const {run}=createGame();run('startBossPractice()');assert.equal(run('boss.arenaEnd-boss.arenaStart'),960);
 for(const [dx,y] of [[50,350],[500,220],[880,350]]){run(`player.x=boss.arenaStart+${dx};player.y=${y};updateCamera(.1)`);assert.equal(run('camera'),run('boss.arenaStart'));assert.equal(run('cameraY'),0);}
});
test('boss practice preserves campaign checkpoint, records and achievements through retry and victory',()=>{
 const {run}=createGame();run('score=47;saveBossEntry();const savedProgress=JSON.stringify(progressStore.load());const savedStats=JSON.stringify(achievementSystem.state);startBossPractice();player.hp=1;player.inv=0;hit();resumeCheckpoint()');assert.equal(run('bossPractice'),true);assert.equal(run('player.hp'),3);
 run('boss.hp=0;Inquisitor.enter(boss,"VICTORY");completeBossBattle();updateCutscene(8);persistActiveBoss()');assert.equal(run('state'),'win');assert.equal(run('JSON.stringify(progressStore.load())'),run('savedProgress'));assert.equal(run('JSON.stringify(achievementSystem.state)'),run('savedStats'));
});
test('rage adds exactly 25 percent movement speed on ground, in air and when crouching',()=>{
 const {run}=createGame();run('enemies=[];traps=[];player.x=500;player.y=350;player.ground=true;keys.right=true;update(1/120)');assert.equal(run('player.vx'),245);
 run('player.rage=10;update(1/120)');assert.equal(run('player.vx'),306.25);
 run('keys.jump=true;update(1/120)');assert.equal(run('player.vx'),306.25);assert.ok(run('player.vy')<0);
 run('keys.jump=false;keys.crouch=true;player.ground=true;player.y=350;update(1/120)');assert.equal(run('player.vx'),156.25);
 run('keys.crouch=false;player.rage=.001;update(.01)');assert.equal(run('player.rage'),0);assert.equal(run('player.vx'),245);
});
test('rage blocks damage and knockback until its timer expires',()=>{
 const {run}=createGame();run('player.inv=0;player.rage=10;player.vy=0;const before=damageTaken;hit();hit()');assert.equal(run('player.hp'),3);assert.equal(run('damageTaken'),run('before'));assert.equal(run('player.vy'),0);
 run('player.rage=0;hit()');assert.equal(run('player.hp'),2);assert.equal(run('damageTaken'),run('before')+1);
});
