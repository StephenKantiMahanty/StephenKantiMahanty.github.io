const { test } = require('node:test');
const assert = require('node:assert/strict');
const M = require('../kalman/navigation.js');
const near = (a,b,tol=1e-9) => assert.ok(Math.abs(a-b)<tol, a+' != '+b);
function positiveDefinite(P) {
  const L = M.identity().map(r=>r.map(()=>0));
  for(let i=0;i<6;i++)for(let j=0;j<=i;j++){
    let s=P[i][j];for(let k=0;k<j;k++)s-=L[i][k]*L[j][k];
    if(i===j){assert.ok(s>0,'covariance pivot '+s);L[i][j]=Math.sqrt(s);}else L[i][j]=s/L[j][j];
  }
}
test('continuous process covariance and constant-acceleration state propagation have exact units',()=>{
  const r=M.predict({x:[0,0,0,1,2,3],P:M.identity()},[2,-2,0],0.6,0.5);
  assert.deepEqual(r.x,[0.75,0.75,1.5,2,1,3]);
  near(r.P[0][0],1.25+0.6*0.5**3/3);
  near(r.P[0][3],0.5+0.6*0.5**2/2);
  near(r.P[3][3],1+0.6*0.5);
});
test('Joseph-form scalar correction matches an independently computed depth fixture',()=>{
  const state={x:[0,0,0,0,0,0],P:M.identity()};
  const r=M.correct(state,{kind:'depth',value:3,variance:1},Infinity);
  near(r.x[2],1.5);near(r.P[2][2],0.5);near(r.nis,4.5);
  near(r.P[0][0],1);assert.equal(state.x[2],0);assert.equal(state.P[2][2],1);
});
test('nonlinear acoustic Jacobian matches finite differences for every beacon and axis',()=>{
  const x=[11,-3,14,0,0,0],eps=1e-5;
  for(let beacon=0;beacon<4;beacon++){
    const sensor={kind:'range',beacon}, o=M.observation(x,sensor);
    for(let axis=0;axis<3;axis++){
      const plus=[...x],minus=[...x];plus[axis]+=eps;minus[axis]-=eps;
      near(o.H[axis],(M.observation(plus,sensor).predicted-M.observation(minus,sensor).predicted)/(2*eps),1e-8);
    }
    assert.deepEqual(o.H.slice(3),[0,0,0]);
  }
});
test('innovation gating rejects an extreme range without changing state or covariance',()=>{
  const state={x:[...M.INITIAL],P:M.identity()};
  const r=M.correct(state,{kind:'range',beacon:0,value:1000,variance:0.25},9);
  assert.equal(r.accepted,false);assert.equal(r.x,state.x);assert.equal(r.P,state.P);assert.ok(r.nis>9);
  assert.equal(M.correct(state,{kind:'range',beacon:0,value:1000,variance:0.25},Infinity).accepted,true);
});
test('world replay is seeded and estimator settings cannot alter its observations',()=>{
  const a=M.generate({seed:42}),b=M.generate({seed:42,q:999,gate:Infinity});
  assert.deepEqual(a,b);assert.notDeepEqual(a,M.generate({seed:43}));
  assert.equal(a.length,1201);assert.equal(a.at(-1).t,120);
});
test('estimator state cannot consume evaluation truth',()=>{
  const data=M.generate(), expected=M.estimate(data);
  const changed=M.estimate(data.map(r=>({...r,truth:[999999,999999,999999,99,99,99]})));
  expected.forEach((r,i)=>{assert.deepEqual(r.x,changed[i].x);assert.deepEqual(r.P,changed[i].P);});
});
test('asynchronous sensor cadences and acoustic outage are exact',()=>{
  const survey=M.generate(), blackout=M.generate({scenario:'blackout'});
  const count=kind=>survey.reduce((s,r)=>s+r.sensors.filter(v=>v.kind===kind).length,0);
  assert.equal(count('depth'),600);assert.equal(count('velocity'),720);assert.equal(count('range'),480);
  assert.equal(blackout.reduce((s,r)=>s+r.sensors.filter(v=>v.kind==='range').length,0),360);
  for(let i=0;i<survey.length;i++){
    assert.deepEqual(survey[i].truth,blackout[i].truth);
    assert.deepEqual(survey[i].imu,blackout[i].imu);
    assert.deepEqual(survey[i].sensors.filter(s=>s.kind!=='range'),blackout[i].sensors.filter(s=>s.kind!=='range'));
    if(blackout[i].t>=40&&blackout[i].t<70)assert.ok(blackout[i].sensors.every(s=>s.kind!=='range'));
  }
});
test('full six-state covariance remains finite, symmetric and positive definite in every mission',()=>{
  for(const scenario of Object.keys(M.SCENARIOS)){
    const run=M.run({scenario});
    for(const row of run.rows){
      assert.ok(row.x.every(Number.isFinite));
      row.P.forEach((r,i)=>r.forEach((v,j)=>{assert.ok(Number.isFinite(v));near(v,row.P[j][i],1e-10);}));
      positiveDefinite(row.P);
    }
  }
});
test('position ellipsoid reconstructs the full correlated covariance',()=>{
  const P=M.identity();
  P[0][0]=4;P[1][1]=2;P[2][2]=1;P[0][1]=P[1][0]=1;P[0][2]=P[2][0]=0.3;P[1][2]=P[2][1]=0.2;
  const {radii,basis}=M.ellipsoid(P);
  const reconstructed=M.multiply(M.multiply(basis,radii.map((v,i)=>radii.map((_,j)=>i===j?v*v/7.8147279:0))),M.transpose(basis));
  for(let i=0;i<3;i++)for(let j=0;j<3;j++)near(reconstructed[i][j],P[i][j],1e-9);
});
test('multipath improvement is measured from the same data and every injected outlier is rejected',()=>{
  const r=M.run({scenario:'multipath'});
  assert.ok(r.ungatedMetrics.rmse/r.metrics.rmse>8);
  const outliers=r.rows.flatMap(row=>row.updates).filter(v=>v.outlier);
  assert.ok(outliers.length>50);assert.ok(outliers.every(v=>!v.accepted));
  near(r.metrics.rmse,0.1834646492251121);
  near(r.ungatedMetrics.rmse,1.6429100926978868);
  assert.equal(r.metrics.accepted+r.metrics.rejected,1800);
  r.rows.forEach((row,i)=>{assert.deepEqual(row.sensors,r.ungated[i].sensors);});
});
test('survey results match a separate RMSE calculation and outperform biased inertial integration',()=>{
  const r=M.run(), sum=r.rows.slice(1).reduce((s,row)=>s+row.x.slice(0,3).reduce((v,x,i)=>v+(x-row.truth[i])**2,0),0);
  near(r.metrics.rmse,Math.sqrt(sum/1200));
  near(r.metrics.rmse,0.16136162361438555);
  assert.ok(r.metrics.deadRmse>20);assert.equal(r.metrics.samples,1200);
});
test('input validation rejects invalid seeds, scenarios, covariance noise and measurements',()=>{
  for(const seed of [-1,2.3,Infinity,'42',4294967296])assert.throws(()=>M.generate({seed}),/seed/);
  for(const scenario of ['nominal','toString','missing'])assert.throws(()=>M.generate({scenario}),/scenario/);
  for(const q of [-1,NaN,Infinity])assert.throws(()=>M.estimate(M.generate(),{q}),/settings/);
  assert.throws(()=>M.correct({x:[...M.INITIAL],P:M.identity()},{kind:'depth',value:NaN,variance:1}),/observation/);
  assert.throws(()=>M.correct({x:[...M.INITIAL],P:M.identity()},{kind:'depth',value:1,variance:0}),/observation/);
});
