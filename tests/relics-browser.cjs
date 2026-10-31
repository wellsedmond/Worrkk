const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3152'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3152/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3152'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const setup=await page.evaluate(()=>{paused=true;const s=statues[0];camera=Math.max(0,s.x-470);cameraY=0;player.x=s.x-52;player.y=350;player.vy=0;player.ground=true;player.face=1;player.rage=0;keys.right=false;banner.left=0;draw();return {count:statues.length,positions:statues.map(s=>({x:s.x,zone:s.zone})),ledges:ledgePlatforms.length,coins:coins.length,font:document.fonts.check('30px UpyrGothic')};});assert.equal(setup.count,5);assert.equal(setup.font,true);assert.ok(setup.ledges>=140&&setup.coins>=340);
  const kind=route==='/'?'hosted':'offline';await page.screenshot({path:`/tmp/upyr-relics-${kind}-intact.png`});
  const states=[];for(let i=1;i<=5;i++){
   states.push(await page.evaluate(()=>{player.cooldown=0;punch();draw();return {hp:statues[0].hp,drops:items.filter(i=>i.id==='blood-relic-0').length};}));
   await page.screenshot({path:`/tmp/upyr-relics-${kind}-hit${i}.png`});
  }assert.deepEqual(states,[{hp:4,drops:0},{hp:3,drops:0},{hp:2,drops:0},{hp:1,drops:0},{hp:0,drops:1}]);
  const save=await page.evaluate(()=>{player.x=statues[0].x;player.y=350;updateEvents(0);const taken=items.find(i=>i.id==='blood-relic-0').taken;saveBossEntry();return {taken,layout:statues.map(s=>({x:s.x,zone:s.zone,hp:s.hp})),rage:player.rage};});assert.equal(save.taken,true);assert.equal(save.rage,10);
  await page.reload();await page.waitForFunction(()=>assetsReady);await page.click('#resume-boss');const restored=await page.evaluate(()=>{paused=true;return {layout:statues.map(s=>({x:s.x,zone:s.zone,hp:s.hp})),taken:items.find(i=>i.id==='blood-relic-0').taken};});assert.deepEqual(restored,{layout:save.layout,taken:true});
  await page.evaluate(()=>{start();paused=true;player.x=12495;player.y=350;camera=12235;draw();player.x=12501;updateEvents(0);paused=false;update(1.4);paused=true;draw();});assert.equal(await page.evaluate(()=>pageTurn.active&&pageTurn.duration>=3.5),true);await page.screenshot({path:`/tmp/upyr-relics-${kind}-page.png`});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());await page.screenshot({path:`/tmp/upyr-relics-${kind}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log(route,JSON.stringify(setup),'all damage stages, hidden drop, save/reload, long gothic page transition and mobile passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
