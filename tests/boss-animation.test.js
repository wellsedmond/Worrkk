import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createGame} from './harness.js';
const meta=JSON.parse(readFileSync(new URL('../assets/inquisitor/animations.frames.json',import.meta.url),'utf8'));
const sockets=JSON.parse(readFileSync(new URL('../assets/inquisitor/projectile-sockets.json',import.meta.url),'utf8'));
test('all projectile sockets lie on the isolated release sprite, not transparent margins',()=>{
 for(const a of Object.values(sockets)){const f=meta[a.clip].frames[a.frame];assert.ok(f.clip.some(([x,y,w])=>a.sourceX>=f.x+x&&a.sourceX<f.x+x+w&&a.sourceY===f.y+y));}
});
test('crossbow release and recoil frames follow every shot event',()=>{
 const {run}=createGame();for(const at of [.85,1.95,3.05]){assert.equal(run(`Inquisitor.shootingFrame(${at},[.85,1.95,3.05])`),3);assert.equal(run(`Inquisitor.shootingFrame(${at+.15},[.85,1.95,3.05])`),4);}
 assert.equal(run('Inquisitor.shootingFrame(.84,[.85,1.95,3.05])'),2);
});
test('throwing hand becomes empty on release, including the grenade inside the frenzy combo',()=>{
 const {run}=createGame();assert.equal(run('Inquisitor.throwingFrame(.65,.65,1.25,7)'),3);assert.equal(run('Inquisitor.throwingFrame(.7,.7,1.35,8)'),3);assert.equal(run('Inquisitor.throwingFrame(3.55,3.55,4.7,8,3.4)'),3);assert.equal(run('Inquisitor.throwingFrame(.64,.65,1.25,7)'),2);
});
test('projectiles start at their mirrored weapon or hand socket in both directions',()=>{
 for(const dir of [-1,1])for(const [attack,time,slot]of [['volley',.85,'high'],['volley',.85,'low'],['garlic',.65,'garlic'],['grenade',.7,'grenade'],['charge',4,'energy']]){
  const {run}=createGame();run(`boss.engaged=true;boss.x=58000;player.x=boss.x+${dir*250};boss.actionIndex=${slot==='low'?0:1};Inquisitor.beginAttack(boss,'${attack}',player);Inquisitor.step(boss,${time},{player,inputs:{},hit(){}})`);
  const p=run('boss.projectiles.at(-1)'),b=run('boss'),a=sockets[slot],f=meta[a.clip].frames[a.frame],scale=meta[a.clip].scale;
  const x=b.x+b.w/2+dir*(a.sourceX-f.pivotX)*scale,y=b.y+b.h+(a.sourceY-f.pivotY)*scale;
  assert.ok(Math.abs(p.y+p.h/2-y)<1e-6,slot);
  const rear=p.kind==='bolt'?p.x+(dir<0?.94:.06)*p.w:p.kind==='energy'?p.x+(dir<0?p.w:0):p.x+p.w/2;
  assert.ok(Math.abs(rear-x)<1e-6,slot);
 }
});
test('victory clears the last attack pose and hit transparency before the approach scene',()=>{
 const {run}=createGame();run('startBossPractice();player.attack=.3;player.inv=1;player.cooldown=.4;heroAnimator.strike(true);boss.hp=0;Inquisitor.enter(boss,"VICTORY");completeBossBattle()');
 assert.equal(run('state'),'cutscene');assert.equal(run('player.attack'),0);assert.equal(run('player.inv'),0);assert.equal(run('player.cooldown'),0);assert.notEqual(run('heroAnimator.pose().phase'),'attack');
});
