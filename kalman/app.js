/* UI owns playback; all physics and estimation live in model.js. */
(() => {
  'use strict';
  const M = window.AbyssModel, C = window.AbyssControls, $ = id => document.getElementById(id);
  const rScale = C.varianceScale(0.01, 16), qScale = C.varianceScale(0.0001, 0.16, true);
  let config = { ...M.DEFAULTS }, data, rows, index = 0, running = false, baseline = null;
  let timer = null, lastTime = 0, accumulator = 0;
  const fmt = (n, digits = 2) => n === null ? '—' : n.toFixed(digits);
  const colors = { truth: '#edf7f1', sensor: '#ffd18b', filter: '#00ff41', dead: '#bbb0f4' };
  const descriptions = {
    nominal: 'Random disturbances, unbiased fixes.',
    dropout: 'Fixes disappear from 20–36 s. Prediction continues; uncertainty grows until correction resumes.',
    current: 'An unknown +0.045 m/s² acceleration acts from 20–40 s. The filter must adapt to a wrong motion model.',
    bias: 'Fixes shift +2 m after 20 s. A confident filter can follow the biased sensor and still be wrong.'
  };
  function announce(text) { $('announcement').textContent = text; }
  function stop() {
    running = false; cancelAnimationFrame(timer); timer = null;
    $('play').textContent = index === M.STEPS ? '✓ Mission complete' : index ? '▶ Resume mission' : '▶ Start mission';
    $('mission-state').textContent = index === M.STEPS ? 'MISSION COMPLETE' : 'READY / PAUSED';
  }
  function readConfig() {
    if (!$('seed').checkValidity()) { $('seed').reportValidity(); return null; }
    return { seed: Number($('seed').value), scenario: $('scenario').value,
      sensorSigma: Number($('sensor-noise').value), accelSigma: Number($('accel-noise').value),
      r: rScale.decode(Number($('r-noise').value)),
      q: qScale.decode(Number($('q-noise').value)) };
  }
  function labels() {
    const spokenVariance = n => Number(n.toPrecision(12));
    $('sensor-value').textContent = `${config.sensorSigma.toFixed(1)} m`;
    $('accel-value').textContent = `${config.accelSigma.toFixed(2)} m/s²`;
    $('r-value').textContent = `${config.r.toPrecision(3)} m²`;
    $('q-value').textContent = `${config.q.toPrecision(3)} (m/s²)²`;
    $('r-noise').setAttribute('aria-valuetext', `${spokenVariance(config.r)} square meters, measurement variance R`);
    $('q-noise').setAttribute('aria-valuetext', `${spokenVariance(config.q)} (meters per second squared) squared, acceleration variance q`);
    $('sensor-noise').setAttribute('aria-valuetext', `${config.sensorSigma} meters, actual sensor standard deviation`);
    $('accel-noise').setAttribute('aria-valuetext', `${config.accelSigma} meters per second squared, actual acceleration standard deviation`);
    const close = (a, b) => Math.abs(a - b) <= 1e-12 * Math.max(a, b, Number.MIN_VALUE);
    const matched = close(config.r, config.sensorSigma ** 2) && close(config.q, config.accelSigma ** 2);
    $('scenario-help').textContent = `${descriptions[config.scenario]} ${matched ? 'R and q match the actual random noise variances.' : 'R or q differs from the actual random noise variances. Try Match actual noise.'}${['current','bias'].includes(config.scenario) ? ' Matching random noise does not model this systematic disturbance.' : ''}`;
    $('clear-baseline').hidden = !baseline;
    $('baseline-row').hidden = !baseline;
    $('baseline-key').hidden = !baseline;
    $('pin').textContent = baseline ? '＋ Replace saved baseline' : '＋ Save tuning as baseline';
    $('baseline-note').textContent = baseline
      ? `Baseline: R ${baseline.config.r.toPrecision(3)} m², q ${baseline.config.q.toPrecision(3)} (m/s²)². Purple trace; identical data, scored over the same elapsed steps.`
      : 'Save the current tuning, then change R or q to compare estimates using the same measurements.';
  }
  function rebuild(regenerate = false) {
    stop(); index = 0; accumulator = 0;
    if (regenerate || !data) data = M.generate(config);
    rows = M.estimate(data, config);
    $('summary').hidden = true;
    labels(); render();
  }
  function changeSettings() {
    const next = readConfig(); if (!next) return;
    const worldChanged = ['seed', 'scenario', 'sensorSigma', 'accelSigma'].some(k => next[k] !== config[k]);
    config = next;
    if (worldChanged) baseline = null;
    rebuild(worldChanged);
    announce(worldChanged ? 'New real-world mission. Paused at zero; baseline cleared.' : 'New tuning. Same measurement stream, paused at zero; baseline retained.');
  }
  function advance() {
    if (index >= M.STEPS) return;
    index++; render();
    if (index === M.STEPS) { stop(); debrief(); announce('Mission complete. Results are available in the mission debrief.'); }
  }
  function frame(now) {
    if (!running) return;
    accumulator += Math.min((now - lastTime) / 1000, 0.25) * Number($('speed').value);
    lastTime = now;
    while (accumulator >= M.DT && index < M.STEPS) { accumulator -= M.DT; advance(); }
    if (running) timer = requestAnimationFrame(frame);
  }
  $('play').addEventListener('click', () => {
    if (running) { stop(); render(); announce('Mission paused.'); return; }
    if (index >= M.STEPS) return;
    running = true; lastTime = performance.now();
    $('play').textContent = 'Ⅱ Pause mission'; $('mission-state').textContent = 'MISSION IN PROGRESS';
    announce('Mission started.'); timer = requestAnimationFrame(frame);
  });
  $('step').addEventListener('click', () => { stop(); advance(); if (index < M.STEPS) { render(); announce(`Stepped to ${rows[index].t.toFixed(1)} seconds. ${rows[index].event}.`); } });
  function rewind() { rebuild(false); announce('Mission reset. Same data and tuning.'); }
  $('reset').addEventListener('click', rewind); $('again').addEventListener('click', rewind);
  function inspect(step) {
    stop(); accumulator = 0; index = Math.max(0, Math.min(M.STEPS, step)); render();
  }
  $('scrub').addEventListener('input', () => inspect(Number($('scrub').value)));
  $('scrub').addEventListener('change', () => announce(`Inspecting ${rows[index].t.toFixed(1)} seconds. Mission paused.`));
  $('end').addEventListener('click', () => { inspect(M.STEPS); announce('Inspecting mission end. Debrief is available.'); });
  $('match').addEventListener('click', () => {
    config.r = config.sensorSigma ** 2; config.q = config.accelSigma ** 2;
    $('r-noise').value = rScale.encode(config.r); $('q-noise').value = qScale.encode(config.q);
    rebuild(false); announce('Exact actual noise variances matched. Same data, paused at zero; baseline retained.');
  });
  $('replay').addEventListener('click', () => { const next = readConfig(); if (!next) return; changeSettings(); announce(`Replaying seed ${config.seed}. Mission paused at zero.`); });
  for (const id of ['scenario', 'sensor-noise', 'accel-noise', 'r-noise', 'q-noise', 'seed']) $(id).addEventListener('change', changeSettings);
  for (const id of ['sensor-noise', 'accel-noise', 'r-noise', 'q-noise']) $(id).addEventListener('input', changeSettings);
  $('pin').addEventListener('click', () => {
    stop(); baseline = { config: { ...config }, rows: M.estimate(data, config) }; labels(); render();
    announce('Baseline saved. Change assumed R or q, then replay the same data.');
  });
  $('clear-baseline').addEventListener('click', () => { baseline = null; labels(); render(); announce('Baseline cleared.'); });
  $('check-answer').addEventListener('click', () => {
    const answer = document.querySelector('input[name="dropout-answer"]:checked');
    $('answer-feedback').textContent = !answer ? 'Choose a prediction first.' : answer.value === 'grow'
      ? 'Yes. From 20 to just before 36 s, there is no fix to correct the prediction. The motion model carries on and its assumed depth uncertainty grows. At 36 s, a returning fix narrows the interval.'
      : 'The robot still has its motion model, so it keeps predicting even when the sensor is silent. But without measurements to correct it, the assumed depth uncertainty grows from 20 to just before 36 s. The measurement at 36 s narrows the interval again.';
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && running) { stop(); render(); } });
  function telemetry(id, n, unit) { $(id).replaceChildren(document.createTextNode(`${fmt(n)} `)); const small = document.createElement('small'); small.textContent = unit; $(id).appendChild(small); }
  function render() {
    const row = rows[index], half = 1.96 * Math.sqrt(row.P[0][0]), metrics = M.metrics(rows.slice(0, index + 1));
    telemetry('true-depth', row.truth[0], 'm'); telemetry('measured-depth', row.z, 'm');
    telemetry('estimated-depth', row.x[0], 'm'); telemetry('velocity', row.x[1], 'm/s');
    telemetry('confidence', half, 'm'); telemetry('actual-error', row.x[0] - row.truth[0], 'm');
    $('clock').textContent = `${row.t.toFixed(1).padStart(4, '0')} / 60.0 s`; $('progress').value = index;
    $('scrub').value = index;
    $('scrub').setAttribute('aria-valuetext', `${row.t.toFixed(1)} seconds of ${M.DURATION.toFixed(1)} seconds`);
    $('scrub-time').textContent = `${row.t.toFixed(1)} / ${M.DURATION.toFixed(1)} s`;
    $('summary').hidden = index !== M.STEPS;
    $('stage').textContent = row.t < 20 ? '01 / GATE APPROACH' : row.t < 40 ? '02 / SLALOM TRANSECT' : '03 / BIN APPROACH';
    $('event').textContent = index === 0 ? 'Ready to descend. Start the mission, or step through one correction.' : row.event;
    $('step').disabled = index === M.STEPS; $('play').disabled = index === M.STEPS;
    if (!running) $('play').textContent = index === M.STEPS ? '✓ Mission complete' : index ? '▶ Resume mission' : '▶ Start mission';
    $('rmse-sensor').textContent = fmt(metrics.sensor, 3); $('rmse-filter').textContent = fmt(metrics.filter, 3); $('rmse-dead').textContent = fmt(metrics.dead, 3);
    if (baseline) $('rmse-baseline').textContent = fmt(M.metrics(baseline.rows.slice(0, index + 1)).filter, 3);
    $('coverage').textContent = `Interval coverage: ${metrics.coverage === null ? '—' : `${metrics.coverage.toFixed(1)}% of elapsed steps`} · ${metrics.fixes} fixes`;
    $('score-time').textContent = `0–${row.t.toFixed(1)} s / SEED ${config.seed}`;
    const status = index === M.STEPS ? 'Complete' : running ? 'Playing' : 'Paused';
    $('mission-state').textContent = index === M.STEPS ? 'MISSION COMPLETE' : running ? 'MISSION IN PROGRESS' : 'READY / PAUSED';
    $('live-text').textContent = `At ${row.t.toFixed(1)} s: truth ${fmt(row.truth[0])} m; fix ${row.z === null ? 'unavailable' : `${fmt(row.z)} m`}; estimate ${fmt(row.x[0])} m; velocity ${fmt(row.x[1])} m/s; assumed 95% interval ±${fmt(half)} m; actual error ${fmt(row.x[0] - row.truth[0])} m. ${status}.`;
    $('error-text').textContent = `Actual error ${fmt(row.x[0] - row.truth[0])} m; assumed bounds ±${fmt(half)} m. ${Math.abs(row.x[0] - row.truth[0]) <= half ? 'Truth is inside the interval at this step.' : 'Truth is outside the interval at this step.'} White line = estimate minus truth; green band = assumed confidence. ${baseline ? 'Purple dashes = saved baseline error.' : 'Confidence can be wrong under model mismatch.'}`;
    worked(row); drawScene(); drawError();
    if (index === M.STEPS) debrief();
  }
  function worked(row) {
    $('worked-time').textContent = index ? `LIVE / t = ${row.t.toFixed(1)} s` : 'STEP TO SEE LIVE NUMBERS';
    if (!index) {
      $('worked-numbers').replaceChildren(...[['PREDICTION','What motion suggests'],['INNOVATION','Fix − prediction'],['POSITION GAIN','How much to trust the fix'],['CORRECTION','Prediction + gain × innovation']].map(([title,value]) => {
        const div=document.createElement('div'),span=document.createElement('span'),strong=document.createElement('strong');
        span.textContent=title;strong.textContent=value;div.append(span,strong);return div;
      }));
      return;
    }
    const parts = row.z === null ? [
      ['PREDICTION', `${fmt(row.prior.x[0], 3)} m`, `v⁻ = ${fmt(row.prior.x[1], 3)} m/s`],
      ['INNOVATION', 'No position fix', 'The sensor is in dropout.'],
      ['POSITION GAIN', 'No correction', 'K is not applied.'],
      ['PREDICTION ONLY', `${fmt(row.x[0], 3)} m`, `P₀₀ = ${fmt(row.P[0][0], 4)} m²`]
    ] : [
      ['PREDICTION', `${fmt(row.prior.x[0], 3)} m`, `v⁻ = ${fmt(row.prior.x[1], 3)} m/s`],
      ['INNOVATION', `${fmt(row.innovation, 3)} m`, `${fmt(row.z, 3)} − ${fmt(row.prior.x[0], 3)}`],
      ['POSITION GAIN', fmt(row.K[0], 3), `S = ${fmt(row.S, 4)} m²`],
      ['CORRECTED DEPTH', `${fmt(row.x[0], 3)} m`, `${fmt(row.prior.x[0], 3)} + (${fmt(row.K[0], 3)} × ${fmt(row.innovation, 3)})`]
    ];
    $('worked-numbers').replaceChildren(...parts.map(([title, value, detail]) => {
      const div = document.createElement('div'), span = document.createElement('span'), strong = document.createElement('strong'), small = document.createElement('small');
      span.textContent = title; strong.textContent = value; small.textContent = detail; div.append(span, strong, small); return div;
    }));
  }
  function debrief() {
    const m = M.metrics(rows);
    $('summary').hidden = false;
    $('summary-text').textContent = `This run used seed ${config.seed} with the ${config.scenario} conditions. There were ${m.fixes} measurements over ${m.steps} steps. The measurement RMSE was ${fmt(m.sensor, 3)} m, compared with ${fmt(m.filter, 3)} m for the filter and ${fmt(m.dead, 3)} m for dead reckoning. The true depth was inside the assumed 95% interval on ${fmt(m.coverage, 1)}% of steps. ${config.scenario === 'bias' ? 'The sensor bias pulls the estimate away from the true depth. The filter can give a narrow interval because it trusts its assumptions, even though those assumptions are wrong.' : config.scenario === 'current' ? 'The current adds acceleration that the motion model does not account for. Increasing q can give the measurements more influence, which may help the estimate catch up.' : config.scenario === 'dropout' ? 'While measurements were missing, the filter had to rely on its motion model. Its uncertainty grew during that period. When measurements returned, it could correct the prediction again.' : 'You can now change R or q and repeat the run. Since the measurements stay the same, the difference in the result comes from how the filter uses them.'}`;
    $('summary-compare').textContent = baseline ? `Same-data comparison: saved baseline RMSE ${fmt(M.metrics(baseline.rows).filter, 3)} m → current ${fmt(m.filter, 3)} m (R ${config.r.toPrecision(3)}, q ${config.q.toPrecision(3)}).` : 'Save this tuning as a baseline, change R or q, and replay to compare on identical measurements.';
  }
  function surface(id) {
    const canvas = $(id), box = canvas.getBoundingClientRect(), ratio = Math.min(window.devicePixelRatio || 1, 3);
    const w = Math.max(1, box.width), h = Math.max(1, box.height);
    if (canvas.width !== Math.round(w * ratio) || canvas.height !== Math.round(h * ratio)) { canvas.width = Math.round(w * ratio); canvas.height = Math.round(h * ratio); }
    const ctx = canvas.getContext('2d'); ctx.setTransform(ratio, 0, 0, ratio, 0, 0); ctx.clearRect(0, 0, w, h);
    return { ctx, w, h };
  }
  function polygon(ctx, points, fill) { ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
  function line(ctx, points, color, width = 1.5, dash = []) { if (!points.length) return; ctx.beginPath(); points.forEach(([x,y],i) => i ? ctx.lineTo(x,y) : ctx.moveTo(x,y)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]); }
  function robot(ctx, x, y, scale) {
    ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
    const light = ctx.createRadialGradient(0,0,5,0,0,55); light.addColorStop(0,'#00ff4129'); light.addColorStop(1,'#00ff4100'); ctx.fillStyle=light;ctx.fillRect(-55,-55,110,110);
    polygon(ctx,[[16,-3],[82,-22],[82,18],[16,4]],'#75e9d50b');
    ctx.strokeStyle='#729b9f';ctx.lineWidth=3;ctx.strokeRect(-23,-14,42,26);
    ctx.fillStyle='#a6bbbc';ctx.fillRect(-24,-16,46,4);ctx.fillRect(-24,11,46,4);
    ctx.fillStyle='#153d4b';ctx.fillRect(-17,-11,28,20);
    const hull = ctx.createLinearGradient(0,-9,0,10);hull.addColorStop(0,'#c3d4c9');hull.addColorStop(.4,'#7fa98b');hull.addColorStop(1,'#00661a');
    ctx.fillStyle=hull;ctx.beginPath();ctx.roundRect(-18,-7,38,15,7);ctx.fill();
    ctx.fillStyle='#244b57';ctx.beginPath();ctx.ellipse(18,.5,5,7.5,0,0,Math.PI*2);ctx.fill();
    for(const tx of [-17,13]){ctx.fillStyle='#071d29';ctx.beginPath();ctx.ellipse(tx,-13,6,4,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#77a8ad';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#588b97';ctx.fillRect(tx-3,-14,6,2);}
    ctx.strokeStyle='#6b929b';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-7,-8);ctx.lineTo(-7,-22);ctx.lineTo(4,-22);ctx.stroke();
    ctx.fillStyle='#00ff41';ctx.fillRect(-7,-23,7,3);ctx.fillStyle='#d6fff0';ctx.fillRect(20,-2,3,4);
    ctx.restore();
  }
  function drawScene() {
    const { ctx, w, h } = surface('scene'), left = w < 400 ? 45 : 56, right = 30, top = 82, bottom = h - 43;
    const { min, max } = C.sceneBounds(rows, baseline ? baseline.rows : []);
    const X = t => left + t / M.DURATION * (w-left-right), Y = d => top+(d-min)/(max-min)*(bottom-top);
    ctx.fillStyle='#050810';ctx.fillRect(0,0,w,h);
    // Task silhouettes correspond to time milestones, not measured horizontal position.
    ctx.strokeStyle='#88c6bd33';ctx.lineWidth=5;ctx.strokeRect(X(12)-20,bottom-76,40,72);
    for(let i=0;i<3;i++){ctx.fillStyle=i%2?'#d8a47728':'#8edac326';ctx.fillRect(X(28+i*4)-3,bottom-60+(i%2)*15,6,58-(i%2)*15);}
    polygon(ctx,[[X(52)-21,bottom-8],[X(52)+15,bottom-8],[X(52)+24,bottom+4],[X(52)-13,bottom+4]],'#8ad2c32c');
    ctx.font='12px Consolas, monospace';ctx.fillStyle='#b5c8bd';
    for(let j=0;j<=4;j++){const d=min+(max-min)*j/4,y=Y(d);line(ctx,[[left,y],[w-right,y]],'#a4cac616',1);ctx.fillText(`${d.toFixed(0)}`,12,y+3);}
    for(const t of [0,20,40,60]){line(ctx,[[X(t),top-4],[X(t),bottom]],'#a4cac61a',1,[2,6]);ctx.textAlign='center';ctx.fillText(`${t}s`,X(t),h-18);}
    ctx.textAlign='left';ctx.font='11px Consolas, monospace';ctx.fillText('DEPTH m ↓',12,69);ctx.textAlign='right';ctx.fillText('MISSION TIME →',w-14,h-4);ctx.textAlign='left';
    if(config.scenario !== 'nominal'){const start=X(20),end=X(config.scenario==='dropout'?36:config.scenario==='current'?40:60);ctx.fillStyle='#ffd18b08';ctx.fillRect(start,top,end-start,bottom-top);line(ctx,[[start,top],[start,bottom]],'#ffd18b55',1,[3,5]);}
    const seen=rows.slice(0,index+1);
    polygon(ctx,[...seen.map(r=>[X(r.t),Y(r.x[0]+1.96*Math.sqrt(r.P[0][0]))]),...seen.slice().reverse().map(r=>[X(r.t),Y(r.x[0]-1.96*Math.sqrt(r.P[0][0]))])],'#00ff4120');
    line(ctx,seen.map(r=>[X(r.t),Y(r.dead[0])]),colors.dead,1.4,[5,5]);
    if(baseline)line(ctx,baseline.rows.slice(0,index+1).map(r=>[X(r.t),Y(r.x[0])]),colors.dead,2,[2,4]);
    line(ctx,seen.map(r=>[X(r.t),Y(r.truth[0])]),colors.truth,1.5,[7,5]);
    ctx.strokeStyle=colors.truth;ctx.lineWidth=1.2;for(const r of seen.filter((_,i)=>i%25===0))ctx.strokeRect(X(r.t)-2.5,Y(r.truth[0])-2.5,5,5);
    ctx.strokeStyle=colors.sensor;ctx.lineWidth=1;for(const r of seen){if(r.z!==null){ctx.beginPath();ctx.arc(X(r.t),Y(r.z),2,0,Math.PI*2);ctx.stroke();}}
    line(ctx,seen.map(r=>[X(r.t),Y(r.x[0])]),colors.filter,2.4);
    const r=seen[seen.length-1],x=X(r.t),y=Y(r.x[0]);line(ctx,[[x,Y(r.truth[0])],[x,y]],'#ffffff66',1,[2,3]);
    ctx.fillStyle=colors.truth;ctx.fillRect(x-3,Y(r.truth[0])-3,6,6);
    polygon(ctx,[[x,y-5],[x+5,y],[x,y+5],[x-5,y]],colors.filter);
    robot(ctx,Math.max(left+25,Math.min(w-55,x+8)),y-34,w<400?1.1:1.7);
    ctx.font='11px Consolas, monospace';ctx.fillStyle='#a8c8c5';for(const [t,text]of [[12,'GATE'],[32,'SLALOM'],[52,'BIN']]){ctx.textAlign='center';ctx.fillText(text,X(t),h-31);}ctx.textAlign='left';
  }
  function drawError() {
    const {ctx,w,h}=surface('error-chart'),left=45,right=18,top=20,bottom=h-29;
    const limit=Math.max(1,...rows.map(r=>Math.max(Math.abs(r.x[0]-r.truth[0]),1.96*Math.sqrt(r.P[0][0]))),...(baseline?baseline.rows.map(r=>Math.abs(r.x[0]-r.truth[0])):[]))*1.1;
    const X=t=>left+t/M.DURATION*(w-left-right),Y=v=>top+(limit-v)/(2*limit)*(bottom-top);
    ctx.font='12px Consolas, monospace';ctx.fillStyle='#abc0c5';
    for(const v of [-limit,0,limit]){line(ctx,[[left,Y(v)],[w-right,Y(v)]],v===0?'#b0cac566':'#8bacb122',1,v===0?[3,4]:[]);ctx.fillText(v.toFixed(1),7,Y(v)+3);}
    const seen=rows.slice(0,index+1);
    polygon(ctx,[...seen.map(r=>[X(r.t),Y(1.96*Math.sqrt(r.P[0][0]))]),...seen.slice().reverse().map(r=>[X(r.t),Y(-1.96*Math.sqrt(r.P[0][0]))])],'#00ff411c');
    for(const sign of [-1,1])line(ctx,seen.map(r=>[X(r.t),Y(sign*1.96*Math.sqrt(r.P[0][0]))]),'#00ff417a',1);
    if(baseline)line(ctx,baseline.rows.slice(0,index+1).map(r=>[X(r.t),Y(r.x[0]-r.truth[0])]),colors.dead,1.5,[4,3]);
    line(ctx,seen.map(r=>[X(r.t),Y(r.x[0]-r.truth[0])]),colors.truth,1.8);
    for(const t of [0,20,40,60]){ctx.textAlign='center';ctx.fillText(`${t}s`,X(t),h-10);}ctx.textAlign='left';
  }
  const resize = new ResizeObserver(() => { if (rows) { drawScene(); drawError(); } });
  resize.observe($('scene')); resize.observe($('error-chart'));
  $('r-noise').value = rScale.encode(config.r); $('q-noise').value = qScale.encode(config.q);
  rebuild(true);
  document.querySelectorAll('button, input, select').forEach(control => { control.disabled = false; });
  render();
})();
