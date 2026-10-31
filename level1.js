/* Level data only. Distances use the existing 245 px/s run speed and 90 px tiers. */
const LEVEL1 = (() => {
 const stakeY=338; // Head-height bolt lane; full crouch artwork stays below it.
 const zones=[
  {id:'forest',name:'Пробуждение Упыря',start:0,end:12500,tint:'#283c3c'},
  {id:'cemetery',name:'Кладбище забытых игроков',start:12500,end:30000,tint:'#453651'},
  {id:'alley',name:'Аллея охотников',start:30000,end:47500,tint:'#613341'},
  {id:'tower',name:'Часовая башня',start:47500,end:57000,tint:'#39435c'},
  {id:'boss',name:'Инквизитор — Последний охотник',start:57000,end:60300,tint:'#6a3049'}
 ];
 const ground=[],ledges=[],enemies=[],traps=[],coins=[],items=[];
 let nextId=0;
 function platform(x,y,w=180,type='ledge',extra={}){const p={id:'p'+nextId++,x,y,w,h:type==='ground'?80:22,type,...extra};(type==='ground'?ground:ledges).push(p);return p;}
 function road(start,end,gaps=[]){let x=start;for(const [a,b]of [...gaps,[end,end]]){while(x<a){const w=Math.min(500,a-x);platform(x,430,w,'ground');x+=w;}x=b;}}
 // Every ground gap is <= 120 px, safely within one jump. Spawn/landing buffers are hazard-free.
 road(0,12500,[[950,1050],[6100,6210],[10100,10210]]);
 road(12500,30000,[[14300,14410],[18800,18910],[23400,23520],[28100,28210]]);
 road(30000,47500,[[34700,34810],[40100,40210],[45300,45410]]);
 road(47500,60300);
 function tiers(x,kind='ledge'){
  platform(x,340,190,kind,kind==='moving'?{axis:'x',amplitude:35,period:4}:{});
  platform(x+95,250,170,'ledge');
 }
 for(const x of [2600,5300,8400,11200])tiers(x);
 for(const [i,x]of [13200,15800,17900,20400,22500,25000,27200,29000].entries())tiers(x,i%3===0?'moving':i%3===1?'crumble':'ledge');
 for(const x of [32100,36200,38700,42300,46200])tiers(x);
 // Mandatory ascending route. Ground below allows recovery after a missed jump.
 for(let i=0;i<8;i++)platform(48600+i*110,340-i*90,210,i===4?'moving':i===6?'crumble':'ledge',i===4?{axis:'x',amplitude:25,period:4}:{});
 for(let x=49480;x<53500;x+=180)platform(x,-290,190,(Math.round(x/180)%5===0)?'crumble':'ledge');
 for(let i=0;i<8;i++)platform(53600+i*130,-200+i*90,215,'ledge');
 function enemy(type,x,extra={}){enemies.push({id:'e'+nextId++,type,x,y:type==='garlic'?350:388,range:type==='helmet'?95:65,...extra});}
 enemy('garlic',1650,{flying:true,y:350,range:50});
 for(const x of [7200,11450])enemy('garlic',x,{flying:true});
 for(const [i,x]of [13800,16500,19600,21700,25800,28700].entries())enemy(i%2?'helmet':'garlic',x,{flying:i%2===0});
 for(const x of [33100,37400,41300,44400,46900])enemy('garlic',x,{flying:true});
 function fire(x,cycle=0){traps.push({id:'t'+nextId++,type:'fire',x,y:397,w:42,h:33,cycle});}
 fire(2150);fire(7800,4);fire(17200,4);fire(26300,4);
 // Stakes travel at head height: crouching leaves 8px clearance. Telegraph lasts 0.9s.
 for(const [i,x]of [2500,31700,33900,36700,39200,41800,43900,46500].entries()){
  traps.push({id:'t'+nextId++,type:'stake',x,y:stakeY,w:48,h:12,period:i?5.5:7,warning:.9,travel:470,speed:230});
  if(i>0)fire(x-260,i%2?4.8:0);
 }
 for(const x of [50100,51800])traps.push({id:'t'+nextId++,type:'pendulum',x,y:-600,length:260,radius:23,period:4.5});
 // Denser patrols stay away from gaps, fire, launchers and existing enemies.
 let added=0;
 for(let x=3200;x<47000;x+=850){
  if(!ground.some(p=>x-140>=p.x&&x+140<=p.x+p.w))continue;
  if(traps.some(t=>Math.abs(t.x-x)<330)||enemies.some(e=>Math.abs(e.x-x)<420))continue;
  const type=added++%3===0?'helmet':'garlic';enemy(type,x,{flying:type==='garlic'});
 }
 for(const x of [54300,55250,56250])enemy('garlic',x,{flying:true});
 // Blood only drops from the five breakable relics.
 for(const p of ground){if(p.x%1000<500&&p.x>300)coins.push({id:'c'+nextId++,x:p.x+Math.min(180,p.w/2),y:390,platformId:p.id});}
 for(const p of ledges)if(p.w>=150)coins.push({id:'c'+nextId++,x:p.x+p.w/2,y:p.y-40,platformId:p.id});
 // Append optional routes after original IDs are assigned, preserving existing saves.
 const batches=[];
 const patterns=[
  {name:'ascending',points:[[195,160,150],[305,70,170]]},
  {name:'chain',points:[[320,250,150],[545,250,160]]},
  {name:'checkerboard',points:[[-145,160,180],[155,160,180],[5,70,170]]},
  {name:'branch',points:[[-180,250,160],[320,250,160],[105,160,180]]},
  {name:'zigzag',points:[[-90,160,160],[100,70,160]]},
  {name:'terrace',points:[[210,160,150],[425,160,170],[315,70,190]]}
 ];
 function batch(x,index,base=[]){
  const id='batch-'+index,pattern=patterns[index%patterns.length],shift=Math.floor(index/6)*9;
  const add=(dx,y,w)=>{const p=platform(x+dx,y,w,'ledge',{optional:true,batch:id});coins.push({id:'bonus-coin-'+p.id,x:p.x+p.w/2,y:p.y-40,platformId:p.id});return p;};
  if(!base.length)base=[add(0,340,180+(index%4)*9),add(85+(index%5)*8,250,150+(index%3)*8)];
  for(const p of base)p.batch=id;
  const extra=pattern.points.map(([dx,y,w],j)=>add(dx+(dx<0?-shift:shift),y,w+((index+j)%5)*5));
  batches.push({id,x,pattern:pattern.name,platformIds:[...base,...extra].map(p=>p.id)});
 }
 const originalTiers=ledges.filter(p=>p.y===340&&p.x<47500);
 originalTiers.forEach((p,i)=>batch(p.x,i,[p,ledges.find(q=>q.x===p.x+95&&q.y===250)]));
 for(const [i,x]of [3700,6500,9450,15000,23800,30800,40800,47860,55000].entries())batch(x,originalTiers.length+i);
 return Object.freeze({id:'level1',name:'Проклятая дорога к СКА Арене',width:60300,stakeY,zones,ground,ledges,enemies,traps,coins,items,batches,
  checkpoints:[{id:'cemetery-end',x:29600,y:430},{id:'tower-base',x:48000,y:430},{id:'tower-top',x:52800,y:-290},{id:'arena',x:57200,y:430}],
  lever:{x:53000,y:-290},gate:{x:53500,y:-600,w:48,h:1030},
  timedSection:{start:50000,end:52500,seconds:24},escapeSeconds:45,
  boss:{x:58650,y:310,w:72,h:140,hp:25,arenaStart:57500,arenaEnd:59900},exitX:59900});
})();
