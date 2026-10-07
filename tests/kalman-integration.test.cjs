const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
test('showcase replaces the teaching activity and is connected from Secret',()=>{
  const html=read('kalman/index.html');
  assert.doesNotMatch(html,/\blab\b|quiz|Check my prediction|lesson-cards|worked-numbers|learner/i);
  for(const id of ['mission','performance','engineering','scene','scrub','benchmark','error-chart','depth-chart','export'])assert.ok(html.includes('id="'+id+'"'));
  assert.match(read('secret/index.html'),/Abyss \/ Underwater Navigation/);
  assert.doesNotMatch(read('secret/index.html'),/Kalman Lab|04 \/ LAB/);
});
test('all runtime imports and asset references are local and exist',()=>{
  const html=read('kalman/index.html');
  for(const [,file]of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css|svg))"/g)){
    assert.ok(!/^https?:/.test(file));assert.ok(fs.existsSync(path.resolve(root,'kalman',file)),file);
  }
  for(const source of ['app.js','scene.js','charts.js']){
    for(const [,file]of read('kalman/'+source).matchAll(/from '(\.\/[^']+)'/g))assert.ok(fs.existsSync(path.resolve(root,'kalman',file)));
  }
  assert.ok(fs.statSync(path.join(root,'kalman/vendor.js')).size>100000);
  assert.match(read('kalman/VENDOR-LICENSES.txt'),/three 0\./);
  assert.match(read('kalman/VENDOR-LICENSES.txt'),/motion 14\./);
});
test('replay controls start disabled with explicit labels and reduced-motion support',()=>{
  const html=read('kalman/index.html');
  assert.match(html,/id="play"[^>]*disabled[^>]*aria-label/);
  assert.match(html,/id="scrub"[^>]*disabled[^>]*aria-valuetext/);
  assert.match(html,/<noscript>/);
  assert.match(read('kalman/styles.css'),/prefers-reduced-motion:reduce/);
  assert.match(read('kalman/app.js'),/prefers-reduced-motion: reduce/);
  assert.match(html,/seed 42/);
});
test('public project specification identifies simulated evidence and the actual 6-state model',()=>{
  const html=read('kalman/index.html');
  assert.match(html,/Simulation results, not deployed vehicle measurements/);
  assert.match(html,/Orientation and sensor bias are not estimated/);
  assert.match(html,/7\.8147/);assert.match(html,/normalized innovation squared above 9/);
  assert.match(html,/0\.02 m²\/s³/);
});
