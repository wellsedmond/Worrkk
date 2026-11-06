const leaderboardUI=(()=>{
 const panel=document.querySelector('#leaderboard-panel'),status=document.querySelector('#leaderboard-status'),rows=document.querySelector('#leaderboard-rows'),table=document.querySelector('#leaderboard-table'),self=document.querySelector('#leaderboard-self'),refresh=document.querySelector('#leaderboard-refresh');
 let returnPause=false,focusBefore=null,request=null;
 const number=n=>n.toLocaleString('ru-RU');
 async function load(){
  request?.abort();request=new AbortController();const active=request;
  table.hidden=true;self.hidden=true;rows.replaceChildren();refresh.disabled=true;
  const initData=window.Telegram?.WebApp?.initData;
  if(!initData||location.protocol==='file:'){
   status.textContent='Общий рейтинг доступен в Telegram. Откройте игру через бота, чтобы участвовать.';refresh.disabled=false;return;
  }
  status.textContent='Загружаем рейтинг…';
  const timeout=setTimeout(()=>active.abort(),15000);
  try{
   await achievementSystem.sync();
   const response=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({initData}),signal:active.signal});
   if(!response.ok)throw Error(response.status===401?'Сессия Telegram истекла. Закройте и заново откройте игру.':'Не удалось загрузить рейтинг. Попробуйте ещё раз.');
   const data=await response.json();if(panel.hidden||active!==request)return;
   status.textContent=data.total?`Игроков: ${number(data.total)} · Монеты за все игры по сохранённым серверным данным.`:'Пока нет участников. Собирайте монеты и станьте первым!';
   for(const player of data.players){
    const row=document.createElement('tr');if(player.isSelf)row.classList.add('leaderboard-me');
    for(const value of [number(player.rank),player.name+(player.isSelf?' · Вы':''),number(player.coins)]){const cell=document.createElement('td');cell.textContent=value;row.append(cell);}
    rows.append(row);
   }
   table.hidden=data.players.length===0;
   self.hidden=!data.self;
   if(data.self)self.textContent=`Ваше место: ${number(data.self.rank)} · Собрано монет: ${number(data.self.coins)}`;
  }catch(error){
   if(!panel.hidden&&active===request)status.textContent=active.signal.aborted?'Нет ответа сервера. Проверьте соединение и обновите рейтинг.':error.message.startsWith('Сессия Telegram')?error.message:'Не удалось загрузить рейтинг. Попробуйте ещё раз.';
  }finally{clearTimeout(timeout);if(active===request)refresh.disabled=false;}
 }
 function open(){focusBefore=document.activeElement;returnPause=paused;paused=true;releaseKeys();panel.hidden=false;document.querySelector('#leaderboard-close').focus();load();}
 function close(){request?.abort();panel.hidden=true;paused=returnPause;releaseKeys();focusBefore?.focus?.();}
 document.querySelector('#leaderboard-open').onclick=open;document.querySelector('#leaderboard-close').onclick=close;refresh.onclick=load;
 panel.addEventListener('keydown',e=>{
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}
  if(e.key==='Tab'){
   const buttons=[...panel.querySelectorAll('button:not(:disabled)')],first=buttons[0],last=buttons.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 return {open,close,load};
})();
