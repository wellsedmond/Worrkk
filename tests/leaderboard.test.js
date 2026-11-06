import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {Readable} from 'node:stream';
import {createHmac} from 'node:crypto';
import {createAchievementApi} from '../achievement-server.js';
import {readLeaderboard} from '../leaderboard-server.js';
function auth(id,name='Игрок'){
 const p=new URLSearchParams({auth_date:String(Math.floor(Date.now()/1000)),user:JSON.stringify({id,first_name:name})});
 const check=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 p.set('hash',createHmac('sha256',createHmac('sha256','WebAppData').update('test-token').digest()).update(check).digest('hex'));return p.toString();
}
async function request(api,url,body){
 const req=Readable.from([JSON.stringify(body)]);req.url=url;req.method='POST';req.headers={'content-type':'application/json',host:'localhost'};
 let status,answer;await api(req,{writeHead:s=>{status=s;},end:data=>{answer=JSON.parse(data);}});return {status,answer};
}
test('rank is based on persisted lifetime coins, respects ties, includes own place outside top 100 and hides account IDs',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'upyr-ranks-'));
 try{
  for(let i=1;i<=105;i++)await writeFile(path.join(directory,i+'.json'),JSON.stringify({stats:{coins:i<3?1000:1000-i},player:{name:'Player '+i}}));
  await writeFile(path.join(directory,'not-a-player.json'),JSON.stringify({stats:{coins:999999}}));
  const board=await readLeaderboard(directory,'105');
  assert.equal(board.total,105);assert.equal(board.players.length,100);assert.deepEqual(board.players.slice(0,3).map(p=>p.rank),[1,1,3]);
  assert.equal(board.self.rank,105);assert.equal(board.self.coins,895);assert.equal(board.self.isSelf,true);assert.equal(board.players.some(p=>p.isSelf),false);
  assert.ok(board.players.every(p=>Object.keys(p).sort().join(',')==='coins,isSelf,name,rank'));
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('authenticated journal updates ranking once, preserves it across restart, and ignores submitted totals and names',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'upyr-ranks-api-'));
 try{
  let api=createAchievementApi({token:'test-token',directory});
  const events=[{type:'run_started',stream:'rank-stream-123',run:'rank-run-12345',seq:1,data:{level:'level1'}},{type:'coin_collected',stream:'rank-stream-123',run:'rank-run-12345',seq:2,data:{id:'coin-a',amount:50}}];
  assert.equal((await request(api,'/api/achievements',{initData:auth(123,'Роман'),events})).status,200);
  await request(api,'/api/achievements',{initData:auth(123,'Роман'),events});
  let response=await request(api,'/api/leaderboard',{initData:auth(123),coins:999999,name:'Fake'});
  assert.equal(response.status,200);assert.equal(response.answer.self.coins,50);assert.equal(response.answer.self.name,'Роман');
  api=createAchievementApi({token:'test-token',directory});
  assert.equal((await request(api,'/api/leaderboard',{initData:auth(123)})).answer.self.coins,50);
  assert.equal((await request(api,'/api/leaderboard',{initData:'bad'})).status,401);
  assert.equal((await request(api,'/api/leaderboard',{initData:auth(123).replace('123','456')})).status,401);
  assert.equal(JSON.parse(await readFile(path.join(directory,'123.json'),'utf8')).stats.coins,50);
 }finally{await rm(directory,{recursive:true,force:true});}
});
test('empty and legacy profiles are supported without inventing a score',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'upyr-ranks-old-'));
 try{
  assert.deepEqual(await readLeaderboard(directory,'1'),{players:[],self:null,total:0});
  await writeFile(path.join(directory,'1.json'),JSON.stringify({version:1,stats:{coins:45}}));
  const board=await readLeaderboard(directory,'1');assert.equal(board.self.name,'Игрок');assert.equal(board.self.coins,45);
 }finally{await rm(directory,{recursive:true,force:true});}
});
