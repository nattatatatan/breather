import { expect, test } from '@playwright/test'

// Read-only checks first; mutating flows (helpful, reply, compose) run last so they cannot
// shift "the first thread" out from under an earlier assertion (threads sort newest-first).

test.describe('circle - discussion', () => {
  test('lists seeded threads', async ({ page }) => {
    await page.goto('/circle')
    await expect(page.getByRole('heading', { name: 'The circle' })).toBeVisible()
    await expect(page.locator('article').first()).toBeVisible()
  })

  test('opens a thread from the list', async ({ page }) => {
    await page.goto('/circle')
    const firstCard = page.locator('article').first()
    const title = (await firstCard.locator('h2').innerText()).trim()
    await firstCard.click()
    await expect(page).toHaveURL(/\/circle\/threads\/\d+$/)
    // level: 1 - the discussion list's own card heading can still be transiently mounted
    // underneath during the route transition, and its h2 would otherwise also match.
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  })

  test('opens an attached sitting', async ({ page }) => {
    await page.goto('/circle')
    const attachedLink = page.getByRole('link', { name: /Samatha ·|Vipassana ·/ }).first()
    if ((await attachedLink.count()) === 0) {
      test.skip(true, 'No thread in this seed has an attached sitting')
    }
    await attachedLink.click()
    await expect(page).toHaveURL(/\/circle\/shared\/\d+$/)
    await expect(page.getByText('Where attention went')).toBeVisible()
  })

  test('opens a practitioner from a thread author', async ({ page }) => {
    await page.goto('/circle')
    await page.locator('article').first().click()
    await expect(page).toHaveURL(/\/circle\/threads\/\d+$/)
    await page.locator('a[href^="/circle/practitioners/"]').first().click()
    await expect(page).toHaveURL(/\/circle\/practitioners\/\d+$/)
    await expect(page.getByText(/^Sitting since/)).toBeVisible()
  })

  test('hours shows the leaderboard', async ({ page }) => {
    await page.goto('/circle/hours')
    await expect(page.getByRole('heading', { name: 'The circle' })).toBeVisible()
    await expect(page.getByText('Hours held this month.')).toBeVisible()
    await expect(page.getByText(/sitting right now\.$/)).toBeVisible()
  })

  test('marks a reply helpful', async ({ page }) => {
    await page.goto('/circle')
    await page.locator('article').first().click()
    await expect(page).toHaveURL(/\/circle\/threads\/\d+$/)

    const helpfulButtons = page.getByRole('button', { name: /^Helpful ·/ })
    const count = await helpfulButtons.count()
    if (count === 0) test.skip(true, 'This thread has no replies to mark helpful')

    const button = helpfulButtons.first()
    if (await button.isDisabled()) test.skip(true, 'Only reply here is the signed-in user\'s own')

    const before = await button.innerText()
    await button.click()
    await expect(button).not.toHaveText(before)
  })

  test('posts a reply', async ({ page }) => {
    await page.goto('/circle')
    await page.locator('article').first().click()
    await expect(page).toHaveURL(/\/circle\/threads\/\d+$/)

    const replyBody = `A note from the e2e run - ${Date.now()}`
    await page.getByPlaceholder('Answer from your own practice').fill(replyBody)
    await page.getByRole('button', { name: 'Send reply' }).click()
    await expect(page.getByText(replyBody)).toBeVisible()
  })

  test('composes a new thread', async ({ page }) => {
    await page.goto('/circle')
    await page.getByRole('link', { name: 'Ask the circle' }).click()
    await expect(page).toHaveURL(/\/circle\/new$/)

    const title = `A question from the e2e run - ${Date.now()}`
    await page.getByLabel('Title').fill(title)
    await page.getByLabel('Body').fill('Just checking that posting a new thread works end to end.')
    await page.getByRole('button', { name: 'Post' }).click()

    await expect(page).toHaveURL(/\/circle\/threads\/\d+$/)
    await expect(page.getByRole('heading', { name: title, level: 1 })).toBeVisible()
  })
})
