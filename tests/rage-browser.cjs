const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3145'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3145/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3145'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  await page.evaluate(()=>{paused=true;player.x=350;player.y=350;player.h=80;player.ground=true;camera=100;enemies=[];traps=[];projectiles=[];});
  for(const armed of [false,true])for(const kind of ['run','jump','crouch']){
   const result=await page.evaluate(({armed,kind})=>{sword=armed?5:0;player.rage=10;player.h=kind==='crouch'?44:80;player.y=430-player.h;heroAnimator.reset();heroAnimator.update(kind==='crouch'?.4:.1,kind==='crouch',{ground:kind!=='jump',vy:kind==='jump'?-500:0,travel:kind==='run'?30:0,sword:armed,rage:true});draw();return {clip:heroAnimator.pose().clip,top:player.y+player.h+heroAnimator.geometry().dy};},{armed,kind});
   assert.equal(result.clip,(armed?'rageSword':'rage')+kind[0].toUpperCase()+kind.slice(1));if(kind==='crouch')assert.ok(result.top>LEVEL_STAKE_VISUAL_BOTTOM);
   await page.screenshot({path:`/tmp/upyr-rage-${route==='/'?'hosted':'offline'}-${armed?'sword':'unarmed'}-${kind}.png`});
  }
  const idle=await page.evaluate(()=>{player.rage=0;sword=5;player.h=80;player.y=350;heroAnimator.reset();draw();return heroAnimator.pose();});assert.equal(idle.clip,'swordIdle');assert.equal(idle.phase,'stand');await page.screenshot({path:`/tmp/upyr-sword-idle-${route==='/'?'hosted':'offline'}.png`});
  const transitions=await page.evaluate(()=>{player.rage=10;sword=5;heroAnimator.update(.1,false,{ground:true,vy:0,travel:30,sword:true,rage:true});draw();const before=heroAnimator.pose().clip;sword=0;draw();const broken=heroAnimator.pose().clip;player.rage=0;draw();const expired=heroAnimator.pose().clip;heroAnimator.reset();sword=5;player.face=-1;draw();return {before,broken,expired,idle:heroAnimator.pose().clip};});assert.deepEqual(transitions,{before:'rageSwordRun',broken:'rageRun',expired:'run',idle:'swordIdle'});
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline: 6 rage locomotion variants, crouch clearance, equipped idle, immediate sword loss and rage expiry, mirrored idle; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
const LEVEL_STAKE_VISUAL_BOTTOM=350;
