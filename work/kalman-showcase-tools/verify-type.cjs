const { chromium } = require('C:/Users/steph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
let browser;
(async () => {
  const directory = path.join(__dirname, 'type-screenshots'); fs.mkdirSync(directory, { recursive: true });
  const evidence = { fonts: [], layouts: [], errors: [], externalRequests: [] };
  browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', e => evidence.errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') evidence.errors.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1:8337') && !r.url().startsWith('blob:')) evidence.externalRequests.push(r.url()); });
  await page.goto('http://127.0.0.1:8337/kalman/');
  await page.waitForFunction(() => document.body.dataset.ready === 'true');
  evidence.fonts = await page.evaluate(() => [...document.fonts].map(f => ({ family: f.family, weight: f.weight, status: f.status })));
  assert.ok(evidence.fonts.filter(f => f.family === 'IBM Plex Sans').length === 2);
  assert.ok(evidence.fonts.every(f => f.status === 'loaded'));
  assert.equal(await page.locator('h1 em,h1 br,.project-close em').count(), 0);
  assert.equal(await page.locator('h1').textContent(), 'Underwater navigation');
  for (const width of [1440, 1280, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(100);
    const layout = await page.evaluate(() => {
      const bounds = el => el.getBoundingClientRect();
      const overflow = [...document.querySelectorAll('main *')].filter(el => { const b = bounds(el); return b.width && (b.left < -1 || b.right > innerWidth + 1); }).map(el => el.className || el.id || el.tagName);
      const type = selectors => Object.fromEntries(selectors.map(selector => {
        const el = document.querySelector(selector), style = getComputedStyle(el);
        return [selector, { font: style.fontFamily, size: Number.parseFloat(style.fontSize), weight: style.fontWeight, tracking: style.letterSpacing, lineHeight: style.lineHeight }];
      }));
      return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, overflow, type: type(['h1','.lede','.engineering-notes p','.technical-details>div','.section-note','.inputs strong','.state-badge']) };
    });
    assert.equal(layout.scrollWidth, width); assert.deepEqual(layout.overflow, []);
    for (const selector of ['.lede','.engineering-notes p','.technical-details>div']) assert.ok(layout.type[selector].size >= 16);
    assert.ok(layout.type.h1.size <= 42); assert.equal(layout.type.h1.tracking, 'normal');
    evidence.layouts.push(layout);
    await page.screenshot({ path: path.join(directory, 'hero-' + width + '.png') });
    for (const section of ['mission', 'performance', 'engineering']) {
      await page.locator('#' + section).evaluate(el => el.scrollIntoView({ behavior: 'instant', block: 'start' }));
      await page.waitForTimeout(120);
      await page.screenshot({ path: path.join(directory, section + '-' + width + '.png') });
    }
  }
  await page.locator('.technical-details summary').click();
  assert.ok(await page.locator('.technical-details').evaluate(el => el.open));
  const specification = await page.locator('.technical-details>div').evaluate(el => ({
    width: el.getBoundingClientRect().width, fontSize: Number.parseFloat(getComputedStyle(el).fontSize),
    overflow: el.scrollWidth > el.clientWidth,
  }));
  assert.equal(specification.overflow, false); assert.equal(specification.fontSize, 16);
  await page.locator('.technical-details').screenshot({ path: path.join(directory, 'specification-320.png') });
  evidence.expandedSpecification = specification;
  assert.deepEqual(evidence.errors, []); assert.deepEqual(evidence.externalRequests, []);
  fs.writeFileSync(path.join(__dirname, 'type-verification.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify({ fonts: evidence.fonts, layouts: evidence.layouts.map(({ width, scrollWidth, overflow }) => ({ width, scrollWidth, overflow })), errors: evidence.errors }));
  await browser.close();
})().catch(async e => { console.error(e); await browser?.close(); process.exitCode = 1; });
