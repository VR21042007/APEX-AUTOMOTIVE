import { chromium } from 'playwright-core'

const selector = process.argv[2] || '#experience'
const output = process.argv[3] || 'tools/target.png'
const width = Number(process.argv[4] || 1440)
const height = Number(process.argv[5] || 900)
const reduced = process.argv.includes('--reduced')

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({
  viewport: { width, height },
  reducedMotion: reduced ? 'reduce' : 'no-preference',
})
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000 })
await page.waitForTimeout(3000)
await page.evaluate((target) => {
  const node = document.querySelector(target)
  window.scrollTo(0, node.getBoundingClientRect().top + window.scrollY)
}, selector)
await page.waitForTimeout(3000)
await page.screenshot({ path: output, type: 'png', timeout: 120000, animations: 'disabled' })
const info = await page.evaluate(() => ({
  scrollY: Math.round(window.scrollY),
  canvases: document.querySelectorAll('canvas').length,
  stage: document.querySelector('.cinematic-frame')?.dataset.stage,
  height: document.documentElement.scrollHeight,
}))
console.log(JSON.stringify({ info, errors }, null, 2))
await browser.close()
