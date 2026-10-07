const fs = require('node:fs');
const path = require('node:path');
const esbuild = require('esbuild');
esbuild.buildSync({ entryPoints: [path.join(__dirname, 'vendor-entry.js')], bundle: true, format: 'esm',
  minify: true, legalComments: 'linked', target: 'es2022', outfile: 'kalman/vendor.js' });
fs.copyFileSync(path.join(__dirname, 'node_modules/uplot/dist/uPlot.min.css'), 'kalman/vendor.css');
const entries = [['three','LICENSE'], ['uplot','LICENSE'], ['motion','LICENSE.md']];
let licenses = '';
for (const [name, file] of entries) {
  const pkg = require(path.join(__dirname, 'node_modules', name, 'package.json'));
  const location = path.join(__dirname, 'node_modules', name, file);
  const fallback = path.join(__dirname, 'node_modules', name, 'LICENSE');
  licenses += name + ' ' + pkg.version + '\n' + fs.readFileSync(fs.existsSync(location) ? location : fallback, 'utf8') + '\n\n';
}
fs.writeFileSync('kalman/VENDOR-LICENSES.txt', licenses);
console.log('Local vendor bundle created.');
