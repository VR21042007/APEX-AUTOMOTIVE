import { chromium } from 'playwright-core'

const url = process.argv[2] || 'http://127.0.0.1:5173'
const width = Number(process.argv[3] || 1440)
const height = Number(process.argv[4] || 900)
const prefix = process.argv[5] || 'tools/stage'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const errors = []
page.on('pageerror', (error) => errors.push(error.message))
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000, state: 'attached' })
await page.waitForTimeout(4000)

const story = await page.evaluate(() => window.__apexStory)
if (!story) throw new Error('Cinematic story trigger was not initialized.')

const checkpoints = [
  ['hero', story.start],
  ['verticals', story.start + (story.end - story.start) * 0.22],
  ['aerodynamics', story.start + (story.end - story.start) * 0.45],
  ['cockpit', story.start + (story.end - story.start) * 0.68],
  ['final', story.start + (story.end - story.start) * 0.88],
  ['release', story.end - 12],
]

const results = []
for (const [name, y] of checkpoints) {
  await page.evaluate((top) => window.scrollTo(0, top), y)
  await page.waitForTimeout(1800)
  const info = await page.evaluate(() => ({
    stage: document.querySelector('.cinematic-frame')?.dataset.stage,
    activePanel: document.querySelector('.story-panel.is-active')?.className || null,
    scrollY: Math.round(window.scrollY),
  }))
  await page.screenshot({
    path: `${prefix}-${name}.png`,
    type: 'png',
    timeout: 120000,
    animations: 'disabled',
  })
  results.push({ name, ...info })
}

console.log(JSON.stringify({ story, results, errors }, null, 2))
await browser.close()
