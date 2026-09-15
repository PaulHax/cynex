import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturePath = resolve(__dirname, 'fixtures/cotraining-trajectory.json');

const loadFixture = async (page: import('@playwright/test').Page) => {
  await page.goto('/');
  const fileChooserPromise = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Load File' }).click();
  const fileChooser = await fileChooserPromise;
  await fileChooser.setFiles(fixturePath);
};

test.describe('Co-training telemetry', () => {
  test('shows multi-agent actions and combined selected-step metrics', async ({
    page,
  }) => {
    await loadFixture(page);

    await expect(page.getByText('CC4 co-training')).toBeVisible();
    await expect(page.getByText('B4')).toBeVisible();
    await expect(page.getByText('R5')).toBeVisible();

    const metrics = page.getByTestId('metrics-card');
    await expect(metrics).toContainText('Phase 2');
    await expect(metrics).toContainText('Reward -3.5');
    await expect(metrics).toContainText('Total -12.25');
    await expect(metrics).toContainText('R -20');
    const primaryRows = await page
      .getByTestId('primary-metrics')
      .locator(':scope > span')
      .evaluateAll(
        (elements) => new Set(elements.map((element) => element.offsetTop)).size
      );
    expect(primaryRows).toBe(1);
    await expect(page.getByTestId('cia-metrics')).toContainText('C -10');
    await expect(page.getByTestId('cia-metrics')).toContainText('I -20');
    await expect(page.getByTestId('cia-metrics')).toContainText('A -30');

    const breakdown = page.getByTestId('reward-breakdown');
    await expect(breakdown).not.toHaveAttribute('open', '');
    await breakdown.getByText('Reward breakdown').click();
    await expect(breakdown).toContainText('RIA -1');
    await expect(breakdown).toContainText('LWF -2');
    await expect(breakdown).toContainText('ASF -0.5');
    await expect(breakdown).toContainText('Action cost 0');
  });

  test('maps dynamic resilience roles to host icon roles', async ({ page }) => {
    await loadFixture(page);

    const roles = await page.evaluate(async (path) => {
      const { extractTopology } =
        await import('/src/network/extractTopology.ts');
      const fixture = await fetch('/@fs' + path).then((response) =>
        response.json()
      );
      return extractTopology(
        fixture.network_topology,
        fixture.subnet_metadata,
        fixture.host_resilience_roles
      ).hosts.map((host) => [host.id, host.role]);
    }, fixturePath);

    expect(roles).toEqual([
      ['op_server_host_0', 'auth'],
      ['op_server_host_1', 'database'],
      ['op_server_host_2', 'front'],
    ]);
  });

  test('loads V2 trajectories that omit optional co-training telemetry', async ({
    page,
  }) => {
    await page.goto('/');

    const normalized = await page.evaluate(async (path) => {
      const { parseTrajectory } = await import('/src/trajectory/normalize.ts');
      const fixture = await fetch('/@fs' + path).then((response) =>
        response.json()
      );
      delete fixture.host_resilience_roles;
      delete fixture.step_states[0].reward_breakdown;
      fixture.metric_scores = [];
      return parseTrajectory(fixture);
    }, fixturePath);

    expect(normalized.hostResilienceRoles).toEqual({});
    expect(normalized.stepStates[0].reward_breakdown).toBeUndefined();
    expect(normalized.metricScores).toEqual([]);
  });

  test('keeps the grabbing cursor throughout timeline scrubbing', async ({
    page,
  }) => {
    await loadFixture(page);

    const thumb = page.locator('[data-thumb="step"]');
    const box = await thumb.boundingBox();
    if (!box) throw new Error('Timeline thumb not found');

    await thumb.hover();
    await page.mouse.down();
    await expect(page.locator('html')).toHaveClass(/is-scrubbing/);
    const cursorShield = page.locator('[data-scrubbing-cursor-shield]');
    await expect(cursorShield).toBeVisible();

    for (const x of [box.x - 80, box.x + 80, box.x + 160]) {
      await page.mouse.move(x, box.y + box.height / 2);
      const cursorState = await page.evaluate(() => {
        const element = document.elementFromPoint(10, 10);
        return {
          isShield: element?.hasAttribute('data-scrubbing-cursor-shield'),
          cursor: element ? getComputedStyle(element).cursor : null,
        };
      });
      expect(cursorState).toEqual({ isShield: true, cursor: 'grabbing' });
    }

    await page.mouse.up();
    await expect(page.locator('html')).not.toHaveClass(/is-scrubbing/);
    await expect(cursorShield).toHaveCount(0);
  });
});
