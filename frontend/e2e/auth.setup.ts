import { expect, test as setup } from '@playwright/test'

// Signs in once through the real UI and stores the Supabase session (localStorage) for all specs.
setup('sign in', async ({ page }) => {
  const email = process.env.E2E_EMAIL
  const password = process.env.E2E_PASSWORD
  if (!email || !password) throw new Error('Set E2E_EMAIL and E2E_PASSWORD in frontend/.env.e2e.local')

  await page.goto('/signin')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).not.toHaveURL(/\/signin/)
  await page.context().storageState({ path: 'e2e/.auth/user.json' })
})
