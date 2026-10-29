const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),hud=document.querySelector('#hud'),overlay=document.querySelector('#overlay');
const heroImage=new Image(), garlicImage=new Image();
heroImage.src='assets/hero.png'; garlicImage.src='assets/garlic.svg';
let assetsReady=false;
Promise.all([heroImage.decode(),garlicImage.decode(),atmosphere.ready]).then(()=>{assetsReady=true;document.querySelector('#play').disabled=false;}).catch(()=>{overlay.hidden=false;overlay.querySelector('p').textContent='Не удалось загрузить графику. Откройте игру через npm start или используйте автономный HTML-файл.';});
document.querySelector('#play').disabled=true;
const keys={left:false,right:false,jump:false};
// A jump rises about 102–112 px at supported frame rates. Leave room for timing.
const groundPlatforms=[[0,430,660,80],[770,430,570,80],[1480,430,600,80],[2220,430,700,80]];
const ledgePlatforms=[[340,340,150,22],[850,340,160,22],[950,250,160,22],[1570,340,170,22],[1660,250,160,22],[2290,340,150,22],[2380,250,160,22]];
const platforms=[...groundPlatforms,...ledgePlatforms];
let player,coins,enemies,camera=0,state='menu',score=0,last=0,clock=0,jumpHeld=false;
function reset(){atmosphere.reset();player={x:70,y:330,w:40,h:80,vx:0,vy:0,ground:false,hp:3,inv:0,face:1};coins=platforms.flatMap(([x,y,w],i)=>Array.from({length:i<4?Math.floor(w/95)-1:3},(_,j)=>({x:x+55+j*(i<4?90:35),y:y-45,taken:false})));enemies=[{x:530,y:388,origin:530,dir:1},{x:1060,y:388,origin:1060,dir:-1},{x:1770,y:388,origin:1770,dir:1},{x:2410,y:388,origin:2410,dir:1}];score=0;camera=0;clock=0;jumpHeld=false;for(const k in keys)keys[k]=false;}
function start(){if(!assetsReady)return;reset();state='playing';overlay.classList.remove('defeat');overlay.hidden=true;}
function finish(win){state=win?'win':'lost';overlay.hidden=false;overlay.classList.toggle('defeat',!win);overlay.querySelector('.eyebrow').textContent=win?'РАССВЕТ ПОДОЖДЁТ':'НОЧЬ НЕ ПРОЩАЕТ ОШИБОК';overlay.querySelector('h2').textContent=win?'НОЧЬ ТВОЯ!':'ВАМПИР ПАЛ!';overlay.querySelector('p').textContent=`Монеты: ${score} из ${coins.length}. ${win?'Финиш достигнут!':'Попробуй прыгнуть чуть раньше.'}`;document.querySelector('#play').textContent='Играть снова →';}
function hit(){if(player.inv>0)return;player.hp--;player.inv=1.6;atmosphere.burst(player.x+20,player.y+35,'sparks');player.vy=-330;if(player.hp<=0)finish(false);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function update(dt){clock+=dt;player.inv=Math.max(0,player.inv-dt);player.vx=((keys.right?1:0)-(keys.left?1:0))*245;if(player.vx)player.face=Math.sign(player.vx);if(keys.jump&&!jumpHeld&&player.ground){player.vy=-590;player.ground=false;}jumpHeld=keys.jump;
player.x=Math.max(0,Math.min(2860,player.x+player.vx*dt));for(const [x,y,w,h]of groundPlatforms){if(overlap(player,{x,y,w,h})){if(player.vx>0)player.x=x-player.w;if(player.vx<0)player.x=x+w;}}
const wasGrounded=player.ground;const prevBottom=player.y+player.h;player.vy+=1550*dt;player.y+=player.vy*dt;player.ground=false;
// Ledges are one-way: only feet crossing the top while falling can collide.
// Scan all crossed tops and choose the first surface, independent of array order.
if(player.vy>=0){
 let landingY=Infinity;
 for(const [x,y,w]of platforms){
  if(player.x+player.w>x && player.x<x+w && prevBottom<=y+.001 && player.y+player.h>=y){landingY=Math.min(landingY,y);}
 }
 if(landingY!==Infinity){player.y=landingY-player.h;player.vy=0;player.ground=true;if(!wasGrounded)atmosphere.burst(player.x+20,landingY,'landing');}
}else{
 // The ground remains solid; floating ledges never block the head or sides.
 for(const [x,y,w,h]of groundPlatforms){if(overlap(player,{x,y,w,h})){player.y=y+h;player.vy=0;}}
}
for(const c of coins)if(!c.taken&&Math.hypot(player.x+20-c.x,player.y+40-c.y)<33){c.taken=true;score++;}
for(const e of enemies){if(e.dead)continue;e.x+=e.dir*65*dt;if(Math.abs(e.x-e.origin)>65)e.dir*=-1;if(overlap(player,{x:e.x,y:e.y,w:38,h:42})){if(player.vy>0&&prevBottom<e.y+12){e.dead=true;atmosphere.burst(e.x+19,e.y+21,'garlic');atmosphere.burst(e.x+19,e.y+10,'sparks');player.vy=-370;}else hit();}}
if(player.y>570)finish(false);if(state==='playing'&&player.x>2780)finish(true);camera=Math.max(0,Math.min(1960,player.x-260));}
function shape(path,fill,stroke='#485346',width=2){ctx.fillStyle=fill;ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.fill(path);if(stroke)ctx.stroke(path);}
function rounded(x,y,w,h,r,fill,stroke){const path=new Path2D();path.roundRect(x,y,w,h,r);shape(path,fill,stroke,2);}
function ellipse(x,y,rx,ry,fill){ctx.fillStyle=fill;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function character(){
 ctx.save();ctx.translate(player.x+20,player.y+player.h);
 const moving=player.ground&&player.vx;
 const bounce=moving?Math.sin(clock*17)*2:Math.sin(clock*3)*.6;
 ctx.scale(player.face,1);
 if(player.inv>0&&Math.floor(clock*14)%2)ctx.globalAlpha=.35;
 ellipse(0,-1,25,4,'#100b20aa');
 ctx.translate(0,bounce);ctx.rotate(moving?.045*Math.sin(clock*8):0);
 if(heroImage.complete&&heroImage.naturalWidth)ctx.drawImage(heroImage,-34,-92,68,92);
 ctx.restore();
}
function drawGarlic(e){
 ctx.save();ctx.translate(e.x+19,e.y+42);
 const stride=Math.sin(clock*9+e.origin)*2;
 ellipse(0,-1,23,4,'#100b2080');ctx.rotate(stride*.025);
 if(garlicImage.complete&&garlicImage.naturalWidth)ctx.drawImage(garlicImage,-24,-50+stride,48,50);
 ctx.restore();
}
function draw(){
 ctx.setTransform(canvas.width/960,0,0,canvas.height/510,0,0);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 atmosphere.background(ctx,camera);
 atmosphere.worldDecor(ctx,camera);
 ctx.save();ctx.translate(-camera,0);
 atmosphere.platforms(ctx,camera);
 for(const c of coins){if(c.taken)continue;
  const y=c.y+Math.sin(clock*4+c.x)*3;
  ellipse(c.x,y+13,9,2,'#4c613626');
  const gold=ctx.createLinearGradient(c.x-10,y-10,c.x+10,y+10);gold.addColorStop(0,'#fff2ac');gold.addColorStop(.45,'#f5bf47');gold.addColorStop(1,'#bf7e2d');
  ctx.fillStyle=gold;ctx.strokeStyle='#b98233';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x,y,9,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff0ab';ctx.beginPath();ctx.ellipse(c.x,y,5,8,0,0,Math.PI*2);ctx.stroke();
 }
 for(const e of enemies)if(!e.dead)drawGarlic(e);
 rounded(2815,220,5,210,2,'#b6a3c6','#51465f');
 const flag=new Path2D();flag.moveTo(2820,220);flag.bezierCurveTo(2840,210,2850,239,2880,228);flag.lineTo(2880,265);flag.bezierCurveTo(2850,276,2840,247,2820,257);flag.closePath();shape(flag,'#b52239','#e08c9d');
 character();ctx.restore();
 atmosphere.effects(ctx,camera);
 atmosphere.hud(hud,player,score,Math.min(100,Math.floor(player.x/2780*100)));
}
function frame(t){const dt=Math.min((t-last)/1000||0,1/30);last=t;atmosphere.tick(dt);if(state==='playing')update(dt);draw();requestAnimationFrame(frame);}
function resize(){canvas.width=960*Math.min(devicePixelRatio||1,2);canvas.height=510*Math.min(devicePixelRatio||1,2);}resize();window.addEventListener('resize',resize);
const physicalKeys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
const mapping={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'jump',ArrowUp:'jump',w:'jump',W:'jump'};
window.addEventListener('keydown',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key){e.preventDefault();keys[key]=true;}});window.addEventListener('keyup',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key)keys[key]=false;});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[b.dataset.key]=false);}
document.querySelector('#play').onclick=start;document.querySelector('#reset').onclick=start;
try{window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();}catch{}atmosphere.prepare(platforms);reset();requestAnimationFrame(frame);
