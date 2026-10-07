const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../..');
const file = path.join(root, 'kalman/index.html');
let html = fs.readFileSync(file, 'utf8');
const replacements = [
  ['<link rel="stylesheet" href="vendor.css"><link rel="stylesheet" href="styles.css">', '<link rel="preload" href="fonts/IBMPlexSans-Regular.woff2" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="vendor.css"><link rel="stylesheet" href="styles.css"><link rel="stylesheet" href="typography.css">'],
  ['STEPHEN KANTI MAHANTY', 'Stephen Kanti Mahanty'],
  ['ABYSS / AUTONOMOUS NAVIGATION', 'Abyss · Underwater robotics'],
  ['<h1>Where is<br>the <em>robot?</em></h1>', '<h1>Underwater navigation</h1>'],
  ['DESIGNED & BUILT BY Stephen Kanti Mahanty <span>/</span> ROBOTICS · STATE ESTIMATION · WEBGL', 'Built by Stephen Kanti Mahanty'],
  ['ENGINEERING PROJECT', 'Survey run'], ['04 / 06 STATES', 'Seed 42'],
  ['POSITION RMSE <small>/ SEED 42, SURVEY</small>', 'Position RMSE <small>120-second simulation</small>'],
  ['MISSION WINDOW', 'Mission length'], ['STATE PROPAGATION', 'Filter updates'], ['SENSOR STREAMS', 'Sensor streams'],
  ['<strong>04</strong>', '<strong>4</strong>'],
  ['<p class="eyebrow">01 / MISSION REPLAY</p>', ''], ['Following the vehicle underwater.', 'Mission replay'],
  ['SYNTHETIC DATA · DETERMINISTIC REPLAY', 'Simulated data · Repeatable results'],
  ['<p class="eyebrow">02 / THE SIGNAL BEHIND THE SCENE</p>', ''], ['Seeing how the estimate changes.', 'Sensor traces'],
  ['HOVER A CHART TO INSPECT THE REPLAY', 'Move over a chart to inspect the replay'],
  ['<p class="eyebrow">03 / PERFORMANCE UNDER PRESSURE</p>', ''], ['When the sensors get it wrong.', 'Simulation results'],
  ['FULL MISSION · SAME SEED · 3D POSITION RMSE', '3D position RMSE over the full mission'],
  ['MULTIPATH / OUTLIER REJECTION', 'Multipath test'], ['Lower position error<br>with innovation gating.', 'Rejecting reflected ranges'],
  ['<p class="eyebrow">04 / SYSTEM ARCHITECTURE</p>', ''], ['How I put the estimate together.', 'How the filter works'],
  ['INITIALIZING', 'Loading'], ['MISSION VOLUME / METERS', 'Coordinates in meters'],
  ['EXTENDED KALMAN FILTER', 'Extended Kalman filter'], ['FUSED POSITION', 'Estimated position'],
  ['EAST / NORTH / DEPTH', 'East / North / Depth'], ['DRAG TO ORBIT · SCROLL TO ZOOM', 'Drag to orbit · Scroll to zoom'],
  ['STATE VECTOR', 'Estimated state'], ['>LIVE<', '>Live<'], ['DEPTH ESTIMATE', 'Depth'], ['SENSOR HEALTH', 'Sensors'],
  ['ACCEPTED', 'Accepted'], ['REJECTED', 'Rejected'],
  ['METERS / POSITIVE DOWN', 'Meters · Depth increases downward'], ['>METERS<', '>Meters<'],
  ['GLOBAL FRAME', 'Global frame'], ['THREE AXES', 'Three axes'], ['FOUR BEACONS', 'Four beacons'], ['VERTICAL FIX', 'Depth reading'],
  ['PROPAGATE → GATE → FUSE', 'Predict → Check → Update'],
  ['<span>01 / NUMERICAL STABILITY</span>', ''], ['Joseph-form covariance.', 'Updating covariance'],
  ['<span>02 / NONLINEAR OBSERVATIONS</span>', ''], ['Working with acoustic distance.', 'Acoustic ranges'],
  ['<span>03 / REPRODUCIBLE EVIDENCE</span>', ''], ['Checking the comparison.', 'Checking the results'],
  ['<span class="eyebrow">Abyss · Underwater robotics</span><h2>More of what<br><em>I\'m building.</em></h2>', '<h2>Other projects</h2>'],
  ['ABYSS · ROBOTICS / ESTIMATION / VISUALIZATION', 'Abyss · Underwater state estimation'],
];
for (const [before, after] of replacements) {
  if (before.startsWith('<link rel="stylesheet"') && html.includes('typography.css')) continue;
  html = html.replaceAll(before, after);
}
if (html.includes('<em>') || !html.includes('typography.css')) throw new Error('Typography rewrite did not finish');
fs.writeFileSync(file, html);
console.log('Updated project headings, labels, and typeface references.');
