const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../kalman/model.js');
const near = (a,b,tol=1e-10) => assert.ok(Math.abs(a-b)<tol, `${a} != ${b}`);
test('exact predict/correct fixture uses velocity cross covariance and Joseph correction', () => {
  const prior = M.predict([0,0], [[1,0],[0,1]], 1, 0, 0);
  assert.deepEqual(prior, {x:[0,0],P:[[2,1],[1,1]]});
  const state = M.correct(prior,3,1);
  near(state.x[0],2);near(state.x[1],1);
  near(state.K[0],2/3);near(state.K[1],1/3);
  for(const [i,j,value] of [[0,0,2/3],[0,1,1/3],[1,0,1/3],[1,1,2/3]]) near(state.P[i][j],value);
});
test('Q is discrete held-acceleration covariance q B B transpose', () => {
  const p=M.predict([2,3],[[0,0],[0,0]],.2,4,.09);
  near(p.x[0],2.68);near(p.x[1],3.8);
  near(p.P[0][0],.09*.2**4/4);near(p.P[0][1],.09*.2**3/2);near(p.P[1][1],.09*.2**2);
});
test('dropout is exactly prediction-only and grows depth uncertainty', () => {
  const data=M.generate({scenario:'dropout'}),rows=M.estimate(data);
  assert.equal(rows.filter(r=>r.t>=20&&r.t<36&&r.z!==null).length,0);
  assert.equal(rows.filter(r=>r.t>=20&&r.t<36).length,80);
  for(const row of rows.filter(r=>r.t>=20&&r.t<36)) {assert.deepEqual(row.x,row.prior.x);assert.deepEqual(row.P,row.prior.P);assert.equal(row.innovation,null);}
  assert.ok(rows[179].P[0][0]>rows[99].P[0][0]*10);
  assert.ok(rows[180].P[0][0]<rows[179].P[0][0]);
});
test('seed replay is deterministic; tuning never changes truth, commands or fixes', () => {
  const a=M.generate(),b=M.generate({q:.15,r:16});assert.deepEqual(a,b);
  assert.deepEqual(M.estimate(a),M.estimate(M.generate()));
  assert.notDeepEqual(M.generate({seed:43}),a);
  const tuned=M.estimate(a,{q:.15,r:16});assert.notDeepEqual(tuned,M.estimate(a));
  assert.deepEqual(tuned.map(r=>[r.z,r.u,r.truth]),M.estimate(a).map(r=>[r.z,r.u,r.truth]));
});
test('truth is never consumed by the filter', () => {
  const data=M.generate(),other=data.map(r=>({...r,truth:[123456,-987]}));
  assert.deepEqual(M.estimate(data).map(r=>[r.x,r.P,r.K]),M.estimate(other).map(r=>[r.x,r.P,r.K]));
});
test('actual sensor noise changes fixes only; actual acceleration noise changes physics', () => {
  const base=M.generate(), noisy=M.generate({sensorSigma:2}), calm=M.generate({accelSigma:0});
  assert.deepEqual(base.map(r=>r.truth),noisy.map(r=>r.truth));
  assert.notDeepEqual(base.map(r=>r.z),noisy.map(r=>r.z));
  assert.notDeepEqual(base.map(r=>r.truth),calm.map(r=>r.truth));
  for(const r of M.generate({sensorSigma:0,accelSigma:0}).slice(1)) near(r.z,r.truth[0]);
  assert.deepEqual(calm.map(r=>r.u),base.map(r=>r.u));
});
test('scenario disturbances are explicit, bounded in time, and preserve random draws', () => {
  const nominal=M.generate(),bias=M.generate({scenario:'bias'}),drop=M.generate({scenario:'dropout'}),current=M.generate({scenario:'current'});
  bias.forEach((r,i)=>{assert.deepEqual(r.truth,nominal[i].truth);if(i)near(r.z-nominal[i].z,r.t>=20?2:0);});
  drop.forEach((r,i)=>{assert.deepEqual(r.truth,nominal[i].truth);if(r.t<20||r.t>=36)assert.equal(r.z,nominal[i].z);});
  current.filter(r=>r.t<20).forEach((r,i)=>assert.deepEqual(r,nominal[i]));
  assert.ok(current.at(-1).truth[0]-nominal.at(-1).truth[0]>20);
});
test('covariance stays finite, symmetric and positive semidefinite over 100000 steps', () => {
  for(const [q,r]of [[.0001,.01],[.0064,.64],[.16,16],[0,1]]) {
    let s={x:[7,.1],P:[[1,0],[0,.04]]};
    for(let i=0;i<25000;i++){
      const p=M.predict(s.x,s.P,.2,Math.cos(i)*.1,q);s=M.correct(p,i%500<100?null:10+Math.sin(i),r);
      assert.ok(s.x.every(Number.isFinite));assert.ok(s.P.flat().every(Number.isFinite));
      near(s.P[0][1],s.P[1][0]);assert.ok(s.P[0][0]>=0&&s.P[1][1]>=0);
      assert.ok(s.P[0][0]*s.P[1][1]-s.P[0][1]**2>=-1e-10);
    }
  }
});
test('seed 42 nominal has meaningful fixed RMSE; mismatch need not improve', () => {
  const scores=Object.fromEntries(['nominal','dropout','current','bias'].map(s=>[s,M.metrics(M.estimate(M.generate({scenario:s})))]));
  assert.ok(scores.nominal.sensor>.6&&scores.nominal.sensor<1);
  assert.ok(scores.nominal.filter<scores.nominal.sensor);
  assert.ok(scores.nominal.dead>scores.nominal.filter);
  assert.equal(scores.nominal.steps,300);assert.equal(scores.dropout.fixes,220);
  assert.ok(scores.bias.coverage<90);assert.ok(scores.current.filter>scores.nominal.filter);
  near(scores.nominal.sensor,0.8293703884070283);
  near(scores.nominal.filter,0.1926924180432113);
  near(scores.nominal.dead,4.906345826662991);
  near(scores.dropout.filter,0.23634380647390774);
  near(scores.current.filter,0.35129557368207154);
  near(scores.bias.filter,1.6179357706512916);
  console.log('Actual seed-42 scores:',JSON.stringify(scores));
});
test('RMSE handles no samples, missing fixes and differing denominators honestly', () => {
  assert.equal(M.metrics(M.estimate(M.generate()).slice(0,1)).filter,null);
  const r={x:[3,0],truth:[1,0],dead:[5,0],P:[[1,0],[0,1]],z:null};
  const m=M.metrics([r,r]);assert.equal(m.sensor,null);near(m.filter,2);near(m.dead,4);assert.equal(m.fixes,0);assert.equal(m.coverage,0);
});
