const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3143'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3143/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3143'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  await page.evaluate(()=>{paused=true;player.x=29420;player.y=350;player.h=80;player.ground=true;player.inv=0;camera=29250;coins=[{id:'qa-coin',x:29780,y:390,taken:false}];enemies=[{id:'qa-garlic',origin:29800,x:29800,y:350,dir:1,type:'garlic',hp:1,dead:false,range:50}];traps=[{id:'qa-fire',type:'fire',x:29890,y:397,w:42,h:33,active:true,cycle:0}];projectiles=[];draw();});
  await page.screenshot({path:`/tmp/upyr-props-${route==='/'?'hosted':'offline'}-closed.png`});
  const result=await page.evaluate(()=>{player.x=29600;score=17;updateEvents(0);const saved=snapshot.score;const frames=[];for(let i=0;i<8;i++){frames.push(levelArt.propFrame('coffin',coffinStates[1].openTime));updateEvents(.1);}draw();score=99;updateEvents(.1);return {frames,saved,after:snapshot.score,opened:coffinStates[1].opened,frame:levelArt.propFrame('coffin',coffinStates[1].openTime)};});
  assert.deepEqual(result.frames,[0,1,2,3,4,5,6,7]);assert.equal(result.saved,17);assert.equal(result.after,17);assert.equal(result.opened,true);assert.equal(result.frame,7);
  await page.screenshot({path:`/tmp/upyr-props-${route==='/'?'hosted':'offline'}-open.png`});
  assert.equal(await page.evaluate(()=>{resumeCheckpoint();return score;}),17);assert.equal(await page.evaluate(()=>coffinStates[1].opened),true);
  const cycles=await page.evaluate(()=>Object.fromEntries(['fire','coin','garlic'].map(kind=>[kind,new Set(Array.from({length:120},(_,i)=>levelArt.propFrame(kind,i/60))).size])));assert.equal(cycles.coin,12);assert.ok(cycles.fire>1&&cycles.garlic>1);
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline: animated fire, rotating coin and flying garlic; 8 coffin frames; save once; respawn preserves save/open coffin; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
