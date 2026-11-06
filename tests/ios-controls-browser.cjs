const {chromium}=require('playwright-core'),{spawn}=require('node:child_process');
const path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3161'},stdio:'ignore'});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3161/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://telegram.org/**',r=>r.fulfill({body:'window.Telegram={WebApp:{platform:"ios",ready(){},expand(){},onEvent(){}}}'}));
  await page.goto('http://127.0.0.1:3161'+route);await page.waitForFunction(()=>assetsReady);await page.locator('#play').tap();
  const before=await page.evaluate(()=>({scale:visualViewport.scale,width:visualViewport.width,height:visualViewport.height}));
  for(const key of ['jump','attack','crouch','left','right']){
   const button=page.locator(`[data-key="${key}"]`);
   assert.equal(await button.evaluate(el=>{const e=new Event('touchend',{bubbles:true,cancelable:true});return el.dispatchEvent(e);}),false);
   assert.equal(await button.evaluate(el=>getComputedStyle(el).touchAction),'none');
   const box=await button.boundingBox();
   for(let i=0;i<4;i++)await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  }
  const move=await page.locator('[data-key="right"]').boundingBox(),jump=await page.locator('[data-key="jump"]').boundingBox();
  const cdp=await context.newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x:move.x+move.width/2,y:move.y+move.height/2},{id:2,x:jump.x+jump.width/2,y:jump.y+jump.height/2}]});
  assert.equal(await page.evaluate(()=>keys.right&&keys.jump),true);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  assert.equal(await page.evaluate(()=>keys.right||keys.jump),false);
  assert.deepEqual(await page.evaluate(()=>({scale:visualViewport.scale,width:visualViewport.width,height:visualViewport.height})),before);
  assert.deepEqual(errors,[]);await context.close();console.log(route+': rapid taps keep viewport scale; touchend default cancelled; simultaneous run and jump work');
 }
}finally{await browser?.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1;});
