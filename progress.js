/* Local, untrusted personal records. Version-one records are migrated without fang data. */
const progressStore=(()=>{
 const key='upyr-run.progress.v1';let available=true;
 const nonnegative=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
 function empty(){return {version:2,completed:false,bestTime:null,maxKills:0,achievements:[],maxScore:0};}
 function load(){try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(!raw||![1,2].includes(raw.version))return empty();return {version:2,completed:raw.completed===true,bestTime:Number.isFinite(raw.bestTime)&&raw.bestTime>0?raw.bestTime:null,maxKills:nonnegative(raw.maxKills),achievements:Array.isArray(raw.achievements)?raw.achievements.filter(x=>x==='НЕПРОКУСИМЫЙ'):[],maxScore:nonnegative(raw.maxScore)};}catch{available=false;return empty();}}
 function save(result){const p=load();p.completed=true;p.bestTime=p.bestTime===null?result.time:Math.min(p.bestTime,result.time);p.maxKills=Math.max(p.maxKills,nonnegative(result.kills));p.maxScore=Math.max(p.maxScore,nonnegative(result.score));if(result.damage===0&&!p.achievements.includes('НЕПРОКУСИМЫЙ'))p.achievements.push('НЕПРОКУСИМЫЙ');try{localStorage.setItem(key,JSON.stringify(p));available=true;}catch{available=false;}return p;}
 return {load,save,get available(){return available;}};
})();
