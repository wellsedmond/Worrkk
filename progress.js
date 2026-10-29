/* Local, untrusted personal progress. Never used as a verified online leaderboard. */
const progressStore=(()=>{
 const key='upyr-run.progress.v1';let available=true;
 function empty(){return {version:1,completed:false,bestTime:null,fangs:0,achievements:[],maxScore:0};}
 function load(){try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(!raw||raw.version!==1)return empty();return {
  version:1,completed:raw.completed===true,bestTime:Number.isFinite(raw.bestTime)&&raw.bestTime>0?raw.bestTime:null,
  fangs:Math.max(0,Math.min(3,Math.floor(Number(raw.fangs)||0))),achievements:Array.isArray(raw.achievements)?raw.achievements.filter(x=>x==='НЕПРОКУСИМЫЙ'):[],maxScore:Number.isFinite(Number(raw.maxScore))?Math.max(0,Math.floor(Number(raw.maxScore))):0};
 }catch{available=false;return empty();}}
 function save(result){const p=load();p.completed=true;p.bestTime=p.bestTime===null?result.time:Math.min(p.bestTime,result.time);p.fangs=Math.max(p.fangs,result.fangs);p.maxScore=Math.max(p.maxScore,result.score);if(result.damage===0&&!p.achievements.includes('НЕПРОКУСИМЫЙ'))p.achievements.push('НЕПРОКУСИМЫЙ');try{localStorage.setItem(key,JSON.stringify(p));available=true;}catch{available=false;}return p;}
 return {load,save,get available(){return available;}};
})();
