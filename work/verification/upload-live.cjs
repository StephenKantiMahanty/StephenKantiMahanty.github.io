const assert = require('node:assert/strict');

(async () => {
  const origin = 'https://kantimahanty.com';
  const source = '// Upload verification; deleted immediately after checking.\nconsole.log("upload works");\n';
  let cookie;
  let upload;
  const request = (url, options = {}) => fetch(new URL(url, origin), {
    ...options,
    headers: { ...options.headers, ...(cookie ? { Cookie: cookie } : {}) },
  });
  try {
    const page = await request('/upload/');
    assert.equal(page.status, 200);
    cookie = page.headers.get('set-cookie')?.split(';')[0];
    const form = new FormData();
    form.append('file', new File([source], 'upload-verification.js', { type: 'text/javascript' }));
    const response = await request('/api/uploads', { method: 'POST', body: form });
    cookie = response.headers.get('set-cookie')?.split(';')[0] || cookie;
    assert.match(response.headers.get('content-type'), /application\/json/);
    upload = await response.json();
    assert.equal(response.status, 201, upload.error);
    assert.ok(upload.deleteUrl);
    const download = await request(upload.fileUrl);
    assert.equal(download.status, 200);
    assert.match(download.headers.get('content-disposition'), /attachment; filename="upload-verification.js"/);
    assert.equal(await download.text(), source);
    const otherSession = await fetch(upload.fileUrl);
    assert.equal(otherSession.status, 404);
    const deletion = await request(upload.deleteUrl, { method: 'POST' });
    assert.equal(deletion.status, 200);
    assert.equal((await deletion.json()).ok, true);
    const gone = await request(upload.fileUrl);
    assert.equal(gone.status, 404);
    console.log(JSON.stringify({ upload: 201, bytesPreserved: true, originalFilename: true, privateSession: true, deletion: 200, deletedFile: 404 }));
    upload = null;
  } finally {
    if (upload?.deleteUrl) {
      const cleanup = await request(upload.deleteUrl, { method: 'POST' });
      assert.ok(cleanup.status === 200 || cleanup.status === 404, 'Verification file cleanup failed');
    }
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
