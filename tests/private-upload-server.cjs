// Local-only preview of the actual Worker; no cloud services or persistent uploads.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function memoryBucket() {
  const records = new Map();
  return {
    records,
    async put(key, buffer, metadata) {
      records.set(key, { bytes: Buffer.from(buffer), ...metadata });
    },
    async get(key) {
      const record = records.get(key);
      return record ? { ...record, body: record.bytes, size: record.bytes.length } : null;
    },
    async delete(key) { records.delete(key); },
  };
}

async function previewEnvironment() {
  const worker = (await import(`data:text/javascript;base64,${fs.readFileSync(path.join(root, 'worker.js')).toString('base64')}`)).default;
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.jpeg': 'image/jpeg', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
  const env = {
    UPLOADS_BUCKET: memoryBucket(),
    ASSETS: { async fetch(request) {
      let relative = decodeURIComponent(new URL(request.url).pathname).replace(/^\//, '');
      if (!relative || relative.endsWith('/')) relative += 'index.html';
      const file = path.resolve(root, relative);
      if (!file.startsWith(root + path.sep) || relative.split(/[\\/]/).some(part => part.startsWith('.'))) {
        return new Response('Forbidden', { status: 403 });
      }
      if (!fs.existsSync(file) || !fs.statSync(file).isFile()) return new Response('Not found', { status: 404 });
      return new Response(fs.readFileSync(file), { headers: { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' } });
    } },
  };
  return { worker, env };
}

if (require.main === module) {
  previewEnvironment().then(({ worker, env }) => {
    http.createServer(async (req, res) => {
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        const body = Buffer.concat(chunks);
        const request = new Request(`http://127.0.0.1:8000${req.url}`, {
          method: req.method, headers: req.headers,
          ...(body.length ? { body } : {}),
        });
        const response = await worker.fetch(request, env);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(Buffer.from(await response.arrayBuffer()));
      } catch (error) {
        console.error(error);
        res.writeHead(500);
        res.end('Preview error');
      }
    }).listen(8000, '127.0.0.1', () => console.log('Worker preview: http://127.0.0.1:8000/ (in-memory uploads)'));
  });
}

module.exports = { memoryBucket, previewEnvironment };
