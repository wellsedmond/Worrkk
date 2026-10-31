const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3149'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3149/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3149'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const transition=await page.evaluate(()=>{
   paused=true;player.x=12490;player.y=350;player.h=80;player.ground=true;zoneIndex=0;camera=12230;draw();
   player.x=12501;updateEvents(0);const active=pageTurn.active;paused=false;
   const before={x:player.x,y:player.y,hp:player.hp,clock,phase:traps[0].phase};keys.right=true;update(.3);paused=true;
   const frozen=player.x===before.x&&player.y===before.y&&player.hp===before.hp&&clock===before.clock&&traps[0].phase===before.phase;
   camera=12240;draw();return {active,to:pageTurn.to,elapsed:pageTurn.elapsed,frozen};
  });assert.deepEqual(transition,{active:true,to:1,elapsed:.3,frozen:true});
  const kind=route==='/'?'hosted':'offline';await page.screenshot({path:`/tmp/upyr-page-${kind}-turn.png`});
  await page.evaluate(()=>{paused=false;update(.7);paused=true;player.x=20480;player.y=80;player.ground=true;zoneIndex=1;camera=20220;cameraY=-150;banner.left=0;draw();});
  assert.equal(await page.evaluate(()=>pageTurn.active),false);assert.equal(await page.evaluate(()=>pageTurn.snapshot.width),1);
  const backgrounds=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=960;c.height=510;const x=c.getContext('2d');atmosphere.background(x,20000,0,0);const a=x.getImageData(0,0,960,510).data;atmosphere.background(x,20000,1,0);const b=x.getImageData(0,0,960,510).data;let sum=0;for(let i=0;i<a.length;i+=4)sum+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);return sum/(960*510*3);});assert.ok(backgrounds>10);
  await page.screenshot({path:`/tmp/upyr-page-${kind}-cemetery.png`});
  const alley=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=960;c.height=510;const x=c.getContext('2d');
   atmosphere.background(x,36500,1,0);const a=x.getImageData(0,0,960,510).data;atmosphere.background(x,36500,2,0);const b=x.getImageData(0,0,960,510).data;
   let difference=0;for(let i=0;i<a.length;i+=4)difference+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
   player.x=36500;player.y=350;player.vy=0;player.ground=true;camera=36240;cameraY=0;updateEvents(0);const turning=pageTurn.active&&pageTurn.to===2;
   paused=false;update(.9);paused=true;draw();return {turning,difference:difference/(960*510*3)};
  });assert.equal(alley.turning,true);assert.ok(alley.difference>10);await page.screenshot({path:`/tmp/upyr-page-${kind}-alley.png`});
  const tower=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=960;c.height=510;const x=c.getContext('2d');atmosphere.background(x,51100,2,0);const a=x.getImageData(0,0,960,510).data;atmosphere.background(x,51100,3,-600);const b=x.getImageData(0,0,960,510).data;
   let difference=0;for(let i=0;i<a.length;i+=4)difference+=Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]);
   player.x=51100;player.y=-370;player.ground=true;camera=50840;cameraY=-600;updateEvents(0);const turning=pageTurn.active&&pageTurn.to===3;
   paused=false;update(.9);paused=true;draw();return {turning,difference:difference/(960*510*3)};
  });assert.equal(tower.turning,true);assert.ok(tower.difference>5);await page.screenshot({path:`/tmp/upyr-page-${kind}-tower.png`});
  const states=await page.evaluate(()=>{const results=[];for(const to of [4,3,2,1]){player.x=LEVEL1.zones[to].start+1;updateEvents(0);results.push(pageTurn.to===to&&pageTurn.active);paused=false;update(1);paused=true;}start();return {results,reset:!pageTurn.active};});assert.ok(states.results.every(Boolean));assert.equal(states.reset,true);
  await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.evaluate(()=>{beginPageTurn(1);return pageTurn.duration;}),.18);await page.evaluate(()=>{clearPageTurn();paused=true;player.x=20480;player.y=80;zoneIndex=1;camera=20220;cameraY=-150;draw();});
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:`/tmp/upyr-page-${kind}-mobile.png`});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  assert.deepEqual(errors,[]);console.log(route,'cemetery background, page curl, all zone boundaries, safe freeze, reset, reduced motion and mobile passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
