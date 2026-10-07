/* Six-state AUV extended Kalman filter. Shared by browser and Node tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AbyssNavigation = api;
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  const DT = 0.1, DURATION = 120, STEPS = 1200, N = 6;
  const BEACONS = [[-14, -22, 24], [58, -22, 24], [58, 28, 24], [-14, 28, 24]];
  const INITIAL = [0, 0, 12, 0.36 + 14 / 18, 0.06, 3 / 22];
  const SCENARIOS = Object.freeze({
    survey: { title: 'Seafloor survey', short: 'SURVEY', detail: 'All sensors online. A complete 120-second navigation run.', start: 0, end: 0 },
    blackout: { title: 'Acoustic blackout', short: 'BLACKOUT', detail: 'Acoustic ranges disappear from 40–70 s. Velocity and depth updates remain online.', start: 40, end: 70 },
    multipath: { title: 'Multipath interference', short: 'MULTIPATH', detail: 'Reflected acoustic signals inject +10 m range errors from 35–75 s.', start: 35, end: 75 },
    current: { title: 'Cross-current', short: 'CURRENT', detail: 'A northward current changes the trajectory from 40–80 s. Inertial and velocity updates track the disturbance.', start: 40, end: 80 }
  });
  const DEFAULTS = Object.freeze({ seed: 42, scenario: 'survey', q: 0.02, gate: 9 });
  const zero = (n = N) => Array.from({ length: n }, () => Array(n).fill(0));
  const identity = (n = N) => zero(n).map((row, i) => row.map((_, j) => +(i === j)));
  const transpose = a => a[0].map((_, j) => a.map(row => row[j]));
  const multiply = (a, b) => a.map(row => b[0].map((_, j) => row.reduce((s, v, k) => s + v * b[k][j], 0)));
  const matvec = (a, x) => a.map(row => row.reduce((s, v, j) => s + v * x[j], 0));
  const distance = (a, b) => Math.hypot(...a.slice(0, 3).map((v, i) => v - b[i]));
  function random(seed) {
    let s = seed >>> 0;
    return () => {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ s >>> 15, 1 | s);
      t ^= t + Math.imul(t ^ t >>> 7, 61 | t);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function normal(rng) { return Math.sqrt(-2 * Math.log(Math.max(rng(), 1e-12))) * Math.cos(2 * Math.PI * rng()); }
  function validate(config) {
    if (!Number.isInteger(config.seed) || config.seed < 0 || config.seed > 4294967295) throw new RangeError('seed must be an unsigned 32-bit integer');
    if (!Object.hasOwn(SCENARIOS, config.scenario)) throw new RangeError('unknown scenario');
  }
  function transition(x, a, dt = DT) {
    return x.map((v, i) => i < 3 ? v + dt * x[i + 3] + 0.5 * dt * dt * a[i] : v + dt * a[i - 3]);
  }
  function predict(state, acceleration, q = DEFAULTS.q, dt = DT) {
    if (!Number.isFinite(q) || q < 0 || !Number.isFinite(dt) || dt <= 0) throw new RangeError('invalid process noise or timestep');
    const F = identity();
    for (let i = 0; i < 3; i++) F[i][i + 3] = dt;
    const P = multiply(multiply(F, state.P), transpose(F));
    // Continuous white acceleration Q, per axis.
    for (let i = 0; i < 3; i++) {
      P[i][i] += q * dt ** 3 / 3;
      P[i][i + 3] += q * dt * dt / 2;
      P[i + 3][i] += q * dt * dt / 2;
      P[i + 3][i + 3] += q * dt;
    }
    return { x: transition(state.x, acceleration, dt), P };
  }
  function observation(x, sensor) {
    const H = Array(N).fill(0);
    if (sensor.kind === 'range') {
      const beacon = BEACONS[sensor.beacon];
      const predicted = distance(x, beacon);
      for (let i = 0; i < 3; i++) H[i] = (x[i] - beacon[i]) / Math.max(predicted, 1e-9);
      return { predicted, H };
    }
    const axis = sensor.kind === 'depth' ? 2 : sensor.axis + 3;
    H[axis] = 1;
    return { predicted: x[axis], H };
  }
  function correct(state, sensor, gate = DEFAULTS.gate) {
    if (!Number.isFinite(sensor.value) || !Number.isFinite(sensor.variance) || sensor.variance <= 0) throw new RangeError('invalid observation');
    if (!(gate > 0)) throw new RangeError('gate must be positive');
    const { predicted, H } = observation(state.x, sensor);
    const PH = matvec(state.P, H);
    const S = H.reduce((s, v, i) => s + v * PH[i], sensor.variance);
    const innovation = sensor.value - predicted, nis = innovation ** 2 / S;
    if (nis > gate) return { ...state, innovation, nis, accepted: false };
    const K = PH.map(v => v / S);
    const A = identity().map((row, i) => row.map((v, j) => v - K[i] * H[j]));
    const P = multiply(multiply(A, state.P), transpose(A));
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) P[i][j] += K[i] * sensor.variance * K[j];
    for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) P[i][j] = P[j][i] = (P[i][j] + P[j][i]) / 2;
    return { x: state.x.map((v, i) => v + K[i] * innovation), P, innovation, nis, accepted: true };
  }
  function generate(config = {}) {
    const c = { ...DEFAULTS, ...config }; validate(c);
    const rng = random(c.seed);
    let truth = [...INITIAL];
    const samples = [{ t: 0, truth: [...truth], imu: [0, 0, 0], sensors: [], acousticOnline: true }];
    for (let i = 1; i <= STEPS; i++) {
      const t = i * DT, a = [-14 / 18 ** 2 * Math.sin(t / 18), -10 / 21 ** 2 * Math.cos(t / 21), -3 / 22 ** 2 * Math.sin(t / 22)];
      if (c.scenario === 'current' && t >= 40 && t < 80) a[1] += 0.008;
      truth = transition(truth, a);
      const imu = a.map((v, axis) => v + [0.006, -0.004, 0.0015][axis] + 0.025 * normal(rng));
      // Consume noise even when a sensor is offline for reproducible comparisons.
      const depthNoise = normal(rng), velocityNoise = [normal(rng), normal(rng), normal(rng)];
      const rangeNoise = BEACONS.map(() => normal(rng));
      const acousticOnline = !(c.scenario === 'blackout' && t >= 40 && t < 70);
      const sensors = [];
      if (i % 2 === 0) sensors.push({ kind: 'depth', value: truth[2] + 0.08 * depthNoise, variance: 0.08 ** 2 });
      if (i % 5 === 0) for (let axis = 0; axis < 3; axis++) sensors.push({ kind: 'velocity', axis, value: truth[axis + 3] + 0.045 * velocityNoise[axis], variance: 0.045 ** 2 });
      if (i % 10 === 0 && acousticOnline) BEACONS.forEach((beacon, index) => {
        const outlier = c.scenario === 'multipath' && t >= 35 && t < 75 && (i / 10 + index) % 3 === 0;
        sensors.push({ kind: 'range', beacon: index, value: distance(truth, beacon) + 0.5 * rangeNoise[index] + (outlier ? 10 : 0), variance: 0.25, outlier });
      });
      samples.push({ t, truth: [...truth], imu, sensors, acousticOnline });
    }
    return samples;
  }
  function estimate(samples, config = {}) {
    const c = { ...DEFAULTS, ...config };
    if (!Number.isFinite(c.q) || c.q < 0 || !(c.gate > 0)) throw new RangeError('invalid estimator settings');
    let state = { x: [...INITIAL], P: identity().map((r, i) => r.map(v => v * [4, 4, 1, 0.12, 0.12, 0.05][i])) };
    let dead = [...INITIAL], accepted = 0, rejected = 0, latestNis = 0;
    const rows = [{ ...samples[0], ...state, dead: [...dead], accepted, rejected, updates: [], nis: 0 }];
    for (const sample of samples.slice(1)) {
      state = predict(state, sample.imu, c.q);
      dead = transition(dead, sample.imu);
      const updates = [];
      for (const sensor of sample.sensors) {
        const result = correct(state, sensor, c.gate);
        latestNis = result.nis;
        if (result.accepted) accepted++; else rejected++;
        updates.push({ ...sensor, innovation: result.innovation, nis: result.nis, accepted: result.accepted });
        state = { x: result.x, P: result.P };
      }
      rows.push({ ...sample, ...state, dead: [...dead], accepted, rejected, updates, nis: latestNis });
    }
    return rows;
  }
  function metrics(rows) {
    const scored = rows.slice(1);
    if (!scored.length) return { rmse: 0, deadRmse: 0, maxError: 0, endpoint: 0, accepted: 0, rejected: 0, distance: 0, samples: 0 };
    let sum = 0, deadSum = 0, maxError = 0, length = 0;
    scored.forEach((row, i) => {
      const error = distance(row.x, row.truth);
      sum += error ** 2; deadSum += distance(row.dead, row.truth) ** 2;
      maxError = Math.max(maxError, error); length += distance(row.truth, rows[i].truth);
    });
    const last = rows.at(-1);
    return { rmse: Math.sqrt(sum / scored.length), deadRmse: Math.sqrt(deadSum / scored.length), maxError,
      endpoint: distance(last.x, last.truth), accepted: last.accepted, rejected: last.rejected, distance: length, samples: scored.length };
  }
  function ellipsoid(P) {
    const A = P.slice(0, 3).map(r => r.slice(0, 3)), V = identity(3);
    for (let k = 0; k < 25; k++) {
      let p = 0, q = 1;
      for (const [i, j] of [[0, 2], [1, 2]]) if (Math.abs(A[i][j]) > Math.abs(A[p][q])) { p = i; q = j; }
      if (Math.abs(A[p][q]) < 1e-12) break;
      const angle = 0.5 * Math.atan2(2 * A[p][q], A[q][q] - A[p][p]), c = Math.cos(angle), s = Math.sin(angle);
      const J = identity(3); J[p][p] = J[q][q] = c; J[p][q] = s; J[q][p] = -s;
      const next = multiply(multiply(transpose(J), A), J), basis = multiply(V, J);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { A[i][j] = next[i][j]; V[i][j] = basis[i][j]; }
    }
    return { radii: A.map((row, i) => Math.sqrt(Math.max(row[i], 0) * 7.8147279)), basis: V };
  }
  function run(config = {}) {
    const c = { ...DEFAULTS, ...config }, samples = generate(c), rows = estimate(samples, c);
    const ungated = estimate(samples, { ...c, gate: Infinity });
    return { config: c, samples, rows, ungated, metrics: metrics(rows), ungatedMetrics: metrics(ungated) };
  }
  return { DT, DURATION, STEPS, INITIAL, BEACONS, SCENARIOS, DEFAULTS, identity, multiply, transpose,
    distance, transition, predict, observation, correct, generate, estimate, metrics, ellipsoid, run };
});
