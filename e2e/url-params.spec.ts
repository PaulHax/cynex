import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const trajectoryPath = resolve(
  __dirname,
  '../public/data/trajectories/hosts15-ppo-E0.json'
);

test.describe('URL parameters', () => {
  test('loads episode and step from URL on initial load', async ({ page }) => {
    await page.goto('/?episode=hosts15-ppo-E0&step=42');
    await expect(page.getByText('Step 43 / 100').first()).toBeVisible();
  });

  test('clamps step above totalSteps', async ({ page }) => {
    await page.goto('/?episode=hosts15-ppo-E0&step=9999');
    await expect(page.getByText('Step 100 / 100').first()).toBeVisible();
  });

  test('falls back to first manifest entry when episode is unknown', async ({
    page,
  }) => {
    await page.goto('/?episode=does-not-exist');
    await expect(page).toHaveURL(/episode=hosts15-ppo-E0/);
  });

  test('writes episode param after default load', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/episode=hosts15-ppo-E0/);
  });

  test('writes step param when advancing, removes it at step 0', async ({
    page,
  }) => {
    await page.goto('/?episode=hosts15-ppo-E0');
    await expect(page).not.toHaveURL(/step=/);

    await page.getByTitle('Next step').click();
    await expect(page).toHaveURL(/step=1/);

    await page.getByTitle('First step').click();
    await expect(page).not.toHaveURL(/step=/);
  });

  test('uploaded file clears episode and step params', async ({ page }) => {
    await page.goto('/?episode=hosts15-ppo-E0&step=10');
    await expect(page).toHaveURL(/episode=hosts15-ppo-E0/);

    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles({
      name: 'not-in-manifest.json',
      mimeType: 'application/json',
      buffer: readFileSync(trajectoryPath),
    });

    await expect(page).not.toHaveURL(/episode=/);
    await expect(page).not.toHaveURL(/step=/);
  });
});
