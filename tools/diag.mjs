import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
const errors=[]
page.on('console', m=>{ if(m.type()==='error') errors.push(m.text()) })
page.on('pageerror', e=>errors.push(e.message))
await page.goto('http://127.0.0.1:5173', { waitUntil:'domcontentloaded', timeout:60000 })
await page.waitForTimeout(7000)
const info = await page.evaluate(()=>{
  const site = document.querySelector('.site')
  const loader = document.querySelector('.loader')
  return {
    siteClass: site?site.className:null,
    entered: document.querySelector('.site--entered')?true:false,
    loaderVisible: loader?!loader.classList.contains('loader--leaving'):null,
    progress: document.querySelector('.loader__counter span')?.textContent,
    url: window.location.href,
    canvases: document.querySelectorAll('canvas').length
  }
})
console.log(JSON.stringify({info, errors: errors.slice(0,20)}, null, 2))
await page.screenshot({ path: 'tools/diag.png', animations:'disabled' })
await browser.close()
