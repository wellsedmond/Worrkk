/* Deterministic boss state machine. Uses the existing player's physics and hit callback. */
const Inquisitor=(()=>{
 const difficulties={easy:{hp:18,interval:1.3,label:'Легко'},normal:{hp:25,interval:1,label:'Нормально'},hard:{hp:35,interval:.8,label:'Сложно'}};
 const attacks={volley:3.25,garlic:1.25,trap:1.1,dash:1.62,grenade:1.35,combo:2.95,feint:2.25,beam:2.4,rain:2.6,frenzy:4.7,charge:4.4};
 const lists={1:['volley','garlic','trap'],2:['dash','grenade','combo','feint'],3:['beam','rain','frenzy','charge']};
 const names={volley:'ОСИНОВЫЙ ЗАЛП',garlic:'БРОСОК ЧЕСНОКА',trap:'КАПКАН',dash:'СЕРЕБРЯНЫЙ РЫВОК',grenade:'УФ-ГРАНАТА',combo:'КОЛ И РЫВОК',feint:'ЛОЖНЫЙ ЗАМАХ',beam:'ЛУЧ РАССВЕТА',rain:'ДОЖДЬ КОЛЬЕВ',frenzy:'БЕЗУМНАЯ КОМБИНАЦИЯ',charge:'ПОСЛЕДНИЙ ПРИГОВОР — УДАРЬТЕ, ЧТОБЫ ПРЕРВАТЬ'};
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 const overlap=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
 function create(config={},difficulty='normal'){
  difficulty=difficulties[difficulty]?difficulty:'normal';const d=difficulties[difficulty];
  return {...config,arenaStart:config.arenaStart||57500,arenaEnd:config.arenaEnd||59900,x:(config.arenaStart||57500)+650,y:290,w:72,h:140,groundY:430,difficulty,maxHp:d.hp,hp:d.hp,phase:1,state:'WAITING',mode:'waiting',engaged:false,dead:false,death:0,inv:0,timer:0,stateTime:0,time:0,attack:null,actionIndex:0,shots:0,dir:-1,projectiles:[],zones:[],serial:0,attention:0,lastPlayerX:null,lastKeys:{},lastAction:'',repeated:0,forced:false,transitionCount:0,shotAt:-100,jumpLeft:0,moveX:0,hitReturn:null,victoryHandled:false};
 }
 function clear(b){b.projectiles=[];b.zones=[];b.attack=null;b.fired=new Set();b.dashDistance=0;b.jumpLeft=0;b.y=290;}
 function enter(b,state,duration=0){if(state==='IDLE')b.didLeap=false;b.state=state;b.timer=duration;b.stateTime=0;b.mode=state==='WAITING'?'waiting':state==='INTRO'?'intro':['RECOVERY','STUNNED','HIT'].includes(state)?'reload':['DEATH','VICTORY'].includes(state)?'defeated':state==='PHASE_TRANSITION'?'transition':'attack';b.dead=state==='DEATH'||state==='VICTORY';}
 function engage(b,skipIntro=false){b.engaged=true;clear(b);enter(b,skipIntro?'IDLE':'INTRO',skipIntro?interval(b):2);}
 function interval(b){return ({1:3.5,2:2.5,3:1.6}[b.phase])*difficulties[b.difficulty].interval;}
 function emit(b,kind,x,y,vx,vy=0,extra={}){if(b.projectiles.length>=32)b.projectiles.shift();b.projectiles.push({id:'inquisitor-'+(++b.serial),kind,x,y,vx,vy,w:kind==='bolt'?48:kind==='rain'?10:kind==='energy'?120:30,h:kind==='bolt'?8:kind==='rain'?48:kind==='energy'?54:30,age:0,...extra});}
 function zone(b,kind,x,w,warning,activeTime,extra={}){if(b.zones.length>=16)b.zones.shift();b.zones.push({id:'zone-'+(++b.serial),kind,x:clamp(x,b.arenaStart+12,b.arenaEnd-w-12),y:kind==='beam'?0:410,w,h:kind==='beam'?430:20,warning,activeTime,age:0,...extra});}
 function bolt(b,y=338){const dir=b.dir;b.shotAt=b.time;b.shots++;emit(b,'bolt',b.x+36+dir*56+(dir<0?-48:0),y,dir*260);}
 function garlic(b){const distance=b.targetX-(b.x+36);emit(b,'garlic',b.x+36+b.dir*35,330,clamp(distance/1.05,-360,360),-265,{gravity:700});}
 function grenade(b){const distance=b.targetX-(b.x+36);emit(b,'grenade',b.x+36+b.dir*35,330,clamp(distance/1.12,-420,420),-300,{gravity:700});}
 function once(b,id,at,fn){if(b.stateTime>=at&&!b.fired.has(id)){b.fired.add(id);fn();}}
 function beginAttack(b,kind,player){
  b.jumpLeft=0;b.y=290;b.attack=kind;b.dir=player.x+player.w/2<b.x+36?-1:1;b.targetX=player.x+player.w/2;b.fired=new Set();b.dashDistance=0;b.shots=0;b.lane=b.actionIndex%2?338:400;
  enter(b,'ATTACK',attacks[kind]);
  if(kind==='trap')zone(b,'trap',b.x+(b.dir<0?-120:100),64,.85,5,{oneShot:true});
  if(kind==='grenade')zone(b,'grenade-mark',b.targetX-80,160,1.4,.3,{harmless:true});
  if(kind==='beam')zone(b,'beam',b.targetX-85,170,1.15,1.0);
  if(kind==='rain')for(const offset of [-210,0,210]){const x=clamp(b.targetX+offset-25,b.arenaStart+25,b.arenaEnd-75);if(!b.zones.some(z=>Math.abs(z.x-x)<100))zone(b,'rain',x,50,1.1,1.3,{harmless:true});}
 }
 function recover(b,ctx,seconds){b.previousAttack=b.attack;enter(b,'RECOVERY',seconds);b.attack=null;ctx.notify?.('Инквизитор уязвим — атакуй!',seconds);}
 function attackStep(b,dt,ctx){
  const t=b.stateTime,kind=b.attack;
  if(kind==='volley')for(let i=0;i<3;i++)once(b,'bolt'+i,.85+i*1.1,()=>bolt(b,b.lane));
  if(kind==='garlic')once(b,'garlic',.65,()=>garlic(b));
  if(kind==='grenade')once(b,'grenade',.7,()=>grenade(b));
  const dash=(from,to)=>{const active=t>=from&&t<to;if(active){const speed=620,old=b.x;b.x=clamp(b.x+b.dir*speed*dt,b.arenaStart+40,b.arenaEnd-110);b.dashDistance+=Math.abs(b.x-old);const sword={x:b.x+(b.dir<0?-35:35),y:365,w:90,h:65};if(overlap(sword,ctx.player))ctx.hit();}return active;};
  if(kind==='dash')dash(1,1.6);
  if(kind==='combo'){once(b,'bolt',.8,()=>bolt(b));dash(2.3,2.9);}
  if(kind==='feint'&&t>=1.9&&t<2.2){const box={x:b.x+(b.dir<0?-100:50),y:350,w:120,h:80};if(overlap(box,ctx.player))ctx.hit();}
  if(kind==='frenzy'){dash(.8,1.4);once(b,'a',2.05,()=>bolt(b));once(b,'b',2.8,()=>bolt(b));once(b,'grenade',3.55,()=>grenade(b));}
  if(kind==='charge')once(b,'energy',4,()=>{emit(b,'energy',b.x+36+(b.dir<0?-120:0),366,b.dir*220);b.shotAt=b.time;});
  if(b.timer<=0){const duration=['dash','combo','feint'].includes(kind)?1.5:kind==='charge'?1.6:2;recover(b,ctx,duration);}
 }
 function updateHazards(b,dt,ctx){
  for(const z of b.zones){z.age+=dt;z.active=z.age>=z.warning&&z.age<z.warning+z.activeTime;
   if(z.kind==='rain'&&z.active&&!z.released){z.released=true;emit(b,'rain',z.x+20,-50,0,520);}
   if(z.active&&!z.harmless&&overlap(ctx.player,z)){ctx.hit();if(z.oneShot)z.dead=true;}
  }
  b.zones=b.zones.filter(z=>!z.dead&&z.age<z.warning+z.activeTime+.3);
  for(const p of b.projectiles){p.age+=dt;p.x+=p.vx*dt;p.vy+=(p.gravity||0)*dt;p.y+=p.vy*dt;
   const contour=['bolt','rain'].includes(p.kind)?CombatGeometry.bolt(p):null;
   if(['bolt','garlic'].includes(p.kind)&&ctx.player.attack>0&&ctx.attackBox&&(contour?CombatGeometry.touches(ctx.attackBox,contour):overlap(ctx.attackBox,p))){p.dead=true;ctx.burst?.(p.x,p.y,p.kind==='garlic'?'garlic':'sparks');continue;}
   const target=p.kind==='bolt'&&ctx.player.h===80?{...ctx.player,y:ctx.player.y-12,h:ctx.player.h+12}:ctx.player;
   if(p.kind!=='grenade'&&(contour?CombatGeometry.touches(target,contour):overlap(p,target))){p.dead=true;ctx.hit();}
   if(p.y+p.h>=b.groundY&&['garlic','grenade','rain'].includes(p.kind)){p.dead=true;if(p.kind==='grenade')zone(b,'uv',p.x-75,150,1.1,3);ctx.burst?.(p.x,b.groundY,'sparks');}
  }
  b.projectiles=b.projectiles.filter(p=>!p.dead&&p.age<9&&p.x>b.arenaStart-200&&p.x<b.arenaEnd+200&&p.y<500);
 }
 function attention(b,dt,ctx){
  if(['WAITING','INTRO','STUNNED','HIT','PHASE_TRANSITION','DEATH','VICTORY'].includes(b.state))return;
  const keys=ctx.inputs||{};let different=false;
  for(const key of ['attack','jump','crouch'])if(keys[key]&&!b.lastKeys[key]){if(b.lastAction===key)b.repeated++;else {b.repeated=Math.max(0,b.repeated-2);different=true;}b.lastAction=key;}
  const moved=b.lastPlayerX===null?0:Math.abs(ctx.player.x-b.lastPlayerX);b.lastPlayerX=ctx.player.x;b.lastKeys={...keys};
  b.attention=clamp(b.attention+(moved<.2||b.repeated>=4?.065:-.11)*dt-(different?.025:0),0,1);
 }
 function step(b,dt,ctx){
  if(ctx.paused||b.state==='WAITING')return;
  b.time+=dt;b.stateTime+=dt;b.timer-=dt;b.inv=Math.max(0,b.inv-dt);b.moveX=0;attention(b,dt,ctx);
  if(!['INTRO','PHASE_TRANSITION','DEATH','VICTORY'].includes(b.state))updateHazards(b,dt,ctx);
  if(b.state==='INTRO'){if(b.timer<=0)enter(b,'IDLE',interval(b));return;}
  if(b.state==='PHASE_TRANSITION'){if(b.timer<=0)enter(b,'IDLE',interval(b)*.5);return;}
  if(b.state==='DEATH'){b.death=Math.max(0,b.timer);if(b.timer<=0)enter(b,'VICTORY');return;}
  if(b.state==='VICTORY')return;
  if(b.state==='HIT'){if(b.timer<=0)enter(b,b.hitReturn.state,b.hitReturn.timer);return;}
  if(b.state==='STUNNED'||b.state==='RECOVERY'){if(b.timer<=0)enter(b,'IDLE',interval(b));return;}
  if(b.state==='IDLE'||b.state==='MOVE'){
   b.state='MOVE';const distance=ctx.player.x-b.x,target=b.phase===2?180:300,dir=Math.sign(distance)||b.dir;
   if(Math.abs(distance)>target+50||Math.abs(distance)<140){const movement=(Math.abs(distance)>target?dir:-dir)*140*dt;const old=b.x;b.x=clamp(b.x+movement,b.arenaStart+100,b.arenaEnd-150);b.moveX=b.x-old;b.dir=dir;}
   if(b.phase>=2&&Math.abs(distance)<150&&!b.didLeap&&b.jumpLeft<=0){b.jumpLeft=.65;b.leapStart=b.x;b.leapDir=-dir;b.didLeap=true;}
   if(b.jumpLeft>0){b.jumpLeft=Math.max(0,b.jumpLeft-dt);const fraction=1-b.jumpLeft/.65;b.y=290-Math.sin(fraction*Math.PI)*45;b.x=clamp(b.leapStart+b.leapDir*110*fraction,b.arenaStart+100,b.arenaEnd-150);}
   if(b.timer<=0||b.attention>=1){let kind;if(b.attention>=1){kind=b.phase===1?'garlic':b.phase===2?'grenade':'rain';b.attention=0;b.repeated=0;b.forced=true;}else{const list=lists[b.phase];kind=list[b.actionIndex%list.length];b.actionIndex++;b.forced=false;}beginAttack(b,kind,ctx.player);}
  }else if(b.state==='ATTACK')attackStep(b,dt,ctx);
 }
 function strike(b,damage=1){
  const interrupt=b.state==='ATTACK'&&b.attack==='charge'&&b.stateTime<4;
  if(b.inv>0||!(['RECOVERY','STUNNED','HIT'].includes(b.state)||interrupt))return {hit:false};
  b.hp=Math.max(0,b.hp-clamp(damage,1,2));b.inv=.24;
  if(b.hp===0){clear(b);enter(b,'DEATH',1.7);b.death=1.7;return {hit:true,killed:true};}
  const phase=b.hp/b.maxHp>.7?1:b.hp/b.maxHp>.35?2:3;
  if(phase!==b.phase){b.phase=phase;b.transitionCount++;b.actionIndex=0;clear(b);enter(b,'PHASE_TRANSITION',1.3);return {hit:true,phaseChanged:true};}
  if(interrupt){clear(b);enter(b,'STUNNED',3);return {hit:true,interrupted:true};}
  const back=b.state==='HIT'?b.hitReturn:{state:b.state,timer:Math.max(0,b.timer-.14)};b.hitReturn=back;enter(b,'HIT',.14);return {hit:true};
 }
 function vulnerable(b){return b.inv<=0&&(['RECOVERY','STUNNED','HIT'].includes(b.state)||b.state==='ATTACK'&&b.attack==='charge'&&b.stateTime<4);}
 function warning(b){
  if(b.state==='DEATH'||b.state==='VICTORY')return 'ИНКВИЗИТОР ПОВЕРЖЕН';
  if(b.state==='INTRO')return 'Инквизитор — Последний охотник';
  if(b.state==='PHASE_TRANSITION')return ['','ОХОТА НАЧИНАЕТСЯ','СВЯЩЕННАЯ ЯРОСТЬ','ПОСЛЕДНИЙ РАССВЕТ'][b.phase];
  if(b.state==='STUNNED')return 'ОГЛУШЁН · АТАКУЙ!';
  if(['RECOVERY','HIT'].includes(b.state))return 'УЯЗВИМ · АТАКУЙ!';
  if(b.state==='ATTACK'&&b.attack==='charge'&&b.stateTime<4)return names.charge+' · '+Math.ceil(4-b.stateTime)+' С';
  if(b.state==='ATTACK'){const detail=b.attack==='volley'?(b.lane<360?' · ПРИСЯДЬ':' · ПРЫГАЙ'):['dash','frenzy'].includes(b.attack)?' · ПЕРЕПРЫГНИ':b.attack==='beam'||b.attack==='rain'?' · УЙДИ С МЕТОК':b.attack==='feint'?' · ЖДИ НАСТОЯЩИЙ УДАР':'';return (b.forced?'ОХОТНИК ЗАМЕТИЛ ПРИВЫЧКУ · ':'')+names[b.attack]+detail;}
  return 'Двигайся и чередуй действия';
 }
 return {create,engage,step,strike,vulnerable,warning,beginAttack,enter,clear,difficulties,attacks,lists,overlap};
})();
