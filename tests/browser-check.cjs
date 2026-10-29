const {chromium}=require('playwright-core');
const fs=require('node:fs');const assert=require('node:assert/strict');
const root=require('node:path').resolve(__dirname,'..');
const {spawn}=require('node:child_process');
const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'3137'},stdio:'ignore'});
let activeBrowser;
process.on('exit',()=>server.kill());
(async()=>{
const browser=await chromium.launch({executablePath:process.env.UPYR_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
activeBrowser=browser;
let serverReady=false;
for(let attempt=0;attempt<50;attempt++){try{const res=await fetch('http://127.0.0.1:3137/');if(res.ok){serverReady=true;break;}}catch{}await new Promise(resolve=>setTimeout(resolve,100));}
assert.ok(serverReady,'test server started');
const page=await browser.newPage({viewport:{width:1280,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
// Exercise the hosted edition and actual script/defer order with Telegram SDK methods stubbed.
const routes=['/','/style.css','/game.js','/atmosphere.js','/assets/hero.png','/assets/garlic.svg',...['ska-palace','skyline','graveyard','web'].map(n=>'/assets/environment/'+n+'.svg')];
for(const path of routes){const res=await fetch('http://127.0.0.1:3137'+path);assert.equal(res.status,200,path);}
await page.route('https://telegram.org/js/telegram-web-app.js',route=>route.fulfill({contentType:'text/javascript',body:'window.telegramCalls=[];window.Telegram={WebApp:{ready(){telegramCalls.push("ready")},expand(){telegramCalls.push("expand")}}};'}));
await page.goto('http://127.0.0.1:3137/');await page.waitForFunction(()=>assetsReady);
assert.deepEqual(await page.evaluate(()=>telegramCalls),['ready','expand']);
await page.screenshot({path:'/tmp/upyr-menu.png'});
await page.click('#play');await page.waitForTimeout(400);
await page.screenshot({path:'/tmp/upyr-game.png'});
// Keyboard controls with Cyrillic layout still use physical codes.
let before=await page.evaluate(()=>player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>player.x)>before);
await page.keyboard.down('Space');await page.waitForTimeout(70);assert.ok(await page.evaluate(()=>player.vy)<0);await page.keyboard.up('Space');
const full=await page.evaluate(()=>{
 start();let jumps=0;let gapJump=false;const sequence=[];
 for(let frame=0;frame<4500&&state==='playing';frame++){
  if(player.ground)gapJump=false;
  keys.right=true;
  // Leap deliberately at the original floor edges; no moving colliders are added.
  const edge=platforms.find(([x,y,w])=>Math.abs(player.y+player.h-y)<2&&player.x+player.w>x&&player.x<x+w);
  const obstacle=platforms.some(([x,y,w,h])=>x>player.x&&x-player.x<100&&(y+h>player.y||y>=player.y+player.h-112)&&y<player.y+player.h);
  const enemy=enemies.some(e=>!e.dead&&e.x>player.x&&e.x-player.x<100&&Math.abs(player.y+player.h-(e.y+42))<3);
  keys.jump=!!(player.ground&&((edge&&edge[3]===80&&player.x>edge[0]+edge[2]-50)||obstacle||enemy));
  const floor=platforms.slice(0,4).find(([x,y,w])=>player.x>=x&&player.x<x+w);
  if(keys.jump){jumps++;if(edge&&edge[3]===80&&player.x>edge[0]+edge[2]-50)gapJump=true;}
  if(!player.ground&&!gapJump&&floor&&player.x>floor[0]+floor[2]-75)keys.right=false;
  update(1/120);atmosphere.tick(1/120);
  if(frame%120===0)sequence.push([Math.round(player.x),Math.round(player.y),player.hp]);
 }
 return {state,x:player.x,hp:player.hp,jumps,sequence};
});
console.log('Traversal',JSON.stringify(full));assert.equal(full.state,'win');
await page.evaluate(()=>{start();player.y=580;update(0)});assert.equal(await page.locator('#overlay h2').textContent(),'ВАМПИР ПАЛ!');
await page.screenshot({path:'/tmp/upyr-defeat.png'});
await page.click('#play');assert.equal(await page.evaluate(()=>state),'playing');
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'/tmp/upyr-mobile.png'});
assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
// Pointer controls: release, cancellation, and focus-loss must clear input.
const bounds=await page.locator('[data-key=right]').boundingBox();await page.mouse.move(bounds.x+20,bounds.y+20);await page.mouse.down();assert.equal(await page.evaluate(()=>keys.right),true);await page.mouse.up();assert.equal(await page.evaluate(()=>keys.right),false);
await page.evaluate(()=>{keys.left=true;dispatchEvent(new Event('blur'))});assert.equal(await page.evaluate(()=>keys.left),false);
const cdp=await page.context().newCDPSession(page);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
const perf=await page.evaluate(()=>{
 const samples=[];start();
 for(let i=0;i<150;i++){camera=(i*13)%1960;draw();}
 for(let i=0;i<150;i++){camera=(i*13)%1960;const begin=performance.now();atmosphere.tick(1/60);draw();samples.push(performance.now()-begin);}
 samples.sort((a,b)=>a-b);return {averageMs:samples.reduce((a,b)=>a+b)/samples.length,p95Ms:samples[Math.floor(samples.length*.95)],particleCap:90};
});console.log('4x CPU draw submission (not GPU FPS)',JSON.stringify(perf));
const raf=await page.evaluate(async()=>{start();const intervals=[];let previous=0;for(let i=0;i<100;i++){const now=await new Promise(requestAnimationFrame);if(previous)intervals.push(now-previous);previous=now;}intervals.sort((a,b)=>a-b);return {medianMs:intervals[Math.floor(intervals.length*.5)],p95Ms:intervals[Math.floor(intervals.length*.95)],maxMs:intervals.at(-1)};});console.log('4x CPU real animation-frame intervals',JSON.stringify(raf));
await cdp.send('Emulation.setCPUThrottlingRate',{rate:1});
await page.evaluate(()=>{start();camera=0});
// Offline build must load all assets with no network requests.
const offline=await browser.newPage();let network=0;offline.on('request',r=>{if(/^https?:/.test(r.url()))network++});await offline.context().setOffline(true);
await offline.setContent(fs.readFileSync(require('node:path').join(root,'Worrkk.html'),'utf8'));await offline.waitForFunction(()=>assetsReady);await offline.click('#play');assert.equal(await offline.evaluate(()=>state),'playing');assert.equal(network,0);
assert.deepEqual(errors,[]);console.log('PASS: hosted assets, Telegram calls, keyboard, complete level, defeat/restart, mobile layout/pointer, offline edition; no page errors.');
await browser.close();server.kill();
})().catch(async e=>{console.error(e);if(activeBrowser)await activeBrowser.close();server.kill();process.exitCode=1});
