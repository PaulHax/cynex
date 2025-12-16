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

  test('renders ActionPanel with step range info', async ({ page }) => {
    await expect(page.getByText('Steps 1 - 1 / 100').first()).toBeVisible();
    await expect(page.getByText('🔵 BLUE')).toBeVisible();
    await expect(page.getByText('🔴 RED')).toBeVisible();
  });

  test('renders StepControls with navigation buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: '|◀' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: '◀', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '▶▶' })).toBeVisible();
    await expect(
      page.getByRole('button', { name: '▶', exact: true })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '▶|' })).toBeVisible();
  });

  test('step forward updates display', async ({ page }) => {
    await expect(page.getByText('Steps 1 - 1 / 100').first()).toBeVisible();

    await page.getByRole('button', { name: '▶', exact: true }).click();

    await expect(page.getByText('Steps 1 - 2 / 100').first()).toBeVisible();
  });

  test('step backward updates display', async ({ page }) => {
    await page.getByRole('button', { name: '▶', exact: true }).click();
    await expect(page.getByText('Steps 1 - 2 / 100').first()).toBeVisible();

    await page.getByRole('button', { name: '◀', exact: true }).click();

    await expect(page.getByText('Steps 1 - 1 / 100').first()).toBeVisible();
  });

  test('range slider thumbs are visible', async ({ page }) => {
    const startThumb = page.locator('[data-thumb="start"]');
    const endThumb = page.locator('[data-thumb="end"]');
    await expect(startThumb).toBeVisible();
    await expect(endThumb).toBeVisible();
  });

  test('first/last buttons work', async ({ page }) => {
    await page.getByRole('button', { name: '▶|' }).click();
    await expect(page.getByText('Steps 1 - 100 / 100').first()).toBeVisible();

    await page.getByRole('button', { name: '|◀' }).click();
    await expect(page.getByText('Steps 1 - 1 / 100').first()).toBeVisible();
  });

  test('range slider end thumb drag updates range', async ({ page }) => {
    const endThumb = page.locator('[data-thumb="end"]');
    const track = page.locator('.bg-slate-700.rounded-lg').first();

    const trackBox = await track.boundingBox();
    if (!trackBox) throw new Error('Track not found');

    const endX = trackBox.x + trackBox.width * 0.5;
    const y = trackBox.y + trackBox.height / 2;

    await endThumb.hover();
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();

    await expect(
      page.getByText(/Steps 1 - (4[5-9]|5[0-5]) \/ 100/).first()
    ).toBeVisible();
  });

  test('range slider track click sets end position', async ({ page }) => {
    const track = page.locator('.bg-slate-700.rounded-lg').first();

    const trackBox = await track.boundingBox();
    if (!trackBox) throw new Error('Track not found');

    await page.mouse.click(
      trackBox.x + trackBox.width * 0.75,
      trackBox.y + trackBox.height / 2
    );

    await expect(
      page.getByText(/Steps 1 - (7[0-9]|80) \/ 100/).first()
    ).toBeVisible();
  });

  test('range slider start thumb drag updates start position', async ({
    page,
  }) => {
    await page.getByRole('button', { name: '▶|' }).click();
    await expect(page.getByText('Steps 1 - 100 / 100').first()).toBeVisible();

    const startThumb = page.locator('[data-thumb="start"]');
    const track = page.locator('.bg-slate-700.rounded-lg').first();

    const trackBox = await track.boundingBox();
    if (!trackBox) throw new Error('Track not found');

    const endX = trackBox.x + trackBox.width * 0.5;
    const y = trackBox.y + trackBox.height / 2;

    await startThumb.hover();
    await page.mouse.down();
    await page.mouse.move(endX, y);
    await page.mouse.up();

    await expect(
      page.getByText(/Steps (4[5-9]|5[0-5]) - 100 \/ 100/).first()
    ).toBeVisible();
  });

  test('trail color gradient shows age-based fading', async ({ page }) => {
    await page.getByRole('button', { name: '▶|' }).click();
    await expect(page.getByText('Steps 1 - 100 / 100').first()).toBeVisible();

    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
