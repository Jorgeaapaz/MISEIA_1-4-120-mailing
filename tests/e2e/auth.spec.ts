import { test, expect } from '@playwright/test'

test.describe('Magic Link Auth', () => {
  test('login page loads and shows email form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('submitting email shows confirmation message', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'test@example.com')
    await page.click('button[type="submit"]')
    // Should show success message (magic link sent)
    await expect(page.locator('body')).toContainText(/enviado|sent|check|revisa/i)
  })

  test('unauthenticated user is redirected to login from dashboard', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/login/)
  })

  test('unauthenticated user is redirected to login from clientes', async ({ page }) => {
    await page.goto('/clientes')
    await expect(page).toHaveURL(/login/)
  })
})
