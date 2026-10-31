// Keep the offline Windows file in sync with the actual Mini App sources.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
let html=await read('index.html');
html=html.replace('<link rel="stylesheet" href="/style.css">',`<style>${await read('style.css')}</style>`);
// Embed CSS backdrop and decorative menu portrait as well as runtime images.
const gothicUrl='data:image/png;base64,'+(await readFile(new URL('assets/environment/gothic-arena.png',root))).toString('base64');
html=html.replaceAll('assets/environment/gothic-arena.png',gothicUrl);
html=html.replace('src="assets/hero.png"','src="data:image/png;base64,'+(await readFile(new URL('assets/hero.png',root))).toString('base64')+'"');
// Offline edition does not fetch Telegram SDK. Hosted Mini App keeps its SDK.
html=html.replace(/\s*<script src="https:\/\/telegram.org\/js\/telegram-web-app.js" defer><\/script>/,'');
for(const file of ['level1.js','inquisitor.js','progress.js','sound.js','parallax.js','atmosphere.js','level-art.js','inquisitor-art.js','hero-animation.js','achievements-core.js','achievements.js','game.js','achievements-ui.js']){
 let js=await read(file);
 if(file==='inquisitor-art.js'){
  const urls={};for(const name of ['body-a','body-b','body-c','body-d','body-e','effects','arena'])urls[name]='data:image/png;base64,'+(await readFile(new URL('assets/inquisitor/'+name+'.png',root))).toString('base64');
  js=js.replace('`assets/inquisitor/${name}.png`',`(${JSON.stringify(urls)})[name]`);
 }else if(file==='atmosphere.js'){
  js=js.replace("'assets/environment/lighting-atlas.png'",JSON.stringify('data:image/png;base64,'+(await readFile(new URL('assets/environment/lighting-atlas.png',root))).toString('base64')));
  js=js.replace("'assets/environment/gothic-arena.png'",JSON.stringify(gothicUrl));
  const names=['ska-palace','skyline','graveyard','web'];
  const urls={};for(const name of names)urls[name]='data:image/svg+xml;base64,'+(await readFile(new URL(`assets/environment/${name}.svg`,root))).toString('base64');
  js=js.replace('`assets/environment/${name}.svg`',`(${JSON.stringify(urls)})[name]`);
 }else if(file==='level-art.js'){
  js=js.replace("'assets/level1/blood-drop-atlas.png'",JSON.stringify('data:image/png;base64,'+(await readFile(new URL('assets/level1/blood-drop-atlas.png',root))).toString('base64')));
  js=js.replace("'assets/level1/helmet-garlic-atlas.png'",JSON.stringify('data:image/png;base64,'+(await readFile(new URL('assets/level1/helmet-garlic-atlas.png',root))).toString('base64')));
  js=js.replace("'assets/level1/props-atlas.png'",JSON.stringify('data:image/png;base64,'+(await readFile(new URL('assets/level1/props-atlas.png',root))).toString('base64')));
  js=js.replace("'assets/level1/crossbow-atlas.png'",JSON.stringify('data:image/png;base64,'+(await readFile(new URL('assets/level1/crossbow-atlas.png',root))).toString('base64')));
  const names=['helmet','hunter','coffin','stake','sword','gate','werewolf','tower'];const urls={};
  for(const name of names)urls[name]='data:image/svg+xml;base64,'+(await readFile(new URL(`assets/level1/${name}.svg`,root))).toString('base64');
  js=js.replace('`assets/level1/${name}.svg`',`(${JSON.stringify(urls)})[name]`);
 }else if(file==='hero-animation.js'){
  for(const name of ['hero-crouch','hero-run','hero-jump','hero-attack','hero-sword','hero-sword-movement','hero-rage','hero-punch']){
   const url='data:image/png;base64,'+(await readFile(new URL('assets/'+name+'.png',root))).toString('base64');
   js=js.replace("'assets/"+name+".png'",JSON.stringify(url));
  }
 }else if(file==='game.js'){
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
