import { chromium } from 'playwright-core'
const args = process.env.NO_SWIFT ? [] : ['--use-angle=swiftshader','--enable-webgl','--ignore-gpu-blocklist']
console.log('args', args)
const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true, args })
const page = await browser.newPage({ viewport:{width:1200,height:800}, deviceScaleFactor:1 })
const errors=[]; page.on('pageerror', e=>errors.push(e.message))
await page.goto('http://127.0.0.1:5173', { waitUntil:'networkidle', timeout:120000 })
for (let i=0;i<6;i++) {
  await page.waitForTimeout(5000)
  const info = await page.evaluate(()=>({site:document.querySelector('.site')?.className, loader:document.querySelector('.loader')?.className||null, counter:document.querySelector('.loader__counter')?.innerText, canvases:document.querySelectorAll('canvas').length}))
  console.log(i, info)
  if (info.site?.includes('entered')) break
}
console.log({errors})
await page.screenshot({path: process.env.NO_SWIFT?'tools/diagnose-gpu.png':'tools/diagnose-swift.png', timeout:120000})
await browser.close()
