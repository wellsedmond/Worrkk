const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3154'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3154/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await context.addInitScript(()=>{window.musicTracks=[];const Original=window.Audio;window.Audio=function(...args){const a=new Original(...args);musicTracks.push(a);return a;};});
  await page.goto('http://127.0.0.1:3154'+route);await page.waitForFunction(()=>assetsReady);assert.equal(await page.locator('#boss-test').isVisible(),true);
  const saved=await page.evaluate(()=>{score=47;saveBossEntry();return JSON.stringify(progressStore.load());});await page.click('#boss-test');await page.fill('#boss-password','admin');await page.click('#boss-access-submit');await page.waitForFunction(()=>bossPractice&&boss.engaged);await page.click('#pause');
  const floor=await page.evaluate(()=>{
   player.x=boss.x-120;player.y=350;updateCamera(0);draw();const a=ctx.getImageData(0,480,960,20).data,left=camera;
   player.x=boss.x+120;updateCamera(0);draw();const b=ctx.getImageData(0,480,960,20).data;let changed=0;for(let i=0;i<a.length;i++)if(a[i]!==b[i])changed++;
   player.x=boss.x-120;updateCamera(0);return {changed,left,right:camera,y:cameraY,width:boss.arenaEnd-boss.arenaStart};
  });assert.deepEqual(floor,{changed:0,left:57500,right:57500,y:0,width:960});
  await page.click('#sound');await page.click('#pause');await page.waitForFunction(()=>musicTracks.some(a=>!a.paused&&a.currentTime>.1));
  const music=await page.evaluate(()=>{const a=musicTracks.find(a=>!a.paused);return {duration:a.duration,loop:a.loop,active:musicTracks.filter(a=>!a.paused).length,embedded:a.src.startsWith('data:audio/mpeg;base64,')};});assert.ok(music.duration>90&&music.duration<91);assert.equal(music.loop,true);assert.equal(music.active,1);assert.equal(music.embedded,route!=='/');
  const x=await page.evaluate(()=>player.x);await page.keyboard.down('ArrowRight');await page.waitForTimeout(1600);await page.keyboard.up('ArrowRight');assert.ok(await page.evaluate(()=>player.x)>x+150);assert.equal(await page.evaluate(()=>camera),57500);assert.equal(await page.evaluate(()=>player.x>boss.x+boss.w),true);await page.click('#pause');await page.evaluate(()=>{player.inv=0;draw();});
  await page.screenshot({path:`/tmp/upyr-static-boss-${route==='/'?'hosted':'offline'}-right.png`});await page.waitForFunction(()=>musicTracks.every(a=>a.paused));
  const rage=await page.evaluate(()=>{player.rage=10;player.inv=0;const hp=player.hp;hit();return {hp:player.hp,before:hp};});assert.equal(rage.hp,rage.before);
  await page.evaluate(()=>{boss.hp=0;Inquisitor.enter(boss,'VICTORY');completeBossBattle();updateCutscene(8);persistActiveBoss();});assert.equal(await page.evaluate(()=>JSON.stringify(progressStore.load())),saved);
  await page.click('#play');await page.waitForFunction(()=>musicTracks.some(a=>!a.paused&&a.duration>180));
  await page.evaluate(()=>{player.x=57500;updateBoss(0);});await page.waitForFunction(()=>musicTracks.some(a=>!a.paused&&a.duration<100));assert.equal(await page.evaluate(()=>musicTracks.length),2);assert.equal(await page.evaluate(()=>musicTracks.filter(a=>!a.paused).length),1);
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{paused=true;draw();});await page.screenshot({path:`/tmp/upyr-static-boss-${route==='/'?'hosted':'offline'}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.click('#menu-open');assert.equal(await page.locator('#boss-test').isVisible(),true);await page.screenshot({path:`/tmp/upyr-static-boss-${route==='/'?'hosted':'offline'}-menu-mobile.png`});await page.click('#boss-test');await page.fill('#boss-password','admin');await page.click('#boss-access-submit');await page.waitForFunction(()=>bossPractice&&boss.engaged);assert.deepEqual(errors,[]);console.log(route,JSON.stringify({floor,music}),'direct boss menu, crossing right, practice isolation, track switch and rage immunity passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
