const achievementUI=(()=>{
 const panel=document.querySelector('#achievements-panel'),list=document.querySelector('#achievement-list'),summary=document.querySelector('#achievement-summary'),toast=document.querySelector('#achievement-toast');
 const categories={all:'Все',combat:'Боевые',journey:'Прохождение',coins:'Монеты',secret:'Секретные'};
 const rarities={common:'Обычное',rare:'Редкое',epic:'Эпическое',legendary:'Легендарное',secret:'Секретное'};
 let category='all',returnPause=false,focusBefore=null,toastTime=0,current=null;
 // Small drawn badges, independent of emoji/font availability.
 function icon(kind){const paths={combat:'M10 30L30 10M10 10L30 30M7 25L15 33M25 7L33 15',journey:'M10 33V14L20 5L30 14V33ZM16 33V25H24V33M14 17H16M24 17H26',coins:'M20 6C3 6 3 34 20 34C37 34 37 6 20 6ZM20 12V28M16 16L20 12L24 16',secret:'M14 14C14 4 31 5 28 16L20 23V26M20 31V33'};return `<svg viewBox="0 0 40 40" aria-hidden="true"><path d="${paths[kind]||paths.secret}" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
 const number=n=>Math.floor(n).toLocaleString('ru-RU');
 function render(){
  if(panel.hidden)return;const state=achievementSystem.state,definitions=UpyrAchievements.definitions,active=definitions.filter(d=>d.active),count=active.filter(d=>state.unlocked[d.id]).length,percent=Math.round(count/active.length*100);
  summary.textContent=`Открыто ${count} / ${active.length} · ${percent}% · ${achievementSystem.points} очков достижений`;
  document.querySelector('#achievement-total').value=count;document.querySelector('#achievement-total').max=active.length;document.querySelector('#achievement-sync').textContent=achievementSystem.status;
  list.innerHTML=definitions.filter(d=>category==='all'||d.category===category).map(d=>{
   const date=state.unlocked[d.id],secret=d.category==='secret'&&!date,progress=Math.min(d.target,Math.max(0,state.stats[d.metric]||0));
   return `<article class="achievement-card ${date?'unlocked':'locked'} ${d.active?'':'inactive'}" data-rarity="${d.rarity}"><div class="achievement-icon">${icon(secret?'secret':d.icon)}</div><div><small>${rarities[d.rarity]} · ${d.reward} очков</small><h3>${secret?'Секретное достижение':d.name}</h3><p>${secret?'Тайна откроется во время игры.':d.description}</p>${!d.active?'<p class="achievement-unavailable">Ожидает будущих уровней · не входит в 100%</p>':secret?'':`<progress max="${d.target}" value="${progress}"></progress><span>${number(progress)} / ${number(d.target)}</span>`}${date?`<time datetime="${date}">Получено ${new Date(date).toLocaleDateString('ru-RU')}</time>`:''}</div></article>`;
  }).join('');
 }
 function open(){focusBefore=document.activeElement;returnPause=paused;paused=true;releaseKeys();panel.hidden=false;render();document.querySelector('#close-achievements').focus();achievementSystem.sync();}
 function close(){panel.hidden=true;paused=returnPause;releaseKeys();focusBefore?.focus?.();}
 document.querySelector('#achievements-open').onclick=open;document.querySelector('#close-achievements').onclick=close;
 const tabs=document.querySelector('#achievement-tabs');tabs.innerHTML=Object.entries(categories).map(([id,label])=>`<button data-category="${id}" aria-pressed="${id==='all'}">${label}</button>`).join('');
 tabs.addEventListener('click',e=>{if(!e.target.dataset.category)return;category=e.target.dataset.category;for(const b of tabs.children)b.setAttribute('aria-pressed',String(b.dataset.category===category));render();});
 panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}if(e.key==='Tab'){const buttons=[...panel.querySelectorAll('button')];const first=buttons[0],last=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
 achievementSystem.onChange=render;
 function tick(dt){
  if(current){toastTime-=dt;if(toastTime<=0){toast.hidden=true;current=null;}return;}
  if(!achievementSystem.toastQueue.length)return;current=achievementSystem.toastQueue.shift();const d=UpyrAchievements.definitions.find(x=>x.id===current);if(!d){current=null;return;}
  toast.innerHTML=`<div class="achievement-icon">${icon(d.icon)}</div><div><small>ДОСТИЖЕНИЕ ОТКРЫТО!</small><b>${d.name}</b><span>${d.description}</span><strong>+${d.reward} очков достижений</strong></div>`;toast.hidden=false;toastTime=4;gameAudio.effect('achievement');
 }
 return {tick,open,close,render};
})();
