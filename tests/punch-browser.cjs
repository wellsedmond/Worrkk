const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3147'}});
(async()=>{let browser;try{
 for(let i=0;i<50;i++){try{if((await fetch('http://127.0.0.1:3147/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const page=await browser.newPage({viewport:{width:1280,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
 for(const route of ['/','/Worrkk.html']){
  await page.goto('http://127.0.0.1:3147'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  await page.evaluate(()=>{paused=true;player.x=350;player.y=350;player.h=80;player.ground=true;camera=100;enemies=[];coins=[];projectiles=[];});
  for(const [rage,count,clip] of [[false,8,'attack'],[true,10,'ragePunch']]){
   const frames=await page.evaluate(({rage,count})=>{sword=0;player.rage=rage?10:0;heroAnimator.reset();heroAnimator.strike(false,rage);const frames=[];for(let i=0;i<count;i++){frames.push({frame:heroAnimator.pose().frame,clip:heroAnimator.pose().clip});draw();heroAnimator.update(.36/count,false);}heroAnimator.update(.01,false);return {frames,after:heroAnimator.pose().phase};},{rage,count});assert.deepEqual(frames.frames.map(p=>p.frame),Array.from({length:count},(_,i)=>i));assert.ok(frames.frames.every(p=>p.clip===clip));assert.equal(frames.after,'stand');
   await page.evaluate(rage=>{player.rage=rage?10:0;heroAnimator.reset();heroAnimator.strike(false,rage);heroAnimator.update(rage?.195:.14,false);draw();},rage);await page.screenshot({path:`/tmp/upyr-punch-${route==='/'?'hosted':'offline'}-${rage?'rage':'normal'}.png`});
  }
  const fire=await page.evaluate(()=>{
   camera=1900;const trap=traps.find(t=>t.type==='fire');let image;const original=ctx.drawImage;ctx.drawImage=function(...args){if(args[3]===207&&args[4]===198)image=args[0];return original.apply(this,args);};try{draw();}finally{ctx.drawImage=original;}if(!image)throw Error('fire image was not drawn');
   const canvas=document.createElement('canvas');canvas.width=100;canvas.height=120;const c=canvas.getContext('2d'),rows=[];
   for(const active of [true,false])for(let i=0;i<(active?7:1);i++){
    const t={...trap,active},g=levelArt.bonfireGeometry(t,(i+.1)/12-t.x*.001);c.clearRect(0,0,100,120);c.drawImage(image,g.sx,g.sy,g.sw,g.sh,g.dx-t.x+20,g.dy-g.baseY+110,g.dw,g.dh);const pixels=c.getImageData(0,0,100,120).data;let bottom=-1;for(let y=0;y<120;y++)for(let x=0;x<100;x++)if(pixels[(y*100+x)*4+3]>160)bottom=y;rows.push(bottom);
   }return rows;
  });assert.ok(fire.every(y=>y>=109&&y<=112),`coal bases must touch ground row110: ${fire}`);
  await page.evaluate(()=>{player.rage=0;sword=0;heroAnimator.reset();camera=1900;player.x=2270;draw();});await page.screenshot({path:`/tmp/upyr-fire-ground-${route==='/'?'hosted':'offline'}.png`});
 }
 assert.deepEqual(errors,[]);console.log('Hosted/offline: normal 8-frame punch and rage 10-frame punch, return to idle; opaque coal pixels touch ground in all burning frames and inactive fire; no JS errors');
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
