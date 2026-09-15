import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const fixturePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  'fixtures/cotraining-trajectory.json'
);
const shortTrajectory = JSON.parse(readFileSync(fixturePath, 'utf8'));
const playbackTrajectory = { ...shortTrajectory, total_steps: 100 };

export const PLAYBACK_EPISODE = 'playback-100-E0';
export const SHORT_EPISODE = 'cotraining-2-E0';

export const installFixtureRoutes = async (page: Page) => {
  await page.route('**/data/trajectories/manifest.json', (route) =>
    route.fulfill({
      json: { files: [`${PLAYBACK_EPISODE}.json`, `${SHORT_EPISODE}.json`] },
    })
  );
  await page.route(`**/data/trajectories/${PLAYBACK_EPISODE}.json`, (route) =>
    route.fulfill({ json: playbackTrajectory })
  );
  await page.route(`**/data/trajectories/${SHORT_EPISODE}.json`, (route) =>
    route.fulfill({ json: shortTrajectory })
  );
};

export const playbackFixturePath = fixturePath;
