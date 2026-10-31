import http from 'node:http';
import {createAchievementApi} from './achievement-server.js';
const achievementApi=createAchievementApi();
import { readFile } from 'node:fs/promises';
const files = {
  '/': ['index.html', 'text/html'],
  '/atmosphere.js': ['atmosphere.js', 'text/javascript'],
  '/Worrkk.html': ['Worrkk.html', 'text/html'],
  '/assets/hero-sword-movement.png': ['assets/hero-sword-movement.png', 'image/png'],
  '/hero-animation.js': ['hero-animation.js', 'text/javascript'],
  '/assets/hero-sword.png': ['assets/hero-sword.png', 'image/png'],
  '/assets/hero-attack.png': ['assets/hero-attack.png', 'image/png'],
  '/assets/hero-run.png': ['assets/hero-run.png', 'image/png'],
  '/assets/hero-jump.png': ['assets/hero-jump.png', 'image/png'],
  '/assets/hero-crouch.png': ['assets/hero-crouch.png', 'image/png'],
  '/game.js': ['game.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css'],
  '/assets/hero.png': ['assets/hero.png', 'image/png'],
  '/assets/garlic.svg': ['assets/garlic.svg', 'image/svg+xml'],
};
for (const name of ['ska-palace', 'skyline', 'graveyard', 'web']) {
  files['/assets/environment/' + name + '.svg'] = ['assets/environment/' + name + '.svg', 'image/svg+xml'];
}
for (const name of ['level1','progress','sound','level-art','parallax','achievements-core','achievements','achievements-ui'])files['/'+name+'.js']=[name+'.js','text/javascript'];
for(const name of ['helmet','hunter','coffin','stake','sword','gate','werewolf','tower'])files['/assets/level1/'+name+'.svg']=['assets/level1/'+name+'.svg','image/svg+xml'];
http.createServer(async (req, res) => {
  if(new URL(req.url,'http://localhost').pathname==='/api/achievements')return achievementApi(req,res);
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  try {
    const data = await readFile(new URL(file[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': file[1] + (file[1].startsWith('text/') ? '; charset=utf-8' : '') });
    res.end(data);
  } catch { res.writeHead(500); res.end('Server error'); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');
