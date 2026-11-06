import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from './harness.js';
function scene(kind='stone'){
 const {run}=createGame();
 run(`enemies=[];traps=[];coins=[];items=[];statues=[];
 groundPlatforms=[toPlatform({id:'floor',x:0,y:430,w:1000,h:80,type:'ground'})];
 ledgePlatforms=[toPlatform({id:'upper',x:240,y:230,w:220,h:18,type:'${kind}',axis:'y',period:3,amplitude:12}),toPlatform({id:'lower',x:240,y:330,w:220,h:18,type:'stone'})];
 platforms=[...groundPlatforms,...ledgePlatforms];player.x=300;player.y=150;player.vy=0;player.ground=true;player.support='upper';`);
 return run;
}
for(const hz of [30,60,120])test(`crouch drops through one platform, lands below and requires a new press at ${hz} Hz`,()=>{
 const run=scene();run(`keys.crouch=true;update(1/${hz})`);
 assert.equal(run('player.ground'),false);assert.ok(run('player.vy')>0);assert.ok(run('player.y+player.h')>230);
 run(`for(let i=0;i<${hz};i++)update(1/${hz})`);
 assert.equal(run('player.support'),'lower');assert.equal(run('player.y+player.h'),330);
 run(`keys.crouch=false;update(1/${hz});keys.crouch=true;update(1/${hz});for(let i=0;i<${hz};i++)update(1/${hz})`);
 assert.equal(run('player.support'),'floor');assert.equal(run('player.y+player.h'),430);assert.equal(run('player.h'),44);
});
for(const kind of ['moving','crumble'])test(`drop-through works on ${kind} platforms`,()=>{
 const run=scene(kind);run('keys.crouch=true;for(let i=0;i<120;i++)update(1/120)');assert.equal(run('player.support'),'lower');
});
test('ordinary crouching on solid ground never drops through the floor',()=>{
 const run=scene();run("player.support='floor';player.y=350;keys.crouch=true;for(let i=0;i<120;i++)update(1/120)");
 assert.equal(run('player.support'),'floor');assert.equal(run('player.y+player.h'),430);assert.equal(run('player.h'),44);
});
test('overlapping ledges do not catch the player; ignored surfaces work again after landing',()=>{
 const run=scene();run("ledgePlatforms.push(toPlatform({id:'overlap',x:280,y:230,w:100,h:18,type:'stone'}));platforms=[...groundPlatforms,...ledgePlatforms];keys.crouch=true;update(1/120)");
 assert.equal(run("dropPlatforms.has('upper')&&dropPlatforms.has('overlap')"),true);
 run('for(let i=0;i<120;i++)update(1/120)');assert.equal(run('player.support'),'lower');assert.equal(run('dropPlatforms.size'),0);
 run('keys.crouch=false;keys.jump=true;update(1/120);keys.jump=false;for(let i=0;i<120;i++)update(1/120)');assert.ok(['upper','overlap'].includes(run('player.support')));
});
test('restart and checkpoint reset drop-through and crouch press state',()=>{
 const run=scene();run('keys.crouch=true;update(1/120);start()');assert.equal(run('dropPlatforms.size'),0);assert.equal(run('crouchHeld'),false);
 run("dropPlatforms.add('upper');crouchHeld=true;resumeCheckpoint()");assert.equal(run('dropPlatforms.size'),0);assert.equal(run('crouchHeld'),false);
});
