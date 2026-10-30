/* Extra actors reuse the Canvas renderer. SVGs are explicit replaceable art assets. */
const levelArt=(()=>{
 const images={};const names=['helmet','hunter','coffin','stake','sword','gate','werewolf','tower'];
 const ready=Promise.all(names.map(async name=>{const img=new Image();img.src=`assets/level1/${name}.svg`;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);images[name]=c;}));
 let zoneNow=0,zoneBefore=0,fade=1;
 const visible=(x,camera,w=120)=>x+w>camera-80&&x<camera+1040;
 function sprite(c,name,x,y,w,h){if(images[name])c.drawImage(images[name],x,y,w,h);}
 function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function flame(c,x,y,t,size=1){c.save();c.translate(x,y);c.scale(size,size);glow(c,0,-12,55,'#ff812b40');c.fillStyle='#ff812b';c.beginPath();c.moveTo(-12,0);c.bezierCurveTo(-24,-18,7,-22,Math.sin(t*9)*5,-45);c.bezierCurveTo(26,-18,15,4,-12,0);c.fill();oval(c,0,-12,6,13,'#ffe3a0');c.restore();}
 function drawZone(c,zone,camera,cameraY,time,cinematic){
  c.fillStyle=LEVEL1.zones[zone].tint+'20';c.fillRect(0,0,960,510);
  if(zone===0){
   for(const tile of parallax.tiles(camera,.35,190)){const x=tile.x;c.save();c.translate(x,440);c.fillStyle='#1d2535';c.beginPath();c.moveTo(-12,0);c.lineTo(-4,-165);c.lineTo(-40,-215);c.lineTo(-15,-200);c.lineTo(6,-150);c.lineTo(35,-245);c.lineTo(29,-175);c.lineTo(62,-203);c.lineTo(30,-150);c.lineTo(14,0);c.fill();c.restore();}
  }
  if(zone===2){for(const tile of parallax.tiles(camera,.4,235)){const x=tile.x;line(c,[[x,460],[x,225],[x+60,145],[x+120,225],[x+120,460]],'#5a435e',16);c.fillStyle='#92283c';c.beginPath();c.moveTo(x+20,233);c.lineTo(x+85,233);c.lineTo(x+85,313);c.lineTo(x+53,295);c.lineTo(x+20,313);c.fill();line(c,[[x+20,232],[x+85,232]],'#a28b98',3);}}
  if(zone===3){
   if(images.tower)parallax.repeatX(c,images.tower,camera,.4,1000,-650-cameraY*.7,1100);
   for(const tile of parallax.tiles(camera,.45,280)){const i=tile.index,x=tile.x+100,y=100-cameraY*.15+(Math.abs(i)%2)*130;c.save();c.translate(x,y);c.rotate(time*(i%2?.15:-.15));c.strokeStyle='#7d657f';c.lineWidth=10;c.beginPath();c.arc(0,0,51,0,Math.PI*2);c.stroke();for(let a=0;a<12;a++){c.rotate(Math.PI/6);line(c,[[40,0],[62,0]],'#806a85',10);}line(c,[[-40,0],[40,0]],'#56435f',7);line(c,[[0,-40],[0,40]],'#56435f',7);c.restore();}
  }
  if(zone===4&&cinematic>7){const alpha=Math.min(1,(cinematic-7)*2)*Math.max(0,1-(cinematic-9.3));c.globalAlpha=alpha;sprite(c,'werewolf',parallax.palaceX(camera)+265,147,44,56);c.globalAlpha=1;}
 }
 function tick(dt){fade=Math.min(1,fade+dt/.9);}
 function background(c,zone,camera,cameraY,time,cinematic){
  if(zone!==zoneNow){zoneBefore=zoneNow;zoneNow=zone;fade=0;}
  if(fade<1){c.save();c.globalAlpha=1-fade;drawZone(c,zoneBefore,camera,cameraY,time,cinematic);c.restore();}
  c.save();c.globalAlpha=fade;drawZone(c,zone,camera,cameraY,time,cinematic);c.restore();
 }
 function enemy(c,e,time){c.save();if(e.dead){c.globalAlpha=e.death*2;c.translate(e.x+19,e.y+42);c.rotate((.5-e.death)*5);sprite(c,'helmet',-24,-46,48,46);}else sprite(c,'helmet',e.x-4,e.y-5,48,48);c.restore();}
 function heroEffects(c,p,time,cinematic,state,sword){
  if(p.rage>0){glow(c,11,-61,20,'#ff203b70');oval(c,10,-62,2.6,1.8,'#ff243b');for(let i=0;i<4;i++)oval(c,25+Math.sin(time*8+i)*5,-30+Math.cos(time*7+i)*8,1.8,1.8,'#ff405a');}
  const pose=heroAnimator.pose();
  if((p.attack>0?p.swingSword:sword>0)){
   const g=heroAnimator.geometry(),extended=pose.clip==='attack'&&pose.frame>=3&&pose.frame<=6;
   const handX=extended&&g?g.dx+g.dw-6:18,handY=extended&&g?g.dy+g.dh*.43-heroAnimator.effectOffset():-32;
   c.save();c.translate(handX,handY);c.rotate(extended?-.2:-1.1);sprite(c,'sword',-9,-8,70,18);c.restore();
  }
  if(p.attack>0&&pose.clip==='attack'&&pose.frame>=3&&pose.frame<=6){c.strokeStyle=p.swingSword?'#e6d4f8':'#ed4765';c.lineWidth=2;c.beginPath();c.arc(23,-38,p.swingSword?58:35,-1.1,1);c.stroke();}
  if(state==='cutscene'&&cinematic>2&&cinematic<5){line(c,[[17,-35],[13,-72],[4,-75]],'#dbb38d',7);}
 }
 function world(c,s){const {camera,cameraY,clock,player,boss}=s;
  for(const trap of s.traps){if(!visible(trap.x,camera,200))continue;
   if(trap.type==='fire'){oval(c,trap.x+21,trap.y+31,28,6,'#342733');for(let i=0;i<4;i++)oval(c,trap.x+5+i*11,trap.y+29,7,4,trap.active?'#ab4935':'#4b3a48');if(trap.active)flame(c,trap.x+21,trap.y+31,clock,.9);else glow(c,trap.x+21,trap.y+28,25,'#ff812b15');}
   if(trap.type==='stake'){c.fillStyle='#221a2b';c.beginPath();c.roundRect(trap.x+22,trap.y-10,20,35,5);c.fill();line(c,[[trap.x+22,trap.y-10],[trap.x+42,trap.y-10],[trap.x+42,trap.y+25]],trap.warn?'#e87b70':'#736079',4);if(trap.warn)glow(c,trap.x+30,trap.y+5,35,Math.sin(clock*16)>0?'#ff3e5870':'#ff3e5820');}
   if(trap.type==='pendulum'&&Number.isFinite(trap.headX)){line(c,[[trap.x,trap.y],[trap.headX,trap.headY]],'#ab97ac',4);oval(c,trap.headX,trap.headY,trap.radius,trap.radius,'#8c728e');oval(c,trap.headX,trap.headY,trap.radius-7,trap.radius-7,'#48354f');line(c,[[trap.headX-12,trap.headY],[trap.headX+12,trap.headY]],'#e4c2c6',2);}
  }
  for(const p of s.projectiles){if(!visible(p.x,camera))continue;if(p.type==='stake'){c.save();c.translate(p.x+(p.vx>0?48:0),p.y);if(p.vx>0)c.scale(-1,1);sprite(c,'stake',0,0,48,12);c.restore();}else if(garlicImage.complete)c.drawImage(garlicImage,p.x,p.y,32,32);}
  for(const item of s.items){if(item.taken||!visible(item.x,camera))continue;const y=item.y+Math.sin(clock*3)*4;glow(c,item.x,y,30,'#b5223970');c.fillStyle='#b52239';c.beginPath();c.moveTo(item.x,y-18);c.bezierCurveTo(item.x-30,y+16,item.x+30,y+16,item.x,y-18);c.fill();line(c,[[item.x-3,y-5],[item.x-6,y+4]],'#ffb8b0',2);}
  const coffins=[{id:'start',x:30,y:430},...LEVEL1.checkpoints];
  for(const cp of coffins){if(!visible(cp.x,camera))continue;const active=cp.id===s.checkpoint.id;glow(c,cp.x+20,cp.y-35,65,active?'#cb526b40':'#8268ae25');sprite(c,'coffin',cp.x-10,cp.y-88,56,84);if(cp.id==='start'){c.save();c.translate(cp.x-12,cp.y);c.rotate(-.35);sprite(c,'coffin',-40,-84,48,78);c.restore();}}
  const l=LEVEL1.lever;if(visible(l.x,camera)){c.fillStyle='#69526d';c.fillRect(l.x,l.y-20,40,20);line(c,[[l.x+20,l.y-18],[l.x+(s.leverOpen?40:1),l.y-65]],'#b5a0ae',7);oval(c,l.x+(s.leverOpen?40:1),l.y-65,8,8,'#c73d59');}
  if(visible(LEVEL1.gate.x,camera))sprite(c,'gate',LEVEL1.gate.x-35,-520,s.leverOpen?65:120,950);
  if(s.escapeLeft>0){for(let i=0;i<8;i++){const x=camera+(i*153+clock*75)%960,y=cameraY+((clock*150+i*73)%540)-30;c.save();c.translate(x,y);c.rotate(clock+i);c.fillStyle='#a08a9d';c.beginPath();c.moveTo(-5,-4);c.lineTo(6,-2);c.lineTo(3,7);c.closePath();c.fill();c.restore();}}
  if(visible(boss.x,camera,180)&&boss.mode!=='waiting'){
   c.save();if(boss.dead){c.translate(boss.x+36,430);c.rotate(-Math.min(1.45,(1.6-Math.max(0,boss.death))));sprite(c,'hunter',-38,-120,78,122);}else{if(boss.mode==='reload')glow(c,boss.x+36,boss.y+55,75,'#ff812b25');sprite(c,'hunter',boss.x-4,boss.y-5,80,125);}c.restore();
   if(boss.dead){sprite(c,'stake',boss.x+70,421,40,10);line(c,[[boss.x+78,410],[boss.x+100,421]],'#c6b0b9',3);}
  }
  if(visible(LEVEL1.exitX,camera,250)){const openness=s.state==='cutscene'?Math.min(1,Math.max(0,(s.cutsceneTime-4)/4)):s.state==='win'?1:0;sprite(c,'gate',LEVEL1.exitX,180,220,250);c.fillStyle='#17112b';c.fillRect(LEVEL1.exitX+100-openness*65,290,openness*130,135);}
  if(s.state==='cutscene'&&s.cutsceneTime<4){const kx=s.cutsceneTime<2?boss.x+80:player.x+48,ky=s.cutsceneTime<2?420:player.y+40;oval(c,kx,ky,10,10,'#e9c36b');line(c,[[kx+7,ky],[kx+39,ky],[kx+39,ky+9]],'#e9c36b',5);}
 }
 return {ready,tick,background,world,enemy,heroEffects};
})();
