/* Shared deterministic rules. Events are sequenced per device stream and deduplicated per run entity. */
(function(root){
 const levels=[{id:'level1',chapter:'chapter1',bosses:['hunter'],enemies:34,attackFree:false}];
 const definitions=[];
 function add(id,name,description,category,metric,target,rarity='rare',reward,active=true){definitions.push({id,name,description,category,metric,target,rarity,reward:reward??({common:10,rare:25,epic:50,legendary:100,secret:75}[rarity]),active,icon:category});}
 add('garlic100','Чесночный пресс','Уничтожить 100 головок чеснока','combat','garlic',100);
 add('streak10','Один против всех','Победить 10 противников подряд без урона','combat','streakBest',10);
 add('stakes100','Не сегодня, Ван Хельсинг!','Увернуться от 100 осиновых кольев','combat','stakes',100,'epic');
 add('kills500','Машина разрушения','Уничтожить 500 противников','combat','kills',500,'epic');
 add('run50','Кровожадный','Уничтожить 50 противников за один забег','combat','runBest',50,'epic',undefined,levels.some(l=>l.enemies>=50));
 add('garlic1000','Чесночная диета','Уничтожить 1 000 головок чеснока','combat','garlic',1000,'legendary');
 add('unhurt','Настоящий упырь','Пройти уровень без получения урона','journey','unhurt',1,'epic');
 add('fire50','Горячая штучка','Перепрыгнуть 50 костров','journey','fires',50,'epic');
 add('wins10','Ночная смена','Завершить 10 прохождений уровней','journey','wins',10);
 add('fire25','Огнеупорный','Перепрыгнуть 25 костров','journey','fires',25);
 add('noattack','Без права на ошибку','Пройти уровень без использования атак','journey','noattack',1,'legendary',undefined,levels.some(l=>l.attackFree));
 add('distance','Вечный двигатель','Преодолеть суммарно 10 000 игровых единиц вперёд','journey','distance',10000);
 add('bosses','Я здесь главный','Победить всех боссов главы I','journey','chapterBosses',1,'epic');
 add('legend','Легенда ночи','Пройти все доступные уровни без единой смерти за полное прохождение','journey','legend',1,'legendary');
 add('deaths100','Бессмертие отменяется','Погибнуть 100 раз','secret','deaths',100,'secret');
 add('deaths10','Это уже традиция','Погибнуть 10 раз на одном уровне','secret','levelDeathBest',10,'secret');
 add('sleep','Не трогайте, я сплю','Провести 60 секунд подряд без движения в безопасной зоне','secret','idleBest',60,'secret');
 add('early5','Опять двадцать пять','Погибнуть в первые 5 секунд забега 5 раз','secret','earlyDeaths',5,'secret');
 [100,500,1000,5000,10000,50000].forEach((n,i)=>add('coins'+n,['Первая добыча','Карманы полны','Ночной грабитель','Сокровища Упыря','Золотой упырь','Кровавый миллионер'][i],`Собрать суммарно ${n.toLocaleString('ru-RU')} монет`,'coins','coins',n,['common','rare','epic','epic','legendary','legendary'][i],[10,25,50,75,100,150][i]));
 add('lastvampire','Последний упырь','Победить Инквизитора — Последнего охотника','journey','inquisitorWins',1,'legendary');
 const types=new Set(['run_started','run_finished','enemy_killed','garlic_destroyed','coin_collected','player_died','player_damaged','level_completed','boss_defeated','bonfire_jumped','stake_dodged','player_moved','player_attacked','inquisitor_defeated']);
 const num=n=>Number.isFinite(n)?Math.max(0,n):0;
 function empty(){return {version:1,stats:{},unlocked:{},streams:{},runs:{},levelDeaths:{},campaigns:{}};}
 function normalize(s){if(!s||s.version!==1)return empty();for(const k of ['stats','unlocked','streams','runs','levelDeaths','campaigns'])if(!s[k]||typeof s[k]!=='object'||Array.isArray(s[k]))s[k]={};for(const [id,date] of Object.entries(s.unlocked))if(!definitions.some(d=>d.id===id)||typeof date!=='string'||!Number.isFinite(Date.parse(date)))delete s.unlocked[id];return s;}
 function points(s){return definitions.reduce((n,d)=>n+(s.unlocked[d.id]?d.reward:0),0);}
 function apply(s,e,now=Date.now()){
  if(!e||!types.has(e.type)||!/^[-a-zA-Z0-9]{12,100}$/.test(e.stream)||!Number.isSafeInteger(e.seq)||e.seq<1||!/^[-a-zA-Z0-9]{12,120}$/.test(e.run))return [];
  const last=Object.hasOwn(s.streams,e.stream)?s.streams[e.stream]:0;if(e.seq<=last)return [];if(e.seq!==last+1)throw Error('Event sequence gap');
  s.streams[e.stream]=e.seq;let r=Object.hasOwn(s.runs,e.run)?s.runs[e.run]:null;const d=e.data||{},stats=s.stats;
  const inc=(k,v=1)=>stats[k]=num(stats[k])+v;const best=(k,v)=>stats[k]=Math.max(num(stats[k]),v);
  if(e.type==='run_started'&&!r&&levels.some(l=>l.id===d.level)){r=s.runs[e.run]={level:String(d.level),campaign:/^[-a-zA-Z0-9]{12,120}$/.test(d.campaign)?d.campaign:e.run,kills:0,streak:0,damage:0,deaths:0,attacks:0,maxX:num(d.x),seen:{},bosses:{},completed:false};if(!Object.hasOwn(s.campaigns,r.campaign))s.campaigns[r.campaign]={levels:{},bosses:{},deaths:0};}
  if(r){const once=(kind,id)=>{if(typeof id!=='string'||id.length>140)return false;const key=kind+':'+id;if(r.seen[key])return false;r.seen[key]=true;return true;};
   switch(e.type){
    case 'enemy_killed':if(once('enemy',d.id)){inc('kills');r.kills++;r.streak++;best('streakBest',r.streak);best('runBest',r.kills);}break;
    case 'garlic_destroyed':if(once('garlic',d.id))inc('garlic');break;
    case 'coin_collected':if(once('coin',d.id)&&Number.isSafeInteger(d.amount)&&d.amount>0&&d.amount<=100)inc('coins',d.amount);break;
    case 'player_damaged':r.damage++;r.streak=0;break;
    case 'player_attacked':r.attacks++;break;
    case 'player_died':if(once('death',d.id)){inc('deaths');r.deaths++;s.campaigns[r.campaign].deaths++;r.streak=0;s.levelDeaths[r.level]=num(s.levelDeaths[r.level])+1;best('levelDeathBest',s.levelDeaths[r.level]);if(num(d.elapsed)<5)inc('earlyDeaths');}break;
    case 'stake_dodged':if(once('stake',d.id))inc('stakes');break;
    case 'bonfire_jumped':if(once('fire',d.id))inc('fires');break;
    case 'player_moved':{const x=Math.min(1000000,num(d.x));if(x>r.maxX){inc('distance',x-r.maxX);r.maxX=x;}best('idleBest',Math.min(60,num(d.safeSeconds)));break;}
    case 'inquisitor_defeated':if(!stats.inquisitorWins){stats.inquisitorWins=1;inc('coins',1000);}break;
    case 'boss_defeated':if(once('boss',d.id)){r.bosses[d.id]=true;const campaign=s.campaigns[r.campaign];campaign.bosses[d.id]=true;const level=levels.find(l=>l.id===r.level);const bosses=levels.filter(l=>l.chapter===level?.chapter).flatMap(l=>l.bosses);if(bosses.length&&bosses.every(id=>campaign.bosses[id]))best('chapterBosses',1);}break;
    case 'level_completed':if(!r.completed){r.completed=true;inc('wins');if(r.damage===0&&r.deaths===0)best('unhurt',1);if(r.attacks===0)best('noattack',1);const campaign=s.campaigns[r.campaign];campaign.levels[r.level]=true;if(campaign.deaths===0&&levels.every(l=>campaign.levels[l.id]))best('legend',1);}break;
   }
  }
  const opened=[];for(const a of definitions)if(a.active&&!s.unlocked[a.id]&&num(stats[a.metric])>=a.target){s.unlocked[a.id]=new Date(now).toISOString();opened.push(a.id);}return opened;
 }
 root.UpyrAchievements={levels,definitions,empty,normalize,apply,points,types:[...types]};
})(globalThis);
