import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
function game(){
 const noop=()=>{};
 const element={disabled:false,classList:{remove:noop,toggle:noop},querySelector:()=>({textContent:''}),addEventListener:noop};
 const context={document:{querySelector:()=>({...element,getContext:()=>({})}),querySelectorAll:()=>[]},window:{addEventListener:noop},Image:class{decode(){return Promise.resolve()}},devicePixelRatio:1,requestAnimationFrame:noop,atmosphere:{ready:Promise.resolve(),reset:noop,prepare:noop,burst:noop}};
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../game.js',import.meta.url),'utf8'),context);vm.runInContext('assetsReady=true;start()',context);
 return code=>vm.runInContext(code,context);
}
test('ground and gaps retain their colliders',()=>{
 const run=game();assert.equal(run('JSON.stringify(groundPlatforms)'),JSON.stringify([[0,430,660,80],[770,430,570,80],[1480,430,600,80],[2220,430,700,80]]));
});
test('every ledge is reachable in one jump from ground or its lower tier at 30/60/120 Hz',()=>{
 for(const hz of [30,60,120]){
  const run=game();const ledges=JSON.parse(run('JSON.stringify(ledgePlatforms)'));
  for(const target of ledges){
   const all=JSON.parse(run('JSON.stringify(platforms)'));
   const source=all.find(p=>p[1]-target[1]===90&&Math.min(p[0]+p[2],target[0]+target[2])-Math.max(p[0],target[0])>=40);
   assert.ok(source,`lower tier exists for ${target}`);
   const x=Math.max(source[0],target[0])+5;
   run(`start();enemies=[];player.x=${x};player.y=${source[1]}-player.h;player.ground=true;keys.jump=true;update(1/${hz});keys.jump=false;`);
   let reached=false;
   for(let frame=0;frame<hz*2;frame++){
    run(`update(1/${hz})`);
    if(run('player.ground')){assert.equal(run('player.y+player.h'),target[1],`${target} at ${hz}Hz`);reached=true;break;}
   }
   assert.ok(reached,`landed on ${target} at ${hz}Hz`);
  }
 }
});
test('land, run and jump with original physics',()=>{
 const run=game();run('for(let i=0;i<120;i++)update(1/120)');assert.equal(run('player.y'),350);assert.equal(run('player.ground'),true);
 run('keys.right=true;update(1/60)');assert.equal(run('player.vx'),245);
 run('keys.jump=true;update(1/60)');assert.ok(Math.abs(run('player.vy')-(-590+1550/60))<1e-8);
});
test('coins collected once, original damage and immunity',()=>{
 const run=game();run('player.x=coins[0].x-20;player.y=coins[0].y-40;update(0);update(0)');assert.equal(run('score'),1);
 run('hit();hit()');assert.equal(run('player.hp'),2);
 run('player.inv=0;hit();player.inv=0;hit()');assert.equal(run('state'),'lost');
});
test('garlic stomp bounces, falling loses, finish and restart work',()=>{
 const run=game();run('player.x=enemies[0].x;player.y=enemies[0].y-player.h-1;player.vy=150;update(1/60)');assert.equal(run('enemies[0].dead'),true);assert.equal(run('player.vy'),-370);
 run('start();player.y=580;update(0)');assert.equal(run('state'),'lost');
 run('start();player.x=2790;update(0)');assert.equal(run('state'),'win');
 run('start()');assert.equal(run('player.hp'),3);assert.equal(run('score'),0);assert.equal(run('state'),'playing');
});
test('floating ledges do not block upward or sideways movement',()=>{
 const run=game();run('player.x=299;player.y=335;keys.right=true;update(1/60)');assert.ok(run('player.x')>300);
 run('start();player.x=370;player.y=355;player.vy=-400;update(1/60)');assert.ok(run('player.y')<355);assert.ok(run('player.vy')<0);
 // Feet already below the ledge top cannot snap upward onto it while falling.
 run('start();player.x=370;player.y=300;player.vy=50;update(1/60)');assert.equal(run('player.ground'),false);assert.ok(run('player.y')>300);
});
test('landing uses the first crossed top even at high speed and remains stable',()=>{
 const run=game();run('player.x=370;player.y=230;player.vy=4000;update(1/30)');assert.equal(run('player.y+player.h'),340);
 run('for(let i=0;i<120;i++)update(1/60)');assert.equal(run('player.y+player.h'),340);assert.equal(run('player.ground'),true);
});
test('ground walls and undersides remain solid; camera follows',()=>{
 const run=game();run('player.x=729;player.y=440;keys.right=true;update(1/60)');assert.equal(run('player.x'),730);
 run('start();player.x=50;player.y=515;player.vy=-400;update(1/60)');assert.equal(run('player.y'),510);assert.equal(run('player.vy'),0);
 run('start();player.x=1500;update(0)');assert.equal(run('camera'),1240);
});
