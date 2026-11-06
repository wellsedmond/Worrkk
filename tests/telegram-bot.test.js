import test from 'node:test';
import assert from 'node:assert/strict';
import {handleUpdate,welcomeText,runBot} from '../telegram-bot.js';

test('private start and deep link send exact welcome with an HTTPS Mini App button',async()=>{
 for(const text of ['/start','/start campaign','/start@UpyrPlatformer_game']){
  const calls=[];await handleUpdate({message:{text,chat:{id:123,type:'private'}}},async(...args)=>calls.push(args),'https://game.example/');
  assert.equal(calls.length,1);const [method,body]=calls[0];assert.equal(method,'sendMessage');assert.equal(body.chat_id,123);assert.equal(body.text,welcomeText);assert.equal(body.parse_mode,'HTML');
  assert.deepEqual(body.reply_markup.inline_keyboard,[[{text:'Играть',web_app:{url:'https://game.example/'}}]]);
 }
});
test('ignores groups, other messages, non-message updates and lookalike commands',async()=>{
 for(const message of [undefined,{text:'/start',chat:{type:'group'}},{text:'/starting',chat:{type:'private'}},{text:'hello',chat:{type:'private'}}]){
  await handleUpdate({message},()=>assert.fail('Unexpected reply'),'https://game.example/');
 }
});
test('existing webhook remains unchanged',async()=>{
 const methods=[];
 await assert.rejects(runBot({token:'fake',request:async url=>{methods.push(url.split('/').at(-1));return {json:async()=>({ok:true,result:{url:'https://existing.example/webhook'}})};}}),/already has a webhook/);
 assert.deepEqual(methods,['getWebhookInfo']);
});
