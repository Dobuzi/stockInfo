import { test, expect } from '@playwright/test';

test('Stock Dashboard smoke test', async ({ page }) => {
  // 1. Load the app
  await page.goto('/');
  await expect(page).toHaveTitle(/Stock Dashboard/);

  // 2. Verify header exists
  await expect(page.getByRole('heading', { name: 'Stock Dashboard' })).toBeVisible();

  // 3. Add a ticker
  await page.fill('input[placeholder*="ticker"]', 'AAPL');
  await page.click('button:has-text("Add")');

  // 4. Verify ticker chip appears
  await expect(page.getByText('AAPL')).toBeVisible();

  // 5. Wait for price chart to load (check for canvas from lightweight-charts)
  // This might take time with real API, but should show loading state at least
  await page.waitForTimeout(2000);

  // 6. Verify we have price chart section
  await expect(page.getByText('Price Chart')).toBeVisible();

  // 7. Click on financial tabs
  await page.click('button:has-text("Balance Sheet")');
  await expect(page.getByRole('button', { name: 'Balance Sheet' })).toBeVisible();

  // 8. Verify dark mode toggle exists
  await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();
});
