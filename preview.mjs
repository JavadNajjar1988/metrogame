import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
};

const now = new Date();
const previewData = {
  'data.json': { consoles: [] },
  'Calender.json': [{ start: now, end: now }],
  'customer_data.json': {},
  'game_temporary.json': {},
  'buffet_temporary.json': {},
};

const emptyLists = new Set([
  'products.json', 'reservations.json', 'clickTime.json', 'finishTime.json',
  'cashPay.json', 'creditpay.json', 'customerPay.json', 'debtpay.json',
]);

const notice = '<aside dir="rtl" role="status" style="position:sticky;top:0;z-index:9999;padding:8px 16px;background:#fff3cd;color:#302600">پیش‌نمایش متروگیم با دادهٔ نمونه. ثبت رزرو، تغییر اطلاعات و پرداخت غیرفعال است.</aside>';

createServer(async (request, response) => {
  let path;
  try {
    path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end();
    return;
  }

  if (!['GET', 'HEAD'].includes(request.method) || path.endsWith('.php')) {
    response.writeHead(501, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: 'عملیات در پیش‌نمایش غیرفعال است.' }));
    return;
  }

  const file = path === '/' ? 'index.html' : path.slice(1);
  if (Object.hasOwn(previewData, file) || emptyLists.has(file)) {
    response.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify(previewData[file] ?? []));
    return;
  }

  const type = types[extname(file)];
  const isPage = /^[\w-]+\.html$/.test(file);
  const isAsset = /^(?:assets|build|fontello|JS|vendors)\/[\w./@ -]+$/.test(file);
  if (!type || (!isPage && !isAsset) || file.split('/').some(part => part.startsWith('.'))) {
    response.writeHead(404).end();
    return;
  }

  try {
    const content = await readFile(new URL(file, import.meta.url));
    response.writeHead(200, { 'Content-Type': type });
    response.end(isPage ? content.toString('utf8').replace(/<body\b[^>]*>/i, '$&' + notice) : content);
  } catch {
    response.writeHead(404).end();
  }
}).listen(Number(process.env.PORT ?? 3000), '0.0.0.0');
