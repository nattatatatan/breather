import { expect, test } from '@playwright/test'

test.describe('signed out', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('redirects to sign in and keeps the design language', async ({ page }) => {
    await page.goto('/you')
    await expect(page).toHaveURL(/\/signin$/)
    await expect(page.getByRole('heading', { name: 'Welcome back.' })).toBeVisible()
    await page.getByRole('button', { name: /create an account/i }).click()
    await expect(page.getByRole('heading', { name: 'Begin a practice.' })).toBeVisible()
    await expect(page.getByLabel('Name')).toBeVisible()
  })
})
