import { test, expect } from '@playwright/test';
import {
  PLAYBACK_EPISODE,
  playbackFixturePath,
  installFixtureRoutes,
} from './fixtureRoutes';

test.describe('URL parameters', () => {
  test.beforeEach(async ({ page }) => {
    await installFixtureRoutes(page);
  });

  test('loads episode and step from URL on initial load', async ({ page }) => {
    await page.goto(`/?episode=${PLAYBACK_EPISODE}&step=42`);
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 43 / 100'
    );
  });

  test('clamps step above totalSteps', async ({ page }) => {
    await page.goto(`/?episode=${PLAYBACK_EPISODE}&step=9999`);
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 100 / 100'
    );
  });

  test('falls back to first manifest entry when episode is unknown', async ({
    page,
  }) => {
    await page.goto('/?episode=does-not-exist');
    await expect(page).toHaveURL(new RegExp(`episode=${PLAYBACK_EPISODE}`));
  });

  test('writes episode param after default load', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(new RegExp(`episode=${PLAYBACK_EPISODE}`));
  });

  test('writes step param when advancing, removes it at step 0', async ({
    page,
  }) => {
    await page.goto(`/?episode=${PLAYBACK_EPISODE}`);
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 1 / 100'
    );
    await expect(page).not.toHaveURL(/step=/);

    await page.getByTitle('Next step').click();
    await expect(page).toHaveURL(/step=1/);

    await page.getByTitle('First step').click();
    await expect(page).not.toHaveURL(/step=/);
  });

  test('uploaded file clears episode and step params', async ({ page }) => {
    await page.goto(`/?episode=${PLAYBACK_EPISODE}&step=10`);
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 11 / 100'
    );
    await expect(page).toHaveURL(new RegExp(`episode=${PLAYBACK_EPISODE}`));

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(playbackFixturePath);

    await expect(page).not.toHaveURL(/episode=/);
    await expect(page).not.toHaveURL(/step=/);
  });
});
