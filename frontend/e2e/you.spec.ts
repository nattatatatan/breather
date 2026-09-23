import { expect, test } from '@playwright/test'

// My practice. Each test establishes its own profile through the real UI first, since this file
// may run on its own (not only after practice.spec.ts).
async function setUpFireProfile(page: import('@playwright/test').Page) {
  await page.goto('/practice/mode')
  await page.getByRole('radio', { name: /Samatha/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: /Calm/ }).click()
  await page.getByRole('link', { name: 'Continue' }).click()
  await page.getByRole('radio', { name: 'Fire' }).click()
  await page.getByRole('button', { name: 'Stay with fire' }).click()
  await expect(page).toHaveURL(/\/sit/)
}

test.describe('My practice', () => {
  test('shows the saved profile', async ({ page }) => {
    await setUpFireProfile(page)
    await page.goto('/you')

    await expect(page.getByRole('heading', { name: 'My practice' })).toBeVisible()
    await expect(page.getByText('Fire', { exact: true })).toBeVisible()
    await expect(page.getByText('Calm', { exact: true })).toBeVisible()
    await expect(page.getByText('30 minutes')).toBeVisible()
    await expect(page.getByText('Silent')).toBeVisible()
    await expect(page.getByText('Hidden')).toBeVisible()
    await expect(page.getByRole('button', { name: /sign out/i })).toBeVisible()
  })

  test('editing Duration saves and survives a reload', async ({ page }) => {
    await setUpFireProfile(page)
    await page.goto('/you')

    await page.getByRole('button', { name: /Duration/ }).click()
    await page.getByRole('radio', { name: '10m' }).click()
    await expect(page.getByText('10 minutes')).toBeVisible()

    await page.reload()
    await expect(page.getByText('10 minutes')).toBeVisible()
  })

  test('Environment offers both choices for fire and saves the pick', async ({ page }) => {
    await setUpFireProfile(page)
    await page.goto('/you')

    await page.getByRole('button', { name: /Environment/ }).click()
    await expect(page.getByRole('radio', { name: 'Still image' })).toBeVisible()
    await expect(page.getByRole('radio', { name: 'The dissolve' })).toBeVisible()
    await page.getByRole('radio', { name: 'The dissolve' }).click()

    await expect(page.getByText('The dissolve')).toBeVisible()
  })

  test('Object and Intention rows link into the flow, pre-filled', async ({ page }) => {
    await setUpFireProfile(page)
    await page.goto('/you')

    await page.getByRole('link', { name: /Object/ }).click()
    await expect(page).toHaveURL(/\/practice\/object\?/)
    await expect(page.getByRole('radio', { name: 'Fire' })).toHaveAttribute('aria-checked', 'true')

    await page.goBack()
    await page.getByRole('link', { name: /Intention/ }).click()
    await expect(page).toHaveURL(/\/practice\/intention\?/)
    await expect(page.getByRole('radio', { name: /Calm/ })).toHaveAttribute('aria-checked', 'true')
  })

  test('Change practice re-enters the flow pre-filled at Mode', async ({ page }) => {
    await setUpFireProfile(page)
    await page.goto('/you')

    await page.getByRole('link', { name: 'Change practice' }).click()
    await expect(page).toHaveURL(/\/practice\/mode/)
    await expect(page.getByRole('radio', { name: /Samatha/ })).toHaveAttribute('aria-checked', 'true')
  })
})
