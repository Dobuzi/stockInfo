import { test, expect } from '@playwright/test';

test.describe('Stock Dashboard Smoke Tests', () => {
  test('UI loads and basic interactions work (no API required)', async ({ page }) => {
    // 1. Load the app
    await page.goto('/');
    await expect(page).toHaveTitle(/Stock Dashboard/);

    // 2. Verify header exists
    await expect(page.getByRole('heading', { name: 'Stock Dashboard' })).toBeVisible();

    // 3. Verify tabs exist
    await expect(page.getByRole('button', { name: 'Watchlist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Portfolio' })).toBeVisible();

    // 4. Verify ticker input exists
    await expect(page.getByPlaceholder(/Enter ticker/i)).toBeVisible();

    // 5. Verify dark mode toggle exists
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();

    // 6. Switch to Portfolio tab
    await page.click('button:has-text("Portfolio")');
    await expect(page.getByRole('button', { name: 'Add Holding' })).toBeVisible();

    // 7. Switch back to Watchlist
    await page.click('button:has-text("Watchlist")');
    await expect(page.getByPlaceholder(/Enter ticker/i)).toBeVisible();
  });

  test('can add ticker and see UI update (may show errors without API keys)', async ({ page }) => {
    await page.goto('/');

    // Add a ticker
    await page.fill('input[placeholder*="ticker"]', 'AAPL');
    await page.click('button:has-text("Add")');

    // Verify ticker chip appears
    await expect(page.getByText('AAPL')).toBeVisible();

    // Price chart section should appear (may show error if no API keys)
    await expect(page.getByText(/Price Chart|Error/i)).toBeVisible({ timeout: 5000 });

    // Financial tabs should be visible
    await expect(page.getByRole('button', { name: /Income|Balance/i })).toBeVisible();
  });
});
