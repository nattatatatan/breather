import { expect, test } from '@playwright/test'

// The Mode -> Intention -> Object flow. Each test sets up whatever profile state it needs
// through the real UI rather than assuming what an earlier test (or run) left behind.

test.describe('practice flow', () => {
  test('Begin with no profile walks through Mode, Intention and Object to /sit', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Choose your object.')).toBeVisible()
    await page.getByRole('link', { name: 'Begin' }).click()

    await expect(page).toHaveURL(/\/practice\/mode/)
    await expect(page.getByRole('heading', { name: /How are you/ })).toBeVisible()
    await page.getByRole('radio', { name: /Vipassana/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/\/practice\/intention/)
    await expect(page.getByText('Vipassana')).toBeVisible() // the mode chip
    await page.getByRole('radio', { name: /Joy/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()

    await expect(page).toHaveURL(/\/practice\/object/)
    await expect(page.getByText('Joy', { exact: true })).toBeVisible() // the intent eyebrow
    await expect(page.getByRole('button', { name: 'Stay with it' })).toBeDisabled()
    await page.getByRole('radio', { name: 'Water' }).click()

    const stay = page.getByRole('button', { name: 'Stay with water' })
    await expect(stay).toBeEnabled()
    await stay.click()

    await expect(page).toHaveURL(/\/sit/)
  })

  test('Home Begin skips straight to /sit once a profile exists', async ({ page }) => {
    // Establish a profile through the UI first (this test does not depend on the previous one).
    await page.goto('/practice/mode')
    await page.getByRole('radio', { name: /Samatha/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()
    await page.getByRole('radio', { name: /Calm/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()
    await page.getByRole('radio', { name: 'Breath' }).click()
    await page.getByRole('button', { name: 'Stay with breath' }).click()
    await expect(page).toHaveURL(/\/sit/)

    await page.goto('/')
    await page.getByRole('link', { name: 'Begin' }).click()
    await expect(page).toHaveURL(/\/sit/)
    await expect(page).not.toHaveURL(/\/practice\/mode/)
  })

  test('Intention and Object redirect to Mode when visited directly without a mode', async ({ page }) => {
    await page.goto('/practice/intention')
    await expect(page).toHaveURL(/\/practice\/mode/)

    await page.goto('/practice/object')
    await expect(page).toHaveURL(/\/practice\/mode/)
  })

  test('back chevrons preserve the draft through Object -> Intention -> Mode', async ({ page }) => {
    await page.goto('/practice/mode')
    await page.getByRole('radio', { name: /Vipassana/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()
    await page.getByRole('radio', { name: /Kindness/ }).click()
    await page.getByRole('link', { name: 'Continue' }).click()
    await expect(page).toHaveURL(/\/practice\/object/)

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/practice\/intention/)
    await expect(page.getByRole('radio', { name: /Kindness/ })).toHaveAttribute('aria-checked', 'true')
    await expect(page.getByText('Vipassana')).toBeVisible()

    await page.getByRole('link', { name: 'Back' }).click()
    await expect(page).toHaveURL(/\/practice\/mode/)
    await expect(page.getByRole('radio', { name: /Vipassana/ })).toHaveAttribute('aria-checked', 'true')
  })
})
