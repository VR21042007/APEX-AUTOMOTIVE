// Usage: node tools/perf.mjs [progress...]
// Reports frame rate, draw calls and triangles at each scroll position.
import { chromium } from 'playwright-core'

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const values = process.argv.slice(2).map(Number)
const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--disable-gpu-vsync', '--disable-frame-rate-limit'] })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DPR || 2) })
await page.goto(process.env.URL || 'http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.waitForFunction(() => window.__apexStory && window.__apexGl && window.__apexRig, null, { timeout: 90000 })
await page.waitForTimeout(2000)
const story = await page.evaluate(() => window.__apexStory)
for (const progress of values.length ? values : [0.03, 0.18, 0.35, 0.51, 0.63, 0.81, 0.95]) {
  await page.evaluate((top) => window.scrollTo(0, top), story.start + (story.end - story.start) * progress)
  await page.waitForTimeout(1500)
  const result = await page.evaluate(() => new Promise((resolve) => {
    const times = []
    let last = performance.now()
    const gl = window.__apexGl
    const tick = (now) => {
      times.push(now - last)
      last = now
      if (times.length < 90) requestAnimationFrame(tick)
      else {
        times.sort((a, b) => a - b)
        resolve({
          fps: Math.round(1000 / (times.reduce((a, b) => a + b, 0) / times.length)),
          p95: Number(times[Math.floor(times.length * 0.95)].toFixed(1)),
          calls: gl.info.render.calls,
          triangles: gl.info.render.triangles,
          programs: gl.info.programs?.length,
        })
      }
    }
    requestAnimationFrame(tick)
  }))
  console.log(String(progress).padEnd(5), JSON.stringify(result))
}
await browser.close()
