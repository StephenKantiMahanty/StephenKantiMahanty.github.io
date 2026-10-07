import { uPlot } from './vendor.js';
const M = window.AbyssNavigation;
export function createCharts(inspect) {
  let plots = [], run, observers = [];
  function make(id, data, names, colors, output, depth = false) {
    const target = document.getElementById(id);
    let pointerActive = false;
    target.addEventListener('pointerenter', () => { pointerActive = true; });
    target.addEventListener('pointerleave', () => { pointerActive = false; });
    const plot = new uPlot({
      width: Math.max(220, target.clientWidth), height: 220,
      padding: [14, 9, 0, 0], legend: { show: false },
      cursor: { y: false, drag: { x: false, y: false }, points: { size: 5 }, focus: { prox: 20 } },
      select: { show: false }, scales: { x: { time: false }, y: { auto: true, dir: depth ? -1 : 1 } },
      axes: [
        { stroke: '#9bb7ad', font: '12px "IBM Plex Sans", sans-serif', grid: { show: false }, ticks: { show: false },
          values: (_, ticks) => ticks.map(t => t + 's'), size: 28 },
        { stroke: '#9bb7ad', font: '12px "IBM Plex Sans", sans-serif', size: 44, gap: 6,
          grid: { stroke: '#263a34', width: 1 }, ticks: { show: false },
          values: (_, ticks) => ticks.map(t => t.toFixed(depth ? 1 : 2)) }
      ],
      series: [{}, ...names.map((name, i) => ({ label: name, stroke: colors[i], width: i ? 1.1 : 1.8,
        dash: i ? [4, 4] : [], points: { show: false }, value: (_, value) => value == null ? '—' : value.toFixed(3) + ' m' }))],
      hooks: { setCursor: [u => {
        if (!pointerActive || u.cursor.idx == null) return;
        inspect(u.cursor.idx);
      }] }
    }, data, target);
    const observer = new ResizeObserver(() => plot.setSize({ width: Math.max(220, target.clientWidth), height: 220 }));
    observer.observe(target); observers.push(observer);
    return { plot, data, output };
  }
  return {
    setRun(next) {
      run = next;
      plots.forEach(p => p.plot.destroy()); observers.forEach(o => o.disconnect()); observers = [];
      const t = run.rows.map(r => r.t);
      plots = [
        make('error-chart', [t, run.rows.map(r => M.distance(r.x, r.truth)), run.ungated.map(r => M.distance(r.x, r.truth))],
          ['Gated EKF', 'Ungated EKF'], ['#b3e4ae', '#e7b579'], 'error-hover'),
        make('depth-chart', [t, run.rows.map(r => r.x[2]), run.rows.map(r => r.truth[2])],
          ['Estimate', 'Reference'], ['#b3e4ae', '#93aab0'], 'depth-hover', true)
      ];
    },
    setIndex(index) {
      plots.forEach(({ plot, data, output }) => {
        plot.setCursor({ left: plot.valToPos(data[0][index], 'x'), top: -10 }, false);
        document.getElementById(output).textContent = data[1][index].toFixed(2) + ' m / ' + data[0][index].toFixed(1) + ' s';
      });
    },
    dispose() { plots.forEach(p => p.plot.destroy()); observers.forEach(o => o.disconnect()); }
  };
}
