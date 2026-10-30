const {chromium}=require('playwright-core');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process');const root=path.resolve(__dirname,'..');
const server=spawn(process.execPath,['server.js'],{cwd:root,env:{...process.env,PORT:'3137'},stdio:'ignore'});
let browser;process.on('exit',()=>server.kill());
(async()=>{
 browser=await chromium.launch({executablePath:process.env.UPYR_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3137/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 const context=await browser.newContext({viewport:{width:1280,height:960},hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await context.addInitScript(()=>{window.audioContexts=0;if(window.AudioContext){const Original=window.AudioContext;window.AudioContext=new Proxy(Original,{construct(target,args){audioContexts++;return Reflect.construct(target,args);}});}});
 await page.route('https://telegram.org/js/telegram-web-app.js',route=>route.fulfill({contentType:'text/javascript',body:'window.telegramCalls=[];window.Telegram={WebApp:{ready(){telegramCalls.push("ready")},expand(){telegramCalls.push("expand")}}};'}));
 const urls=['/','/game.js','/hero-animation.js','/assets/hero-crouch.png','/level1.js','/level-art.js','/progress.js','/sound.js','/atmosphere.js','/style.css','/assets/hero.png','/assets/garlic.svg',...['helmet','hunter','coffin','fang','stake','gate','werewolf','tower'].map(x=>'/assets/level1/'+x+'.svg')];
 for(const url of urls)assert.equal((await fetch('http://127.0.0.1:3137'+url)).status,200,url);
 await page.goto('http://127.0.0.1:3137/');await page.waitForFunction(()=>assetsReady);
 assert.deepEqual(await page.evaluate(()=>telegramCalls),['ready','expand']);assert.equal(await page.evaluate(()=>audioContexts),0);
 await page.screenshot({path:'/tmp/upyr-level1-menu.png'});
 await page.click('#play');await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>audioContexts),0);
 const before=await page.evaluate(()=>player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(180);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>player.x)>before);
 await page.keyboard.down('Space');await page.waitForTimeout(70);assert.ok(await page.evaluate(()=>player.vy)<0);await page.keyboard.up('Space');
 await page.waitForTimeout(800);
 const footBefore=await page.evaluate(()=>player.y+player.h);
 await page.keyboard.down('ArrowDown');await page.waitForTimeout(370);
 assert.equal(await page.evaluate(()=>heroAnimator.pose().phase),'hold');assert.equal(await page.evaluate(()=>player.h),44);assert.equal(await page.evaluate(()=>player.y+player.h),footBefore);
 await page.screenshot({path:'/tmp/upyr-crouch.png'});
 await page.keyboard.up('ArrowDown');await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>heroAnimator.pose().phase),'up');await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>heroAnimator.pose().phase),'stand');
 await page.click('#sound');assert.equal(await page.evaluate(()=>audioContexts),1);await page.click('#sound');
 // Same real physics/input path as a player; the driver never changes positions or health.
 await page.addScriptTag({content:fs.readFileSync(path.join(root,'tests/route-agent.js'),'utf8')});
 const route=await page.evaluate(()=>{start();return driveLevel(60000)});
 assert.equal(route.state,'win');assert.equal(route.fangs,3);assert.equal(route.continues,0);assert.equal(route.visited.length,5);assert.equal(route.bossHp,0);assert.ok(route.seconds>=300&&route.seconds<=420);
 assert.equal(await page.locator('#overlay h2').textContent(),'LEVEL COMPLETE!');assert.equal(await page.locator('#continue').isVisible(),false);assert.ok((await page.locator('#overlay p').textContent()).includes('LEVEL 2 — СКОРО'));
 await page.screenshot({path:'/tmp/upyr-level1-complete.png'});
 const record=await page.evaluate(()=>progressStore.load());assert.equal(record.completed,true);assert.equal(record.fangs,3);
 await page.reload();await page.waitForFunction(()=>assetsReady);assert.equal(await page.evaluate(()=>progressStore.load().maxScore),record.maxScore);assert.equal(await page.evaluate(()=>audioContexts),0);
 await page.click('#play');await page.waitForTimeout(300);await page.screenshot({path:'/tmp/upyr-level1-forest.png'});
 // Positioning below is for visual snapshots/isolated checks only, not the complete-route run.
 for(const [zone,x,y]of [[1,20480,80],[2,36500,350],[3,51100,-370],[4,58597,350]]){
  await page.evaluate(({zone,x,y})=>{player.x=x;player.y=y;player.ground=true;zoneIndex=zone;camera=x-260;cameraY=Math.min(0,y-230);if(zone===4){boss.mode='reload';boss.timer=6;}}, {zone,x,y});
  await page.waitForTimeout(1000);await page.screenshot({path:'/tmp/upyr-level1-zone'+(zone+1)+'.png'});
 }
 await page.evaluate(()=>{start();player.x=29600;player.y=350;updateEvents(0);player.hp=1;player.inv=0;hit()});assert.equal(await page.locator('#overlay h2').textContent(),'ВАМПИР ПАЛ!');await page.click('#continue');assert.equal(await page.evaluate(()=>player.x),29600);assert.equal(await page.evaluate(()=>player.hp),3);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'/tmp/upyr-level1-mobile.png'});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const cdp=await context.newCDPSession(page);
 const a=await page.locator('[data-key=left]').boundingBox(),j=await page.locator('[data-key=jump]').boundingBox();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:a.x+a.width/2,y:a.y+a.height/2,id:1},{x:j.x+j.width/2,y:j.y+j.height/2,id:2}]});assert.equal(await page.evaluate(()=>keys.left&&keys.jump),true);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await page.evaluate(()=>keys.left||keys.jump),false);
 await page.evaluate(()=>{keys.attack=true;keys.crouch=true;dispatchEvent(new Event('blur'))});assert.equal(await page.evaluate(()=>keys.attack||keys.crouch),false);assert.equal(await page.evaluate(()=>paused),true);await page.click('#pause');assert.equal(await page.evaluate(()=>paused),false);
 const performanceResults=[];
 for(const [zone,x,y]of [[0,100,350],[1,20500,80],[3,51100,-370],[4,58500,350]]){
  await page.evaluate(({zone,x,y})=>{start();player.x=x;player.y=y;zoneIndex=zone;camera=x-260;cameraY=Math.min(0,y-230);},{zone,x,y});
  await page.waitForTimeout(1100);
  const data=await page.evaluate(async()=>{const samples=[];let previous=0;for(let i=0;i<90;i++){const now=await new Promise(requestAnimationFrame);if(previous)samples.push(now-previous);previous=now;}samples.sort((a,b)=>a-b);return {medianMs:samples[Math.floor(samples.length*.5)],p95Ms:samples[Math.floor(samples.length*.95)]};});performanceResults.push({zone:zone+1,...data});
 }
 // Restarts keep actor counts stable; no per-run event listeners or textures are appended.
 const sizes=await page.evaluate(()=>{const result=[];for(let i=0;i<12;i++){start();result.push([platforms.length,enemies.length,traps.length,items.length,projectiles.length].join(':'));}return [...new Set(result)];});assert.equal(sizes.length,1);
 const offlineContext=await browser.newContext({offline:true});const offline=await offlineContext.newPage();let network=0;offline.on('request',r=>{if(/^https?:/.test(r.url()))network++});await offline.setContent(fs.readFileSync(path.join(root,'Worrkk.html'),'utf8'));await offline.waitForFunction(()=>assetsReady);await offline.click('#play');assert.equal(await offline.evaluate(()=>state),'playing');assert.equal(network,0);
 assert.deepEqual(errors,[]);console.log(JSON.stringify({route,progress:record,performanceResults,errors,checks:'hosted assets, crouch sprite frames, fixed feet, Telegram stub, audio gesture, full route, 3 fangs, 3 boss phases, cutscene, persistence, checkpoint, multi-touch, pause, offline, restart counts'},null,2));
 await browser.close();server.kill();
})().catch(async e=>{console.error(e);if(browser)await browser.close();server.kill();process.exitCode=1});
