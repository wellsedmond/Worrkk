/* Local/offline profile and retryable server event outbox; Telegram identity is verified by server only. */
const achievementSystem=(()=>{
 const core=UpyrAchievements;const telegram=window.Telegram?.WebApp;const initData=telegram?.initData||'';
 const user=telegram?.initDataUnsafe?.user?.id;const profile=initData&&Number.isSafeInteger(user)?'telegram-'+user:'guest';
 const key='upyr.achievements.v1.'+profile;let stored;try{stored=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 let model=core.normalize(stored?.model);
 // Only the old no-damage flag is historical evidence; best score is not lifetime coin income.
 if(!stored&&profile==='guest'&&progressStore.load().achievements.includes('НЕПРОКУСИМЫЙ')){model.stats.unhurt=1;model.unlocked.unhurt=new Date().toISOString();}
 let pending=Array.isArray(stored?.pending)?stored.pending:[];
 const uid=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
 // A new page has its own stream; old offline events retain their original stream and sequence.
 const stream=uid();let sequence=0,run='',serial=0,inflight=false,status=initData?'Ожидание синхронизации':'Локальный профиль',timer=0,dirty=false;
 let onChange=()=>{},onUnlock=()=>{};const toastQueue=[];
 function persist(){try{localStorage.setItem(key,JSON.stringify({model,pending}));dirty=false;}catch{status='Хранилище недоступно — не закрывайте игру';}}
 function emit(type,data={}){if(!run&&type!=='run_started')return;const e={stream,seq:++sequence,run,type,data};const opened=core.apply(model,e);if(initData)pending.push(e);dirty=true;opened.forEach(id=>{toastQueue.push(id);onUnlock(id);});if(type!=='player_moved'||opened.length)persist();onChange();}
 function start(){run=uid();serial=0;emit('run_started',{level:'level1',x:70});}
 function unique(prefix){return prefix+'-'+(++serial);}
 async function sync(){
  if(!initData||inflight||typeof fetch!=='function')return;inflight=true;
  const batch=pending.slice(0,100);
  try{const response=await fetch('/api/achievements',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData,events:batch}),signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error(response.status===401?'Telegram-сессия истекла: откройте игру заново':response.status===503?'Серверное сохранение ещё не настроено':'Нет связи с сервером');
   const answer=await response.json();pending=pending.slice(batch.length);const previous=model.unlocked;model=core.normalize(answer.state);for(const event of pending)core.apply(model,event);for(const id of Object.keys(model.unlocked))if(!previous[id])toastQueue.push(id);
   status=pending.length?'Синхронизация…':'Сохранено в Telegram-профиле';persist();onChange();
  }catch(error){status=/^(Telegram|Серверное|Нет связи)/.test(error.message)?error.message:'Нет связи — прогресс ожидает синхронизации';onChange();}finally{inflight=false;}
 }
 function tick(dt){timer+=dt;if(timer>=2){timer=0;if(dirty)persist();if(initData)sync();}}
 if(typeof window.addEventListener==='function'){window.addEventListener('online',sync);window.addEventListener('pagehide',persist);}
 if(!stored)persist();
 return {start,emit,unique,tick,sync,persist,toastQueue,get state(){return model;},get status(){return status;},get points(){return core.points(model);},set onChange(fn){onChange=fn;},set onUnlock(fn){onUnlock=fn;}};
})();
