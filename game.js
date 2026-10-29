const canvas=document.querySelector('canvas'),ctx=canvas.getContext('2d'),hud=document.querySelector('#hud'),overlay=document.querySelector('#overlay');
const heroImage=new Image(), garlicImage=new Image();
heroImage.src='assets/hero.png'; garlicImage.src='assets/garlic.svg';
let assetsReady=false;
Promise.all([heroImage.decode(),garlicImage.decode()]).then(()=>{assetsReady=true;document.querySelector('#play').disabled=false;}).catch(()=>{overlay.hidden=false;overlay.querySelector('p').textContent='Не удалось загрузить графику. Откройте игру через npm start или используйте автономный HTML-файл.';});
document.querySelector('#play').disabled=true;
const keys={left:false,right:false,jump:false};
const platforms=[[0,430,660,80],[770,430,570,80],[1480,430,600,80],[2220,430,700,80],[340,330,150,22],[850,320,160,22],[1120,240,160,22],[1570,320,170,22],[1850,240,160,22],[2290,320,150,22],[2530,250,160,22]];
let player,coins,enemies,camera=0,state='menu',score=0,last=0,clock=0,jumpHeld=false;
function reset(){player={x:70,y:330,w:40,h:80,vx:0,vy:0,ground:false,hp:3,inv:0,face:1};coins=platforms.flatMap(([x,y,w],i)=>Array.from({length:i<4?Math.floor(w/95)-1:3},(_,j)=>({x:x+55+j*(i<4?90:35),y:y-45,taken:false})));enemies=[{x:530,y:388,origin:530,dir:1},{x:1060,y:388,origin:1060,dir:-1},{x:1770,y:388,origin:1770,dir:1},{x:2410,y:388,origin:2410,dir:1}];score=0;camera=0;clock=0;jumpHeld=false;for(const k in keys)keys[k]=false;}
function start(){if(!assetsReady)return;reset();state='playing';overlay.hidden=true;}
function finish(win){state=win?'win':'lost';overlay.hidden=false;overlay.querySelector('h2').textContent=win?'Кепка на высоте!':'Ещё один забег?';overlay.querySelector('p').textContent=`Монеты: ${score} из ${coins.length}. ${win?'Финиш достигнут!':'Попробуй прыгнуть чуть раньше.'}`;document.querySelector('#play').textContent='Играть снова →';}
function hit(){if(player.inv>0)return;player.hp--;player.inv=1.6;player.vy=-330;if(player.hp<=0)finish(false);}
function overlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function update(dt){clock+=dt;player.inv=Math.max(0,player.inv-dt);player.vx=((keys.right?1:0)-(keys.left?1:0))*245;if(player.vx)player.face=Math.sign(player.vx);if(keys.jump&&!jumpHeld&&player.ground){player.vy=-590;player.ground=false;}jumpHeld=keys.jump;
player.x=Math.max(0,Math.min(2860,player.x+player.vx*dt));for(const [x,y,w,h]of platforms){if(overlap(player,{x,y,w,h})){if(player.vx>0)player.x=x-player.w;if(player.vx<0)player.x=x+w;}}
const prevBottom=player.y+player.h;player.vy+=1550*dt;player.y+=player.vy*dt;player.ground=false;
for(const [x,y,w,h]of platforms){if(overlap(player,{x,y,w,h})){if(player.vy>=0&&prevBottom<=y+2){player.y=y-player.h;player.vy=0;player.ground=true;}else if(player.vy<0){player.y=y+h;player.vy=0;}}}
for(const c of coins)if(!c.taken&&Math.hypot(player.x+20-c.x,player.y+40-c.y)<33){c.taken=true;score++;}
for(const e of enemies){if(e.dead)continue;e.x+=e.dir*65*dt;if(Math.abs(e.x-e.origin)>65)e.dir*=-1;if(overlap(player,{x:e.x,y:e.y,w:38,h:42})){if(player.vy>0&&prevBottom<e.y+12){e.dead=true;player.vy=-370;}else hit();}}
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
 ellipse(0,-1,25,4,'#20302b35');
 ctx.translate(0,bounce);ctx.rotate(moving?.045*Math.sin(clock*8):0);
 if(heroImage.complete&&heroImage.naturalWidth)ctx.drawImage(heroImage,-34,-92,68,92);
 ctx.restore();
}
function drawGarlic(e){
 ctx.save();ctx.translate(e.x+19,e.y+42);
 const stride=Math.sin(clock*9+e.origin)*2;
 ellipse(0,-1,23,4,'#20302b30');ctx.rotate(stride*.025);
 if(garlicImage.complete&&garlicImage.naturalWidth)ctx.drawImage(garlicImage,-24,-50+stride,48,50);
 ctx.restore();
}
function draw(){
 ctx.setTransform(canvas.width/960,0,0,canvas.height/510,0,0);
 ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 const sky=ctx.createLinearGradient(0,0,0,510);sky.addColorStop(0,'#86bfc8');sky.addColorStop(.7,'#e9e6c7');sky.addColorStop(1,'#afc99a');ctx.fillStyle=sky;ctx.fillRect(0,0,960,510);
 ellipse(790,85,48,48,'#ffedb1');ellipse(790,85,65,65,'#fff1ca22');
 for(let i=-1;i<9;i++){
  const x=i*240-camera*.16;const path=new Path2D();path.moveTo(x-150,460);path.bezierCurveTo(x-60,180,x+85,160,x+240,460);
  shape(path,i%2?'#8eada0':'#a7bdab',null);
 }
 for(let i=-1;i<8;i++){
  const x=i*210-camera*.09,y=75+(i%3)*32;
  ellipse(x,y,42,13,'#fff8e5aa');ellipse(x+29,y-8,31,18,'#fff8e5aa');ellipse(x+55,y,34,12,'#fff8e5aa');
 }
 for(let i=-1;i<15;i++){
  const x=i*110-camera*.42,y=370+(i%3)*12;
  const trunk=new Path2D();trunk.moveTo(x,y+80);trunk.lineTo(x+4,y-20);shape(trunk,'#6e7961','#6e7961',7);
  ellipse(x,y-15,30,49,'#73967e');ellipse(x-16,y-3,22,31,'#81a486');ellipse(x+15,y-17,22,34,'#8fb08e');
 }
 ctx.save();ctx.translate(-camera,0);
 for(const [x,y,w,h]of platforms){
  const earth=ctx.createLinearGradient(0,y,0,y+h);earth.addColorStop(0,'#a48259');earth.addColorStop(1,'#66513f');
  rounded(x,y,w,h,9,earth,'#685b43');
  rounded(x,y-2,w,13,6,'#8eaf63','#607c46');
  for(let a=x+12;a<x+w-10;a+=42){ellipse(a,y+28,7,3,'#b2966e');ellipse(a+15,y+48,4,2,'#60513d');}
  for(let a=x+9;a<x+w-8;a+=23){const grass=new Path2D();grass.moveTo(a,y+2);grass.lineTo(a-3,y-5);grass.moveTo(a,y+2);grass.lineTo(a+4,y-7);ctx.strokeStyle='#628344';ctx.lineWidth=1.5;ctx.stroke(grass);}
 }
 for(const c of coins){if(c.taken)continue;
  const y=c.y+Math.sin(clock*4+c.x)*3;
  ellipse(c.x,y+13,9,2,'#4c613626');
  const gold=ctx.createLinearGradient(c.x-10,y-10,c.x+10,y+10);gold.addColorStop(0,'#fff2ac');gold.addColorStop(.45,'#f5bf47');gold.addColorStop(1,'#bf7e2d');
  ctx.fillStyle=gold;ctx.strokeStyle='#b98233';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(c.x,y,9,12,0,0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff0ab';ctx.beginPath();ctx.ellipse(c.x,y,5,8,0,0,Math.PI*2);ctx.stroke();
 }
 for(const e of enemies)if(!e.dead)drawGarlic(e);
 rounded(2815,220,5,210,2,'#eee0bd','#796f58');
 const flag=new Path2D();flag.moveTo(2820,220);flag.bezierCurveTo(2840,210,2850,239,2880,228);flag.lineTo(2880,265);flag.bezierCurveTo(2850,276,2840,247,2820,257);flag.closePath();shape(flag,'#dc7942','#9f5033');
 character();ctx.restore();
 hud.textContent=`Жизни: ${player.hp} / 3  ·  Монеты: ${score}  ·  Путь: ${Math.min(100,Math.floor(player.x/2780*100))}%`;
}
function frame(t){const dt=Math.min((t-last)/1000||0,1/30);last=t;if(state==='playing')update(dt);draw();requestAnimationFrame(frame);}
function resize(){canvas.width=960*Math.min(devicePixelRatio||1,2);canvas.height=510*Math.min(devicePixelRatio||1,2);}resize();window.addEventListener('resize',resize);
const physicalKeys={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',Space:'jump',ArrowUp:'jump',KeyW:'jump'};
const mapping={ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right',' ':'jump',ArrowUp:'jump',w:'jump',W:'jump'};
window.addEventListener('keydown',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key){e.preventDefault();keys[key]=true;}});window.addEventListener('keyup',e=>{const key=physicalKeys[e.code]||mapping[e.key];if(key)keys[key]=false;});window.addEventListener('blur',()=>{for(const k in keys)keys[k]=false;});
for(const b of document.querySelectorAll('[data-key]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);keys[b.dataset.key]=true;});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys[b.dataset.key]=false);}
document.querySelector('#play').onclick=start;document.querySelector('#reset').onclick=start;
try{window.Telegram?.WebApp?.ready();window.Telegram?.WebApp?.expand();}catch{}reset();requestAnimationFrame(frame);
