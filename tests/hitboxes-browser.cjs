const {chromium}=require('playwright-core'),{spawn}=require('node:child_process'),path=require('node:path'),assert=require('node:assert/strict');
const server=spawn(process.execPath,['server.js'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:'3151'}});
(async()=>{let browser;try{
 for(let i=0;i<60;i++){try{if((await fetch('http://127.0.0.1:3151/')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({executablePath:'/usr/bin/chromium',headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const route of ['/','/Worrkk.html']){
  const context=await browser.newContext({viewport:{width:1280,height:960}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://telegram.org/**',r=>r.fulfill({body:''}));
  await page.goto('http://127.0.0.1:3151'+route);await page.waitForFunction(()=>assetsReady);await page.click('#play');
  const sizes=await page.evaluate(()=>{
   paused=true;window.debugHitboxes=true;clock=0;camera=0;cameraY=0;zoneIndex=0;clearPageTurn();
   const flame={id:'qa-fire',type:'fire',x:420,y:397,w:42,h:33,active:true,cycle:0};traps=[flame];
   enemies=[{id:'qa-garlic',type:'garlic',x:600,y:370,w:38,h:42,origin:600,baseY:370,dir:1,range:60,hp:1},{id:'qa-helmet',type:'helmet',x:740,y:388,w:38,h:42,origin:740,baseY:388,dir:-1,range:60,hp:2}];
   projectiles=[];spawnProjectile('stake',280,338,-1);player.x=140;player.y=350;player.h=80;player.ground=true;
   const fire=CombatGeometry.bounds(CombatGeometry.fire(flame)),image=levelArt.bonfireGeometry(flame,clock),bolt=CombatGeometry.bounds(CombatGeometry.bolt(projectiles[0]));draw();
   return {fire,image,bolt,garlic:CombatGeometry.bounds(CombatGeometry.enemy(enemies[0],clock)),helmet:CombatGeometry.bounds(CombatGeometry.enemy(enemies[1],clock))};
  });assert.ok(sizes.fire.y>=sizes.image.dy&&sizes.fire.y+sizes.fire.h<=sizes.image.baseY);assert.ok(sizes.fire.x>=sizes.image.dx&&sizes.fire.x+sizes.fire.w<=sizes.image.dx+sizes.image.dw);assert.ok(sizes.fire.h>33);assert.ok(sizes.bolt.h>8);assert.ok(sizes.garlic.w>38);assert.ok(sizes.helmet.w>38);
  const falling=await page.evaluate(()=>{const p={kind:'rain',x:400,y:180,w:10,h:48,age:.2};const c=document.createElement('canvas');c.width=960;c.height=510;InquisitorArt.drawWorld(c.getContext('2d'),{boss:{...boss,engaged:true,projectiles:[p],zones:[]}});return CombatGeometry.bounds(CombatGeometry.bolt(p));});assert.equal(falling.w,10);assert.ok(falling.h>40);
  const kind=route==='/'?'hosted':'offline';await page.screenshot({path:`/tmp/upyr-hitboxes-${kind}.png`});
  const contacts=await page.evaluate(()=>{player.x=440;player.y=385;player.w=2;player.h=2;player.hp=3;player.inv=0;state='playing';updateTraps(0);const flame=player.hp;player.inv=0;player.x=395;player.y=412;updateTraps(0);const glow=player.hp;
   traps=[];projectiles=[];player.w=40;player.h=44;player.x=290;player.y=386;player.inv=0;spawnProjectile('stake',300,338,0);updateTraps(0);const crouch=player.hp;return {flame,glow,crouch};});assert.deepEqual(contacts,{flame:2,glow:2,crouch:2});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>draw());assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert.deepEqual(errors,[]);console.log(route,JSON.stringify(sizes),'visible edge contacts, harmless glow and crouch passed');await context.close();
 }
 }finally{if(browser)await browser.close();server.kill();}})().catch(e=>{console.error(e);process.exitCode=1});
