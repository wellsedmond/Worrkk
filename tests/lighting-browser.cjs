const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3146'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3146/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3146'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const results=await page.evaluate(()=>{
   paused=true;player.x=400;player.y=350;player.h=80;player.ground=true;camera=0;
   const staticPixels={},motionPixels={},recorded={candle:new Set(),lantern:new Set()},original=ctx.drawImage;
   for(const kind of ['candle','lantern']){
    const base=atmosphere.lightingSprite(kind,0),first=base.getContext('2d').getImageData(0,0,base.width,base.height).data;let changedBody=0,changedFlame=0;
    for(let i=1;i<8;i++){const pixels=atmosphere.lightingSprite(kind,i).getContext('2d').getImageData(0,0,base.width,base.height).data;
     for(let y=0;y<base.height;y++)for(let x=0;x<base.width;x++){const p=(y*base.width+x)*4;if(![0,1,2,3].some(k=>first[p+k]!==pixels[p+k]))continue;const flame=kind==='candle'?y<205:x>=140&&x<214&&y>=128&&y<230;if(flame)changedFlame++;else changedBody++;}
    }staticPixels[kind]=changedBody;motionPixels[kind]=changedFlame;
   }
   ctx.drawImage=function(...args){for(const kind of ['candle','lantern'])for(let i=0;i<8;i++)if(args[0]===atmosphere.lightingSprite(kind,i))recorded[kind].add(i);return original.apply(this,args);};
   try{for(let i=0;i<8;i++){atmosphere.tick(.1);draw();}}finally{ctx.drawImage=original;}
   const report=atmosphere.lightingReport(),overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
   const boxes=report.objects.map(atmosphere.lightingBounds);
   const grounded=boxes.every(b=>groundPlatforms.some(p=>b.x>=p[0]&&b.x+b.w<=p[0]+p[2]));
   const clear=boxes.every((b,i)=>!report.obstacles.some(o=>overlap(b,o))&&!boxes.some((other,j)=>j!==i&&overlap(b,other)));
   return {staticPixels,motionPixels,actualFrames:{candle:recorded.candle.size,lantern:recorded.lantern.size},original:report.original,target:report.target,actual:report.actual,baseTarget:report.baseTarget,openingBefore:report.openingBefore,openingAdded:report.openingAdded,openingAfter:report.openingAfter,grounded,clear};
  });
  assert.deepEqual(results.staticPixels,{candle:0,lantern:0});assert.ok(results.motionPixels.candle>0&&results.motionPixels.lantern>0);assert.deepEqual(results.actualFrames,{candle:8,lantern:8});assert.equal(results.baseTarget,Math.round(results.original*.7));assert.ok(results.actual<=results.baseTarget);assert.ok(results.openingAfter<=Math.ceil(results.openingBefore/3)+results.openingAdded);assert.equal(results.openingAdded,2);assert.equal(results.actual,results.target);assert.equal(results.grounded,true);assert.equal(results.clear,true);
  await page.screenshot({path:`/tmp/upyr-static-lighting-${route==='/'?'hosted':'offline'}.png`});
  const blood=await page.evaluate(()=>{
   const relic=statues[0];while(relic.hp)Relics.strike(relic);items.push(Relics.drop(relic));const item=items.find(i=>i.type==='rage');camera=item.x-280;player.x=item.x-160;const frames=new Set(),original=ctx.drawImage;
   ctx.drawImage=function(...args){if(args[0].naturalWidth===2171&&args[0].naturalHeight===724)frames.add(args[1]);return original.apply(this,args);};
   try{for(let i=0;i<8;i++){clock=i/10;draw();}}finally{ctx.drawImage=original;}
   return {frames:frames.size,cycle:Array.from({length:9},(_,i)=>levelArt.bloodDropFrame(i/10))};
  });assert.equal(blood.frames,8);assert.deepEqual(blood.cycle,[0,1,2,3,4,5,6,7,0]);await page.screenshot({path:`/tmp/upyr-blood-drop-${route==='/'?'hosted':'offline'}.png`});
  const pickup=await page.evaluate(()=>{const item=items.find(i=>i.type==='rage');player.x=item.x;player.y=350;player.h=80;player.rage=0;updateEvents(0);const first=player.rage;player.rage=9;updateEvents(0);return {taken:item.taken,first,after:player.rage};});assert.deepEqual(pickup,{taken:true,first:10,after:9});
  console.log(route,JSON.stringify({lanterns:`${results.original} -> ${results.actual}`,staticPixels:results.staticPixels,clear:results.clear,bloodFrames:blood.frames}));
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline: fixed wax and lantern bodies, only flame pixels animate, 30% fewer non-overlapping lights, 8-frame blood drop and single pickup; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
