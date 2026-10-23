import { chromium } from 'playwright-core'

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
})
const errors = []
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (error) => errors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text())
})

await page.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 120000 })
await page.waitForSelector('.site--entered', { timeout: 120000 })
await page.waitForTimeout(3500)

const results = {}
for (const id of ['design', 'performance', 'gallery', 'experience', 'contact']) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded()
  await page.waitForTimeout(1400)
  await page.screenshot({
    path: `tools/section-${id}.png`,
    timeout: 120000,
    animations: 'disabled',
  })
  results[id] = await page.evaluate((sectionId) => {
    const node = document.getElementById(sectionId)
    const rect = node.getBoundingClientRect()
    return { top: Math.round(rect.top), height: Math.round(rect.height) }
  }, id)
}

const galleryButton = page.locator('.gallery-card__button').first()
await galleryButton.click()
await page.waitForTimeout(500)
results.lightboxOpen = await page.locator('[role="dialog"]').isVisible()
await page.screenshot({ path: 'tools/section-lightbox.png', timeout: 120000, animations: 'disabled' })
await page.keyboard.press('Escape')
await page.waitForTimeout(400)
results.lightboxClosed = (await page.locator('[role="dialog"]').count()) === 0

await page.locator('#experience').scrollIntoViewIfNeeded()
await page.waitForTimeout(2000)
const profile = page.locator('.viewer__controls button', { hasText: 'Profile' })
await profile.click()
await page.waitForTimeout(1800)
results.profilePressed = (await profile.getAttribute('aria-pressed')) === 'true'
await page.screenshot({ path: 'tools/section-viewer.png', timeout: 120000, animations: 'disabled' })

await page.locator('#contact').scrollIntoViewIfNeeded()
await page.waitForTimeout(800)
await page.locator('.form-submit').click()
await page.waitForTimeout(300)
results.validationCount = await page.locator('.form-error').count()
await page.locator('#name').fill('Alex Morgan')
await page.locator('#email').fill('alex@example.com')
await page.locator('#message').fill('I would like to arrange a private viewing of the Astra.')
await page.locator('.form-submit').click()
await page.waitForTimeout(900)
results.success = await page.locator('.contact-success').isVisible()
await page.screenshot({ path: 'tools/section-success.png', timeout: 120000, animations: 'disabled' })

results.desktopOverflow = await page.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
mobile.on('pageerror', (error) => errors.push(`mobile: ${error.message}`))
await mobile.goto('http://127.0.0.1:5173', { waitUntil: 'networkidle', timeout: 120000 })
await mobile.waitForSelector('.site--entered', { timeout: 120000 })
await mobile.waitForTimeout(3000)
await mobile.locator('.menu-toggle').click()
await mobile.waitForTimeout(500)
results.menuOpen = await mobile.locator('#mobile-menu').isVisible()
await mobile.screenshot({ path: 'tools/mobile-menu.png', timeout: 120000, animations: 'disabled' })
results.mobileOverflow = await mobile.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
)
results.pageHeight = await page.evaluate(() => document.documentElement.scrollHeight)

console.log(JSON.stringify({ results, errors }, null, 2))
await browser.close()
