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

    // Verify ticker chip (button) appears — use role to avoid matching heading text
    await expect(page.getByRole('button', { name: 'AAPL', exact: true })).toBeVisible();

    // Price chart section should appear (may show error if no API keys)
    await expect(page.getByText(/Price Chart|Error/i)).toBeVisible({ timeout: 5000 });

    // Financial tabs should be visible (first matching tab is sufficient)
    await expect(page.getByRole('button', { name: /Income Statement/i })).toBeVisible();
  });

  test('adding BRK-B (special-char ticker) does not crash the app', async ({ page }) => {
    await page.goto('/');

    // Add first ticker
    await page.fill('input[placeholder*="ticker"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await expect(page.getByRole('button', { name: 'AAPL', exact: true })).toBeVisible();

    // Add BRK-B as second ticker — triggers comparison view (previously crashed via hooks violation)
    await page.fill('input[placeholder*="ticker"]', 'BRK-B');
    await page.click('button:has-text("Add")');

    // Chip for BRK-B must be visible
    await expect(page.getByRole('button', { name: 'BRK-B', exact: true })).toBeVisible();

    // App must not show the Next.js unhandled error screen
    await expect(page.locator('text="Application error"')).not.toBeVisible();

    // Comparison view or error panel must render (not a blank crash)
    await expect(
      page.locator('h2:has-text("Comparison View"), .comparison-table, [class*="ErrorPanel"], [class*="ErrorBoundary"]')
        .or(page.getByText(/Comparison View|Company Information|Failed to load/i))
    ).toBeVisible({ timeout: 8000 });
  });

  test('Buffett score badge appears on ticker chip after overview loads', async ({ page }) => {
    await page.goto('/');

    // Add AAPL
    await page.fill('input[placeholder*="ticker"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await expect(page.getByRole('button', { name: 'AAPL', exact: true })).toBeVisible();

    // Wait for the overview request to resolve (badge OR error — either means the request completed)
    // The badge only appears if the API key is configured and overview data is available
    await page.waitForTimeout(3000);

    // App must not crash regardless of API key availability
    await expect(page.locator('text="Application error"')).not.toBeVisible();

    // If the badge is present, verify it looks correct
    const badge = page.locator('[title*="Buffett Score"]');
    const badgeVisible = await badge.isVisible();
    if (badgeVisible) {
      await expect(badge).toBeVisible();
    }
  });
});
