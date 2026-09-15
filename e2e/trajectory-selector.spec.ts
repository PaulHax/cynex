import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  playbackFixturePath,
  SHORT_EPISODE,
  installFixtureRoutes,
} from './fixtureRoutes';

const __dirname = dirname(fileURLToPath(import.meta.url));

test.describe('Trajectory Selector', () => {
  test.beforeEach(async ({ page }) => {
    await installFixtureRoutes(page);
    await page.goto('/');
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 1 / 100'
    );
  });

  test('shows trajectory dropdown with available files', async ({ page }) => {
    const dropdown = page.getByRole('combobox');
    await expect(dropdown).toBeVisible();
    await expect(dropdown).toContainText('playback-100-E0');
    await expect(dropdown).toContainText(SHORT_EPISODE);
  });

  test('shows load file button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Load File' })).toBeVisible();
  });

  test('shows drag-and-drop zone', async ({ page }) => {
    await expect(page.getByText("or drag 'n drop")).toBeVisible();
  });

  test('loads the checked-in default trajectory on startup', async ({
    page,
  }) => {
    await expect(
      page.getByText('CC4 co-training — 3 hosts — Episode 7')
    ).toBeVisible();
  });

  test('load file via file picker', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(playbackFixturePath);

    await expect(
      page.getByText('CC4 co-training — 3 hosts — Episode 7')
    ).toBeVisible();
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 1 / 2'
    );
  });

  test('selecting another trajectory resets the selected step', async ({
    page,
  }) => {
    await page.getByTitle('Last step').click();
    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 100 / 100'
    );

    const dropdown = page.getByRole('combobox');
    await dropdown.selectOption(`${SHORT_EPISODE}.json`);

    await expect(page.getByTestId('playback-step-label')).toHaveText(
      'Step 1 / 2'
    );
  });

  test('invalid file shows error', async ({ page }) => {
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;

    await fileChooser.setFiles(resolve(__dirname, '../package.json'));

    await expect(
      page.getByText('Invalid trajectory file format')
    ).toBeVisible();
  });

  test('drag zone highlights on drag over', async ({ page }) => {
    const appContainer = page.locator('#root > div');

    await appContainer.evaluate((el) => {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File(['{}'], 'test.json', { type: 'application/json' })
      );
      const event = new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer,
      });
      el.dispatchEvent(event);
    });

    await expect(page.getByText('Drop trajectory JSON here')).toBeVisible();
  });
});
