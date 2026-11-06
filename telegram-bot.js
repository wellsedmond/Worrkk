import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {setTimeout as delay} from 'node:timers/promises';

export const welcomeText=`🧛‍♂️ <b>UPYR RUN — ДОБРО ПОЖАЛОВАТЬ В НОВЫЙ КОШМАР!</b> 🩸

Тьма сгущается. Часы отсчитывают последние секунды. И наш упырь снова выходит на охоту! 🌙

🔥 <b>UPYR RUN возвращается в совершенно новом формате!</b>

Теперь это полноценный <b>2D-платформер</b>, где каждый уровень — новое испытание, а за каждым поворотом поджидает опасность!

⚔️ <b>Что тебя ждёт?</b>

🦇 Мрачные локации, полные ловушек и секретов.

🧄 Опасные противники — от назойливого чеснока до беспощадных охотников на вампиров.

🩸 Новые способности, сражения и улучшения персонажа.

🏆 Достижения, испытания и награды для самых упорных.

💀 Эпические битвы с боссами, где одной скорости уже недостаточно!

<b>Беги. Прыгай. Сражайся. Выживай.</b>

Здесь больше нельзя просто убежать от опасности. Теперь придётся посмотреть ей прямо в глаза!

🦇 <b>UPYR RUN — ТВОЯ КРОВЬ. ТВОИ ПРАВИЛА. ТВОЯ ИГРА.</b>

<i>Добро пожаловать на тёмную сторону платформеров!</i> 🩸`;

export async function handleUpdate(update,api,gameUrl){
 const message=update.message;
 if(message?.chat?.type!=='private'||!/^\/start(?:@[a-zA-Z0-9_]+)?(?:\s|$)/.test(message.text||''))return;
 await api('sendMessage',{
  chat_id:message.chat.id,text:welcomeText,parse_mode:'HTML',
  reply_markup:{inline_keyboard:[[{text:'Играть',web_app:{url:gameUrl}}]]}
 });
}

export async function runBot({token=process.env.TELEGRAM_BOT_TOKEN,gameUrl=process.env.TELEGRAM_GAME_URL||'https://game.46-17-97-222.sslip.io/',directory=process.env.UPYR_BOT_DATA_DIR||'/data/bot',request=fetch}={}){
 if(!token)throw Error('TELEGRAM_BOT_TOKEN is required');
 if(new URL(gameUrl).protocol!=='https:')throw Error('TELEGRAM_GAME_URL must use HTTPS');
 const api=async(method,body={})=>{
  const response=await request(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:AbortSignal.timeout(40000)});
  const result=await response.json();
  if(!result.ok){const error=Error('Telegram API request failed');error.code=result.error_code;error.retryAfter=result.parameters?.retry_after;throw error;}
  return result.result;
 };
 // Preserve any existing webhook instead of taking over another bot worker.
 const webhook=await api('getWebhookInfo');
 if(webhook.url)throw Error('Bot already has a webhook; polling was not started');
 await mkdir(directory,{recursive:true,mode:0o700});
 const file=path.join(directory,'offset.json');let offset=0;
 try{offset=JSON.parse(await readFile(file,'utf8'));if(!Number.isSafeInteger(offset)||offset<0)throw Error('Invalid bot offset');}catch(error){if(error.code!=='ENOENT')throw error;}
 console.log('Telegram welcome bot started');
 let failures=0;
 for(;;){
  try{
   const updates=await api('getUpdates',{offset,timeout:25,allowed_updates:['message']});
   for(const update of updates){
    try{await handleUpdate(update,api,gameUrl);}catch(error){if(error.code!==403)throw error;}
    offset=update.update_id+1;
    await writeFile(file+'.tmp',JSON.stringify(offset),{mode:0o600});await rename(file+'.tmp',file);
   }
   failures=0;
  }catch(error){
   if(error.code===401||error.code===409)throw Error(error.code===401?'Bot token rejected':'Another bot worker is already polling; stopped');
   console.error('Telegram request failed; retrying');
   await delay(Math.max(error.retryAfter||0,Math.min(60,2**Math.min(++failures,6)))*1000);
  }
 }
}

if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
 runBot().catch(error=>{console.error(error.code===undefined&&['TELEGRAM_BOT_TOKEN is required','TELEGRAM_GAME_URL must use HTTPS','Bot already has a webhook; polling was not started','Bot token rejected','Another bot worker is already polling; stopped'].includes(error.message)?error.message:'Telegram bot could not start; check token, network and storage');process.exitCode=1;});
}
