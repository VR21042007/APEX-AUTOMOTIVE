import { chromium } from 'playwright-core'
const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true })
const page = await browser.newPage({ viewport:{width:1440,height:900}, deviceScaleFactor:1 })
await page.goto('http://127.0.0.1:5173', { waitUntil:'networkidle', timeout:120000 })
await page.waitForSelector('.site--entered', { timeout:120000, state:'attached' })
for (const delay of [0, 1500, 4000, 8000]) {
  if (delay) await page.waitForTimeout(delay)
  const out = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel)
      if (!el) return null
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return { cls: el.className, opacity: cs.opacity, visibility: cs.visibility, display: cs.display, transform: cs.transform, clip: cs.clipPath, animation: cs.animation, rect: {x:r.x,y:r.y,w:r.width,h:r.height}, text:el.innerText?.slice(0,80) }
    }
    return { hero: pick('.hero-stage'), title1: pick('.hero-title__line--one'), title2: pick('.hero-title__line--two'), bottom: pick('.hero-stage__bottom'), kicker: pick('.hero-kicker'), anims: document.getAnimations().map(a => ({state:a.playState,time:a.currentTime,name:a.animationName})).slice(0,20), reduced: matchMedia('(prefers-reduced-motion: reduce)').matches }
  })
  console.log('DELAY', delay, JSON.stringify(out, null, 2))
}
await browser.close()
