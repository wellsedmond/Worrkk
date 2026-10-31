/* Local, untrusted personal records and the existing save slot for the final arena. */
const progressStore=(()=>{
 const key='upyr-run.progress.v1';let available=true,volatile=null,memoryOnly=false;
 const nonnegative=value=>Number.isFinite(Number(value))?Math.max(0,Math.floor(Number(value))):0;
 const difficulty=value=>['easy','normal','hard'].includes(value)?value:'normal';
 function empty(){return {version:2,completed:false,bestTime:null,maxKills:0,achievements:[],maxScore:0,boss:{defeated:false,firstRewardClaimed:false,difficulties:[]},bossDifficulty:'normal',bossCheckpoint:null,bossEntry:null};}
 function entry(raw){
  if(!raw||raw.version!==1||raw.level!=='level1'||!raw.snapshot||typeof raw.snapshot!=='object')return null;
  const s=raw.snapshot,statues=Array.isArray(raw.snapshot.statues)?raw.snapshot.statues.filter(s=>Number.isInteger(s.zone)&&s.zone>=0&&s.zone<5&&Number.isFinite(s.x)&&Number.isInteger(s.hp)&&s.hp>=0&&s.hp<=5).slice(0,5).map(s=>({zone:s.zone,x:s.x,hp:s.hp})):null,ids=value=>Array.isArray(value)?value.filter(id=>typeof id==='string'&&id.length<140).slice(0,1500):[];
  return {version:1,level:'level1',checkpoint:{id:'inquisitor-entry',x:57400,y:430},snapshot:{score:nonnegative(s.score),kills:nonnegative(s.kills),sword:Math.min(5,nonnegative(s.sword)),swordRewards:nonnegative(s.swordRewards),coins:ids(s.coins),items:ids(s.items),enemies:ids(s.enemies),leverOpen:!!s.leverOpen,statues},clock:nonnegative(raw.clock),damage:nonnegative(raw.damage),difficulty:difficulty(raw.difficulty),achievementRun:typeof raw.achievementRun==='string'&&/^[-a-zA-Z0-9]{12,120}$/.test(raw.achievementRun)?raw.achievementRun:null,coffins:ids(raw.coffins)};
 }
 function load(){if(memoryOnly&&volatile)return volatile;try{
  const raw=JSON.parse(localStorage.getItem(key)||'null');if(!raw||![1,2].includes(raw.version))return empty();
  const p=empty();Object.assign(p,{completed:raw.completed===true,bestTime:Number.isFinite(raw.bestTime)&&raw.bestTime>0?raw.bestTime:null,maxKills:nonnegative(raw.maxKills),achievements:Array.isArray(raw.achievements)?raw.achievements.filter(x=>['НЕПРОКУСИМЫЙ','Последний упырь'].includes(x)):[],maxScore:nonnegative(raw.maxScore),bossDifficulty:difficulty(raw.bossDifficulty),bossCheckpoint:entry(raw.bossCheckpoint),bossEntry:entry(raw.bossEntry)});
  if(raw.boss&&typeof raw.boss==='object')p.boss={defeated:raw.boss.defeated===true,firstRewardClaimed:raw.boss.firstRewardClaimed===true,difficulties:Array.isArray(raw.boss.difficulties)?[...new Set(raw.boss.difficulties.filter(x=>['easy','normal','hard'].includes(x)))]:[]};
  return p;
 }catch{available=false;return empty();}}
 function write(p){volatile=p;try{localStorage.setItem(key,JSON.stringify(p));available=true;memoryOnly=false;return true;}catch{available=false;memoryOnly=true;return false;}}
 function save(result){const p=load();p.completed=true;p.bestTime=p.bestTime===null?result.time:Math.min(p.bestTime,result.time);p.maxKills=Math.max(p.maxKills,nonnegative(result.kills));p.maxScore=Math.max(p.maxScore,nonnegative(result.score));if(result.damage===0&&!p.achievements.includes('НЕПРОКУСИМЫЙ'))p.achievements.push('НЕПРОКУСИМЫЙ');write(p);return p;}
 function saveBossCheckpoint(data){const e=entry(data);if(!e)return false;const p=load();p.bossCheckpoint=e;p.bossEntry=e;return write(p);}
 function clearBossCheckpoint(){const p=load();p.bossCheckpoint=null;write(p);}
 function completeBoss(mode,claimed=false){const p=load(),first=!p.boss.firstRewardClaimed&&!claimed;p.boss.defeated=true;p.boss.firstRewardClaimed=true;if(!p.boss.difficulties.includes(difficulty(mode)))p.boss.difficulties.push(difficulty(mode));if(!p.achievements.includes('Последний упырь'))p.achievements.push('Последний упырь');p.bossCheckpoint=null;write(p);return first;}
 function setBossDifficulty(mode){const p=load();p.bossDifficulty=difficulty(mode);write(p);return p.bossDifficulty;}
 return {load,save,saveBossCheckpoint,clearBossCheckpoint,completeBoss,setBossDifficulty,get available(){return available;}};
})();
