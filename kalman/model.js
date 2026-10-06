/* Shared by the dependency-free browser activity and Node numerical tests. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AbyssModel = api;
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  const DT = 0.2, DURATION = 60, STEPS = Math.round(DURATION / DT);
  const DEFAULTS = Object.freeze({ seed: 42, scenario: 'nominal', sensorSigma: 0.8, accelSigma: 0.08, q: 0.0064, r: 0.64 });
  function nonnegative(value, name) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError(`${name} must be finite and nonnegative`);
  }
  function positive(value, name) {
    if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be finite and positive`);
  }
  function validateWorld(c) {
    if (!Number.isInteger(c.seed) || c.seed < 0 || c.seed > 4294967295) throw new RangeError('seed must be an unsigned 32-bit integer');
    if (!['nominal', 'dropout', 'current', 'bias'].includes(c.scenario)) throw new RangeError('scenario must be nominal, dropout, current or bias');
    nonnegative(c.sensorSigma, 'sensorSigma'); nonnegative(c.accelSigma, 'accelSigma');
    if (!Number.isFinite(c.sensorSigma ** 2) || !Number.isFinite(c.accelSigma ** 2)) throw new RangeError('noise variance must be finite');
  }
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
  function predict(x, P, h, u, q) {
    nonnegative(q, 'q'); positive(h, 'time step');
    if (!Number.isFinite(u)) throw new RangeError('acceleration must be finite');
    const b0 = h * h / 2, b1 = h;
    return {
      x: [x[0] + h * x[1] + b0 * u, x[1] + b1 * u],
      P: [[P[0][0] + h * (P[0][1] + P[1][0]) + h * h * P[1][1] + q * b0 * b0,
        P[0][1] + h * P[1][1] + q * b0 * b1],
      [P[1][0] + h * P[1][1] + q * b0 * b1, P[1][1] + q * b1 * b1]]
    };
  }
  function correct(prediction, z, r) {
    positive(r, 'R');
    if (z === null) return { ...prediction, K: [0, 0], innovation: null, S: null };
    if (!Number.isFinite(z)) throw new RangeError('position fix must be finite or null');
    const { x, P } = prediction;
    const S = P[0][0] + r, K = [P[0][0] / S, P[1][0] / S], innovation = z - x[0];
    // Joseph form: (I-KH) P (I-KH)' + K R K'. H = [1,0].
    const A = [[1 - K[0], 0], [-K[1], 1]];
    const AP = A.map(row => [row[0] * P[0][0] + row[1] * P[1][0], row[0] * P[0][1] + row[1] * P[1][1]]);
    const C = A.map((row, i) => A.map((other, j) => AP[i][0] * other[0] + AP[i][1] * other[1] + K[i] * r * K[j]));
    const cross = (C[0][1] + C[1][0]) / 2;
    C[0][1] = C[1][0] = cross;
    return { x: [x[0] + K[0] * innovation, x[1] + K[1] * innovation], P: C, K, innovation, S };
  }
  function generate(config = {}) {
    const c = { ...DEFAULTS, ...config };
    validateWorld(c);
    const rng = random(c.seed);
    let truth = [7, 0.1];
    const data = [{ t: 0, truth: [...truth], z: null, u: 0, event: 'Initial state' }];
    for (let i = 1; i <= STEPS; i++) {
      const t = i * DT, u = 0.07 * Math.cos(t * 0.2) - 0.035 * Math.sin(t * 0.4);
      // Always consume both noises, even during dropout. Tuning never enters generation.
      const disturbance = c.accelSigma * normal(rng), noise = c.sensorSigma * normal(rng);
      const active = t >= 20 && t < 40;
      const current = c.scenario === 'current' && active ? 0.045 : 0;
      const bias = c.scenario === 'bias' && t >= 20 ? 2 : 0;
      truth = predict(truth, [[0, 0], [0, 0]], DT, u + disturbance + current, 0).x;
      const dropout = c.scenario === 'dropout' && t >= 20 && t < 36;
      data.push({ t, truth: [...truth], u, z: dropout ? null : truth[0] + noise + bias,
        event: dropout ? 'Fix unavailable · prediction only' : current ? 'Unmodeled current · +0.045 m/s²' : bias ? 'Sensor bias · +2 m' : 'Position fix received' });
    }
    return data;
  }
  function estimate(data, config = {}) {
    const c = { ...DEFAULTS, ...config };
    nonnegative(c.q, 'q'); positive(c.r, 'R');
    let state = { x: [7, 0.1], P: [[1, 0], [0, 0.04]] }, dead = [7, 0.1];
    const rows = [{ ...data[0], ...state, dead: [...dead], prior: state, K: [0, 0], innovation: null, S: null }];
    for (const sample of data.slice(1)) {
      const prior = predict(state.x, state.P, DT, sample.u, c.q);
      state = correct(prior, sample.z, c.r);
      dead = predict(dead, [[0, 0], [0, 0]], DT, sample.u, 0).x;
      rows.push({ ...sample, ...state, prior, dead: [...dead] });
    }
    return rows;
  }
  function metrics(rows) {
    let sensor = 0, filter = 0, dead = 0, count = 0, covered = 0;
    const scored = rows.slice(1);
    for (const row of scored) {
      const error = row.x[0] - row.truth[0];
      filter += error * error;
      dead += (row.dead[0] - row.truth[0]) ** 2;
      if (Math.abs(error) <= 1.96 * Math.sqrt(row.P[0][0])) covered++;
      if (row.z !== null) { sensor += (row.z - row.truth[0]) ** 2; count++; }
    }
    return { sensor: count ? Math.sqrt(sensor / count) : null,
      filter: scored.length ? Math.sqrt(filter / scored.length) : null,
      dead: scored.length ? Math.sqrt(dead / scored.length) : null,
      coverage: scored.length ? 100 * covered / scored.length : null, fixes: count, steps: scored.length };
  }
  return { DT, DURATION, STEPS, DEFAULTS, predict, correct, generate, estimate, metrics };
});
