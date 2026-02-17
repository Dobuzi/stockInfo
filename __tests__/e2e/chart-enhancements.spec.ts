import { test, expect } from '@playwright/test';
import { skipWithoutApiKeys } from './helpers';

test.describe('Chart Enhancements', () => {
  // Skip all tests in this suite if API keys are not configured
  test.skip(skipWithoutApiKeys() !== false, skipWithoutApiKeys() as string);
  test('should display volume histogram and SMA indicators', async ({ page }) => {
    await page.goto('/');

    // Add ticker with sufficient data for all SMAs
    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'AAPL');
    await page.click('button:has-text("Add")');

    // Wait for chart to load
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Change to 1Y range to ensure enough data for 200-day SMA
    await page.click('button:has-text("1Y")');

    // Wait for chart update
    await page.waitForTimeout(2000);

    // Verify legend shows SMA indicators (desktop only)
    const legend = page.locator('text=SMA 20');
    const viewport = await page.viewportSize();
    if (viewport && viewport.width >= 640) {
      await expect(legend).toBeVisible();
      await expect(page.locator('text=SMA 50')).toBeVisible();
      await expect(page.locator('text=SMA 200')).toBeVisible();
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'test-results/chart-with-indicators.png',
      fullPage: false,
    });
  });

  test('should show appropriate SMAs based on data range', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'MSFT');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // 1-month range: should show 20-day SMA only (maybe 50 if data permits)
    await page.click('button:has-text("1M")');
    await page.waitForTimeout(2000);

    // Legend should show at least SMA 20
    const viewport = await page.viewportSize();
    if (viewport && viewport.width >= 640) {
      await expect(page.locator('text=SMA 20')).toBeVisible();
    }
  });

  test('should display volume histogram below price chart', async ({ page }) => {
    await page.goto('/');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'TSLA');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    // Chart container should be taller (550px vs original 400px)
    const chartSection = page.locator('section:has(canvas)');
    const boundingBox = await chartSection.boundingBox();

    expect(boundingBox).not.toBeNull();
    expect(boundingBox!.height).toBeGreaterThan(500);
  });

  test('should work in dark mode', async ({ page }) => {
    await page.goto('/');

    // Toggle dark mode
    await page.click('button[aria-label="Toggle dark mode"]');

    await page.fill('input[placeholder="Enter ticker (e.g., AAPL)"]', 'GOOGL');
    await page.click('button:has-text("Add")');

    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });

    await page.click('button:has-text("1Y")');
    await page.waitForTimeout(2000);

    // Take dark mode screenshot
    await page.screenshot({
      path: 'test-results/chart-dark-mode.png',
      fullPage: false,
    });

    // Verify legend is visible in dark mode (desktop)
    const viewport = await page.viewportSize();
    if (viewport && viewport.width >= 640) {
      const legend = page.locator('div:has-text("SMA 20")').first();
      await expect(legend).toBeVisible();
    }
  });
});
