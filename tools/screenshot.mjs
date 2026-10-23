import { chromium } from 'playwright-core'
import fs from 'node:fs'

const url = process.argv[2] || 'http://127.0.0.1:5173/tools/car-test.html'
const out = process.argv[3] || 'tools/car-test.png'
const width = Number(process.argv[4] || 1440)
const height = Number(process.argv[5] || 900)

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
})
const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
const errors = []
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') console.log('[browser]', msg.type(), msg.text())
})
page.on('pageerror', (err) => errors.push(err.message))
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForTimeout(3000)
await page.screenshot({ path: out, fullPage: false })
const info = await page.evaluate(() => ({
  ready: document.body.dataset.ready || null,
  log: document.getElementById('log')?.textContent || null,
  webgl: !!document.querySelector('canvas'),
}))
console.log(JSON.stringify({ info, errors }, null, 2))
fs.mkdirSync('tools', { recursive: true })
await browser.close()
