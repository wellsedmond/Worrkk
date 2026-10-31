const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3144'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3144/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3144'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  await page.evaluate(()=>{paused=true;traps=[];projectiles=[];coins=[];const e=enemies.find(e=>e.type==='helmet');Object.assign(e,{x:270,origin:270,y:388,baseY:388,dir:1});enemies=[e];player.x=200;player.y=350;player.ground=true;heroAnimator.reset();draw();});
  const movement=await page.evaluate(()=>new Set(Array.from({length:8},(_,i)=>levelArt.helmetPose(enemies[0],i/12).frame)).size);assert.equal(movement,8);await page.screenshot({path:`/tmp/upyr-helmet-${route==='/'?'hosted':'offline'}-move.png`});
  const hurt=await page.evaluate(()=>{player.rage=10;punch();draw();return {hp:enemies[0].hp,dead:enemies[0].dead,pose:levelArt.helmetPose(enemies[0],clock)};});assert.equal(hurt.hp,1);assert.equal(hurt.dead,false);assert.equal(hurt.pose.clip,'damage');assert.equal(hurt.pose.frame,1);await page.screenshot({path:`/tmp/upyr-helmet-${route==='/'?'hosted':'offline'}-hurt.png`});
  const death=await page.evaluate(()=>{player.cooldown=0;punch();const e=enemies[0];const frames=Array.from({length:8},(_,i)=>levelArt.helmetPose({...e,death:.8-i*.1},clock).frame);e.death=.2;draw();return {dead:e.dead,frames,kills};});assert.equal(death.dead,true);assert.deepEqual(death.frames,[0,1,2,3,4,5,6,7]);assert.equal(death.kills,1);await page.screenshot({path:`/tmp/upyr-helmet-${route==='/'?'hosted':'offline'}-death.png`});
  const swordResult=await page.evaluate(()=>{start();paused=true;const e=enemies.find(e=>e.type==='helmet');player.x=e.x-50;player.y=350;player.face=1;sword=5;punch();return {dead:e.dead,sword,kills,score};});assert.equal(swordResult.dead,true);assert.equal(swordResult.sword,4);assert.equal(swordResult.kills,1);assert.equal(swordResult.score,8);
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline helmet garlic: 8 movement frames, hit reaction, 8 death frames; two punches even in rage or one sword hit; single reward; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
