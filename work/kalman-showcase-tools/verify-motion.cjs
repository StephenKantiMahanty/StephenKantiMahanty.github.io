const { chromium } = require('C:/Users/steph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const origin = 'http://127.0.0.1:8337';
let browser;
(async () => {
  const evidence = { errors: [], motion: {}, layouts: [], limits: ['Headless Edge/Chromium with software WebGL; no physical-device or cross-engine performance claim.'] };
  browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', e => { evidence.errors.push(e.message); console.error('PAGE ERROR:', e.message); });
  page.on('console', m => { if (m.type() === 'error') { evidence.errors.push(m.text()); console.error('CONSOLE ERROR:', m.text()); } });
  page.on('response', r => { if (r.status() >= 400) console.error('HTTP', r.status(), r.url()); });
  await page.goto(origin + '/kalman/');
  try { await page.waitForFunction(() => document.body.dataset.ready === 'true', null, { timeout: 10000 }); }
  catch (error) { console.error(await page.locator('#scene-fallback').textContent()); throw error; }
  await page.waitForTimeout(950);
  const captureDir = path.join(__dirname, 'motion-screenshots'); fs.mkdirSync(captureDir, { recursive: true });
  await page.screenshot({ path: path.join(captureDir, 'hero-1440.png') });
  assert.equal(await page.locator('#scrub').inputValue(), '260');
  await page.locator('.masthead a[href="#engineering"]').click();
  await page.waitForFunction(() => document.querySelector('#engineering .section-heading').getAnimations().length > 0);
  const entrance = await page.locator('#engineering .section-heading').evaluate(el => ({
    opacity: Number(getComputedStyle(el).opacity), animations: el.getAnimations().length,
  }));
  assert.ok(entrance.opacity < 1);
  evidence.motion.sectionEntrance = entrance;
  await page.waitForTimeout(1200);
  assert.ok(await page.locator('#engineering-title').isVisible());
  const headingTop = await page.locator('#engineering-title').evaluate(el => el.getBoundingClientRect().top);
  assert.ok(headingTop >= 104 && headingTop < 250, 'sticky header must not cover anchor target');
  assert.equal(await page.locator('.masthead a[href="#engineering"]').getAttribute('aria-current'), 'location');
  assert.ok(await page.locator('.reading-progress').evaluate(el => getComputedStyle(el).transform !== 'none'));
  evidence.motion.navigation = { headingTop, currentSection: 'engineering' };
  await page.waitForTimeout(800);
  assert.equal(await page.locator('#engineering [data-reveal-pending]').count(), 0);
  const summary = page.locator('.technical-details summary');
  await summary.scrollIntoViewIfNeeded();
  await summary.click(); await page.waitForTimeout(100);
  assert.ok(await page.locator('.technical-details').evaluate(el => el.open));
  assert.ok(await page.locator('.technical-details>div').evaluate(el => el.getAnimations().length > 0));
  await summary.click(); await summary.click(); await page.waitForTimeout(400);
  assert.equal(await summary.getAttribute('aria-expanded'), 'true');
  assert.equal(await page.locator('.technical-details>div').evaluate(el => el.style.height), '');
  await summary.focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(400);
  assert.equal(await page.locator('.technical-details').evaluate(el => el.open), false);
  evidence.motion.disclosure = { interruptedClicks: true, keyboard: true, settledHeight: 'auto' };
  await page.locator('.masthead a[href="#mission"]').click(); await page.waitForTimeout(1100);
  await page.locator('[data-scenario="blackout"]').click();
  const transitions = await page.evaluate(() => ({
    indicator: document.querySelector('.scenario-indicator').getAnimations().length,
    scene: document.querySelector('.scene-wrap').getAnimations().length,
    telemetry: document.querySelector('.telemetry').getAnimations().length,
    chart: document.querySelector('.chart').getAnimations().length,
  }));
  assert.ok(Object.values(transitions).every(n => n > 0));
  await page.locator('[data-scenario="multipath"]').click(); await page.locator('[data-scenario="current"]').click();
  await page.waitForTimeout(450);
  const indicatorError = await page.evaluate(() => {
    const selected = document.querySelector('[data-scenario][aria-pressed="true"]').getBoundingClientRect();
    const indicator = document.querySelector('.scenario-indicator').getBoundingClientRect();
    return Math.max(Math.abs(selected.left - indicator.left), Math.abs(selected.width - indicator.width));
  });
  assert.ok(indicatorError < 2);
  assert.equal(await page.locator('#scrub').inputValue(), '520');
  evidence.motion.scenarios = { transitions, rapidClicksSettle: true, indicatorError };
  await page.locator('#rate').selectOption('1'); await page.locator('#play').click();
  const samples = await page.evaluate(() => new Promise(resolve => {
    const values = []; function frame() { values.push({ pose: Number(document.querySelector('#scene').dataset.renderSample), sample: Number(document.querySelector('#scrub').value) }); if (values.length < 30) requestAnimationFrame(frame); else resolve(values); } requestAnimationFrame(frame);
  }));
  assert.ok(samples.some(r => r.pose % 1 > 0.01), 'rendering should interpolate between exact numerical samples');
  assert.ok(samples.every(r => r.pose >= r.sample && r.pose < r.sample + 1.001));
  await page.locator('#play').click();
  const paused = await page.locator('#scene').getAttribute('data-render-sample'); await page.waitForTimeout(200);
  assert.equal(await page.locator('#scene').getAttribute('data-render-sample'), paused);
  evidence.motion.replay = { samples, interpolation: true, stablePause: true };
  await page.locator('[data-scenario="blackout"]').click();
  assert.ok(await page.evaluate(() => document.getAnimations().length > 0));
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForTimeout(100);
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  assert.equal(await page.locator('[data-reveal-pending]').count(), 0);
  await page.locator('[data-scenario="multipath"]').click(); await page.locator('#play').click();
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(() => document.getAnimations().length), 0);
  assert.ok(await page.locator('#scene').evaluate(el => Number.isInteger(Number(el.dataset.renderSample))));
  await page.locator('#play').click();
  evidence.motion.liveReducedMotion = true;
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(150);
    const layout = await page.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    assert.equal(layout.width, layout.scrollWidth); evidence.layouts.push(layout);
    await page.screenshot({ path: path.join(captureDir, 'hero-' + width + '.png') });
    await page.locator('#engineering').evaluate(el => el.scrollIntoView({ block: 'start', behavior: 'instant' })); await page.waitForTimeout(100);
    await page.screenshot({ path: path.join(captureDir, 'engineering-' + width + '.png') });
  }
  assert.deepEqual(evidence.errors, []);
  fs.writeFileSync(path.join(__dirname, 'motion-verification.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ motionChecksPassed: true, layouts: evidence.layouts, errors: evidence.errors }));
  await browser.close();
})().catch(async error => { console.error(error); await browser?.close(); process.exitCode = 1; });
