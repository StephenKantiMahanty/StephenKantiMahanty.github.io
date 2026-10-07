const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium } = require('C:/Users/steph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const root = path.join(__dirname,'screenshots');
const origin='http://127.0.0.1:8337';
let browser;
async function ready(page){await page.goto(origin+'/kalman/');await page.waitForFunction(()=>document.body.dataset.ready==='true');await page.waitForTimeout(500);}
async function audit(page){
  return page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,
    overflow:[...document.querySelectorAll('main *')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&(b.right>innerWidth+1||b.left< -1)&&!e.closest('.uplot')&&!e.matches('.sr-only')}).map(e=>e.id||e.className).slice(0,15)}));
}
(async()=>{
  fs.mkdirSync(root,{recursive:true});
  browser=await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const evidence={layouts:[],journeys:[],errors:[],requests:[],limits:['Headless Edge/Chromium with software WebGL; no physical device, Safari, or screen-reader testing.']};
  const page=await browser.newPage({viewport:{width:1440,height:1000},acceptDownloads:true});
  page.on('pageerror',e=>evidence.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')evidence.errors.push(m.text())});
  page.on('request',r=>{if(!r.url().startsWith(origin)&&!r.url().startsWith('blob:'))evidence.requests.push(r.url())});
  await ready(page);
  assert.equal(await page.locator('#scrub').inputValue(),'260');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('#scrub').inputValue(),'260','idle initialization must not scrub the mission');
  await page.screenshot({path:path.join(root,'hero-desktop.png')});
  await page.locator('#mission').scrollIntoViewIfNeeded();await page.waitForTimeout(100);
  await page.screenshot({path:path.join(root,'mission-desktop.png')});
  for(const scenario of ['survey','blackout','multipath','current']){
    await page.locator('[data-scenario="'+scenario+'"]').click();
    assert.equal(await page.locator('[data-scenario="'+scenario+'"]').getAttribute('aria-pressed'),'true');
    assert.match(await page.locator('#mission-state').textContent(),/paused/i);
    assert.equal(await page.locator('#scrub').inputValue(),scenario==='survey'?'260':'520');
    if(scenario==='blackout')assert.match(await page.locator('#acoustic-status').textContent(),/offline/i);
    evidence.journeys.push({scenario,clock:await page.locator('#clock').textContent(),error:await page.locator('#error').textContent()});
  }
  await page.locator('#restart').click(); assert.equal(await page.locator('#scrub').inputValue(),'0');
  await page.locator('#scrub').focus(); await page.keyboard.press('ArrowRight'); assert.equal(await page.locator('#scrub').inputValue(),'1');
  await page.locator('#play').click();await page.waitForTimeout(700);
  assert.ok(Number(await page.locator('#scrub').inputValue())>1);
  await page.locator('#play').click();
  const paused=await page.locator('#scrub').inputValue();await page.waitForTimeout(200);
  assert.equal(await page.locator('#scrub').inputValue(),paused);
  await page.locator('#scrub').focus();await page.keyboard.press('End');
  assert.equal(await page.locator('#scrub').inputValue(),'1200');assert.match(await page.locator('#mission-state').textContent(),/complete/i);
  await page.locator('[data-scenario="multipath"]').click();
  for(const view of ['top','follow','overview']){
    await page.locator('[data-view="'+view+'"]').click();await page.waitForTimeout(200);
    assert.equal(await page.locator('[data-view="'+view+'"]').getAttribute('aria-pressed'),'true');
  }
  await page.locator('#show-drift').check();await page.locator('#show-uncertainty').uncheck();
  await page.locator('#show-uncertainty').check();await page.locator('#show-drift').uncheck();
  await page.locator('#fullscreen').click();
  assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);
  await page.locator('#fullscreen').click();await page.waitForTimeout(150);
  assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);
  evidence.fullscreen=true;
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#export').click()]);
  const csvPath=path.join(__dirname,'export.csv');await download.saveAs(csvPath);
  const lines=fs.readFileSync(csvPath,'utf8').trim().split('\n');
  assert.equal(lines.length,1202);assert.equal(lines[0].split(',').length,22);
  assert.ok(lines.every(line=>line.split(',').length===22));
  assert.equal(lines.at(-1).split(',')[0],'120');assert.match(download.suggestedFilename(),/multipath-seed42/);
  evidence.csv={file:download.suggestedFilename(),rows:lines.length-1,columns:22};
  await page.locator('#error-chart').scrollIntoViewIfNeeded();
  const chart=await page.locator('#error-chart .u-over').boundingBox();
  await page.mouse.move(chart.x+chart.width*0.5,chart.y+chart.height*0.5);
  await page.waitForTimeout(100);
  const inspected=Number(await page.locator('#scrub').inputValue());
  assert.ok(inspected>550&&inspected<650,'chart hover should select approximately 60s');
  evidence.chartHoverSeconds=inspected*0.1;
  await page.mouse.move(0,0);
  for(const width of [1440,1280,768,390,320]){
    await page.setViewportSize({width,height:width<600?844:1000});await page.waitForTimeout(200);
    const layout=await audit(page);assert.equal(layout.scroll,width);assert.deepEqual(layout.overflow,[]);
    evidence.layouts.push(layout);
    if(width===390||width===320){
      await page.evaluate(()=>document.getElementById('mission').scrollIntoView({block:'start'}));
      await page.waitForTimeout(650);
      await page.screenshot({path:path.join(root,'mission-'+width+'.png'),fullPage:false});
      await page.goto(origin+'/kalman/');await page.waitForFunction(()=>document.body.dataset.ready==='true');
      await page.waitForTimeout(850);
      await page.screenshot({path:path.join(root,'hero-'+width+'.png')});
      await page.evaluate(()=>document.getElementById('engineering').scrollIntoView({block:'start'}));
      await page.waitForTimeout(650);
      await page.screenshot({path:path.join(root,'engineering-'+width+'.png')});
    }
  }
  const reduced=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  await ready(reduced);
  assert.equal(await reduced.locator('#scrub').inputValue(),'260');
  assert.equal(await reduced.evaluate(()=>document.getAnimations().length),0);
  await reduced.locator('[data-view="top"]').click();
  await reduced.locator('#play').click();await reduced.waitForTimeout(300);assert.ok(Number(await reduced.locator('#scrub').inputValue())>260);
  evidence.reducedMotion={animations:0,playback:true};
  const nojs=await browser.newPage({viewport:{width:390,height:844},javaScriptEnabled:false});
  await nojs.goto(origin+'/kalman/');
  assert.ok(await nojs.locator('noscript').isVisible());assert.ok(await nojs.locator('#play').isDisabled());
  assert.match(await nojs.locator('#engineering').textContent(),/Joseph[- ]form/);
  await nojs.screenshot({path:path.join(root,'nojs.png')});evidence.noJavaScript=true;
  const noGL=await browser.newPage({viewport:{width:390,height:844}});
  await noGL.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.startsWith('webgl')?null:original.call(this,type,...args)}});
  await ready(noGL);assert.ok(await noGL.locator('#scene-fallback').isVisible());
  assert.ok(await noGL.locator('[data-view="overview"]').isDisabled());
  await noGL.locator('[data-scenario="multipath"]').click();assert.match(await noGL.locator('#error').textContent(),/m/);
  evidence.noWebGL={fallback:true,telemetry:true};
  assert.deepEqual(evidence.errors,[]);assert.deepEqual(evidence.requests,[]);
  fs.writeFileSync(path.join(__dirname,'verification.json'),JSON.stringify(evidence,null,2));
  console.log(JSON.stringify(evidence,null,2));
  await browser.close();
})().catch(async e=>{console.error(e);await browser?.close();process.exitCode=1;});
