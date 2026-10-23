import { chromium } from 'playwright-core'
import fs from 'node:fs'
const url = process.argv[2] || 'http://127.0.0.1:5173'
const out = process.argv[3] || 'tools/site-hero.png'
const width = Number(process.argv[4] || 1440)
const height = Number(process.argv[5] || 900)
const scrollY = Number(process.argv[6] || 0)
const settle = Number(process.argv[7] || 2500)
const browser = await chromium.launch({ executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe', headless:true })
const page = await browser.newPage({ viewport:{ width, height }, deviceScaleFactor:1 })
const errors=[]; const logs=[]
page.on('console', m=>{ if(m.type()==='error'||m.type()==='warning') logs.push(`${m.type()}: ${m.text()}`) })
page.on('pageerror', e=>errors.push(e.message))
await page.goto(url, { waitUntil:'networkidle', timeout:120000 })
await page.waitForSelector('.site--entered', { timeout:120000, state:'attached' })
await page.waitForTimeout(5000)
const initial = await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length, stage:document.querySelector('.cinematic-frame')?.dataset.stage}))
if (scrollY) { await page.evaluate(top=>window.scrollTo(0,top), scrollY); await page.waitForTimeout(settle) }
const info = await page.evaluate(()=>({canvases:document.querySelectorAll('canvas').length, pageHeight:document.documentElement.scrollHeight, scrollY:window.scrollY, stage:document.querySelector('.cinematic-frame')?.dataset.stage, entered:document.querySelector('.site')?.className}))
await page.screenshot({ path:out, type:'png', timeout:120000, animations:'disabled' })
console.log(JSON.stringify({initial, info, errors, logs:logs.slice(0,20)}, null, 2))
fs.mkdirSync('tools', {recursive:true})
await browser.close()
