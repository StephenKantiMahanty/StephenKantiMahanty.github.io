import { createProjectMotion } from './motion.js';
import { createMissionScene } from './scene.js';
import { createCharts } from './charts.js';
const M = window.AbyssNavigation;
const $ = id => document.getElementById(id);
let reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const runs = new Map();
let run, index = 260, playing = false, lastTime = 0, accumulator = 0, scene, charts, motion, raf;
const getRun = name => {
  if (!runs.has(name)) runs.set(name, M.run({ scenario: name }));
  return runs.get(name);
};
function announce(message) { $('announcement').textContent = message; }
function setPlaying(value) {
  playing = value;
  $('play').innerHTML = playing ? 'Ⅱ <span>Pause replay</span>' : '▶ <span>Play replay</span>';
  $('play').setAttribute('aria-label', playing ? 'Pause mission replay' : 'Play mission replay');
  $('mission-state').textContent = index === M.STEPS ? 'Mission complete' : playing ? 'Replay / running' : 'Replay / paused';
  lastTime = performance.now(); accumulator = 0;
  if (!playing) scene?.setIndex(index);
}
function setIndex(value, inspect = false) {
  index = Math.max(0, Math.min(M.STEPS, Math.round(value)));
  if (inspect && playing) setPlaying(false);
  const row = run.rows[index];
  $('scrub').value = index;
  $('scrub').setAttribute('aria-valuetext', row.t.toFixed(1) + ' seconds of 120 seconds');
  $('clock').innerHTML = row.t.toFixed(1).padStart(5, '0') + ' <span>/ 120.0 s</span>';
  $('depth').innerHTML = row.x[2].toFixed(2) + ' <small>m</small>';
  $('east').textContent = row.x[0].toFixed(2) + ' m';
  $('north').textContent = row.x[1].toFixed(2) + ' m';
  $('speed').textContent = Math.hypot(...row.x.slice(3)).toFixed(2) + ' m/s';
  $('error').textContent = M.distance(row.x, row.truth).toFixed(3) + ' m';
  $('accepted').textContent = row.accepted.toLocaleString();
  $('rejected').textContent = row.rejected.toLocaleString();
  $('acoustic-status').classList.toggle('offline', !row.acousticOnline);
  $('acoustic-status').querySelector('strong').textContent = row.acousticOnline ? '1 Hz' : 'Offline';
  $('mission-state').textContent = index === M.STEPS ? 'Mission complete' : playing ? 'Replay / running' : 'Replay / paused';
  $('scene').setAttribute('aria-label', 'At ' + row.t.toFixed(1) + ' seconds, estimated position east ' +
    row.x[0].toFixed(2) + ', north ' + row.x[1].toFixed(2) + ', depth ' + row.x[2].toFixed(2) +
    ' meters. Position error ' + M.distance(row.x, row.truth).toFixed(3) + ' meters. Acoustic ranges ' + (row.acousticOnline ? 'online.' : 'offline.'));
  scene?.setIndex(index); charts?.setIndex(index);
  if (index === M.STEPS && playing) { setPlaying(false); announce('Mission complete. Review the performance results or replay.'); }
}
function setScenario(name) {
  setPlaying(false);
  run = getRun(name);
  document.querySelectorAll('[data-scenario]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.scenario === name)));
  $('scene-heading').textContent = M.SCENARIOS[name].title;
  $('scenario-detail').textContent = M.SCENARIOS[name].detail;
  scene?.setRun(run); charts.setRun(run);
  index = name === 'survey' ? 260 : 520;
  setIndex(index);
  announce(M.SCENARIOS[name].title + ' selected. Replay paused at ' + (index * M.DT).toFixed(1) + ' seconds.');
  motion?.scenarioChanged();
}
function populateBenchmarks() {
  const body = $('benchmark'); body.replaceChildren();
  for (const name of Object.keys(M.SCENARIOS)) {
    const result = getRun(name), row = document.createElement('tr');
    const title = document.createElement('th'); title.scope = 'row'; title.textContent = M.SCENARIOS[name].short.toLowerCase().replace(/^./, v => v.toUpperCase());
    row.append(title);
    [result.metrics.rmse, result.ungatedMetrics.rmse, result.metrics.deadRmse].forEach(value => {
      const cell = document.createElement('td'); cell.textContent = value.toFixed(3) + ' m'; row.append(cell);
    });
    body.append(row);
  }
  $('hero-rmse').innerHTML = (getRun('survey').metrics.rmse * 100).toFixed(1) + '<small>cm</small>';
  const multi = getRun('multipath'), improvement = multi.ungatedMetrics.rmse / multi.metrics.rmse;
  $('rejection-improvement').innerHTML = improvement.toFixed(1) + '<small>×</small>';
  $('result-story-copy').textContent = 'With gating, I get ' + multi.metrics.rmse.toFixed(3) + ' m RMSE. Without it, the error rises to ' + multi.ungatedMetrics.rmse.toFixed(3) +
    ' m. Both runs use the same observations; the gated filter rejects ' + multi.metrics.rejected + ' scalar updates.';
}
function exportCSV() {
  const header = ['time_s','true_east_m','true_north_m','true_depth_m','estimated_east_m','estimated_north_m','estimated_depth_m',
    'velocity_east_m_s','velocity_north_m_s','velocity_depth_m_s','position_error_m','ungated_error_m','inertial_error_m',
    'variance_east_m2','variance_north_m2','variance_depth_m2','cov_east_north_m2','cov_east_depth_m2','cov_north_depth_m2',
    'accepted_updates','rejected_updates','acoustic_online'];
  const rows = run.rows.map((r, i) => [r.t,...r.truth.slice(0,3),...r.x, M.distance(r.x,r.truth),
    M.distance(run.ungated[i].x,r.truth),M.distance(r.dead,r.truth),r.P[0][0],r.P[1][1],r.P[2][2],
    r.P[0][1],r.P[0][2],r.P[1][2],r.accepted,r.rejected,+r.acousticOnline]
    .map(v => Number.isInteger(v) ? v : v.toFixed(7)).join(','));
  const url = URL.createObjectURL(new Blob([header.join(',') + '\n' + rows.join('\n')], { type: 'text/csv' }));
  const link = document.createElement('a'); link.href = url; link.download = 'abyss-' + run.config.scenario + '-seed42.csv';
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); announce('Complete mission data exported as CSV.');
}
function tick(time) {
  raf = requestAnimationFrame(tick);
  if (!playing || document.hidden) { lastTime = time; return; }
  accumulator += Math.min((time - lastTime) / 1000, 0.2) * Number($('rate').value);
  lastTime = time;
  if (accumulator >= M.DT) {
    const steps = Math.floor(accumulator / M.DT); accumulator -= steps * M.DT;
    setIndex(index + steps);
  }
  if (!reduced && playing) scene?.setProgress(index + accumulator / M.DT);
}
async function initialize() {
  try {
    await document.fonts.ready;
    try { scene = createMissionScene($('scene'), $('vehicle-label'), reduced); }
    catch (error) {
      console.warn('3D rendering unavailable:', error.message);
      $('scene-fallback').hidden = false; $('vehicle-label').hidden = true;
      document.querySelectorAll('[data-view]').forEach(b => b.disabled = true);
    }
    charts = createCharts(i => setIndex(i, true));
    populateBenchmarks(); setScenario('survey');
    motion = createProjectMotion(value => { reduced = value; scene?.setReducedMotion(value); });
    document.querySelectorAll('button,input,select').forEach(control => {
      if (control.matches('[data-view]') && !scene) return;
      control.disabled = false;
    });
    if (!document.querySelector('.console').requestFullscreen) $('fullscreen').hidden = true;
    $('play').addEventListener('click', () => { if (index === M.STEPS) setIndex(0); setPlaying(!playing); announce(playing ? 'Mission replay started.' : 'Mission replay paused.'); });
    $('restart').addEventListener('click', () => { setPlaying(false); setIndex(0); announce('Mission replay reset.'); });
    $('scrub').addEventListener('input', () => setIndex(Number($('scrub').value), true));
    $('scrub').addEventListener('change', () => announce('Inspecting ' + (index * M.DT).toFixed(1) + ' seconds.'));
    $('rate').addEventListener('change', () => { accumulator = 0; lastTime = performance.now(); });
    $('export').addEventListener('click', exportCSV);
    document.querySelectorAll('[data-scenario]').forEach(b => b.addEventListener('click', () => setScenario(b.dataset.scenario)));
    document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
      document.querySelectorAll('[data-view]').forEach(other => other.setAttribute('aria-pressed', String(other === b)));
      scene?.setView(b.dataset.view); announce(b.textContent + ' camera selected.');
    }));
    $('scene').addEventListener('cameraviewchange', () => {
      document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', 'false'));
    });
    const layers = () => scene?.setLayers($('show-drift').checked, $('show-uncertainty').checked);
    $('show-drift').addEventListener('change', layers); $('show-uncertainty').addEventListener('change', layers);
    $('show-multipath').addEventListener('click', () => setScenario('multipath'));
    $('fullscreen').addEventListener('click', async () => {
      try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('.console').requestFullscreen(); }
      catch { announce('Fullscreen is unavailable. Use the mission view on this page.'); }
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) setPlaying(false); });
    raf = requestAnimationFrame(tick);
    document.body.dataset.ready = 'true';
    window.addEventListener('pagehide', () => { setPlaying(false); });
    window.addEventListener('pageshow', () => { lastTime = performance.now(); });
  } catch (error) {
    $('mission-state').textContent = 'UNAVAILABLE';
    $('scene-fallback').hidden = false;
    $('scene-fallback').textContent = 'Mission initialization failed. Reload the page to try again. The source and model specification remain available below.';
    console.error(error);
  }
}
initialize();
