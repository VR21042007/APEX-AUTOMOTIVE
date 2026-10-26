import { chromium } from 'playwright-core'

const url = process.argv[2] || 'http://127.0.0.1:5173/'
const executablePath = process.env.CHROME_PATH
  || (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : 'C:/Program Files/Google/Chrome/Application/chrome.exe')
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'],
})

const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 })
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto(url, { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000, state: 'attached' })
await page.waitForFunction(() => window.__apexStory && window.__apexRig, null, { timeout: 60000 })
await page.waitForTimeout(2500)

const story = await page.evaluate(() => window.__apexStory)
const model = await page.evaluate(() => window.__apexModelReady)
const scrollTo = (progress) =>
  page.evaluate((top) => window.scrollTo(0, top), story.start + (story.end - story.start) * progress)

// Reads the rig's live animation state so each scene can be checked numerically.
const sceneState = () =>
  page.evaluate(() => {
    const rig = window.__apexRig
    const amount = (key) => Math.max(0, ...rig.tracks.flatMap((track) => track.offsets.filter((o) => o.key === key).map((o) => o.amount)))
    return {
      stage: Number(document.querySelector('.cinematic-frame')?.dataset.stage),
      camera: window.__apexCamera,
      explode: amount('explode'),
      wheelOut: amount('wheelOut'),
      wheelSeparate: amount('wheelSeparate'),
      xray: rig.shellAmount || 0,
      light: Number(getComputedStyle(document.querySelector('.cinematic-frame')).getPropertyValue('--light')),
      activePanels: document.querySelectorAll('.story-panel.is-active').length,
      activeHero: document.querySelector('.hero-stage.is-active') !== null,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    }
  })

const SHOTS = [
  { name: 'hero', progress: 0.03, stage: 0 },
  { name: 'exploded', progress: 0.18, stage: 1, expect: (s) => s.explode > 0.95 },
  { name: 'xray', progress: 0.35, stage: 2, expect: (s) => s.xray > 0.95 && s.explode < 0.01 },
  { name: 'wheel', progress: 0.51, stage: 3, expect: (s) => s.wheelSeparate > 0.95 && s.xray === 0 },
  { name: 'carbon', progress: 0.63, stage: 4, expect: (s) => s.wheelOut < 0.01 && s.light < 0.05 },
  { name: 'cockpit', progress: 0.81, stage: 5, expect: (s) => Math.abs(s.camera.position[0]) < 0.9 && s.camera.position[1] < 1.15 && Math.abs(s.camera.position[2]) < 1.5 },
  { name: 'circuit', progress: 0.95, stage: 6 },
]

const shots = []
let previousCamera = null
let cameraTravel = 0
for (const shot of SHOTS) {
  await scrollTo(shot.progress)
  await page.waitForFunction((stage) => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === stage, shot.stage, { timeout: 15000 })
  await page.waitForTimeout(1500)
  const state = await sceneState()
  if (!state.camera) throw new Error(`Camera was not reported at ${shot.name}`)
  if (shot.stage === 0 ? !state.activeHero : state.activePanels !== 1) {
    throw new Error(`Expected exactly one active composition for ${shot.name}`)
  }
  if (state.overflow !== 0) throw new Error(`Desktop horizontal overflow at ${shot.name}: ${state.overflow}px`)
  if (shot.expect && !shot.expect(state)) throw new Error(`Scene check failed for ${shot.name}: ${JSON.stringify(state)}`)
  if (previousCamera) cameraTravel += Math.hypot(...state.camera.position.map((value, axis) => value - previousCamera[axis]))
  previousCamera = state.camera.position
  await page.screenshot({ path: `tools/review-${shot.name}.png`, animations: 'disabled' })
  shots.push({ shot: shot.name, stage: state.stage, camera: state.camera.position.map((value) => Number(value.toFixed(2))) })
}

// Scrolling back up must put every panel back on the car.
await scrollTo(0.18)
await page.waitForFunction(() => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === 1, null, { timeout: 15000 })
await page.waitForTimeout(1500)
const reverse = await sceneState()
await scrollTo(0.03)
await page.waitForTimeout(1500)
const rest = await sceneState()

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
await page.waitForFunction(() => Number(document.querySelector('.cinematic-frame')?.dataset.stage) === 6, null, { timeout: 15000 })
const mobileResult = await page.evaluate(() => ({
  stage: Number(document.querySelector('.cinematic-frame')?.dataset.stage),
  cameraMobile: window.__apexCamera?.mobile,
  overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
}))
await page.screenshot({ path: 'tools/review-mobile-circuit.png', animations: 'disabled' })

const result = {
  story,
  model,
  shots,
  cameraTravel: Number(cameraTravel.toFixed(2)),
  reverse: { stage: reverse.stage, explode: Number(reverse.explode.toFixed(2)) },
  rest: { explode: rest.explode, xray: rest.xray, wheelOut: rest.wheelOut },
  release,
  mobile: mobileResult,
  errors,
}
console.log(JSON.stringify(result, null, 2))
await browser.close()

if (cameraTravel < 10) throw new Error(`Camera travel was too small: ${cameraTravel}`)
if (reverse.stage !== 1 || reverse.explode < 0.95) throw new Error(`Reverse scroll did not restore the exploded view: ${JSON.stringify(reverse)}`)
if (rest.explode !== 0 || rest.xray !== 0 || rest.wheelOut !== 0) throw new Error(`Car did not return to rest: ${JSON.stringify(rest)}`)
if (release.scrollY <= story.end || release.pinned) throw new Error('Pinned cinematic frame did not release after its end.')
if (mobileResult.stage !== 6 || !mobileResult.cameraMobile || mobileResult.overflow !== 0) {
  throw new Error(`Mobile circuit stage failed: ${JSON.stringify(mobileResult)}`)
}
if (errors.length) throw new Error(`Browser errors: ${errors.join(' | ')}`)
