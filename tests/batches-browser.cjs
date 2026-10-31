const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3153'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3153/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3153'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const data=await page.evaluate(()=>{paused=true;const signatures=LEVEL1.batches.map(b=>JSON.stringify(b.platformIds.map(id=>{const p=LEVEL1.ledges.find(p=>p.id===id);return [p.x-b.x,p.y,p.w];})));return {batches:signatures.length,unique:new Set(signatures).size,oneCoin:LEVEL1.ledges.every(p=>coins.filter(c=>c.platformId===p.id).length===1),coins:coins.length,freeBlood:items.length,addedLamps:atmosphere.lightingReport().openingAdded};});
  assert.equal(data.unique,data.batches);assert.equal(data.oneCoin,true);assert.equal(data.freeBlood,0);assert.equal(data.addedLamps,2);assert.ok(data.coins<346);
  for(const pattern of ['chain','checkerboard','terrace']){await page.evaluate(pattern=>{const b=LEVEL1.batches.find(b=>b.pattern===pattern);clearPageTurn();camera=b.x-190;cameraY=-40;player.x=b.x+20;player.y=260;player.ground=true;player.vy=0;clock=1;zoneIndex=LEVEL1.zones.findIndex(z=>b.x>=z.start&&b.x<z.end);banner.left=0;heroAnimator.reset();draw();},pattern);await page.screenshot({path:`/tmp/upyr-batches-${route==='/'?'hosted':'offline'}-${pattern}.png`});}
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log(route,JSON.stringify(data),'unique rows/checkerboards, one coin per platform, no loose blood, two extra lamps and mobile passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
