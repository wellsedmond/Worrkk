const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3150'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3150/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext(),page=await context.newPage(),errors=[];
  await context.addInitScript(()=>{window.musicTracks=[];const Original=window.Audio;window.Audio=function(...args){const audio=new Original(...args);musicTracks.push(audio);return audio;};});
  page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3150'+route);await page.waitForFunction(()=>assetsReady);assert.equal(await page.evaluate(()=>musicTracks.length),0);
  await page.click('#play');assert.equal(await page.evaluate(()=>musicTracks.length),0);await page.click('#sound');
  await page.waitForFunction(()=>musicTracks.length===1&&!musicTracks[0].paused&&musicTracks[0].currentTime>.1);
  const track=await page.evaluate(()=>({duration:musicTracks[0].duration,loop:musicTracks[0].loop,volume:musicTracks[0].volume,embedded:musicTracks[0].src.startsWith('data:audio/mpeg;base64,')}));
  assert.ok(track.duration>188&&track.duration<190);assert.equal(track.loop,true);assert.equal(track.volume,.32);assert.equal(track.embedded,route!=='/');
  await page.click('#pause');await page.waitForFunction(()=>musicTracks[0].paused);const at=await page.evaluate(()=>musicTracks[0].currentTime);await page.waitForTimeout(150);assert.equal(await page.evaluate(()=>musicTracks[0].currentTime),at);
  await page.click('#pause');await page.waitForFunction(at=>!musicTracks[0].paused&&musicTracks[0].currentTime>at,at);
  await page.evaluate(()=>{musicTracks[0].currentTime=musicTracks[0].duration-.1;});await page.waitForFunction(()=>musicTracks[0].currentTime<2);
  await page.click('#sound');await page.waitForFunction(()=>musicTracks[0].paused);assert.equal(await page.evaluate(()=>localStorage.getItem('upyr.sound')),'off');
  await page.click('#sound');await page.waitForFunction(()=>!musicTracks[0].paused);assert.equal(await page.evaluate(()=>musicTracks.length),1);
  await page.reload();await page.waitForFunction(()=>assetsReady);assert.equal(await page.evaluate(()=>musicTracks.length),0);await page.click('#play');await page.waitForFunction(()=>musicTracks.length===1&&!musicTracks[0].paused);
  await page.evaluate(()=>{paused=true;window.dispatchEvent(new Event('pagehide'));});assert.equal(await page.evaluate(()=>musicTracks[0].paused),true);assert.deepEqual(errors,[]);
  console.log(route,'uploaded MP3 decodes, loops, waits for gesture, pauses/resumes, mutes, persists preference and embeds offline');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
