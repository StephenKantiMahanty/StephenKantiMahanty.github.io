const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
(async () => {
  const headers = { 'User-Agent': 'Kalman-portfolio-typography' };
  const commitResponse = await fetch('https://api.github.com/repos/IBM/plex/commits/master', { headers });
  if (!commitResponse.ok) throw new Error('Font source lookup failed: ' + commitResponse.status);
  const { sha } = await commitResponse.json();
  const base = `https://raw.githubusercontent.com/IBM/plex/${sha}/packages/plex-sans/fonts/complete/woff2/`;
  const directory = path.resolve(__dirname, '../../kalman/fonts');
  fs.mkdirSync(directory, { recursive: true });
  const assets = [];
  for (const file of ['IBMPlexSans-Regular.woff2', 'IBMPlexSans-SemiBold.woff2', 'license.txt']) {
    const response = await fetch(base + file, { headers });
    if (!response.ok) throw new Error(file + ': ' + response.status);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (file.endsWith('.woff2') && bytes.toString('ascii', 0, 4) !== 'wOF2') throw new Error('Invalid font file');
    fs.writeFileSync(path.join(directory, file), bytes);
    assets.push({ file, bytes: bytes.length, sha256: crypto.createHash('sha256').update(bytes).digest('hex'), source: base + file });
  }
  fs.writeFileSync(path.join(directory, 'SOURCE.json'), JSON.stringify({ family: 'IBM Plex Sans', repository: 'https://github.com/IBM/plex', commit: sha, license: 'SIL Open Font License 1.1', assets }, null, 2) + '\n');
  console.log(JSON.stringify({ commit: sha, assets: assets.map(({ file, bytes }) => ({ file, bytes })) }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
