import {opendir,readFile} from 'node:fs/promises';
import path from 'node:path';

// Read the existing server coin journal; clients never submit leaderboard totals.
export async function readLeaderboard(directory,currentUser){
 const players=[];let files;
 try{files=await opendir(directory);}catch(error){if(error.code==='ENOENT')return {players:[],self:null,total:0};throw error;}
 for await(const file of files){
  if(!file.isFile()||!/^\d+\.json$/.test(file.name))continue;
  const state=JSON.parse(await readFile(path.join(directory,file.name),'utf8'));
  const coins=state.stats?.coins||0;
  if(!Number.isSafeInteger(coins)||coins<0)continue;
  players.push({id:file.name.slice(0,-5),name:typeof state.player?.name==='string'?state.player.name.slice(0,80):'Игрок',coins});
 }
 players.sort((a,b)=>b.coins-a.coins||a.id.localeCompare(b.id,'en',{numeric:true}));
 let rank=0,lastCoins=null;
 const publicRows=players.map((p,index)=>{
  if(p.coins!==lastCoins){rank=index+1;lastCoins=p.coins;}
  return {rank,name:p.name,coins:p.coins,isSelf:p.id===currentUser};
 });
 return {players:publicRows.slice(0,50),self:publicRows.find(p=>p.isSelf)||null,total:players.length};
}
