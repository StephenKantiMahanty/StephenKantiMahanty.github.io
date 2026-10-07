const { chromium } = require('C:/Users/steph/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true,args:['--enable-unsafe-swiftshader','--use-angle=swiftshader']});
  const page = await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[]; page.on('pageerror',e=>errors.push(e.message)); page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.goto('http://127.0.0.1:8337/kalman/');
  await page.waitForFunction(()=>document.body.dataset.ready==='true',{timeout:20000});
  await page.waitForTimeout(700);
  fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'screenshots','desktop.png'),fullPage:true});
  await page.locator('#mission').scrollIntoViewIfNeeded(); await page.waitForTimeout(300);
  await page.screenshot({path:path.join(__dirname,'screenshots','mission.png')});
  const info=await page.evaluate(()=>({ready:document.body.dataset.ready,title:document.title,hero:document.getElementById('hero-rmse').textContent,gl:!!document.getElementById('scene').getContext('webgl2'),fallback:!document.getElementById('scene-fallback').hidden,width:document.documentElement.scrollWidth,innerWidth:innerWidth}));
  console.log(JSON.stringify({info,errors},null,2));
  await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
