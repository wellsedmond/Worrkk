import vm from 'node:vm';
import {readFileSync} from 'node:fs';
export function createGame(storage=new Map()){
 const noop=()=>{};const nodes=new Map();
 const node=()=>({textContent:'',hidden:false,disabled:false,dataset:{},classList:{remove:noop,toggle:noop},addEventListener:noop,setAttribute:noop,matches:()=>false,querySelector:()=>node(),getContext:()=>({})});
 const context={console,document:{querySelector:s=>{if(!nodes.has(s))nodes.set(s,node());return nodes.get(s);},querySelectorAll:()=>[],addEventListener:noop},window:{addEventListener:noop},Image:class{decode(){return Promise.resolve()}},devicePixelRatio:1,requestAnimationFrame:noop,localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},atmosphere:{ready:Promise.resolve(),reset:noop,prepare:noop,burst:noop,tick:noop},levelArt:{ready:Promise.resolve()},gameAudio:{activate:noop,effect:noop,tick:noop,syncButton:noop}};
 vm.createContext(context);
 for(const file of ['level1.js','progress.js','game.js'])vm.runInContext(readFileSync(new URL('../'+file,import.meta.url),'utf8'),context);
 vm.runInContext('assetsReady=true;start()',context);
 return {run:code=>vm.runInContext(code,context),storage};
}
