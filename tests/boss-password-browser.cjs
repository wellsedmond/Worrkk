const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3156'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3156/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3156'+route);await page.waitForFunction(()=>assetsReady);assert.equal(await page.locator('#boss-test svg').count(),1);await page.click('#boss-test');
  assert.equal(await page.locator('#boss-access-note').textContent(),'Упс, если ты не разработчик, то пройди уровень и увидишь босса');assert.equal(await page.locator('#boss-password').getAttribute('type'),'password');
  await page.click('#boss-access-submit');assert.equal(await page.locator('#boss-password-error').isVisible(),true);assert.equal(await page.evaluate(()=>boss.engaged),false);
  await page.fill('#boss-password','ADMIN');await page.press('#boss-password','Enter');assert.equal(await page.locator('#boss-password-error').isVisible(),true);assert.equal(await page.evaluate(()=>bossPractice),false);
  await page.click('#boss-access-cancel');assert.equal(await page.locator('#boss-access-panel').isVisible(),false);assert.equal(await page.evaluate(()=>paused),false);assert.equal(await page.locator('#boss-password').inputValue(),'');
  await page.click('#boss-test');await page.press('#boss-password','Escape');assert.equal(await page.locator('#boss-access-panel').isVisible(),false);assert.equal(await page.evaluate(()=>document.activeElement.id),'boss-test');
  await page.click('#boss-test');await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'boss-access-cancel');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'boss-password');
  await page.fill('#boss-password','admin');assert.equal(await page.evaluate(()=>Object.values(keys).some(Boolean)),false);await page.press('#boss-password','Enter');await page.waitForFunction(()=>bossPractice&&boss.engaged);assert.equal(await page.locator('#boss-access-panel').isVisible(),false);assert.equal(await page.locator('#boss-password').inputValue(),'');
  await page.reload();await page.waitForFunction(()=>assetsReady);assert.equal(await page.evaluate(()=>bossPractice),false);await page.setViewportSize({width:390,height:844});await page.click('#boss-test');assert.equal(await page.locator('#boss-password').inputValue(),'');await page.screenshot({path:`/tmp/upyr-boss-password-${route==='/'?'hosted':'offline'}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.click('#boss-access-cancel');await page.click('#play');const natural=await page.evaluate(()=>{paused=true;player.x=57500;updateBoss(0);return {engaged:boss.engaged,practice:bossPractice};});assert.deepEqual(natural,{engaged:true,practice:false});assert.deepEqual(errors,[]);console.log(route,'lock icon and notice, empty/wrong/admin password, Enter/Escape/Tab, cleared input, mobile and normal campaign boss passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
