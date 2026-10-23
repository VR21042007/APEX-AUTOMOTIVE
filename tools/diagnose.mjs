import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })
const events = []
page.on('console', (message) => events.push({ type: `console:${message.type()}`, text: message.text() }))
page.on('pageerror', (error) => events.push({ type: 'pageerror', text: error.message, stack: error.stack }))
page.on('requestfailed', (request) => events.push({ type: 'requestfailed', text: `${request.url()} ${request.failure()?.errorText}` }))
page.on('response', (response) => {
  if (response.status() >= 400) events.push({ type: 'response', text: `${response.status()} ${response.url()}` })
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForTimeout(12000)
const info = await page.evaluate(() => ({
  classes: document.querySelector('.site')?.className || null,
  loader: document.querySelector('.loader')?.className || null,
  loaderText: document.querySelector('.loader')?.innerText?.slice(0, 300) || null,
  bodyClass: document.body.className,
  loaderTrack: document.querySelector('.loader__track span')?.getAttribute('style'),
  progress: document.querySelector('.loader__counter')?.innerText,
  canvasCount: document.querySelectorAll('canvas').length,
  rootText: document.getElementById('root')?.innerText?.slice(0, 500),
}))
console.log(JSON.stringify({ info, events }, null, 2))
await page.screenshot({ path: 'tools/diagnose.png', timeout: 120000 })
await browser.close()
