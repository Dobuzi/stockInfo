import { test, expect } from '@playwright/test';

test.describe('Portfolio Tracking', () => {
  test('complete portfolio management flow', async ({ page }) => {
    await page.goto('/');

    // Switch to Portfolio tab
    await page.click('button:has-text("Portfolio")');

    // Should show empty state
    await expect(page.locator('text=No holdings yet')).toBeVisible();

    // Click Add Holding
    await page.click('button:has-text("Add Holding")');

    // Fill form
    await page.fill('input[placeholder="AAPL"]', 'AAPL');
    await page.fill('input[placeholder="10.5"]', '10');
    await page.fill('input[placeholder="150.25"]', '150');

    // Submit
    await page.click('button:has-text("Add")');

    // Wait for modal to close
    await expect(page.locator('text=Add Holding').first()).not.toBeVisible();

    // Verify holding appears in table
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible();

    // Verify summary cards update (should show non-zero values)
    await expect(page.locator('text=Total Value')).toBeVisible();

    // Edit holding
    await page.click('button[aria-label="Edit AAPL"]');
    await page.fill('input[placeholder="10.5"]', '15');
    await page.click('button:has-text("Update")');

    // Verify quantity updated
    await expect(page.locator('td:has-text("15")')).toBeVisible();

    // Delete holding
    await page.click('button[aria-label="Delete AAPL"]');

    // Should show empty state again
    await expect(page.locator('text=No holdings yet')).toBeVisible();
  });

  test('displays allocation chart with multiple holdings', async ({ page }) => {
    await page.goto('/');
    await page.click('button:has-text("Portfolio")');

    // Add first holding
    await page.click('button:has-text("Add Holding")');
    await page.fill('input[placeholder="AAPL"]', 'AAPL');
    await page.fill('input[placeholder="10.5"]', '10');
    await page.fill('input[placeholder="150.25"]', '150');
    await page.click('button:has-text("Add")');

    // Wait for modal to close
    await page.waitForTimeout(500);

    // Add second holding
    await page.click('button:has-text("Add Holding")');
    await page.fill('input[placeholder="AAPL"]', 'GOOGL');
    await page.fill('input[placeholder="10.5"]', '5');
    await page.fill('input[placeholder="150.25"]', '140');
    await page.click('button:has-text("Add")');

    // Verify allocation chart appears
    await expect(page.locator('text=Portfolio Allocation')).toBeVisible();
  });
});
