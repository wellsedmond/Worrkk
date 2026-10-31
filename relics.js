/* One breakable blood cache per zone. Layout and damage belong to the run snapshot. */
const Relics=(()=>{
 const statue=(zone,x,hp=5)=>({id:'relic-'+zone,zone,x,y:430,w:72,h:126,hp,hurt:0});
 function candidates(level,zone){
  const z=level.zones[zone],end=zone===4?level.boss.arenaStart:z.end,spots=[];
  for(let x=z.start+110;x<end-120;x+=60){
   if(!level.ground.some(p=>x-15>=p.x&&x+87<=p.x+p.w))continue;
   if(level.traps.some(t=>Math.abs(t.x-x-36)<190))continue;
   if(level.enemies.some(e=>Math.abs(e.x-x-36)<e.range+160))continue;
   if(level.checkpoints.some(cp=>Math.abs(cp.x-x-36)<100))continue;
   if(level.ledges.some(p=>p.y>270&&p.y<440&&x<p.x+p.w+20&&x+72>p.x-20))continue;
   if(x<level.gate.x+150&&x+72>level.gate.x-100)continue;
   spots.push(x);
  }
  return spots;
 }
 function create(level,random=Math.random){return level.zones.map((z,i)=>{const choices=candidates(level,i);if(!choices.length)throw Error('No safe relic location in '+z.id);return statue(i,choices[Math.min(choices.length-1,Math.floor(random()*choices.length))]);});}
 function restore(saved,level){
  if(!Array.isArray(saved)||saved.length!==level.zones.length)return null;
  const result=[];for(let i=0;i<level.zones.length;i++){const s=saved.find(s=>s.zone===i);if(!s||!candidates(level,i).includes(s.x)||!Number.isInteger(s.hp)||s.hp<0||s.hp>5)return null;result.push(statue(i,s.x,s.hp));}return result;
 }
 function strike(s){if(s.hp<=0)return false;s.hp--;s.hurt=.16;return true;}
 function drop(s){return {id:'blood-'+s.id,type:'rage',x:s.x+s.w/2,y:s.y-48,taken:false};}
 function body(s){return {x:s.x+5,y:s.y-s.h,w:s.w-10,h:s.h};}
 return {create,restore,strike,drop,body,candidates};
})();
