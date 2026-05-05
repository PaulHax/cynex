import { test } from '@playwright/test';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// High-DPI captures of the main network view, taken ~15 steps into the
// trajectory. The Vite dev server is started by the playwright config.
//
// We use deviceScaleFactor to multiply backing-buffer pixels without
// changing layout, so the deck.gl canvas (useDevicePixels=true) renders
// at the higher resolution. Viewport 1920x1080 with DPR 5 yields a
// 9600x5400 backing buffer — comfortably above 8K (7680x4320).
const VIEWPORT = { width: 1920, height: 1080 };
const DEVICE_SCALE_FACTOR = 5;
const STEPS_INTO_TRAJECTORY = 15;
const OUTPUT_DIR = resolve(__dirname, '..', '.playwright', 'screenshots');

mkdirSync(OUTPUT_DIR, { recursive: true });

test.use({
  viewport: VIEWPORT,
  deviceScaleFactor: DEVICE_SCALE_FACTOR,
  launchOptions: {
    executablePath:
      process.env.CHROMIUM_PATH ??
      '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  },
});

test.describe('high-resolution network view screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    // Wait for the canvas + step controls to be ready (trajectory loaded).
    await page.locator('canvas').first().waitFor({ state: 'visible' });
    await page.getByRole('button', { name: '▶', exact: true }).waitFor();

    // Collapse the sidebar so the network fills the viewport.
    const collapse = page.getByRole('button', { name: 'Collapse sidebar' });
    if (await collapse.isVisible().catch(() => false)) {
      await collapse.click();
    }

    // Step into the trajectory.
    const next = page.getByRole('button', { name: '▶', exact: true });
    for (let i = 0; i < STEPS_INTO_TRAJECTORY; i++) {
      await next.click();
    }

    // Give deck.gl a moment to render the new step + trails.
    await page.waitForTimeout(500);
  });

  test('dark background', async ({ page }) => {
    const network = page.locator('.bg-slate-950').first();
    await network.screenshot({
      path: resolve(OUTPUT_DIR, 'network-dark.png'),
      type: 'png',
    });
  });

  test('white background', async ({ page }) => {
    // Override the dark page/network background. The deck.gl canvas is
    // transparent by default, so the parent's background shows through.
    await page.addStyleTag({
      content: `
        html, body, .bg-slate-950, .bg-slate-900 { background: #ffffff !important; }
      `,
    });
    await page.waitForTimeout(200);

    const network = page.locator('.bg-slate-950').first();
    await network.screenshot({
      path: resolve(OUTPUT_DIR, 'network-white.png'),
      type: 'png',
      omitBackground: false,
    });
  });
});
