import fs from 'node:fs';
import path from 'node:path';

const contentTypeMap = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'application/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8'],
]);

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) {
    return {};
  }
  return JSON.parse(raw);
}

export function sendJson(res, status, payload) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload, null, 2));
}

export function sendHtml(res, html, status = 200) {
  res.writeHead(status, { 'content-type': 'text/html; charset=utf-8' });
  res.end(html);
}

export function methodNotAllowed(res) {
  sendJson(res, 405, { ok: false, error: 'Method Not Allowed' });
}

export function notFound(res) {
  sendJson(res, 404, { ok: false, error: 'Not Found' });
}

export function serveStaticFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    notFound(res);
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = contentTypeMap.get(ext) || 'application/octet-stream';
  res.writeHead(200, { 'content-type': contentType });
  fs.createReadStream(filePath).pipe(res);
}
