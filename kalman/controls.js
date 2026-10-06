/* Physical values stay exact at an explicitly matched slider tick. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.AbyssControls = api;
})(typeof window === 'undefined' ? this : window, function () {
  'use strict';
  function varianceScale(min, max, zero = false) {
    const first = zero ? 1 : 0, last = 322;
    let anchor;
    return {
      encode(physical) {
        const tick = physical === 0 && zero ? 0 : Math.max(first, Math.min(last,
          Math.round(first + (Math.log10(physical) - Math.log10(min)) / Math.log10(max / min) * (last - first))));
        anchor = { tick, physical };
        return tick;
      },
      decode(tick) {
        if (anchor && tick === anchor.tick) return anchor.physical;
        if (zero && tick === 0) return 0;
        return Number((min * (max / min) ** ((tick - first) / (last - first))).toPrecision(4));
      }
    };
  }
  function sceneBounds(rows, baseline = []) {
    let low = 0, high = 14;
    for (const r of rows) {
      const half = 1.96 * Math.sqrt(r.P[0][0]);
      const values = [r.truth[0], r.x[0] - half, r.x[0] + half, r.dead[0]];
      if (r.z !== null) values.push(r.z);
      low = Math.min(low, ...values); high = Math.max(high, ...values);
    }
    for (const r of baseline) { low = Math.min(low, r.x[0]); high = Math.max(high, r.x[0]); }
    return { min: Math.floor((low - 2) / 4) * 4, max: Math.ceil((high + 2) / 4) * 4 };
  }
  return { varianceScale, sceneBounds };
});
