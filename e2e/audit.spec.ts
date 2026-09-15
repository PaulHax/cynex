import { test, expect } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { PLAYBACK_EPISODE, installFixtureRoutes } from './fixtureRoutes';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', '.playwright', 'audit');
mkdirSync(OUTPUT_DIR, { recursive: true });

const setup = async (page: import('@playwright/test').Page) => {
  await installFixtureRoutes(page);
  await page.goto(`/?episode=${PLAYBACK_EPISODE}&step=8`);
  await expect(page.getByTestId('playback-step-label')).toHaveText(
    'Step 9 / 100'
  );
  await expect(page.locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'Collapse sidebar' }).click();
  await expect(
    page.getByRole('button', { name: 'Expand sidebar' })
  ).toBeVisible();
};

const cases: {
  name: string;
  viewport: { width: number; height: number };
  dsf: number;
}[] = [
  { name: 'small-dpr1', viewport: { width: 1280, height: 720 }, dsf: 1 },
  { name: 'small-dpr2', viewport: { width: 1280, height: 720 }, dsf: 2 },
  { name: 'small-dpr5', viewport: { width: 1280, height: 720 }, dsf: 5 },
  { name: 'big-dpr1', viewport: { width: 3840, height: 2160 }, dsf: 1 },
  { name: 'big-dpr2', viewport: { width: 3840, height: 2160 }, dsf: 2 },
];

test.describe('visual audits', () => {
  test.describe.configure({ mode: 'serial' });
  for (const c of cases) {
    test.describe(c.name, () => {
      test.use({ viewport: c.viewport, deviceScaleFactor: c.dsf });
      test('captures the map at the selected step', async ({ page }) => {
        await setup(page);
        await page.locator('canvas').screenshot({
          path: resolve(OUTPUT_DIR, `${c.name}.png`),
          type: 'png',
        });
      });
    });
  }
});
