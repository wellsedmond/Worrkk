// Keep the offline Windows file in sync with the actual Mini App sources.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
let html=await read('index.html');
html=html.replace('<link rel="stylesheet" href="/style.css">',`<style>${await read('style.css')}</style>`);
// Offline edition does not fetch Telegram SDK. Hosted Mini App keeps its SDK.
html=html.replace(/\s*<script src="https:\/\/telegram.org\/js\/telegram-web-app.js" defer><\/script>/,'');
for(const file of ['atmosphere.js','game.js']){
 let js=await read(file);
 if(file==='atmosphere.js'){
  const names=['ska-palace','skyline','graveyard','web'];
  const urls={};for(const name of names)urls[name]='data:image/svg+xml;base64,'+(await readFile(new URL(`assets/environment/${name}.svg`,root))).toString('base64');
  js=js.replace('`assets/environment/${name}.svg`',`(${JSON.stringify(urls)})[name]`);
 }else{
  for(const [name,mime] of [['hero.png','image/png'],['garlic.svg','image/svg+xml']]){
   const url='data:'+mime+';base64,'+(await readFile(new URL('assets/'+name,root))).toString('base64');
   js=js.replace(`'assets/${name}'`,JSON.stringify(url));
  }
 }
 html=html.replace(`<script src="/${file}" defer></script>`,'');
 html=html.replace('</body>',`<script>${js.replace(/<\/script/gi,'<\\/script')}</script>\n</body>`);
}
html=html.split('\n').map(line=>line.trimEnd()).join('\n');
await writeFile(new URL('Worrkk.html',root),html,'utf8');
console.log('Built Worrkk.html: self-contained UTF-8 edition of UPYR RUN');
