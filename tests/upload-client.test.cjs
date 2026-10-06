const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { previewEnvironment } = require('./private-upload-server.cjs');

const root = path.resolve(__dirname, '..');
const read = file => readFileSync(path.join(root, file), 'utf8');

function element() {
  const listeners = new Map();
  const classes = new Set(['hidden']);
  return {
    textContent: '', disabled: false, hidden: true, style: {}, dataset: {}, files: [],
    classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
    },
    addEventListener: (name, listener) => listeners.set(name, listener),
    dispatch: (name, event = {}) => listeners.get(name)?.(event),
    removeAttribute(name) { delete this[name]; },
  };
}

function client(fetch, script = 'upload/upload.js', route = '/upload/') {
  const elements = new Map();
  const get = id => {
    if (!elements.has(id)) elements.set(id, element());
    return elements.get(id);
  };
  get('upload-form').querySelectorAll = () => [get('file-input'), get('upload-button')];
  const document = {
    getElementById: get, querySelector: get, querySelectorAll: () => [],
  };
  const window = {
    location: { origin: 'https://portfolio.test', href: `https://portfolio.test${route}`, pathname: route },
    addEventListener() {}, open() {}, close() {},
  };
  const context = vm.createContext({ document, window, fetch, URL, FormData, Blob, navigator: {} });
  vm.runInContext(read('upload/api.js'), context);
  vm.runInContext(read(script), context);
  return { get, context, submit: file => {
    get('file-input').files = [file];
    return get('upload-form').dispatch('submit', { preventDefault() {} });
  } };
}

test('code uploads and deletion round-trip through the real Worker', async () => {
  const { worker, env } = await previewEnvironment();
  let cookie;
  const page = client(async (url, options) => {
    const response = await worker.fetch(new Request(url, {
      ...options, headers: cookie ? { Cookie: cookie } : {},
    }), env);
    cookie = response.headers.get('Set-Cookie')?.split(';')[0] || cookie;
    return response;
  });
  await page.submit(new File(['print("hello")'], 'main.py', { type: 'text/x-python' }));
  assert.equal(page.get('status-message').textContent, 'File uploaded successfully.');
  assert.equal(page.get('result-panel').classList.contains('hidden'), false);
  const download = await worker.fetch(new Request(page.get('file-url').textContent, { headers: { Cookie: cookie } }), env);
  assert.equal(await download.text(), 'print("hello")');
  assert.match(download.headers.get('Content-Disposition'), /attachment; filename="main.py"/);
  await page.get('delete-button').dispatch('click');
  assert.equal(page.get('status-message').textContent, 'Upload deleted.');
  assert.equal(env.UPLOADS_BUCKET.records.size, 0);
});

test('HTML responses display a useful error and restore upload controls', async () => {
  for (const status of [200, 404, 405, 502]) {
    const page = client(async () => new Response('<html><head>Error</head></html>', { status }));
    await page.submit(new File(['const value = 1;'], 'main.js', { type: 'text/javascript' }));
    assert.match(page.get('status-message').textContent, /upload service is unavailable/);
    assert.doesNotMatch(page.get('status-message').textContent, /Unexpected token|<html>/);
    assert.equal(page.get('result-panel').classList.contains('hidden'), true);
    assert.equal(page.get('file-input').disabled, false);
    assert.equal(page.get('upload-button').disabled, false);
  }
});

test('JSON storage errors and invalid success data never display successful upload links', async () => {
  for (const [body, status, expected] of [
    [{ error: 'File storage is unavailable.' }, 503, /File storage is unavailable/],
    [{}, 200, /invalid response/],
    [null, 200, /invalid response/],
  ]) {
    const page = client(async () => Response.json(body, { status }));
    await page.submit(new File(['code'], 'code.txt'));
    assert.match(page.get('status-message').textContent, expected);
    assert.equal(page.get('result-panel').classList.contains('hidden'), true);
  }
});

test('HTML on deletion preserves the file links so deletion can be retried', async () => {
  const page = client(async () => new Response('<html>Error</html>'));
  vm.runInContext(`renderUploadResult({ id: 'id', viewerUrl: '/uploads/id/', fileUrl: '/uploads/id/file', deleteUrl: '/api/uploads/id/delete' });`, page.context);
  await page.get('delete-button').dispatch('click');
  assert.match(page.get('status-message').textContent, /upload service is unavailable/);
  assert.equal(page.get('result-panel').classList.contains('hidden'), false);
  assert.equal(page.get('delete-button').disabled, false);
});

test('viewer handles HTML metadata without displaying a JSON parser error', async () => {
  const page = client(async () => new Response('<html>Error</html>'), 'upload/viewer.js', '/uploads/id/');
  await vm.runInContext('loadFile()', page.context);
  assert.match(page.get('viewer-status').textContent, /upload service is unavailable/);
  assert.equal(page.get('close-delete-button').disabled, true);
  assert.equal(page.get('download-file-link').classList.contains('hidden'), true);
});
