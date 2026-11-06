const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3164'},stdio:'ignore'});
const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3164/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 const context=await browser.newContext({viewport:{width:844,height:390},hasTouch:true,isMobile:true}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:'window.Telegram={WebApp:{platform:"android",ready(){},expand(){},onEvent(){},safeAreaInset:{top:0,bottom:0}}}'}));
 await page.goto('http://127.0.0.1:3164/');await page.waitForFunction(()=>assetsReady);
 await page.evaluate(()=>{startBossPractice('admin');paused=true;player.rage=10;notify('Тренировочный бой · Инквизитор',30);draw();});
 const samples=[];
 for(const [width,height,top]of [[568,320,0],[568,320,48],[667,375,0],[844,390,0],[915,412,48],[1024,768,24]]){
  await page.setViewportSize({width,height});await page.evaluate(top=>{Telegram.WebApp.safeAreaInset.top=top;syncOrientation();draw();},top);
  for(const attack of ['volley','charge','rain']){
   await page.evaluate(attack=>{boss.phase=3;Inquisitor.beginAttack(boss,attack,player);boss.forced=true;draw();},attack);
   const boss=await page.locator('#boss-hud').boundingBox();assert.ok(boss.width<=320&&boss.height<95,'compact boss panel');
   assert.ok(boss.y>=0&&boss.y+boss.height<=height,'boss panel fits viewport');
   for(const selector of ['#hud','header','#banner','#rage-meter','[data-key="left"]','[data-key="right"]','[data-key="attack"]','[data-key="jump"]','[data-key="crouch"]']){
    const el=page.locator(selector);if(!await el.isVisible())continue;
    const box=await el.boundingBox();assert.equal(overlaps(boss,box),false,`${selector} overlaps boss panel at ${width}x${height} safe top ${top}: ${JSON.stringify({boss,box})}`);
   }
   samples.push({width,height,top,attack,panelHeight:boss.height});
  }
 }
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>{Telegram.WebApp.safeAreaInset.top=0;syncOrientation();draw();});await page.screenshot({path:'/tmp/upyr-compact-boss-hud.png'});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({checks:samples.length,errors,result:'Compact mobile boss panel does not overlap HUD, header, banners, rage or controls'}));
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
