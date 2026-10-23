import { chromium } from 'playwright-core'

const url = process.argv[2] || 'http://127.0.0.1:5173/'
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})

const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000, state: 'attached' })
await page.waitForFunction(() => window.__apexStory, null, { timeout: 30000 })
await page.waitForTimeout(2500)

const story = await page.evaluate(() => window.__apexStory)
const model = await page.evaluate(() => window.__apexModelReady)
const checkpoints = [0.04, 0.145, 0.245, 0.345, 0.455, 0.58, 0.7, 0.82, 0.95]
const shots = []
let previousCamera = null
let cameraTravel = 0

for (let index = 0; index < checkpoints.length; index += 1) {
  const progress = checkpoints[index]
  const expectedStage = index
  const scrollY = story.start + (story.end - story.start) * progress
  await page.evaluate((top) => window.scrollTo(0, top), scrollY)
  await page.waitForFunction((stage) => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === stage, expectedStage, { timeout: 15000 })
  await page.waitForTimeout(1150)

  const info = await page.evaluate(() => ({
    stage: Number(document.querySelector('.cinematic-frame')?.dataset.stage),
    camera: window.__apexCamera,
    activePanels: document.querySelectorAll('.story-panel.is-active').length,
    activeHero: document.querySelector('.hero-stage.is-active') !== null,
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  }))
  if (!info.camera) throw new Error(`Camera was not reported at shot ${String(index + 1).padStart(2, '0')}`)
  if (index === 0 ? !info.activeHero : info.activePanels !== 1) {
    throw new Error(`Expected exactly one active composition for shot ${String(index + 1).padStart(2, '0')}`)
  }
  if (info.overflow !== 0) throw new Error(`Desktop horizontal overflow at shot ${index + 1}: ${info.overflow}px`)
  if (previousCamera) {
    cameraTravel += Math.hypot(...info.camera.position.map((value, axis) => value - previousCamera[axis]))
  }
  previousCamera = info.camera.position
  if ([0, 3, 5, 6, 7, 8].includes(index)) {
    await page.screenshot({ path: `tools/review-shot-${String(index + 1).padStart(2, '0')}.png`, animations: 'disabled' })
  }
  shots.push({ shot: index + 1, stage: info.stage, camera: info.camera.position.map((value) => Number(value.toFixed(2))) })
}

await page.evaluate((top) => window.scrollTo(0, top), story.start + (story.end - story.start) * 0.14)
await page.waitForFunction(() => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === 1, null, { timeout: 15000 })
const reverseStage = await page.evaluate(() => Number(document.querySelector('.cinematic-frame')?.dataset.stage))
await page.evaluate((top) => window.scrollTo(0, top), story.start + (story.end - story.start) * 0.85)
await page.waitForTimeout(1200)
const cockpit = await page.evaluate(() => ({
  stage: Number(document.querySelector('.cinematic-frame')?.dataset.stage),
  camera: window.__apexCamera,
}))
await page.screenshot({ path: 'tools/review-cockpit.png', animations: 'disabled' })
await page.evaluate((top) => window.scrollTo(0, top), story.end + 120)
await page.waitForTimeout(1200)
const release = await page.evaluate(() => ({
  scrollY: Math.round(window.scrollY),
  pinned: getComputedStyle(document.querySelector('.cinematic-frame')).position === 'fixed',
}))

await page.setViewportSize({ width: 390, height: 844 })
await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000, state: 'attached' })
await page.waitForFunction(() => window.__apexStory, null, { timeout: 30000 })
await page.waitForTimeout(1800)
const mobileStory = await page.evaluate(() => window.__apexStory)
await page.evaluate((top) => window.scrollTo(0, top), mobileStory.start + (mobileStory.end - mobileStory.start) * 0.95)
await page.waitForFunction(() => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === 8, null, { timeout: 15000 })
const mobileResult = await page.evaluate(() => ({
  stage: Number(document.querySelector('.cinematic-frame')?.dataset.stage),
  cameraMobile: window.__apexCamera?.mobile,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
  camera: window.__apexCamera?.position?.map((value) => Number(value.toFixed(2))),
}))
await page.screenshot({ path: 'tools/review-mobile-driving.png', animations: 'disabled' })

const result = {
  story,
  model,
  shots,
  cameraTravel: Number(cameraTravel.toFixed(2)),
  reverseStage,
  cockpit: {
    stage: cockpit.stage,
    target: cockpit.camera?.target?.map((value) => Number(value.toFixed(2))),
  },
  release,
  mobile: mobileResult,
  errors,
}
console.log(JSON.stringify(result, null, 2))
await browser.close()

if (cameraTravel < 10) throw new Error(`Camera travel was too small: ${cameraTravel}`)
if (reverseStage !== 1) throw new Error(`Reverse scroll did not restore shot 02: ${reverseStage}`)
if (cockpit.stage !== 7 || cockpit.camera.target[2] > 0 || cockpit.camera.position[2] < 2) {
  throw new Error(`Cockpit camera did not reach the modeled interior: ${JSON.stringify(cockpit)}`)
}
if (release.scrollY <= story.end || release.pinned) throw new Error('Pinned cinematic frame did not release after its end.')
if (mobileResult.stage !== 8 || !mobileResult.cameraMobile || mobileResult.overflow !== 0) {
  throw new Error(`Mobile driving stage failed: ${JSON.stringify(mobileResult)}`)
}
if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`)
