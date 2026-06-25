import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('shows login page', async ({ page }) => {
    await page.goto('/login')

    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/senha/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible()
  })

  test('validates required fields on login', async ({ page }) => {
    await page.goto('/login')

    await page.getByRole('button', { name: /entrar/i }).click()

    await expect(page.getByText(/email obrigat/i)).toBeVisible()
    await expect(page.getByText(/senha obrigat/i)).toBeVisible()
  })

  test('shows register page', async ({ page }) => {
    await page.goto('/register')

    await expect(page.getByRole('heading', { name: /criar conta/i })).toBeVisible()
    await expect(page.getByLabel(/nome completo/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/^senha$/i)).toBeVisible()
  })

  test('redirects to login when accessing protected route without auth', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveURL('/login')
  })
})
