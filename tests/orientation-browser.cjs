const {chromium}=require('playwright-core');
const {spawn}=require('node:child_process');
const path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3160'},stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3160/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/130.0.0.0 Mobile Safari/537.36'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://telegram.org/**',r=>r.fulfill({body:'window.Telegram={WebApp:{platform:"android",ready(){},expand(){},onEvent(){}}}'}));
  await page.goto('http://127.0.0.1:3160'+route);await page.waitForFunction(()=>assetsReady);
  assert.equal(await page.locator('#orientation-notice').isVisible(),true);
  assert.equal(await page.locator('main').evaluate(el=>el.inert),true);
  await page.evaluate(()=>{start();window.frozenClock=clock;keys.right=true;update(.1);});
  assert.equal(await page.evaluate(()=>clock===frozenClock),true);
  await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>clock===frozenClock),true);
  if(route==='/')await page.screenshot({path:'/tmp/upyr-phone-portrait.png'});
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>!orientationBlocked);
  assert.equal(await page.locator('#orientation-notice').isVisible(),false);
  for(const selector of ['canvas','nav','[data-key="jump"]']){
   const box=await page.locator(selector).boundingBox();assert.ok(box.y>=0&&box.y+box.height<=391,selector+' must fit on the sideways phone');
  }
  const field=await page.locator('canvas').boundingBox();assert.deepEqual({x:field.x,y:field.y,width:field.width,height:field.height},{x:0,y:0,width:844,height:390});
  assert.equal(await page.evaluate(()=>keys.right),false);
  await page.waitForFunction(()=>clock>frozenClock);
  await page.dispatchEvent('[data-key="right"]','pointerdown',{pointerId:1});assert.equal(await page.evaluate(()=>keys.right),true);
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>orientationBlocked);
  assert.equal(await page.evaluate(()=>keys.right),false);
  await page.evaluate(()=>{window.frozenClock=clock;window.savedHp=player.hp;});
  await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>clock===frozenClock&&player.hp===savedHp),true);
  await page.evaluate(()=>{paused=true;});
  await page.setViewportSize({width:844,height:390});await page.waitForFunction(()=>!orientationBlocked);
  assert.equal(await page.evaluate(()=>paused),true);
  await page.waitForTimeout(100);assert.equal(await page.evaluate(()=>clock===frozenClock),true);
  if(route==='/')await page.screenshot({path:'/tmp/upyr-phone-landscape.png'});
  for(const [width,height]of [[568,320],[667,375],[844,390],[932,430],[1024,768]]){
   await page.setViewportSize({width,height});await page.waitForFunction(()=>!orientationBlocked);
   const boxes={};
   for(const key of ['left','right','jump','attack','crouch']){
    const button=page.locator(`[data-key="${key}"]`);boxes[key]=await button.boundingBox();
    const box=boxes[key];assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=width&&box.y+box.height<=height,key+' fits '+width+'x'+height);
    assert.ok(Math.abs(box.height-62.4)<.1,key+' has 30 percent greater height');
    assert.ok(box.width>box.height,key+' has oval proportions');
    assert.equal(await button.evaluate(el=>getComputedStyle(el).borderRadius),'50%');
   }
   const values=Object.values(boxes);
   for(let i=0;i<values.length;i++)for(let j=i+1;j<values.length;j++){
    const a=values[i],b=values[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y,'control buttons must not overlap');
   }
   assert.ok(boxes.jump.y+boxes.jump.height<boxes.crouch.y);
   assert.ok(boxes.attack.x+boxes.attack.width<boxes.jump.x);
  }
  assert.deepEqual(errors,[]);await context.close();console.log(route+': portrait blocks play, rotation clears held input, landscape resumes, manual pause preserved');
 }
 for(const platform of ['android','tdesktop']){
  const context=await browser.newContext({viewport:{width:1280,height:720},hasTouch:platform==='android'}),page=await context.newPage();
  await page.route('https://telegram.org/**',r=>r.fulfill({body:`window.fullscreenCalls=0;window.telegramEvents={};window.Telegram={WebApp:{platform:${JSON.stringify(platform)},isVersionAtLeast:()=>true,ready(){},expand(){},disableVerticalSwipes(){},requestFullscreen(){fullscreenCalls++},safeAreaInset:{top:12,left:20,right:16,bottom:8},contentSafeAreaInset:{top:40},onEvent(name,fn){telegramEvents[name]=fn}}};`}));
  await page.goto('http://127.0.0.1:3160/');await page.waitForFunction(()=>assetsReady);
  assert.equal(await page.evaluate(()=>fullscreenCalls),1);
  const box=await page.locator('canvas').boundingBox();assert.deepEqual(box,{x:0,y:0,width:1280,height:720});
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--game-top')),'40px');
  await page.evaluate(()=>{Telegram.WebApp.safeAreaInset.left=44;telegramEvents.safeAreaChanged();});
  assert.equal(await page.evaluate(()=>document.documentElement.style.getPropertyValue('--game-left')),'44px');
  await page.setViewportSize({width:390,height:844});await page.waitForFunction(()=>orientationBlocked);
  assert.equal(await page.locator('#orientation-title').textContent(),platform==='android'?'Поверните телефон':'Расширьте окно игры');
  await page.setViewportSize({width:1280,height:720});await page.waitForFunction(()=>!orientationBlocked);
  await context.close();console.log(platform+': fullscreen requested, game fills viewport, safe areas update, portrait blocked');
 }
 const desktop=await browser.newContext({viewport:{width:390,height:844}}),page=await desktop.newPage();
 await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));await page.goto('http://127.0.0.1:3160/');await page.waitForFunction(()=>assetsReady);
 assert.equal(await page.locator('#orientation-notice').isVisible(),false);await desktop.close();console.log('Desktop portrait window remains available');
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
