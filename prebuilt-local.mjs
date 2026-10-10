import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { Readable } from 'node:stream';
import app from './.vercel/output/functions/__server.func/index.mjs';

const root = new URL('./.vercel/output/static/', import.meta.url);
const mime = {'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.ico':'image/x-icon','.json':'application/json; charset=utf-8','.html':'text/html; charset=utf-8'};

function toRequest(req) {
  const url = `http://${req.headers.host || '127.0.0.1:8080'}${req.url}`;
  const init = { method: req.method, headers: req.headers };
  if (!['GET','HEAD'].includes(req.method)) {
    init.body = Readable.toWeb(req);
    init.duplex = 'half';
  }
  return new Request(url, init);
}

async function tryStatic(pathname, res) {
  let rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!rel) return false;
  rel = normalize(rel).replace(/^\.\.(?:[\\/]|$)/, '');
  const file = join(root.pathname, rel);
  try {
    const s = await stat(file);
    if (!s.isFile()) return false;
    const buf = await readFile(file);
    res.statusCode = 200;
    res.setHeader('content-type', mime[extname(file).toLowerCase()] || 'application/octet-stream');
    if (pathname.startsWith('/assets/')) res.setHeader('cache-control', 'public, max-age=31536000, immutable');
    res.end(buf);
    return true;
  } catch { return false; }
}

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, `http://${req.headers.host || '127.0.0.1:8080'}`);
    if (await tryStatic(u.pathname, res)) return;
    const response = await app.fetch(toRequest(req), { waitUntil(){} });
    res.statusCode = response.status;
    response.headers.forEach((v,k)=>res.setHeader(k,v));
    if (!response.body) return res.end();
    Readable.fromWeb(response.body).pipe(res);
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end(String(err?.stack || err));
  }
});

server.listen(8181, '127.0.0.1', () => console.log('Second Thought prebuilt: http://127.0.0.1:8181/'));
