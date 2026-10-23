import { chromium } from 'playwright-core'
import fs from 'node:fs'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const page = await browser.newPage({
  viewport: { width: 1600, height: 1100 },
  deviceScaleFactor: 1,
})

const errors = []
page.on('console', (message) => {
  if (message.type() === 'error') console.log('[browser]', message.text())
})
page.on('pageerror', (error) => errors.push(error.message))

fs.mkdirSync('public/images', { recursive: true })

const renders = [
  { view: 'hero', output: 'public/images/astra-hero.jpg' },
  { view: 'side', output: 'public/images/astra-side.jpg' },
  { view: 'front', output: 'public/images/astra-front.jpg' },
  { view: 'rear', output: 'public/images/astra-rear.jpg' },
  { view: 'detail', output: 'public/images/astra-detail.jpg' },
]

for (const render of renders) {
  await page.goto(`http://127.0.0.1:5173/tools/studio.html?view=${render.view}`, {
    waitUntil: 'networkidle',
    timeout: 120000,
  })
  await page.waitForFunction(
    () => document.body.dataset.ready === 'true' || document.body.dataset.error,
    { timeout: 120000 },
  )
  const state = await page.evaluate(() => ({
    ready: document.body.dataset.ready,
    error: document.body.dataset.error,
  }))
  if (state.error) throw new Error(state.error)
  await page.waitForTimeout(700)
  await page.screenshot({ path: render.output, type: 'jpeg', quality: 91 })
  console.log('rendered', render.view, '->', render.output)
}

console.log(JSON.stringify({ errors }, null, 2))
await browser.close()
