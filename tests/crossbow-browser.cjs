const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3142'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3142/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:process.env.UPYR_CHROMIUM||'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3142'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const frames=await page.evaluate(()=>{paused=true;return [{shotTime:-1,warn:false},{shotTime:-1,warn:true,phase:.8,warning:.9},...[0,.1,.2,.3,.4,.5].map(t=>({shotTime:t+1e-7}))].map(t=>levelArt.crossbowFrame(t));});assert.deepEqual(frames,[0,1,2,3,4,5,6,7]);
  for(const armed of [false,true]){
   const result=await page.evaluate(armed=>{paused=true;enemies=[];coins=[];player.x=450;player.y=350;player.h=80;player.ground=true;player.inv=0;player.hp=3;sword=armed?5:0;camera=210;keys.crouch=true;setCrouch();heroAnimator.reset();heroAnimator.update(.4,true,{ground:true,vy:0,travel:0,sword:armed});const trap=traps.find(t=>t.type==='stake');traps=[trap];Object.assign(trap,{x:580,y:LEVEL1.stakeY,phase:.89,shotTime:0});projectiles=[];spawnProjectile('stake',player.x+5,LEVEL1.stakeY,-1);const bottom=projectiles[0].y+projectiles[0].h/2+8,head=player.y+player.h+heroAnimator.geometry().dy;updateTraps(0);draw();return {bottom,head,hp:player.hp};},armed);
   assert.ok(result.bottom<result.head);assert.equal(result.hp,3);await page.screenshot({path:`/tmp/upyr-crossbow-${route==='/'?'hosted':'offline'}-${armed?'sword':'unarmed'}.png`});
  }
  const hp=await page.evaluate(()=>{projectiles=[];keys.crouch=false;setCrouch();player.inv=0;spawnProjectile('stake',player.x,LEVEL1.stakeY,0);updateTraps(0);return player.hp;});assert.equal(hp,2);
 }
 assert.deepEqual(errors,[]);console.log('8 crossbow frames; arrow clears armed/unarmed crouch and hits standing head; hosted/offline passed; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
