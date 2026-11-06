const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3165'},stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3165/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:'window.Telegram={WebApp:{platform:"android",ready(){},expand(){},onEvent(){}}}'}));
  await page.goto('http://127.0.0.1:3165'+route);await page.waitForFunction(()=>assetsReady);await page.locator('#play').tap();
  assert.equal(await page.locator('.header-actions button').count(),1);
  for(const id of ['sound','pause','menu-open','reset'])assert.equal(await page.locator('#'+id).isVisible(),false);
  await page.evaluate(()=>{keys.right=true;});await page.locator('#game-settings').tap();
  assert.equal(await page.evaluate(()=>paused&&!keys.right),true);assert.equal(await page.locator('#game-settings').getAttribute('aria-expanded'),'true');
  for(const id of ['sound','pause','menu-open','reset'])assert.equal(await page.locator('#'+id).isVisible(),true);
  await page.evaluate(()=>{window.settingsClock=clock;});await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>clock===settingsClock),true);
  await page.locator('#sound').tap();assert.match(await page.locator('#sound').innerText(),/вкл/);await page.locator('#sound').tap();assert.match(await page.locator('#sound').innerText(),/выкл/);
  await page.locator('#pause').tap();await page.locator('#settings-close').tap();assert.equal(await page.evaluate(()=>paused),true);
  await page.locator('#game-settings').tap();await page.locator('#pause').tap();assert.equal(await page.evaluate(()=>paused),false);assert.equal(await page.locator('#settings-panel').isVisible(),false);
  await page.locator('#game-settings').tap();await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>paused),false);
  await page.evaluate(()=>{player.x=600;});await page.locator('#game-settings').tap();await page.locator('#reset').tap();assert.ok(await page.evaluate(()=>player.x<100&&state==='playing'&&!paused));
  await page.locator('#game-settings').tap();await page.locator('#menu-open').tap();assert.equal(await page.evaluate(()=>state),'menu');assert.equal(await page.locator('#settings-panel').isVisible(),false);
  await page.locator('#menu-resume').tap();assert.equal(await page.evaluate(()=>state),'playing');
  await page.locator('#game-settings').tap();
  const box=await page.locator('#settings-panel').boundingBox();assert.ok(box.x>=0&&box.y>=0&&box.x+box.width<=844&&box.y+box.height<=390);
  if(route==='/')await page.screenshot({path:'/tmp/upyr-gear-settings.png'});
  await page.locator('#settings-close').tap();if(route==='/')await page.screenshot({path:'/tmp/upyr-gear-game.png'});
  assert.deepEqual(errors,[]);await context.close();console.log(route+': one gear, all four actions, automatic pause, manual pause, sound, restart and main-menu resume passed');
 }
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
