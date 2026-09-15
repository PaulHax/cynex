import { test, expect } from '@playwright/test';
import { installFixtureRoutes } from './fixtureRoutes';

test.describe('Network Topology View', () => {
  test.beforeEach(async ({ page }) => {
    await installFixtureRoutes(page);
    await page.goto('/');
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 1 / 100'
    );
  });

  test('renders the checked-in trajectory and both agent panels', async ({
    page,
  }) => {
    await expect(
      page.getByText('CC4 co-training — 3 hosts — Episode 7')
    ).toBeVisible();
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByText('BLUE', { exact: true })).toBeVisible();
    await expect(page.getByText('RED', { exact: true })).toBeVisible();
  });

  test('shows a single playback handle and navigation buttons', async ({
    page,
  }) => {
    await expect(page.locator('[data-thumb="step"]')).toBeVisible();
    await expect(page.locator('[data-thumb="start"]')).toHaveCount(0);
    await expect(page.locator('[data-thumb="end"]')).toHaveCount(0);
    for (const title of [
      'First step',
      'Previous step',
      'Play',
      'Next step',
      'Last step',
    ]) {
      await expect(page.getByTitle(title)).toBeVisible();
    }
  });

  test('moves forward, backward, and to both endpoints', async ({ page }) => {
    const label = page.getByTestId('playback-step-label');
    await page.getByTitle('Next step').click();
    await expect(label).toHaveText('Step 2 / 100');
    await page.getByTitle('Previous step').click();
    await expect(label).toHaveText('Step 1 / 100');
    await page.getByTitle('Last step').click();
    await expect(label).toHaveText('Step 100 / 100');
    await page.getByTitle('First step').click();
    await expect(label).toHaveText('Step 1 / 100');
  });

  test('scrubs to the midpoint by dragging the single handle', async ({
    page,
  }) => {
    const thumb = page.locator('[data-thumb="step"]');
    const trackBox = await thumb.locator('..').boundingBox();
    if (!trackBox) throw new Error('Playback track not visible');

    await thumb.hover();
    await page.mouse.down();
    await page.mouse.move(
      trackBox.x + trackBox.width / 2,
      trackBox.y + trackBox.height / 2
    );
    await page.mouse.up();

    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 51 / 100'
    );
  });

  test('clicking the track selects the corresponding step', async ({
    page,
  }) => {
    const trackBox = await page
      .locator('[data-thumb="step"]')
      .locator('..')
      .boundingBox();
    if (!trackBox) throw new Error('Playback track not visible');

    await page.mouse.click(
      trackBox.x + trackBox.width * 0.75,
      trackBox.y + trackBox.height / 2
    );

    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 75 / 100'
    );
  });

  test('opens the trail lookback setting', async ({ page }) => {
    await page.getByTitle('Trail settings').click();
    await expect(page.getByText('Trace lookback steps: 10')).toBeVisible();
  });

  test('hides and restores both agent trails', async ({ page }) => {
    await page.getByRole('button', { name: 'Hide blue agent' }).click();
    await page.getByRole('button', { name: 'Hide red agent' }).click();
    await expect(
      page.getByRole('button', { name: 'Show blue agent' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Show red agent' })
    ).toBeVisible();
    await page.getByRole('button', { name: 'Show blue agent' }).click();
    await page.getByRole('button', { name: 'Show red agent' }).click();
    await expect(
      page.getByRole('button', { name: 'Hide blue agent' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Hide red agent' })
    ).toBeVisible();
  });
});
