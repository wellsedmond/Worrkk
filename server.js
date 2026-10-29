import http from 'node:http';
import { readFile } from 'node:fs/promises';
const files = {
  '/': ['index.html', 'text/html'],
  '/game.js': ['game.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css'],
  '/assets/hero.png': ['assets/hero.png', 'image/png'],
  '/assets/garlic.svg': ['assets/garlic.svg', 'image/svg+xml'],
};
http.createServer(async (req, res) => {
  const file = files[new URL(req.url, 'http://localhost').pathname];
  if (!file) { res.writeHead(404); return res.end('Not found'); }
  try {
    const data = await readFile(new URL(file[0], import.meta.url));
    res.writeHead(200, { 'Content-Type': file[1] + (file[1].startsWith('text/') ? '; charset=utf-8' : '') });
    res.end(data);
  } catch { res.writeHead(500); res.end('Server error'); }
}).listen(Number(process.env.PORT) || 3000, '0.0.0.0');
