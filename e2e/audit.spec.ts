import { test } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = resolve(__dirname, '..', '.playwright', 'audit');
mkdirSync(OUTPUT_DIR, { recursive: true });

const setup = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  await page.locator('canvas').first().waitFor({ state: 'visible' });
  await page.getByRole('button', { name: '▶', exact: true }).waitFor();
  const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
  if (await collapse.isVisible().catch(() => false)) await collapse.click();
  const next = page.getByRole('button', { name: '▶', exact: true });
  for (let i = 0; i < 8; i++) await next.click();
  await page.waitForTimeout(400);
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

for (const c of cases) {
  test.describe(`audit ${c.name}`, () => {
    test.use({ viewport: c.viewport, deviceScaleFactor: c.dsf });
    test('capture', async ({ page }) => {
      await setup(page);
      await page
        .locator('canvas')
        .first()
        .screenshot({
          path: resolve(OUTPUT_DIR, `${c.name}.png`),
          type: 'png',
        });
    });
  });
}
