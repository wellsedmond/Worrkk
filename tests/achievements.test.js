import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createHmac} from 'node:crypto';
import {Readable} from 'node:stream';
import '../achievements-core.js';
import {verifyTelegram,createAchievementApi} from '../achievement-server.js';
import {createGame} from './harness.js';
const c=globalThis.UpyrAchievements;
function driver(state=c.empty(),stream='device-stream-123',run='run-identifier-123'){
 let seq=state.streams[stream]||0;
 const send=(type,data={})=>{const event={stream,run,seq:++seq,type,data};return {event,opened:c.apply(state,event,1700000000000)};};
 return {state,send};
}
function auth(token='test-token',id=123,when=Math.floor(Date.now()/1000)){
 const p=new URLSearchParams({auth_date:String(when),query_id:'test',user:JSON.stringify({id,first_name:'Test'})});
 const check=[...p].sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>k+'='+v).join('\n');
 const secret=createHmac('sha256','WebAppData').update(token).digest();p.set('hash',createHmac('sha256',secret).update(check).digest('hex'));return p.toString();
}
async function request(api,body,headers={}){const req=Readable.from([JSON.stringify(body)]);req.method='POST';req.headers={'content-type':'application/json',host:'localhost',...headers};let status,answer;const res={writeHead:s=>status=s,end:s=>answer=JSON.parse(s)};await api(req,res);return {status,answer};}
test('25 configured achievements, 23 attainable, separate rewards and six exact coin tiers',()=>{
 assert.equal(c.definitions.length,25);assert.equal(c.definitions.filter(d=>d.active).length,23);
 assert.deepEqual(c.definitions.filter(d=>d.category==='coins').map(d=>d.reward),[10,25,50,75,100,150]);
 assert.equal(new Set(c.definitions.map(d=>d.id)).size,25);
});
test('coin journal counts lifetime awards, duplicate operations and retries exactly once across reload',()=>{
 const d=driver();d.send('run_started',{level:'level1'});const event=d.send('coin_collected',{id:'coin-a',amount:100}).event;
 c.apply(d.state,event);d.send('coin_collected',{id:'coin-a',amount:100});assert.equal(d.state.stats.coins,100);assert.equal(c.points(d.state),10);
 const restarted=driver(c.normalize(JSON.parse(JSON.stringify(d.state))),'device-stream-456','run-identifier-456');restarted.send('run_started',{level:'level1'});restarted.send('coin_collected',{id:'coin-a',amount:100});assert.equal(restarted.state.stats.coins,200);
});
test('coin thresholds can unlock simultaneously and points rebuild from IDs, never balance',()=>{
 const d=driver();d.send('run_started',{level:'level1'});for(let i=0;i<9;i++)d.send('coin_collected',{id:''+i,amount:100});const {opened}=d.send('coin_collected',{id:'9',amount:100});assert.ok(opened.includes('coins1000'));assert.equal(c.points(d.state),85);
 const e=driver();e.send('run_started',{level:'level1'});e.state.stats.coins=49950;const unlocked=e.send('coin_collected',{id:'award',amount:100}).opened;assert.equal(unlocked.length,6);assert.equal(c.points(e.state),410);
});
test('combat thresholds, garlic and damage streak are driven by unique victims',()=>{
 const d=driver();d.send('run_started',{level:'level1'});for(let i=0;i<9;i++)d.send('enemy_killed',{id:''+i});d.send('player_damaged');d.send('enemy_killed',{id:'9'});assert.equal(d.state.unlocked.streak10,undefined);
 for(let i=10;i<510;i++){d.send('enemy_killed',{id:''+i});d.send('garlic_destroyed',{id:''+i});}assert.ok(d.state.unlocked.streak10);assert.ok(d.state.unlocked.kills500);assert.ok(d.state.unlocked.garlic100);assert.equal(d.state.unlocked.run50,undefined);
 for(let i=510;i<1010;i++)d.send('garlic_destroyed',{id:''+i});assert.ok(d.state.unlocked.garlic1000);
});
test('obstacle milestones deduplicate, distance counts only new forward frontier, safe idle is consecutive',()=>{
 const d=driver();d.send('run_started',{level:'level1',x:70});for(let i=0;i<100;i++){d.send('stake_dodged',{id:''+i});d.send('bonfire_jumped',{id:''+i});}d.send('bonfire_jumped',{id:'0'});assert.equal(d.state.stats.fires,100);assert.ok(d.state.unlocked.fire25);assert.ok(d.state.unlocked.fire50);assert.ok(d.state.unlocked.stakes100);
 d.send('player_moved',{x:10070,safeSeconds:59});d.send('player_moved',{x:0,safeSeconds:0});d.send('player_moved',{x:10070,safeSeconds:30});assert.equal(d.state.stats.distance,10000);assert.equal(d.state.unlocked.sleep,undefined);d.send('player_moved',{x:10070,safeSeconds:60});assert.ok(d.state.unlocked.sleep);
});
test('100 deaths, per-level and early thresholds survive runs; completion checks damage, attacks and deaths',()=>{
 const d=driver();d.send('run_started',{level:'level1'});for(let i=0;i<100;i++)d.send('player_died',{id:''+i,elapsed:i<5?4.99:5});assert.ok(d.state.unlocked.deaths100);assert.ok(d.state.unlocked.deaths10);assert.ok(d.state.unlocked.early5);d.send('level_completed');assert.equal(d.state.unlocked.unhurt,undefined);assert.equal(d.state.unlocked.legend,undefined);
 const next=driver(d.state,'device-stream-456','run-identifier-456');next.send('run_started',{level:'level1'});next.send('boss_defeated',{id:'hunter'});next.send('level_completed');assert.ok(next.state.unlocked.unhurt);assert.ok(next.state.unlocked.legend);assert.ok(next.state.unlocked.bosses);next.send('level_completed');assert.equal(next.state.stats.wins,2);
 for(let i=0;i<8;i++){const a=driver(d.state,'device-stream-n'+i,'run-identifier-n'+i);a.send('run_started',{level:'level1'});a.send('level_completed');}assert.ok(d.state.unlocked.wins10);assert.equal(d.state.unlocked.noattack,undefined);
});
test('game integration keeps lifetime kill/coin stats through checkpoint rollback and death',()=>{
 const g=createGame();g.run("defeatEnemy(enemies[0]);captureCheckpoint();defeatEnemy(enemies[1]);finish(false);resumeCheckpoint();defeatEnemy(enemies[1])");assert.equal(g.run('achievementSystem.state.stats.kills'),2);assert.equal(g.run('achievementSystem.state.stats.deaths'),1);assert.equal(g.run('achievementSystem.state.stats.coins'),2);
 g.run('start();defeatEnemy(enemies[0])');assert.equal(g.run('achievementSystem.state.stats.kills'),3);
 const again=createGame(g.storage);assert.equal(again.run('achievementSystem.state.stats.kills'),3);
});
test('armed attacks select all sixteen sword frames, unarmed retains original punch',()=>{
 const g=createGame();g.run('sword=5;punch()');assert.equal(g.run('heroAnimator.pose().clip'),'sword');
 const frames=[];for(let i=0;i<16;i++){frames.push(g.run('heroAnimator.pose().frame'));g.run('heroAnimator.update(.36/16,false)');}assert.deepEqual(frames,Array.from({length:16},(_,i)=>i));
 g.run('heroAnimator.update(.1,false);sword=0;player.cooldown=0;punch()');assert.equal(g.run('heroAnimator.pose().clip'),'attack');
});
test('Telegram HMAC rejects tampered, stale, future, duplicate params and wrong token',()=>{
 assert.equal(verifyTelegram(auth(),'test-token'),'123');for(const data of [auth()+'&user=bad',auth().replace('Test','Evil'),auth('test-token',123,1),auth('test-token',123,Math.floor(Date.now()/1000)+1000)])assert.throws(()=>verifyTelegram(data,'test-token'));
 assert.throws(()=>verifyTelegram(auth(),'wrong-token'));
});
test('server atomically persists, retries without double awards, isolates users and rejects sequence gaps',async()=>{
 const directory=await mkdtemp(path.join(tmpdir(),'upyr-achievements-'));try{
  let api=createAchievementApi({token:'test-token',directory});const d=driver();const events=[d.send('run_started',{level:'level1'}).event,d.send('coin_collected',{id:'a',amount:100}).event];
  const body={initData:auth(),events};let response=await request(api,body);assert.equal(response.status,200);assert.equal(response.answer.state.stats.coins,100);
  api=createAchievementApi({token:'test-token',directory});response=await request(api,body);assert.equal(response.answer.state.stats.coins,100);
  const other=await request(api,{initData:auth('test-token',456),events:[]});assert.equal(other.answer.state.stats.coins,undefined);
  const gap={...events[1],seq:4};assert.equal((await request(api,{initData:auth(),events:[gap]})).status,409);assert.equal(JSON.parse(await readFile(path.join(directory,'123.json'),'utf8')).stats.coins,100);
  assert.equal((await request(api,body,{origin:'https://evil.example'})).status,403);assert.equal((await request(api,{initData:'bad',events:[]})).status,401);
 }finally{await rm(directory,{recursive:true,force:true});}
});

test('real crouched stake crossings count only successful dodges; hits and deflections do not count',()=>{
 const g=createGame();g.run("enemies=[];traps=[];player.x=500;player.y=386;player.h=44;player.ground=true;spawnProjectile('stake',550,357,-1);for(let i=0;i<70;i++)updateTraps(1/120)");assert.equal(g.run('achievementSystem.state.stats.stakes'),1);
 g.run("player.attack=.36;spawnProjectile('stake',550,397,-1);for(let i=0;i<70;i++)updateTraps(1/120)");assert.equal(g.run('achievementSystem.state.stats.stakes'),1);
 g.run("player.attack=0;player.h=80;player.y=350;player.inv=0;spawnProjectile('stake',550,357,-1);for(let i=0;i<70;i++)updateTraps(1/120)");assert.equal(g.run('achievementSystem.state.stats.stakes'),1);
});
test('bonfire progress requires a real jump, clearance and a safe landing beyond the fire',()=>{
 const g=createGame();g.run("enemies=[];traps=[{id:'qa-fire',type:'fire',x:250,y:400,w:50,h:30,active:true}];player.x=190;player.y=350;player.ground=true;keys.right=true;keys.jump=true;for(let i=0;i<110;i++){update(1/120);keys.jump=false;}");assert.equal(g.run('achievementSystem.state.stats.fires'),1);
 g.run("start();enemies=[];traps=[{id:'qa-fire',type:'fire',x:250,y:400,w:50,h:30,active:true}];player.x=260;player.y=200;player.ground=false;player.vy=0;for(let i=0;i<40;i++)update(1/120)");assert.equal(g.run('achievementSystem.state.stats.fires'),1);
});

test('old genuine no-damage badge migrates locally; best score never becomes lifetime coins',()=>{
 const storage=new Map([['upyr-run.progress.v1',JSON.stringify({version:2,completed:true,achievements:['НЕПРОКУСИМЫЙ'],maxScore:9000})]]);
 const g=createGame(storage);assert.ok(g.run('achievementSystem.state.unlocked.unhurt'));assert.equal(g.run('achievementSystem.state.stats.coins'),undefined);assert.equal(g.run('achievementSystem.points'),50);
});
