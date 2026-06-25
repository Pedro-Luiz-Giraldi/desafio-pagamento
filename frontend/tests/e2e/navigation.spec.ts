import { test, expect } from '@playwright/test'

test.describe('Navigation (Smoke Tests)', () => {
  test('public routes are accessible', async ({ page }) => {
    // Login page
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()

    // Register page
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()

    // Confirm email page
    await page.goto('/confirm-email')
    await expect(page.getByText(/confirmar email/i)).toBeVisible()
  })

  test('404 page works', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page.getByText('Página não encontrada')).toBeVisible()
  })
})
