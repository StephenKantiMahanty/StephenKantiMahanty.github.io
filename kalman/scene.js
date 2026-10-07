import { THREE, OrbitControls } from './vendor.js';
const M = window.AbyssNavigation;
const point = state => new THREE.Vector3(state[0] - 22, 24 - state[2], state[1] - 3);
export function createMissionScene(canvas, label, reducedMotion) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.setClearColor(0x081d21);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x081d21, 0.007);
  const camera = new THREE.PerspectiveCamera(43, 1, 0.1, 300);
  camera.position.set(48, 43, 54);
  const controls = new OrbitControls(camera, canvas);
  controls.target.set(0, 8, -3);
  controls.enableDamping = !reducedMotion;
  controls.dampingFactor = 0.09;
  controls.minDistance = 12; controls.maxDistance = 145;
  controls.maxPolarAngle = Math.PI / 2 - 0.035;
  controls.enablePan = true;
  controls.update();
  scene.add(new THREE.HemisphereLight(0xaedbd3, 0x0c2020, 2.5));
  const sunlight = new THREE.DirectionalLight(0xd9ede1, 3.1); sunlight.position.set(-22, 80, 35); scene.add(sunlight);
  const rim = new THREE.DirectionalLight(0x54c9be, 1.4); rim.position.set(32, 10, -30); scene.add(rim);
  const floorGeo = new THREE.PlaneGeometry(105, 85, 42, 34);
  floorGeo.rotateX(-Math.PI / 2);
  const vertices = floorGeo.attributes.position;
  const colors = [];
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i), z = vertices.getZ(i);
    const height = -2.6 + 0.8 * Math.sin(x * 0.13) * Math.cos(z * 0.17) + 0.45 * Math.sin(x * 0.5 + z * 0.32);
    vertices.setY(i, height);
    const color = new THREE.Color().setRGB(0.048 + height * 0.002, 0.145 + height * 0.006, 0.145 + height * 0.006);
    colors.push(color.r, color.g, color.b);
  }
  floorGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  floorGeo.computeVertexNormals();
  scene.add(new THREE.Mesh(floorGeo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  const grid = new THREE.GridHelper(100, 20, 0x3b706a, 0x235455);
  grid.position.y = -1.1;
  grid.material.transparent = true; grid.material.opacity = 0.26;
  scene.add(grid);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x1c3b3b, roughness: 1, flatShading: true });
  for (let i = 0; i < 28; i++) {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(1, 0), rockMat);
    rock.position.set(Math.sin(i * 3.53) * 45, -1.8, Math.cos(i * 5.71) * 34);
    const size = 0.4 + (i % 5) * 0.24; rock.scale.set(size * 1.5, size, size);
    rock.rotation.set(i * 0.34, i * 0.6, i * 0.17); scene.add(rock);
  }
  const beacons = [];
  for (const [index, b] of M.BEACONS.entries()) {
    const group = new THREE.Group(); group.position.copy(point(b));
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 1.1, 8), new THREE.MeshStandardMaterial({ color: 0x6b927d, metalness: 0.5, roughness: 0.5 }));
    base.position.y = -0.4; group.add(base);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8), rockMat); pole.position.y = 0.9; group.add(pole);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), new THREE.MeshBasicMaterial({ color: 0xb3e4ae })); lamp.position.y = 2.2; group.add(lamp);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.7, 1.75, 48), new THREE.MeshBasicMaterial({ color: 0x719b83, transparent: true, opacity: 0.3, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.4; group.add(ring);
    scene.add(group); beacons.push({ group, lamp, index });
  }
  const robot = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xe1e8dd, metalness: 0.48, roughness: 0.32 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x183030, metalness: 0.62, roughness: 0.3 });
  const orangeMat = new THREE.MeshStandardMaterial({ color: 0xcaad64, metalness: 0.25, roughness: 0.45 });
  const hull = new THREE.Mesh(new THREE.CapsuleGeometry(0.53, 2.1, 8, 20), bodyMat); hull.rotation.z = Math.PI / 2; robot.add(hull);
  for (const x of [-0.8, 0.8]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.18, 20), orangeMat); band.rotation.z = Math.PI / 2; band.position.x = x; robot.add(band);
  }
  const pod = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.55, 0.76), darkMat); pod.position.y = -0.45; robot.add(pod);
  for (const z of [-0.8, 0.8]) {
    const strut = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.18, 1.7), darkMat); strut.position.set(-0.7, -0.15, 0); robot.add(strut);
    const thruster = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.55, 16, 1, true), darkMat);
    thruster.rotation.z = Math.PI / 2; thruster.position.set(-0.7, -0.15, z); robot.add(thruster);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.018, 8, 18), new THREE.MeshBasicMaterial({ color: 0xb3e4ae }));
    glow.rotation.y = Math.PI / 2; glow.position.set(-0.99, -0.15, z); robot.add(glow);
  }
  const lens = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8), new THREE.MeshBasicMaterial({ color: 0xb3e4ae }));
  lens.position.set(1.64, 0, 0); robot.add(lens);
  const light = new THREE.PointLight(0xb0eaca, 2, 8); light.position.set(1.8, 0.2, 0); robot.add(light);
  scene.add(robot);
  const uncertainty = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 12),
    new THREE.MeshBasicMaterial({ color: 0xb3e4ae, transparent: true, opacity: 0.22, wireframe: true, depthWrite: false }));
  scene.add(uncertainty);
  const projection = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]),
    new THREE.LineDashedMaterial({ color: 0x648e7b, transparent: true, opacity: 0.6, dashSize: 0.25, gapSize: 0.3 }));
  scene.add(projection);
  const beamGroup = new THREE.Group(); scene.add(beamGroup);
  const beams = M.BEACONS.map(b => {
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([point(b), point(INITIAL_STATE())]),
      new THREE.LineBasicMaterial({ color: 0x73cba8, transparent: true, opacity: 0.14, depthWrite: false }));
    beamGroup.add(line); return line;
  });
  function INITIAL_STATE() { return M.INITIAL; }
  const trailGroup = new THREE.Group(); scene.add(trailGroup);
  let trajectories = {}, rows = [], frame = null, view = 'overview', showDrift = false, showUncertainty = true, visible = true, currentIndex = 0;
  let cameraTarget = null, dirty = false, lastFrame = performance.now(), frameDelta = 1 / 60;
  function setPose(value) {
    if (!rows.length) return;
    const bounded = Math.max(0, Math.min(value, rows.length - 1));
    const first = Math.floor(bounded), fraction = bounded - first;
    const a = rows[first].x, b = rows[Math.min(first + 1, rows.length - 1)].x;
    const state = a.map((v, i) => v + (b[i] - v) * fraction);
    robot.position.copy(point(state));
    robot.rotation.y = -Math.atan2(state[4], state[3]);
    robot.rotation.z = Math.atan2(-state[5], Math.hypot(state[3], state[4]));
    uncertainty.position.copy(robot.position);
    projection.geometry.attributes.position.setXYZ(0, robot.position.x, robot.position.y, robot.position.z);
    projection.geometry.attributes.position.setXYZ(1, robot.position.x, -1, robot.position.z);
    projection.geometry.attributes.position.needsUpdate = true;
    beams.forEach(line => { line.geometry.attributes.position.setXYZ(1, robot.position.x, robot.position.y, robot.position.z); line.geometry.attributes.position.needsUpdate = true; });
    // This is drawing interpolation only; covariance, charts, telemetry and CSV stay on exact samples.
    canvas.dataset.renderSample = bounded.toFixed(4);
    dirty = true;
  }
  function lineFor(points, color, opacity, dashed = false) {
    const mat = dashed ? new THREE.LineDashedMaterial({ color, transparent: true, opacity, dashSize: 0.5, gapSize: 0.4 })
      : new THREE.LineBasicMaterial({ color, transparent: true, opacity });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), mat);
    if (dashed) line.computeLineDistances();
    trailGroup.add(line); return line;
  }
  function setRun(run) {
    for (const child of [...trailGroup.children]) { trailGroup.remove(child); child.geometry.dispose(); child.material.dispose(); }
    rows = run.rows;
    const estimatePoints = rows.map(r => point(r.x));
    trajectories.reference = lineFor(rows.map(r => point(r.truth)), 0x91aeb1, 0.3, true);
    trajectories.estimate = lineFor(estimatePoints, 0xc2ffba, 1);
    trajectories.drift = lineFor(rows.map(r => point(r.dead)), 0xb29bdb, 0.65, true);
    const curve = new THREE.CatmullRomCurve3(estimatePoints.filter((_, i) => i % 4 === 0));
    trajectories.tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 600, 0.05, 5, false),
      new THREE.MeshBasicMaterial({ color: 0xa8e6a3, transparent: true, opacity: 0.7 }));
    trailGroup.add(trajectories.tube);
    setIndex(currentIndex);
  }
  function setIndex(index) {
    if (!rows.length) return;
    currentIndex = Math.max(0, Math.min(index, rows.length - 1));
    const row = rows[currentIndex], p = point(row.x);
    robot.position.copy(p);
    robot.rotation.y = -Math.atan2(row.x[4], row.x[3]);
    robot.rotation.z = Math.atan2(-row.x[5], Math.hypot(row.x[3], row.x[4]));
    const ellipsoid = M.ellipsoid(row.P), basis = ellipsoid.basis;
    // Transform covariance basis from east/north/depth to scene x/y/z.
    const matrix = new THREE.Matrix4().set(
      basis[0][0], basis[0][1], basis[0][2], 0,
      -basis[2][0], -basis[2][1], -basis[2][2], 0,
      basis[1][0], basis[1][1], basis[1][2], 0,
      0, 0, 0, 1);
    uncertainty.quaternion.setFromRotationMatrix(matrix);
    uncertainty.position.copy(p); uncertainty.scale.set(...ellipsoid.radii);
    uncertainty.visible = showUncertainty;
    trajectories.estimate.geometry.setDrawRange(0, currentIndex + 1);
    trajectories.tube.geometry.setDrawRange(0, Math.floor(600 * currentIndex / M.STEPS) * 5 * 6);
    trajectories.drift.visible = showDrift;
    trajectories.drift.geometry.setDrawRange(0, currentIndex + 1);
    projection.geometry.attributes.position.setXYZ(0, p.x, p.y, p.z);
    projection.geometry.attributes.position.setXYZ(1, p.x, -1, p.z);
    projection.geometry.attributes.position.needsUpdate = true; projection.computeLineDistances();
    beams.forEach((line, i) => {
      line.geometry.attributes.position.setXYZ(1, p.x, p.y, p.z); line.geometry.attributes.position.needsUpdate = true;
      line.visible = row.acousticOnline;
      line.material.opacity = (currentIndex % 10 < 3 ? 0.16 : 0.04);
      beacons[i].lamp.material.color.set(row.acousticOnline ? 0xb3e4ae : 0xe7b579);
    });
    setPose(currentIndex); render();
  }
  function resize() {
    const rect = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    // Keep the HTML label inside the viewport even while offscreen rendering is paused.
    const labelWidth = label.offsetWidth || 115;
    label.style.left = Math.max(15, Math.min(rect.width - labelWidth - 15, Number.parseFloat(label.style.left) || 15)) + 'px';
    camera.aspect = rect.width / rect.height; camera.updateProjectionMatrix(); render();
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas.parentElement);
  function render(controlsUpdated = false) {
    if (!visible) return;
    if (cameraTarget) {
      const mix = reducedMotion ? 1 : 1 - Math.exp(-8 * frameDelta);
      camera.position.lerp(cameraTarget.position, mix); controls.target.lerp(cameraTarget.target, mix);
      if (camera.position.distanceTo(cameraTarget.position) < 0.02 && controls.target.distanceTo(cameraTarget.target) < 0.02) {
        camera.position.copy(cameraTarget.position); controls.target.copy(cameraTarget.target); cameraTarget = null;
      }
    }
    if (view === 'follow' && rows.length) {
      const p = robot.position;
      controls.target.lerp(p, reducedMotion ? 1 : 1 - Math.exp(-10 * frameDelta));
      camera.position.lerp(p.clone().add(new THREE.Vector3(12, 9, 16)), reducedMotion ? 1 : 1 - Math.exp(-8 * frameDelta));
    }
    if (!controlsUpdated || cameraTarget || view === 'follow') controls.update();
    renderer.render(scene, camera); dirty = false;
    const screen = robot.position.clone().project(camera);
    const width = canvas.clientWidth, height = canvas.clientHeight;
    label.hidden = Math.abs(screen.x) > 1 || Math.abs(screen.y) > 1;
    const labelWidth = label.offsetWidth || 115;
    label.style.left = Math.max(15, Math.min(width - labelWidth - 15, (screen.x * 0.5 + 0.5) * width + 17)) + 'px';
    label.style.top = Math.max(95, Math.min(height - 95, (-screen.y * 0.5 + 0.5) * height - 20)) + 'px';
  }
  function tick(time) {
    frame = requestAnimationFrame(tick);
    frameDelta = Math.min(Math.max((time - lastFrame) / 1000, 0.001), 0.05); lastFrame = time;
    if (!visible) return;
    const followMoving = view === 'follow' && rows.length &&
      (controls.target.distanceTo(robot.position) > 0.01 || camera.position.distanceTo(robot.position.clone().add(new THREE.Vector3(12, 9, 16))) > 0.01);
    const controlsChanged = controls.update();
    if (dirty || cameraTarget || followMoving || controlsChanged) render(true);
  }
  // Render only while in view; pause work when tab is hidden.
  let inViewport = true;
  const intersection = new IntersectionObserver(entries => { inViewport = entries[0].isIntersecting; visible = inViewport && !document.hidden; if (visible) render(); });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', () => { visible = inViewport && !document.hidden; if (visible) render(); });
  controls.addEventListener('start', () => {
    cameraTarget = null; view = 'free';
    canvas.dispatchEvent(new CustomEvent('cameraviewchange'));
  });
  frame = requestAnimationFrame(tick);
  resize();
  return {
    setRun, setIndex,
    setProgress(value) { setPose(value); },
    setReducedMotion(value) {
      reducedMotion = value; controls.enableDamping = !value;
      setPose(currentIndex); render();
    },
    setView(next) {
      view = next;
      const position = next === 'top' ? new THREE.Vector3(0, 88, -2.95) : new THREE.Vector3(48, 43, 54);
      cameraTarget = { position, target: new THREE.Vector3(0, 8, -3) };
      if (next === 'follow') cameraTarget = null;
      render();
    },
    setLayers(drift, confidence) { showDrift = drift; showUncertainty = confidence; setIndex(currentIndex); },
    dispose() { if (frame) cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); controls.dispose(); renderer.dispose(); }
  };
}
