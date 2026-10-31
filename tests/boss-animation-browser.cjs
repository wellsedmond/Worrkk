const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3155'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3155/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3155'+route);await page.waitForFunction(()=>assetsReady);await page.click('#boss-test');await page.fill('#boss-password','admin');await page.click('#boss-access-submit');await page.click('#pause');
  const results=[];
  for(const dir of [-1,1])for(const [attack,at,slot]of [['volley',.85,'high'],['volley',1.95,'high'],['volley',3.05,'high'],['volley',.85,'low'],['combo',.8,'high'],['frenzy',2.05,'high'],['frenzy',2.8,'high'],['garlic',.65,'garlic'],['grenade',.7,'grenade'],['frenzy',3.55,'grenade'],['charge',4,'energy']]){
   const result=await page.evaluate(({dir,attack,at,slot})=>{
    Inquisitor.clear(boss);boss.x=boss.arenaStart+400;boss.inv=0;boss.time=0;boss.actionIndex=slot==='low'?0:1;player.x=boss.x+dir*250;player.y=350;player.h=80;player.inv=0;player.attack=0;Inquisitor.beginAttack(boss,attack,player);
    while(boss.stateTime<at)Inquisitor.step(boss,1/120,{player,inputs:{},hit(){}});
    const p=boss.projectiles.at(-1),socket=InquisitorArt.socket(boss,slot),pose=InquisitorArt.pose(boss),rear=p.kind==='bolt'?p.x+(dir<0?.94:.06)*p.w:p.kind==='energy'?p.x+(dir<0?p.w:0):p.x+p.w/2;
    let stray=0;
    if(['high','low','energy'].includes(slot)){
     const canvas=document.createElement('canvas');canvas.width=960;canvas.height=510;const c=canvas.getContext('2d'),local={...boss,x:300};InquisitorArt.body(c,local);const tip=InquisitorArt.socket(local,slot),x=Math.round(dir>0?tip.x+4:tip.x-120);const pixels=c.getImageData(x,Math.round(tip.y-12),116,24).data;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>100)stray++;
    }
    draw();return {attack,slot,dir,frame:pose.frame,errorX:Math.abs(rear-socket.x),errorY:Math.abs(p.y+p.h/2-socket.y),stray};
   },{dir,attack,at,slot});assert.equal(result.frame,3,JSON.stringify(result));assert.ok(result.errorX<1e-6&&result.errorY<1e-6,JSON.stringify(result));assert.equal(result.stray,0,JSON.stringify(result));results.push(result);
   if(dir===1&&['low','garlic','energy'].includes(slot))await page.screenshot({path:`/tmp/upyr-boss-animation-${route==='/'?'hosted':'offline'}-${slot}.png`});
  }
  const face=await page.evaluate(()=>{
   const cases=[];for(const armed of [0,5])for(const dir of [-1,1]){
    sword=armed;player.x=300;player.y=350;player.h=80;player.rage=0;player.inv=0;player.attack=0;player.face=dir;clock=0;heroAnimator.reset();heroAnimator.update(0,false,{ground:true,vy:0,travel:0,sword:armed>0,rage:false});
    const render=(s,t)=>{state=s;cutsceneTime=t;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,960,510);character();return ctx.getImageData(275,332,90,60).data;};
    const baseline=render('playing',0);for(const t of [2.1,3,4.9]){const image=render('cutscene',t);let changed=0;for(let i=0;i<baseline.length;i++)if(baseline[i]!==image[i])changed++;cases.push({armed,dir,t,changed});}
   }state='playing';player.x=boss.x-100;player.y=350;player.face=1;sword=0;boss.hp=0;Inquisitor.enter(boss,'VICTORY');player.attack=.3;player.inv=1;completeBossBattle();updateCutscene(3);draw();return cases;
  });assert.ok(face.every(f=>f.changed===0),JSON.stringify(face));await page.screenshot({path:`/tmp/upyr-boss-animation-${route==='/'?'hosted':'offline'}-victory.png`});
  const duplicateCrossbows=await page.evaluate(()=>{let copies=0;const original=ctx.drawImage;ctx.drawImage=function(...args){if(args[0].naturalWidth===2172&&args[1]===8&&args[2]===180)copies++;return original.apply(this,args);};try{draw();}finally{ctx.drawImage=original;}return copies;});assert.equal(duplicateCrossbows,0);
  assert.deepEqual(errors,[]);console.log(route,JSON.stringify({releaseCases:results.length,maxSocketError:Math.max(...results.map(r=>Math.max(r.errorX,r.errorY))),bakedProjectilePixels:results.reduce((s,r)=>s+r.stray,0),duplicateCrossbows,faceCases:face.length,facePixelChanges:face.reduce((s,f)=>s+f.changed,0)}));await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
