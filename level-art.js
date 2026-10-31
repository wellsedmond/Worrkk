/* Extra actors reuse the Canvas renderer. SVGs are explicit replaceable art assets. */
const levelArt=(()=>{
 const images={};const names=['helmet','hunter','coffin','stake','sword','gate','werewolf','tower'];
 const helmetImage=new Image();helmetImage.src='assets/level1/helmet-garlic-atlas.png';
 const helmetFrames={"idle":[{"x":20,"y":75,"w":218,"h":245,"pivotX":129.0,"pivotY":311},{"x":240,"y":75,"w":214,"h":245,"pivotX":347.0,"pivotY":311},{"x":460,"y":75,"w":215,"h":245,"pivotX":567.5,"pivotY":311},{"x":680,"y":75,"w":214,"h":245,"pivotX":787.0,"pivotY":311},{"x":900,"y":75,"w":192,"h":245,"pivotX":996.0,"pivotY":311},{"x":1095,"y":75,"w":217,"h":245,"pivotX":1203.5,"pivotY":311},{"x":1320,"y":75,"w":206,"h":245,"pivotX":1423.0,"pivotY":311},{"x":1532,"y":75,"w":226,"h":245,"pivotX":1645.0,"pivotY":311}],"move":[{"x":0,"y":375,"w":222,"h":194,"pivotX":140,"pivotY":560},{"x":222,"y":375,"w":222,"h":194,"pivotX":355,"pivotY":560},{"x":444,"y":375,"w":221,"h":194,"pivotX":576,"pivotY":560},{"x":665,"y":375,"w":222,"h":194,"pivotX":801,"pivotY":560},{"x":887,"y":375,"w":222,"h":194,"pivotX":1038,"pivotY":560},{"x":1109,"y":375,"w":221,"h":194,"pivotX":1257,"pivotY":560},{"x":1330,"y":375,"w":222,"h":194,"pivotX":1480,"pivotY":560},{"x":1552,"y":375,"w":222,"h":194,"pivotX":1698,"pivotY":560}],"damage":[{"x":10,"y":575,"w":220,"h":280,"pivotX":125,"pivotY":839},{"x":217,"y":575,"w":223,"h":280,"pivotX":330,"pivotY":839},{"x":438,"y":575,"w":214,"h":280,"pivotX":550,"pivotY":839},{"x":648,"y":575,"w":238,"h":280,"pivotX":765,"pivotY":839},{"x":884,"y":575,"w":212,"h":280,"pivotX":980,"pivotY":839},{"x":1090,"y":575,"w":225,"h":280,"pivotX":1200,"pivotY":839},{"x":1310,"y":575,"w":234,"h":280,"pivotX":1430,"pivotY":839},{"x":1530,"y":575,"w":244,"h":280,"pivotX":1650,"pivotY":839}]};
 const propsImage=new Image();propsImage.src='assets/level1/props-atlas.png';
 const propFrames={"fire":[{"x":5,"y":0,"w":207,"h":198,"pivotY":186},{"x":219,"y":0,"w":207,"h":198,"pivotY":185},{"x":432,"y":0,"w":207,"h":198,"pivotY":186},{"x":642,"y":0,"w":207,"h":198,"pivotY":186},{"x":852,"y":0,"w":207,"h":198,"pivotY":186},{"x":1065,"y":0,"w":207,"h":198,"pivotY":186},{"x":1273,"y":0,"w":207,"h":198,"pivotY":187}],"coin":[{"x":18,"y":199,"w":160,"h":155,"pivotX":98.5,"pivotY":276},{"x":201,"y":199,"w":160,"h":155,"pivotX":281,"pivotY":276},{"x":369,"y":199,"w":160,"h":155,"pivotX":449,"pivotY":276},{"x":534,"y":199,"w":160,"h":155,"pivotX":613.5,"pivotY":276},{"x":712,"y":199,"w":160,"h":155,"pivotX":792.5,"pivotY":276},{"x":896,"y":199,"w":160,"h":155,"pivotX":975.5,"pivotY":276},{"x":1080,"y":199,"w":160,"h":155,"pivotX":1159.5,"pivotY":276},{"x":1258,"y":199,"w":160,"h":155,"pivotX":1338,"pivotY":276},{"x":1438,"y":199,"w":160,"h":155,"pivotX":1518.5,"pivotY":276},{"x":1612,"y":199,"w":160,"h":155,"pivotX":1692,"pivotY":276},{"x":1796,"y":199,"w":160,"h":155,"pivotX":1875.5,"pivotY":276},{"x":1988,"y":199,"w":160,"h":155,"pivotX":2068,"pivotY":276}],"garlic":[{"x":10,"y":355,"w":163,"h":150,"pivotX":95,"pivotY":430},{"x":175,"y":355,"w":230,"h":150,"pivotX":326,"pivotY":430},{"x":405,"y":355,"w":241,"h":150,"pivotX":568,"pivotY":430},{"x":645,"y":355,"w":258,"h":150,"pivotX":827,"pivotY":430},{"x":905,"y":355,"w":252,"h":150,"pivotX":1083,"pivotY":430},{"x":1158,"y":355,"w":258,"h":150,"pivotX":1339,"pivotY":430}],"coffin":[{"x":16,"y":502,"w":164,"h":222,"pivotX":96,"pivotY":700},{"x":205,"y":502,"w":165,"h":222,"pivotX":287,"pivotY":700},{"x":391,"y":502,"w":160,"h":222,"pivotX":474,"pivotY":700},{"x":573,"y":502,"w":156,"h":222,"pivotX":655,"pivotY":700},{"x":741,"y":502,"w":177,"h":222,"pivotX":843,"pivotY":700},{"x":932,"y":502,"w":168,"h":222,"pivotX":1025,"pivotY":700},{"x":1108,"y":502,"w":174,"h":222,"pivotX":1203,"pivotY":700},{"x":1290,"y":502,"w":210,"h":222,"pivotX":1416,"pivotY":700}]};
 const crossbowImage=new Image();crossbowImage.src='assets/level1/crossbow-atlas.png';
 const crossbowFrames=[{"x":0,"y":160,"w":222,"h":356,"muzzleX":22,"muzzleY":270},{"x":222,"y":160,"w":222,"h":356,"muzzleX":242,"muzzleY":270},{"x":444,"y":160,"w":221,"h":356,"muzzleX":466,"muzzleY":270},{"x":665,"y":160,"w":222,"h":356,"muzzleX":688,"muzzleY":270},{"x":887,"y":160,"w":222,"h":356,"muzzleX":910,"muzzleY":270},{"x":1109,"y":160,"w":221,"h":356,"muzzleX":1128,"muzzleY":270},{"x":1330,"y":160,"w":222,"h":356,"muzzleX":1350,"muzzleY":270},{"x":1552,"y":160,"w":222,"h":356,"muzzleX":1564,"muzzleY":270}],boltFrames=[{"x":0,"y":695,"w":222,"h":74},{"x":222,"y":695,"w":222,"h":74},{"x":444,"y":695,"w":221,"h":74},{"x":665,"y":695,"w":222,"h":74},{"x":887,"y":695,"w":222,"h":74},{"x":1109,"y":695,"w":221,"h":74},{"x":1330,"y":695,"w":222,"h":74},{"x":1552,"y":695,"w":222,"h":74}];
 const ready=Promise.all([helmetImage.decode(),propsImage.decode(),crossbowImage.decode(),...names.map(async name=>{const img=new Image();img.src=`assets/level1/${name}.svg`;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;c.getContext('2d').drawImage(img,0,0);images[name]=c;})]);
 let zoneNow=0,zoneBefore=0,fade=1;
 const visible=(x,camera,w=120)=>x+w>camera-80&&x<camera+1040;
 function sprite(c,name,x,y,w,h){if(images[name])c.drawImage(images[name],x,y,w,h);}
 function oval(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
 function line(c,points,color,width=2){c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();}
 function glow(c,x,y,r,color){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'transparent');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
 function flame(c,x,y,t,size=1){c.save();c.translate(x,y);c.scale(size,size);glow(c,0,-12,55,'#ff812b40');c.fillStyle='#ff812b';c.beginPath();c.moveTo(-12,0);c.bezierCurveTo(-24,-18,7,-22,Math.sin(t*9)*5,-45);c.bezierCurveTo(26,-18,15,4,-12,0);c.fill();oval(c,0,-12,6,13,'#ffe3a0');c.restore();}
 function drawZone(c,zone,camera,cameraY,time,cinematic){
  c.fillStyle=LEVEL1.zones[zone].tint+'20';c.fillRect(0,0,960,510);
  if(zone===0){c.globalAlpha=.3;
   for(const tile of parallax.tiles(camera,.35,190)){const x=tile.x;c.save();c.translate(x,440);c.fillStyle='#090c15';c.beginPath();c.moveTo(-12,0);c.lineTo(-4,-165);c.lineTo(-40,-215);c.lineTo(-15,-200);c.lineTo(6,-150);c.lineTo(35,-245);c.lineTo(29,-175);c.lineTo(62,-203);c.lineTo(30,-150);c.lineTo(14,0);c.fill();c.restore();}
  }
  c.globalAlpha=1;
  if(zone===2){for(const tile of parallax.tiles(camera,.4,235)){const x=tile.x;line(c,[[x,460],[x,225],[x+60,145],[x+120,225],[x+120,460]],'#32222e',16);c.fillStyle='#92283c';c.beginPath();c.moveTo(x+20,233);c.lineTo(x+85,233);c.lineTo(x+85,313);c.lineTo(x+53,295);c.lineTo(x+20,313);c.fill();line(c,[[x+20,232],[x+85,232]],'#a28b98',3);}}
  if(zone===3){
   if(images.tower)parallax.repeatX(c,images.tower,camera,.4,1000,-650-cameraY*.7,1100);
   for(const tile of parallax.tiles(camera,.45,280)){const i=tile.index,x=tile.x+100,y=100-cameraY*.15+(Math.abs(i)%2)*130;c.save();c.translate(x,y);c.rotate(time*(i%2?.15:-.15));c.strokeStyle='#5d5059';c.lineWidth=10;c.beginPath();c.arc(0,0,51,0,Math.PI*2);c.stroke();for(let a=0;a<12;a++){c.rotate(Math.PI/6);line(c,[[40,0],[62,0]],'#60525b',10);}line(c,[[-40,0],[40,0]],'#2b2530',7);line(c,[[0,-40],[0,40]],'#2b2530',7);c.restore();}
  }
  if(zone===4&&cinematic>7){const alpha=Math.min(1,(cinematic-7)*2)*Math.max(0,1-(cinematic-9.3));c.globalAlpha=alpha;sprite(c,'werewolf',parallax.palaceX(camera)+265,147,44,56);c.globalAlpha=1;}
 }
 function tick(dt){fade=Math.min(1,fade+dt/.9);}
 function background(c,zone,camera,cameraY,time,cinematic){
  if(zone!==zoneNow){zoneBefore=zoneNow;zoneNow=zone;fade=0;}
  if(fade<1){c.save();c.globalAlpha=1-fade;drawZone(c,zoneBefore,camera,cameraY,time,cinematic);c.restore();}
  c.save();c.globalAlpha=fade;drawZone(c,zone,camera,cameraY,time,cinematic);c.restore();
 }
 function helmetPose(e,time){
  if(e.dead)return {clip:'damage',frame:Math.min(7,Math.floor((.8-e.death)/.8*8+1e-7)),scale:.26};
  if(e.hurt>0)return {clip:'damage',frame:Math.min(2,1+Math.floor((.3-e.hurt)/.15+1e-7)),scale:.26};
  return {clip:'move',frame:Math.floor(time*12+e.origin*.01)%8,scale:.3};
 }
 function enemy(c,e,time){
  if(!helmetImage.complete||!helmetImage.naturalWidth)return;
  const pose=helmetPose(e,time),f=helmetFrames[pose.clip][pose.frame];
  c.save();c.translate(e.x+e.w/2,e.y+e.h);if(e.dir<0)c.scale(-1,1);
  c.drawImage(helmetImage,f.x,f.y,f.w,f.h,(f.x-f.pivotX)*pose.scale,(f.y-f.pivotY)*pose.scale,f.w*pose.scale,f.h*pose.scale);c.restore();
 }

 function heroEffects(c,p,time,cinematic,state,sword){
  if(p.rage>0&&!heroAnimator.pose().clip?.startsWith('rage')){glow(c,11,-61,20,'#ff203b70');oval(c,10,-62,2.6,1.8,'#ff243b');for(let i=0;i<4;i++)oval(c,25+Math.sin(time*8+i)*5,-30+Math.cos(time*7+i)*8,1.8,1.8,'#ff405a');}
  const pose=heroAnimator.pose();
  if(p.attack<=0&&sword>0&&!['swordRun','swordJump','swordCrouch','swordIdle','rageSwordRun','rageSwordJump','rageSwordCrouch'].includes(pose.clip)){
   const g=heroAnimator.geometry(),extended=pose.clip==='attack'&&pose.frame>=3&&pose.frame<=6;
   const handX=extended&&g?g.dx+g.dw-6:18,handY=extended&&g?g.dy+g.dh*.43-heroAnimator.effectOffset():-32;
   c.save();c.translate(handX,handY);c.rotate(extended?-.2:-1.1);sprite(c,'sword',-9,-8,70,18);c.restore();
  }
  if(state==='cutscene'&&cinematic>2&&cinematic<5){line(c,[[17,-35],[13,-72],[4,-75]],'#dbb38d',7);}
 }
 function crossbowFrame(t){return t.shotTime>=0?Math.min(7,2+Math.floor(t.shotTime/.1)):t.warn&&t.phase>=t.warning*.65?1:0;}
 function crossbow(c,muzzleX,boltY,t,dir=-1){
  if(!crossbowImage.complete||!crossbowImage.naturalWidth)return;
  const f=crossbowFrames[crossbowFrame(t)],scale=88/244;
  c.save();c.translate(muzzleX,boltY+4);if(dir>0)c.scale(-1,1);
  c.drawImage(crossbowImage,f.x,f.y,f.w,f.h,(f.x-f.muzzleX)*scale,(f.y-f.muzzleY)*scale,f.w*scale,f.h*scale);c.restore();
 }
 function flyingBolt(c,p){
  const f=boltFrames[Math.min(7,Math.floor(p.life*24))];
  c.save();c.translate(p.x+(p.vx>0?p.w:0),p.y+p.h/2);if(p.vx>0)c.scale(-1,1);
  c.drawImage(crossbowImage,f.x,f.y,f.w,f.h,0,-8,p.w,16);c.restore();
 }
 function prop(c,kind,frame,x,y,sx,sy=sx,dir=1){
  const f=propFrames[kind][frame];if(!propsImage.complete||!propsImage.naturalWidth)return;
  c.save();c.translate(x,y);if(dir<0)c.scale(-1,1);
  c.drawImage(propsImage,f.x,f.y,f.w,f.h,(f.x-(f.pivotX??f.x+f.w/2))*sx,(f.y-(f.pivotY??f.y+f.h))*sy,f.w*sx,f.h*sy);c.restore();
 }
 function propFrame(kind,time){const count=propFrames[kind].length;return kind==='coffin'?Math.min(count-1,Math.floor(time/.8*count+1e-7)):Math.floor(time*(kind==='coin'?12:kind==='fire'?12:10))%count;}
 function coin(c,x,y,time){prop(c,'coin',propFrame('coin',time+x*.003),x,y,24/135);}
 function garlic(c,x,y,w,h,time,dir=1){prop(c,'garlic',propFrame('garlic',time),x+w/2,y+h/2,w/130,h/130,dir);}
 function bonfireGeometry(t,time){
  const f=propFrames.fire[t.active?propFrame('fire',time+t.x*.001):0],sy=t.active?f.y:145,sh=t.active?f.h:f.pivotY-145+1;
  return {sx:f.x,sy,sw:f.w,sh,dx:t.x+t.w/2-f.w/2*58/207,dy:t.y+t.h+(sy-f.pivotY)*55/198,dw:58,dh:sh*55/198,baseY:t.y+t.h,pivotY:f.pivotY};
 }
 function bonfire(c,t,time){
  const g=bonfireGeometry(t,time);if(t.active)glow(c,t.x+t.w/2,t.y+20,50,'#ff65183a');
  c.drawImage(propsImage,g.sx,g.sy,g.sw,g.sh,g.dx,g.dy,g.dw,g.dh);
 }
 function coffin(c,cp){prop(c,'coffin',cp.opened?propFrame('coffin',cp.openTime):0,cp.x+20,cp.y,90/190);}
 function world(c,s){const {camera,cameraY,clock,player,boss}=s;
  for(const trap of s.traps){if(!visible(trap.x,camera,200))continue;
   if(trap.type==='fire')bonfire(c,trap,clock);
   if(trap.type==='stake'){crossbow(c,trap.x,trap.y,trap);if(trap.warn)glow(c,trap.x+30,trap.y+4,30,Math.sin(clock*16)>0?'#ff3e5840':'#ff3e5815');}
   if(trap.type==='pendulum'&&Number.isFinite(trap.headX)){line(c,[[trap.x,trap.y],[trap.headX,trap.headY]],'#ab97ac',4);oval(c,trap.headX,trap.headY,trap.radius,trap.radius,'#8c728e');oval(c,trap.headX,trap.headY,trap.radius-7,trap.radius-7,'#48354f');line(c,[[trap.headX-12,trap.headY],[trap.headX+12,trap.headY]],'#e4c2c6',2);}
  }
  for(const p of s.projectiles){if(!visible(p.x,camera))continue;if(p.type==='stake'){flyingBolt(c,p);}else garlic(c,p.x,p.y,p.w,p.h,p.life,p.vx<0?-1:1);}
  for(const item of s.items){if(item.taken||!visible(item.x,camera))continue;const y=item.y+Math.sin(clock*3)*4;glow(c,item.x,y,30,'#b5223970');c.fillStyle='#b52239';c.beginPath();c.moveTo(item.x,y-18);c.bezierCurveTo(item.x-30,y+16,item.x+30,y+16,item.x,y-18);c.fill();line(c,[[item.x-3,y-5],[item.x-6,y+4]],'#ffb8b0',2);}
  for(const cp of s.coffins){if(!visible(cp.x,camera))continue;if(cp.opened)glow(c,cp.x+20,cp.y-35,55,'#bc123830');coffin(c,cp);}
  const l=LEVEL1.lever;if(visible(l.x,camera)){c.fillStyle='#69526d';c.fillRect(l.x,l.y-20,40,20);line(c,[[l.x+20,l.y-18],[l.x+(s.leverOpen?40:1),l.y-65]],'#b5a0ae',7);oval(c,l.x+(s.leverOpen?40:1),l.y-65,8,8,'#c73d59');}
  if(visible(LEVEL1.gate.x,camera))sprite(c,'gate',LEVEL1.gate.x-35,-520,s.leverOpen?65:120,950);
  if(s.escapeLeft>0){for(let i=0;i<8;i++){const x=camera+(i*153+clock*75)%960,y=cameraY+((clock*150+i*73)%540)-30;c.save();c.translate(x,y);c.rotate(clock+i);c.fillStyle='#a08a9d';c.beginPath();c.moveTo(-5,-4);c.lineTo(6,-2);c.lineTo(3,7);c.closePath();c.fill();c.restore();}}
  if(visible(boss.x,camera,180)&&boss.mode!=='waiting'){
   c.save();if(boss.dead){c.translate(boss.x+36,430);c.rotate(-Math.min(1.45,(1.6-Math.max(0,boss.death))));sprite(c,'hunter',-38,-120,78,122);}else{if(boss.mode==='reload')glow(c,boss.x+36,boss.y+55,75,'#ff812b25');sprite(c,'hunter',boss.x-4,boss.y-5,80,125);}c.restore();
   if(!boss.dead&&boss.phase!==2)crossbow(c,boss.x+36,LEVEL1.stakeY,{shotTime:boss.shotTime,warn:boss.mode==='attack'&&boss.timer<.9,phase:.9,warning:.9},boss.shotDir);
   if(boss.dead){sprite(c,'stake',boss.x+70,421,40,10);line(c,[[boss.x+78,410],[boss.x+100,421]],'#c6b0b9',3);}
  }
  if(visible(LEVEL1.exitX,camera,250)){const openness=s.state==='cutscene'?Math.min(1,Math.max(0,(s.cutsceneTime-4)/4)):s.state==='win'?1:0;sprite(c,'gate',LEVEL1.exitX,180,220,250);c.fillStyle='#17112b';c.fillRect(LEVEL1.exitX+100-openness*65,290,openness*130,135);}
  if(s.state==='cutscene'&&s.cutsceneTime<4){const kx=s.cutsceneTime<2?boss.x+80:player.x+48,ky=s.cutsceneTime<2?420:player.y+40;oval(c,kx,ky,10,10,'#e9c36b');line(c,[[kx+7,ky],[kx+39,ky],[kx+39,ky+9]],'#e9c36b',5);}
 }
 return {ready,tick,background,world,enemy,heroEffects,crossbowFrame,coin,garlic,propFrame,helmetPose,bonfireGeometry};
})();
