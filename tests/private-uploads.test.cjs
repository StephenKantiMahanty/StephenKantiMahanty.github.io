const assert = require('node:assert/strict');
const { test } = require('node:test');
const { previewEnvironment } = require('./private-upload-server.cjs');

const origin = 'https://portfolio.test';
async function upload(worker, env, { name = 'part.dxf', type = 'application/dxf', bytes = '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF', field = 'file', cookie } = {}) {
  const form = new FormData();
  form.append(field, new File([bytes], name, { type }));
  const response = await worker.fetch(new Request(`${origin}/api/uploads`, {
    method: 'POST', body: form, headers: cookie ? { Cookie: cookie } : {},
  }), env);
  return { response, data: await response.json(), cookie: cookie || response.headers.get('Set-Cookie')?.split(';')[0] };
}
const request = (worker, env, url, cookie, method = 'GET') => worker.fetch(new Request(url, {
  method, headers: cookie ? { Cookie: cookie } : {},
}), env);

test('arbitrary files preserve bytes, type, original name and private metadata', async () => {
  const { worker, env } = await previewEnvironment();
  const cases = [
    ['part.dxf', 'application/dxf', '0\nSECTION\n0\nEOF'],
    ['report.pdf', 'application/pdf', '%PDF-1.7\nfixture'],
    ['data.zip', 'application/zip', new Uint8Array([80, 75, 3, 4, 0, 255])],
    ['notes.txt', 'text/plain', 'private test notes'],
    ['plan.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'test document'],
    ['測定 résumé.bin', '', new Uint8Array([0, 128, 255])],
    ['empty.dat', '', ''],
  ];
  for (const [name, type, bytes] of cases) {
    const { response, data, cookie } = await upload(worker, env, { name, type, bytes });
    assert.equal(response.status, 201, name);
    assert.equal(data.name, name);
    assert.equal(data.previewable, false);
    assert.match(data.fileUrl, /\/uploads\/[^/]+\/file$/);
    const file = await request(worker, env, data.fileUrl, cookie);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('Content-Type'), type || 'application/octet-stream');
    assert.match(file.headers.get('Content-Disposition'), /^attachment;/);
    assert.ok(file.headers.get('Content-Disposition').includes(`filename*=UTF-8''${encodeURIComponent(name)}`));
    assert.deepEqual(Buffer.from(await file.arrayBuffer()), Buffer.from(await new Blob([bytes]).arrayBuffer()));
    assert.equal(file.headers.get('Cache-Control'), 'no-store');
    assert.equal(file.headers.get('X-Content-Type-Options'), 'nosniff');
    const metadata = await request(worker, env, `${origin}/api/uploads/${data.id}`, cookie);
    const details = await metadata.json();
    assert.equal(details.name, name);
    assert.equal(details.size, data.size);
    assert.equal(details.fileUrl, data.fileUrl);
    assert.equal(details.previewable, false);
    assert.equal(details.sessionToken, undefined);
  }
});

test('downloads, previews, metadata and deletion require the uploading session', async () => {
  const { worker, env } = await previewEnvironment();
  const { data, cookie } = await upload(worker, env);
  for (const wrongCookie of [undefined, 'skm_upload_session=someone-else']) {
    for (const url of [data.fileUrl, `${data.fileUrl}?preview=1`, `${origin}/api/uploads/${data.id}`]) {
      assert.equal((await request(worker, env, url, wrongCookie)).status, 404);
    }
    assert.equal((await request(worker, env, data.deleteUrl, wrongCookie, 'POST')).status, 404);
  }
  assert.equal((await request(worker, env, data.fileUrl, cookie)).status, 200);
  assert.equal((await request(worker, env, data.deleteUrl, cookie, 'POST')).status, 200);
  assert.equal(env.UPLOADS_BUCKET.records.size, 0);
  assert.equal((await request(worker, env, data.fileUrl, cookie)).status, 404);
  assert.equal((await request(worker, env, `${origin}/api/uploads/${data.id}`, cookie)).status, 404);
});

test('raster images preview inline and also download with the original name', async () => {
  const { worker, env } = await previewEnvironment();
  const { data, cookie } = await upload(worker, env, { name: 'photo.jpg', type: 'image/jpeg', bytes: new Uint8Array([255, 216, 255]) });
  assert.equal(data.previewable, true);
  const preview = await request(worker, env, `${data.fileUrl}?preview=1`, cookie);
  assert.match(preview.headers.get('Content-Disposition'), /^inline;/);
  const download = await request(worker, env, data.fileUrl, cookie);
  assert.match(download.headers.get('Content-Disposition'), /^attachment;/);
  assert.match(download.headers.get('Content-Disposition'), /filename="photo.jpg"/);
});

test('HTML, SVG and executable content remain attachments even with preview requested', async () => {
  const { worker, env } = await previewEnvironment();
  for (const [name, type] of [['page.html', 'text/html'], ['drawing.svg', 'image/svg+xml'], ['app.js', 'text/javascript']]) {
    const { data, cookie } = await upload(worker, env, { name, type, bytes: '<script>alert(1)</script>' });
    assert.equal(data.previewable, false);
    const raw = await request(worker, env, `${data.fileUrl}?preview=1`, cookie);
    assert.match(raw.headers.get('Content-Disposition'), /^attachment;/);
    assert.match(raw.headers.get('Content-Security-Policy'), /sandbox/);
    const alias = await request(worker, env, `${origin}/uploads/${data.id}/image.png`, cookie);
    assert.match(alias.headers.get('Content-Disposition'), /^attachment;/);
  }
});

test('10 MB limit applies to every type, accepts the boundary and rejects excess', async () => {
  const { worker, env } = await previewEnvironment();
  const accepted = await upload(worker, env, { bytes: new Uint8Array(10 * 1024 * 1024) });
  assert.equal(accepted.response.status, 201);
  const rejected = await upload(worker, env, { bytes: new Uint8Array(10 * 1024 * 1024 + 1) });
  assert.equal(rejected.response.status, 413);
  assert.match(rejected.data.error, /File is too large/);
  assert.equal(env.UPLOADS_BUCKET.records.size, 1);
});

test('invalid and missing multipart file input returns a useful error', async () => {
  const { worker, env } = await previewEnvironment();
  const invalid = await worker.fetch(new Request(`${origin}/api/uploads`, { method: 'POST', body: 'invalid' }), env);
  assert.equal(invalid.status, 400);
  const missing = new FormData();
  missing.append('file', 'not a file');
  const response = await worker.fetch(new Request(`${origin}/api/uploads`, { method: 'POST', body: missing }), env);
  assert.equal(response.status, 400);
  assert.equal(env.UPLOADS_BUCKET.records.size, 0);
});

test('existing image field, URLs and bucket records remain usable and deletable', async () => {
  const { worker, env } = await previewEnvironment();
  assert.equal((await upload(worker, env, { field: 'image', type: 'image/png' })).response.status, 201);
  const legacyKey = '/uploads/old-id/image.png';
  await env.UPLOADS_BUCKET.put(legacyKey, Buffer.from('legacy image'), {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: { sessionToken: 'old-session', originalName: 'old.png' },
  });
  const cookie = 'skm_upload_session=old-session';
  assert.equal((await request(worker, env, `${origin}${legacyKey}`, cookie)).status, 200);
  assert.equal((await request(worker, env, `${origin}/uploads/old-id/file`, cookie)).status, 200);
  assert.equal((await request(worker, env, `${origin}/api/uploads/old-id`, cookie)).status, 200);
  assert.equal((await request(worker, env, `${origin}/api/uploads/old-id/delete`, cookie, 'POST')).status, 200);
  assert.equal(env.UPLOADS_BUCKET.records.has(legacyKey), false);
});

test('both upload page paths establish a private session cookie', async () => {
  const { worker, env } = await previewEnvironment();
  for (const route of ['/upload/', '/upload/index.html']) {
    const response = await request(worker, env, `${origin}${route}`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Lax/);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
});
