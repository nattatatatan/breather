import { expect, test, type APIRequestContext, type Page } from '@playwright/test'

// Uses the signed-in storageState from auth.setup.ts. The practice profile is set directly
// through the API (not the Mode -> Intention -> Object UI, which is owned by another feature)
// with the backend's minimum duration (60s), so the "hold to end" and "<60s discard" paths are
// both reachable without a long real-time wait.

async function accessToken(page: Page): Promise<string> {
  await page.goto('/')
  const token = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.includes('auth-token'))
    if (!key) return null
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw).access_token as string) : null
  })
  if (!token) throw new Error('Could not read the Supabase access token from localStorage')
  return token
}

async function setPractice(request: APIRequestContext, token: string, elementSlug: string, durationSeconds: number) {
  const [elements, intents] = await Promise.all([
    request.get('/api/elements').then((r) => r.json()),
    request.get('/api/intents').then((r) => r.json()),
  ])
  const element = elements.find((e: { slug: string }) => e.slug === elementSlug)
  const intent = intents.find((i: { slug: string }) => i.slug === 'calm')
  const headers = { Authorization: `Bearer ${token}` }
  const res = await request.put('/api/me/practice', {
    headers,
    data: {
      mode: 'samatha',
      intent_id: intent.id,
      element_id: element.id,
      environment: 'still',
      duration_seconds: durationSeconds,
      sound: 'silent',
      timer_visible: false,
    },
  })
  expect(res.ok()).toBeTruthy()
}

test.describe('a sitting', () => {
  test('records returns by tapping, completes at the planned duration, and saves a note', async ({ page, request }) => {
    // The backend's minimum planned duration is 60s (real time - the local timer runs off
    // performance.now(), and page.clock does not reliably survive the SPA's full navigation
    // into /sit), so this test genuinely waits for the sitting to finish.
    test.setTimeout(120_000)

    const token = await accessToken(page)
    await setPractice(request, token, 'breath', 60)

    const createResponse = page.waitForResponse((r) => r.url().includes('/api/sessions') && r.request().method() === 'POST')
    await page.goto('/sit')
    await createResponse

    await expect(page.getByText('Rest on the breath. When it wanders, return.')).toBeVisible()

    const stage = page.getByTestId('session-stage')

    await stage.click({ position: { x: 30, y: 30 } })
    await expect(page.getByText('Return noted')).toBeAttached()

    await page.waitForTimeout(2_000)
    await stage.click({ position: { x: 30, y: 30 } })

    // Wait for the sitting to complete on its own at the planned 60s.
    await page.waitForURL(/\/sit\/complete\/\d+/, { timeout: 90_000 })

    await expect(page.getByText('2 returns noted.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /held$/ })).toBeVisible()

    await page.getByLabel('Your note afterwards').fill('Settled quickly, one clear stretch near the end.')
    await page.getByRole('button', { name: 'Save' }).click()
    await expect(page).toHaveURL('/')
  })

  test('holding to end before 60 seconds discards the sitting', async ({ page, request }) => {
    const token = await accessToken(page)
    await setPractice(request, token, 'breath', 60)

    const createResponse = page.waitForResponse((r) => r.url().includes('/api/sessions') && r.request().method() === 'POST')
    await page.goto('/sit')
    const created = await createResponse
    const { id } = await created.json()

    const holdButton = page.getByRole('button', { name: 'Hold to end the sitting' })
    const box = await holdButton.boundingBox()
    if (!box) throw new Error('Hold to end button not found')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(1700) // just past the 1.5s hold threshold, in real time
    await page.mouse.up()

    await page.waitForURL('/', { timeout: 10_000 })

    // A discarded sitting is deleted, not completed.
    const check = await request.get(`/api/sessions/${id}`, { headers: { Authorization: `Bearer ${token}` } })
    expect(check.status()).toBe(404)
  })

  test('releasing the hold early cancels and does not end the sitting', async ({ page, request }) => {
    const token = await accessToken(page)
    await setPractice(request, token, 'breath', 60)

    const createResponse = page.waitForResponse((r) => r.url().includes('/api/sessions') && r.request().method() === 'POST')
    await page.goto('/sit')
    await createResponse

    const holdButton = page.getByRole('button', { name: 'Hold to end the sitting' })
    const box = await holdButton.boundingBox()
    if (!box) throw new Error('Hold to end button not found')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.down()
    await page.waitForTimeout(300) // well under the threshold
    await page.mouse.up()

    // Still on the session screen, holding it did not register as a return either.
    await page.waitForTimeout(300)
    await expect(page).toHaveURL('/sit')
    await expect(page.getByText('Rest on the breath. When it wanders, return.')).toBeVisible()
  })
})
