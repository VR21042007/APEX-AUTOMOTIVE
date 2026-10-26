// Usage: node tools/shot.mjs <prefix> <progress...>
// Scrolls the cinematic story to each progress value and saves a screenshot.
import { chromium } from 'playwright-core'

const CHROME = process.env.CHROME_PATH
  || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'C:/Program Files/Google/Chrome/Application/chrome.exe')
const url = process.env.URL || 'http://127.0.0.1:5173/'
const [prefix = 'tools/shot', ...values] = process.argv.slice(2)
const width = Number(process.env.W || 1440)
const height = Number(process.env.H || 900)

const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] })
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => { if (message.type() === 'error' || message.type() === 'warning') errors.push(message.text()) })
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 60000, state: 'attached' }).catch(async (error) => {
  console.log('ERRORS:\n' + [...new Set(errors)].join('\n'))
  await browser.close()
  throw error
})
await page.waitForFunction(() => window.__apexStory, null, { timeout: 30000 })
await page.waitForTimeout(1500)
const story = await page.evaluate(() => window.__apexStory)
if (process.env.BARE) await page.addStyleTag({ content: '.story-panel,.hero-stage,.journey-progress,.cinematic-grain{display:none!important}' })
if (process.env.SELECTOR) {
  await page.evaluate((selector) => window.scrollTo(0, document.querySelector(selector).getBoundingClientRect().top + window.scrollY), process.env.SELECTOR)
  await page.waitForTimeout(3000)
  await page.screenshot({ path: `${prefix}-section.png` })
  console.log(`${prefix}-section.png`)
}
for (const value of values.length ? values : ['0']) {
  const progress = Number(value)
  await page.evaluate((top) => window.scrollTo(0, top), story.start + (story.end - story.start) * progress)
  await page.waitForTimeout(Number(process.env.WAIT || 2200))
  const file = `${prefix}-${value}.png`
  await page.screenshot({ path: file })
  const info = await page.evaluate(() => ({ stage: document.querySelector('.cinematic-frame')?.dataset.stage, camera: window.__apexCamera?.position?.map((v) => +v.toFixed(2)) }))
  console.log(file, JSON.stringify(info))
}
if (errors.length) console.log('ERRORS:\n' + [...new Set(errors)].slice(0, 12).join('\n'))
await browser.close()
