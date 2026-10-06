const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const M = require('../kalman/model.js');
const C = require('../kalman/controls.js');

test('invalid covariance noise is rejected even when dropout skips correction', () => {
  for (const q of [-1, NaN, Infinity, -Infinity, '0', null]) {
    assert.throws(() => M.predict([0,0], [[1,0],[0,1]], 1, 0, q), /q must be finite and nonnegative/);
    assert.throws(() => M.estimate(M.generate(), {q}), /q must be finite and nonnegative/);
  }
  for (const r of [0, -1, NaN, Infinity, '1', null]) {
    assert.throws(() => M.correct({x:[0,0],P:[[1,0],[0,1]]}, null, r), /R must be finite and positive/);
    assert.throws(() => M.estimate(M.generate(), {r}), /R must be finite and positive/);
  }
});
test('invalid world and seed inputs are rejected; zero actual noise remains valid', () => {
  for (const key of ['sensorSigma', 'accelSigma']) for (const value of [-1, NaN, Infinity, '1', null, 1e308]) {
    assert.throws(() => M.generate({[key]: value}), /finite/);
  }
  for (const seed of [-1, 2.5, NaN, Infinity, 4294967296, '42', null]) assert.throws(() => M.generate({seed}), /seed/);
  assert.throws(() => M.generate({scenario:'other'}), /scenario/);
  assert.equal(M.generate({seed:4294967295,sensorSigma:0,accelSigma:0}).length,301);
  assert.ok(M.estimate(M.generate({accelSigma:0}), {q:0}).every(r => r.P.flat().every(Number.isFinite)));
});
test('explicit variance mapping preserves exact squared matches, zero and independent movement', () => {
  const r = C.varianceScale(.01,16), q = C.varianceScale(.0001,.16,true);
  for (const sigma of [.1,.8,1.7,4]) { const exact=sigma**2, tick=r.encode(exact); assert.equal(r.decode(tick),exact); assert.notEqual(r.decode(tick===322?tick-1:tick+1),exact); }
  for (const sigma of [0,.01,.03,.08,.2]) { const exact=sigma**2; assert.equal(q.decode(q.encode(exact)),exact); }
  assert.equal(q.decode(0),0);
  for(let tick=0;tick<=322;tick++){assert.ok(r.decode(tick)>0);assert.ok(q.decode(tick)>=0);}
});
test('scene bounds contain negative truth, fixes, dead reckoning, baseline and both uncertainty edges', () => {
  const rows = M.estimate(M.generate({scenario:'current',sensorSigma:4}));
  rows.push({...rows[0],truth:[-81,0],z:-111,dead:[-95,0],x:[-48,0],P:[[400,0],[0,1]]});
  const base=[{x:[-130,0]},{x:[150,0]}], {min,max}=C.sceneBounds(rows,base);
  for(const r of rows) for(const v of [r.truth[0],r.z,r.dead[0],r.x[0]-1.96*Math.sqrt(r.P[0][0]),r.x[0]+1.96*Math.sqrt(r.P[0][0])].filter(v=>v!==null)) assert.ok(v>min&&v<max);
  assert.ok(min < -130 && max > 150);
});

// Execute the actual UI with a minimal DOM and spy only on the public model boundary.
function app() {
  const elements = new Map(), calls={generate:[],estimate:[]};
  const context2d = new Proxy({}, {get: (_,key) => key.startsWith('create') ? () => ({addColorStop(){}}) : () => {}});
  function element(id='') {
    return {id, value:'', textContent:'', disabled:true, hidden:false, children:[], attrs:{}, events:{},
      addEventListener(type,fn){this.events[type]=fn;}, setAttribute(k,v){this.attrs[k]=v;},
      replaceChildren(...children){this.children=children;}, appendChild(child){this.children.push(child);}, append(...children){this.children.push(...children);},
      checkValidity(){return true;}, getBoundingClientRect(){return {width:700,height:400};}, getContext(){return context2d;}};
  }
  const html=fs.readFileSync('kalman/index.html','utf8');
  for(const match of html.matchAll(/\bid="([^"]+)"[^>]*>/g)) {const e=element(match[1]);e.value=/\bvalue="([^"]+)"/.exec(match[0])?.[1]||'';elements.set(e.id,e);}
  elements.get('scenario').value='nominal';elements.get('speed').value='1';
  const $=id=>elements.get(id);
  const model={...M,generate(c){const data=M.generate(c);calls.generate.push(data);return data;},estimate(data,c){calls.estimate.push({data,c:{...c}});return M.estimate(data,c);}};
  const document={getElementById:$,createElement:()=>element(),createTextNode:text=>({textContent:text}),addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[...elements.values()]};
  vm.runInNewContext(fs.readFileSync('kalman/app.js','utf8'),{window:{AbyssModel:model,AbyssControls:C},document,ResizeObserver:class{observe(){}},cancelAnimationFrame(){},requestAnimationFrame(){return 1;},performance:{now:()=>0}});
  return {$,calls,fire(id,type='click',value){if(value!==undefined)$(id).value=String(value);$(id).events[type]();}};
}
test('match keeps exact variances, same data and baseline, including q=0; world changes clear baseline', () => {
  const a=app();a.fire('accel-noise','input',0);a.fire('sensor-noise','input',1.7);a.fire('pin');
  const data=a.calls.generate.at(-1), count=a.calls.generate.length;
  a.fire('end');a.fire('play');a.fire('match');
  assert.equal(a.calls.generate.length,count);assert.equal(a.calls.estimate.at(-1).data,data);
  assert.equal(a.calls.estimate.at(-1).c.q,0);assert.equal(a.calls.estimate.at(-1).c.r,1.7**2);
  assert.equal(a.$('r-noise').attrs['aria-valuetext'],'2.89 square meters, measurement variance R');
  assert.equal(a.$('q-noise').attrs['aria-valuetext'],'0 (meters per second squared) squared, acceleration variance q');
  assert.equal(a.$('baseline-row').hidden,false);assert.equal(a.$('summary').hidden,true);
  assert.equal(a.$('scrub').value,0);assert.match(a.$('mission-state').textContent,/PAUSED/);
  a.fire('r-noise','input',Number(a.$('r-noise').value)+1);
  assert.equal(a.calls.generate.length,count);assert.equal(a.calls.estimate.at(-1).c.q,0);
  a.fire('seed','change',43);assert.equal(a.$('baseline-row').hidden,true);assert.equal(a.calls.generate.length,count+1);
});
test('scrub is paused in seconds, leaves data unchanged, updates endpoint controls and removes stale summary', () => {
  const a=app(), count=a.calls.estimate.length;
  a.fire('play');a.fire('scrub','input',179);
  assert.equal(a.$('scrub').attrs['aria-valuetext'],'35.8 seconds of 60.0 seconds');
  assert.match(a.$('live-text').textContent,/Paused/);assert.match(a.$('mission-state').textContent,/PAUSED/);
  assert.equal(a.calls.estimate.length,count);
  a.fire('end');assert.equal(a.$('summary').hidden,false);assert.equal(a.$('play').disabled,true);assert.equal(a.$('step').disabled,true);
  a.fire('scrub','input',100);assert.equal(a.$('summary').hidden,true);assert.equal(a.$('play').disabled,false);assert.equal(a.$('step').disabled,false);
  a.fire('reset');assert.equal(a.$('scrub').value,0);assert.equal(a.calls.generate.length,1);
});
test('same-data gain responds to R while noise matching help reflects tuning', () => {
  const a=app();a.fire('step');a.fire('pin');
  const data=a.calls.generate[0], base=a.calls.estimate.at(-1).c;
  a.fire('r-noise','input',322);const tuned=a.calls.estimate.at(-1).c;
  assert.equal(a.calls.generate.length,1);assert.equal(a.calls.estimate.at(-1).data,data);
  assert.ok(M.estimate(data,tuned)[1].K[0]<M.estimate(data,base)[1].K[0]);
  assert.match(a.$('scenario-help').textContent,/differs/);a.fire('match');assert.match(a.$('scenario-help').textContent,/match the actual/);
});
