const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3146'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3146/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3146'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const results=await page.evaluate(()=>{
   paused=true;enemies=[];traps=[];coins=[];player.x=400;player.y=350;player.ground=true;camera=0;
   const recorded={candle:new Set(),lantern:new Set()},original=ctx.drawImage;
   ctx.drawImage=function(...args){if(args[0].naturalWidth===1983&&args[0].naturalHeight===793)recorded[args[2]===0?'candle':'lantern'].add(args[1]);return original.apply(this,args);};
   try{for(let i=0;i<8;i++){atmosphere.tick(.1);draw();}}finally{ctx.drawImage=original;}
   let grounded=true;for(let c=0;c<LEVEL1.width;c+=350){for(const o of atmosphere.lightingObjects(c)){const start=o.kind==='lantern'?o.x-20:o.x-25,w=o.kind==='lantern'?74:50;if(!groundPlatforms.some(p=>start>=p[0]&&start+w<=p[0]+p[2]))grounded=false;}}
   return {frames:Array.from({length:9},(_,i)=>atmosphere.lightingFrame(i/10)),actualFrames:{candle:recorded.candle.size,lantern:recorded.lantern.size},grounded,objects:atmosphere.lightingObjects(0).map(o=>o.kind)};
  });
  assert.deepEqual(results.frames,[0,1,2,3,4,5,6,7,0]);assert.deepEqual(results.actualFrames,{candle:8,lantern:8});assert.equal(results.grounded,true);assert.ok(results.objects.includes('candle')&&results.objects.includes('lantern'));
  await page.screenshot({path:`/tmp/upyr-lighting-${route==='/'?'hosted':'offline'}.png`});
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline: all 8 frames of each light actually drawn, cycle wraps, all bases on ground across level; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
