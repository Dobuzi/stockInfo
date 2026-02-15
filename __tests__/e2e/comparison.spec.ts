import { test, expect } from '@playwright/test';

test.describe('Comparison Feature', () => {
  test('should switch from detail to comparison view when adding second ticker', async ({ page }) => {
    await page.goto('/');

    // Add first ticker
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');

    // Should show detail view
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();

    // Add second ticker
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    // Should auto-switch to comparison view
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();
    await expect(page.locator('table')).toBeVisible();

    // Should show both tickers in table header
    await expect(page.locator('th:has-text("AAPL")')).toBeVisible();
    await expect(page.locator('th:has-text("GOOGL")')).toBeVisible();
  });

  test('should switch to detail view when clicking ticker chip', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'MSFT');
    await page.click('button:has-text("Add")');

    // Should be in comparison view
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();

    // Click AAPL ticker chip
    await page.click('button:has-text("AAPL")');

    // Should switch to detail view for AAPL
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();
    await expect(page.locator('h2:has-text("Comparison View")')).not.toBeVisible();
  });

  test('should return to comparison view when clicking selected chip again', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'TSLA');
    await page.click('button:has-text("Add")');

    // Click AAPL to show detail
    await page.click('button:has-text("AAPL")');
    await expect(page.locator('h2:has-text("AAPL - Price Chart")')).toBeVisible();

    // Click AAPL again to return to comparison
    await page.click('button:has-text("AAPL")');
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();
  });

  test('should display comparison metrics', async ({ page }) => {
    await page.goto('/');

    // Add two tickers
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    // Wait for comparison table to load
    await expect(page.locator('h2:has-text("Comparison View")')).toBeVisible();

    // Check for metric sections (using exact text match for headers)
    await expect(page.locator('td.font-semibold:has-text("Company Information")')).toBeVisible();
    await expect(page.locator('td.font-semibold:has-text("Valuation Metrics")')).toBeVisible();
    await expect(page.locator('td.font-semibold:has-text("Profitability")')).toBeVisible();
    await expect(page.locator('td.font-semibold:has-text("Growth")').first()).toBeVisible();
    await expect(page.locator('td.font-semibold:has-text("Financial Health")')).toBeVisible();
    await expect(page.locator('td.font-semibold:has-text("Dividends")')).toBeVisible();

    // Check for specific metrics
    await expect(page.locator('td:has-text("Market Cap")')).toBeVisible();
    await expect(page.locator('td:has-text("P/E Ratio")')).toBeVisible();
    await expect(page.locator('td:has-text("Profit Margin")')).toBeVisible();
  });
});
