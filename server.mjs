import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import { isAction, isDataFile, readData, runAction } from './backend.mjs';

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
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
  '.mp3': 'audio/mpeg',
};

const assetCache = new Map();

function json(response, status, body) {
  const payload = Buffer.from(JSON.stringify(body), 'utf8');
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': String(payload.byteLength),
    'Cache-Control': 'no-store',
  }).end(payload);
}

async function readForm(request) {
  const contentType = request.headers['content-type'] ?? '';
  if (!/^(application\/x-www-form-urlencoded|multipart\/form-data)(?:;|$)/i.test(contentType)) {
    throw Object.assign(new Error('قالب فرم پشتیبانی نمی‌شود.'), { status: 415 });
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of request.iterator({ destroyOnReturn: false })) {
    size += chunk.length;
    if (size > 64 * 1024) {
      request.resume();
      throw Object.assign(new Error('حجم درخواست بیش از حد مجاز است.'), { status: 413 });
    }
    chunks.push(chunk);
  }
  try {
    return await new Response(Buffer.concat(chunks), {
      headers: { 'Content-Type': contentType },
    }).formData();
  } catch {
    throw Object.assign(new Error('فرم قابل خواندن نیست.'), { status: 400 });
  }
}

const server = createServer(async (request, response) => {
  let file;
  try {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    file = path === '/' ? 'index.html' : path.slice(1);
  } catch {
    return json(response, 400, { error: 'نشانی معتبر نیست.' });
  }

  try {
    if (isAction(file)) {
      if (request.method === 'POST') {
        const result = await runAction(file, await readForm(request));
        if (result.location) return response.writeHead(303, { Location: result.location }).end();
        return json(response, 200, result);
      }
      if (file === 'console_costs.php' && request.method === 'GET') return json(response, 200, {});
      response.setHeader('Allow', 'POST');
      return json(response, 405, { error: 'روش درخواست مجاز نیست.' });
    }

    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return json(response, 405, { error: 'روش درخواست مجاز نیست.' });
    }

    if (isDataFile(file)) return json(response, 200, await readData(file));

    const type = types[extname(file)];
    const isPage = /^[\w-]+\.html$/.test(file);
    const isAsset = /^(?:assets|build|fontello|JS|src|vendors)\/[\w./@ -]+$/.test(file);
    if (!type || (!isPage && !isAsset) || file.split('/').some(part => part.startsWith('.'))) {
      return response.writeHead(404).end();
    }

    let content = isAsset ? assetCache.get(file) : undefined;
    if (!content) {
      content = await readFile(new URL(file, import.meta.url));
      if (isAsset) assetCache.set(file, content);
    }

    response.writeHead(200, {
      'Content-Type': type,
      'Content-Length': String(content.byteLength),
      'Cache-Control': isAsset ? 'public, max-age=3600' : 'no-cache',
    });
    if (request.method === 'HEAD') {
      response.end();
    } else {
      response.end(content);
    }
  } catch (error) {
    if (error.code === 'ENOENT' || error.code === 'EISDIR') return response.writeHead(404).end();
    if (error.status) return json(response, error.status, { error: error.message });
    console.error(error);
    return json(response, 500, { error: 'خطا در پردازش درخواست.' });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, process.env.HOST ?? '0.0.0.0', () => console.log('Metrogame listening on port ' + server.address().port));
