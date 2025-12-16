import { test, expect } from '@playwright/test';

test.describe('Network Topology View', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders page header with trajectory info', async ({ page }) => {
    await expect(
      page.getByText('PPO agent vs RedMeanderAgent_Resilience')
    ).toBeVisible();
  });

  test('renders NetworkGraph canvas', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('renders ActionPanel with step info', async ({ page }) => {
    await expect(
      page.locator('div').filter({ hasText: /^Step 1 \/ 100$/ })
    ).toBeVisible();
    await expect(page.getByText('🔵 BLUE')).toBeVisible();
    await expect(page.getByText('🔴 RED')).toBeVisible();
  });

  test('renders StepControls with navigation buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: '|◀' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: '◀', exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '▶', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '▶|' })).toBeVisible();
    await expect(page.getByRole('slider')).toBeVisible();
  });

  test('step forward updates display', async ({ page }) => {
    await expect(
      page.locator('div').filter({ hasText: /^Step 1 \/ 100$/ })
    ).toBeVisible();

    await page.getByRole('button', { name: '▶', exact: true }).click();

    await expect(
      page.locator('div').filter({ hasText: /^Step 2 \/ 100$/ })
    ).toBeVisible();
  });

  test('step backward updates display', async ({ page }) => {
    await page.getByRole('button', { name: '▶', exact: true }).click();
    await expect(
      page.locator('div').filter({ hasText: /^Step 2 \/ 100$/ })
    ).toBeVisible();

    await page.getByRole('button', { name: '◀', exact: true }).click();

    await expect(
      page.locator('div').filter({ hasText: /^Step 1 \/ 100$/ })
    ).toBeVisible();
  });

  test('slider navigation works', async ({ page }) => {
    const slider = page.getByRole('slider');
    await slider.fill('50');

    await expect(
      page.locator('div').filter({ hasText: /^Step 51 \/ 100$/ })
    ).toBeVisible();
  });

  test('first/last buttons work', async ({ page }) => {
    await page.getByRole('button', { name: '▶|' }).click();
    await expect(
      page.locator('div').filter({ hasText: /^Step 100 \/ 100$/ })
    ).toBeVisible();

    await page.getByRole('button', { name: '|◀' }).click();
    await expect(
      page.locator('div').filter({ hasText: /^Step 1 \/ 100$/ })
    ).toBeVisible();
  });
});
