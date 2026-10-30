import {createHmac,timingSafeEqual} from 'node:crypto';
import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import path from 'node:path';
import './achievements-core.js';
const core=globalThis.UpyrAchievements;
export function verifyTelegram(initData,token,now=Date.now()){
 if(!token||typeof initData!=='string'||initData.length>16000)throw Error('Unauthorized');
 const p=new URLSearchParams(initData);if([...p.keys()].some((k,i,a)=>a.indexOf(k)!==i))throw Error('Unauthorized');
 const hash=p.get('hash')||'';p.delete('hash');const auth=Number(p.get('auth_date'));if(!Number.isFinite(auth)||auth>now/1000+30||now/1000-auth>86400)throw Error('Unauthorized');
 const check=[...p].sort(([a],[b])=>a<b?-1:a>b?1:0).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();const expected=createHmac('sha256',secret).update(check).digest();
 if(!/^[a-f0-9]{64}$/i.test(hash)||!timingSafeEqual(Buffer.from(hash,'hex'),expected))throw Error('Unauthorized');
 const user=JSON.parse(p.get('user'));if(!Number.isSafeInteger(user?.id)||user.id<=0)throw Error('Unauthorized');return String(user.id);
}
export function createAchievementApi({token=process.env.TELEGRAM_BOT_TOKEN,directory=process.env.UPYR_DATA_DIR||path.resolve('data/achievements')}={}){
 let lock=Promise.resolve();
 return async(req,res)=>{
  const reply=(status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(body));};
  if(req.method!=='POST')return reply(405,{error:'POST required'});
  if(!token)return reply(503,{error:'Server storage needs TELEGRAM_BOT_TOKEN and persistent UPYR_DATA_DIR'});
  if(!req.headers['content-type']?.startsWith('application/json'))return reply(415,{error:'JSON required'});
  // No CORS access; authenticated initData is never accepted as a user-id substitute.
  if(req.headers.origin){try{if(new URL(req.headers.origin).host!==req.headers.host)return reply(403,{error:'Origin rejected'});}catch{return reply(403,{error:'Origin rejected'});}}
  let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>128000)return reply(413,{error:'Too large'});}}catch{return reply(400,{error:'Invalid body'});}
  let input,user;try{input=JSON.parse(raw);user=verifyTelegram(input.initData,token);}catch{return reply(401,{error:'Invalid or expired Telegram initData'});}
  if(!Array.isArray(input.events)||input.events.length>100||input.events.some(e=>!e||!core.types.includes(e.type)||!/^[-a-zA-Z0-9]{12,100}$/.test(e.stream)||!/^[-a-zA-Z0-9]{12,120}$/.test(e.run)||!Number.isSafeInteger(e.seq)||e.seq<1||JSON.stringify(e.data||{}).length>2000))return reply(400,{error:'Invalid events'});
  const task=lock.then(async()=>{
   await mkdir(directory,{recursive:true,mode:0o700});const file=path.join(directory,user+'.json');let state;
   try{state=core.normalize(JSON.parse(await readFile(file,'utf8')));}catch(error){if(error.code!=='ENOENT')throw error;state=core.empty();}
   for(const event of input.events)core.apply(state,event);
   const encoded=JSON.stringify(state);if(encoded.length>16000000)throw Error('Profile storage limit');
   await writeFile(file+'.tmp',encoded,{mode:0o600});await rename(file+'.tmp',file);return state;
  });lock=task.catch(()=>{});
  try{reply(200,{state:await task});}catch(error){reply(error.message==='Event sequence gap'?409:500,{error:error.message==='Event sequence gap'?'Resend missing events':'Storage unavailable'});}
 };
}
