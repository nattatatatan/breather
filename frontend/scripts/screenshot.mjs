// Screenshot a route at the design's phone size, for pixel comparison with docs/design/png.
// Usage: node scripts/screenshot.mjs <url> <out.png> [--auth] [--wait=ms] [--height=844] [--full]
// --auth signs in through the real UI on the URL's origin first, using E2E_EMAIL/E2E_PASSWORD
// from frontend/.env.e2e.local.
import { chromium } from '@playwright/test'
import { readFileSync } from 'node:fs'

const [url, out, ...flags] = process.argv.slice(2)
if (!url || !out) {
  console.error('usage: node scripts/screenshot.mjs <url> <out.png> [--auth] [--wait=ms] [--height=844] [--full]')
  process.exit(1)
}
const flag = (name, fallback) => flags.find((f) => f.startsWith(`--${name}=`))?.split('=')[1] ?? fallback

function credentials() {
  const env = Object.fromEntries(
    readFileSync(new URL('../.env.e2e.local', import.meta.url), 'utf8')
      .split('\n')
      .filter((l) => l.includes('=') && !l.startsWith('#'))
      .map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]),
  )
  return { email: process.env.E2E_EMAIL ?? env.E2E_EMAIL, password: process.env.E2E_PASSWORD ?? env.E2E_PASSWORD }
}

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 390, height: Number(flag('height', 844)) }, deviceScaleFactor: 2 })
const page = await context.newPage()
page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && console.log(`[${m.type()}] ${m.text()}`))
page.on('pageerror', (e) => console.log(`[pageerror] ${e.message}`))

if (flags.includes('--auth')) {
  const { email, password } = credentials()
  await page.goto(new URL('/signin', url).href)
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await page.waitForURL((u) => !u.pathname.startsWith('/signin'))
}

await page.goto(url)
await page.waitForTimeout(Number(flag('wait', 1200)))
await page.screenshot({ path: out, fullPage: flags.includes('--full') })
console.log(`saved ${out} (${page.url()})`)
await browser.close()
