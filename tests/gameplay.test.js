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
test('level retains every original platform collider',()=>{
 const run=game();assert.equal(run('JSON.stringify(platforms)'),JSON.stringify([[0,430,660,80],[770,430,570,80],[1480,430,600,80],[2220,430,700,80],[340,330,150,22],[850,320,160,22],[1120,240,160,22],[1570,320,170,22],[1850,240,160,22],[2290,320,150,22],[2530,250,160,22]]));
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
test('walls, underside collisions and camera retain behavior',()=>{
 const run=game();run('player.x=299;player.y=335;keys.right=true;update(1/60)');assert.equal(run('player.x'),300);
 run('start();player.x=370;player.y=355;player.vy=-400;update(1/60)');assert.equal(run('player.y'),352);assert.equal(run('player.vy'),0);
 run('start();player.x=1500;update(0)');assert.equal(run('camera'),1240);
});
