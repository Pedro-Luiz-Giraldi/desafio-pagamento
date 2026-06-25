import { test, expect } from '@playwright/test'

test.describe('404 Page', () => {
  test('shows 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist')

    await expect(page.getByText('Página não encontrada')).toBeVisible()
    await expect(page.getByText(/A página que você está procurando não existe/)).toBeVisible()
  })

  test('can navigate back to home from 404', async ({ page }) => {
    await page.goto('/invalid-route')

    await page.getByRole('button', { name: /voltar à home/i }).click()

    await expect(page).toHaveURL('/')
  })
})
