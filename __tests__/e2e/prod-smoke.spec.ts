import { test, expect } from '@playwright/test';

test.describe('Production Smoke Test (No API Keys)', () => {
  // Skip this test if running locally without production flag
  test.skip(({ browserName }) => process.env.TEST_ENV !== 'production', 'Production-only test');

  test('production deployment has all UI elements', async ({ page }) => {
    // Load production site directly
    await page.goto('https://stock-info-ten.vercel.app');

    // Verify page loads
    await expect(page).toHaveTitle(/Stock Dashboard/);

    // Verify header
    await expect(page.getByRole('heading', { name: 'Stock Dashboard' })).toBeVisible();

    // Verify tabs exist (Watchlist and Portfolio)
    await expect(page.getByRole('button', { name: 'Watchlist' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Portfolio' })).toBeVisible();

    // Verify ticker input section
    await expect(page.getByPlaceholder(/Enter ticker/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add' })).toBeVisible();

    // Verify dark mode toggle
    await expect(page.getByRole('button', { name: /toggle dark mode/i })).toBeVisible();

    // Switch to Portfolio tab and verify it loads
    await page.click('button:has-text("Portfolio")');
    await expect(page.getByRole('button', { name: 'Add Holding' })).toBeVisible({ timeout: 3000 });

    // No console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Wait a bit to catch any console errors
    await page.waitForTimeout(1000);

    // Allow API-related errors (expected without data), but fail on JavaScript errors
    const jsErrors = errors.filter(e =>
      !e.includes('API') &&
      !e.includes('fetch') &&
      !e.includes('network') &&
      !e.includes('Failed to load')
    );

    expect(jsErrors).toHaveLength(0);
  });
});
