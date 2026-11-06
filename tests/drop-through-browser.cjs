const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3166'},stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3166/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:'window.Telegram={WebApp:{platform:"android",ready(){},expand(){},onEvent(){}}}'}));
  await page.goto('http://127.0.0.1:3166'+route);await page.waitForFunction(()=>assetsReady);
  await page.evaluate(()=>{start();enemies=[];traps=[];const p=ledgePlatforms[0];player.x=p[0]+20;player.y=p[1]-player.h;player.ground=true;player.support=p.id;camera=player.x-260;});
  const box=await page.locator('[data-key="crouch"]').boundingBox(),cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:box.x+box.width/2,y:box.y+box.height/2}]});
  await page.waitForFunction(()=>player.y+player.h>345);await page.waitForFunction(()=>player.ground&&player.y+player.h===430&&player.h===44);
  assert.equal(await page.evaluate(()=>player.h),44);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.keyboard.down('ArrowDown');await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>player.y+player.h),430);await page.keyboard.up('ArrowDown');
  await page.evaluate(()=>{releaseKeys();const p=ledgePlatforms[0];player.x=p[0]+20;player.y=p[1]-player.h;player.vy=0;player.ground=true;player.support=p.id;});
  await page.keyboard.down('KeyS');await page.waitForFunction(()=>player.y+player.h>345);await page.keyboard.up('KeyS');await page.waitForFunction(()=>player.ground&&player.y+player.h===430);
  assert.deepEqual(errors,[]);await context.close();console.log(route+': touch crouch and S descend through a real level platform; ground remains solid');
 }
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
