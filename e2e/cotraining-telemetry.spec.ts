import { test, expect } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFile } from 'fs/promises';

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
    await expect(page.getByText('R5').first()).toBeVisible();

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
    await expect(page.getByTestId('cia-metrics')).toContainText('R -20');

    const breakdown = page.getByTestId('reward-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(metrics.locator('summary')).toHaveCount(0);
    await expect(breakdown).toContainText('RIA -1');
    await expect(breakdown).toContainText('LWF -2');
    await expect(breakdown).toContainText('ASF -0.5');
    await expect(breakdown).toContainText('Action cost 0');
    const breakdownBox = await breakdown.boundingBox();
    const ciaBox = await page.getByTestId('cia-metrics').boundingBox();
    if (!breakdownBox || !ciaBox) throw new Error('Metrics rows not found');
    expect(breakdownBox.y).toBeLessThan(ciaBox.y);
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

  test('plots CIA and Resilience over time above the slider and collapses', async ({
    page,
  }) => {
    await loadFixture(page);

    const timeline = page.getByTestId('metric-timeline');
    const chart = page.getByTestId('metric-timeline-chart');
    const toggle = timeline.locator(
      'button[aria-controls="metric-timeline-plot"]'
    );
    await expect(toggle).toHaveAccessibleName('Collapse metrics graph');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(chart).toBeVisible();
    await expect(timeline).toContainText('Confidentiality -10');
    await expect(timeline).toContainText('Integrity -20');
    await expect(timeline).toContainText('Availability -30');
    await expect(timeline).toContainText('Resilience -20');
    await expect(timeline).toContainText('Reward total -12.25');
    await expect(chart.locator('path[data-series]')).toHaveCount(5);
    for (const key of ['C', 'I', 'A', 'Resilience', 'Reward']) {
      await expect(chart.locator(`path[data-series="${key}"]`)).toHaveAttribute(
        'd',
        /M .* L /
      );
    }

    const firstMarker = await page
      .getByTestId('metric-timeline-marker')
      .getAttribute('x1');
    const sliderTrack = page.locator('[data-thumb="step"]').locator('..');
    const chartBox = await chart.boundingBox();
    const trackBox = await sliderTrack.boundingBox();
    if (!chartBox || !trackBox) throw new Error('Chart or slider not visible');
    expect(Math.abs(chartBox.x - trackBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(chartBox.width - trackBox.width)).toBeLessThanOrEqual(1);

    await page.locator('button[title="Next step"]').click();
    await expect(
      page.getByText('Step 2 / 2', { exact: true }).last()
    ).toBeVisible();
    await expect(timeline).not.toContainText('Step 2 / 2');
    await expect(timeline).toContainText('Confidentiality -5');
    await expect(timeline).toContainText('Reward total -14.25');
    await expect(
      page.getByTestId('metric-timeline-marker')
    ).not.toHaveAttribute('x1', firstMarker ?? '');

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAccessibleName('Expand metrics graph');
    await expect(chart).toHaveCount(0);
    await expect(timeline).toContainText('Confidentiality -5');
    await expect(page.locator('[data-thumb="step"]')).toBeVisible();
    await toggle.click();
    await expect(chart).toBeVisible();
  });

  test('graph disclosure changes map height without shrinking the sidebar', async ({
    page,
  }) => {
    await loadFixture(page);

    const sidebar = page
      .getByTestId('metrics-card')
      .locator('..')
      .locator('..');
    const map = page.locator('.bg-slate-950').first();
    const playback = page.getByTestId('playback-controls');
    const timeline = page.getByTestId('timeline-controls');
    const sidebarBefore = await sidebar.boundingBox();
    const mapBefore = await map.boundingBox();
    const playbackBox = await playback.boundingBox();
    const timelineBox = await timeline.boundingBox();
    if (!sidebarBefore || !mapBefore || !playbackBox || !timelineBox)
      throw new Error('Split playback layout not visible');

    expect(playbackBox.x + playbackBox.width).toBe(mapBefore.x);
    expect(timelineBox.x).toBe(mapBefore.x);
    expect(sidebarBefore.y + sidebarBefore.height).toBeLessThanOrEqual(
      playbackBox.y
    );

    await page.getByRole('button', { name: 'Collapse metrics graph' }).click();
    const sidebarAfter = await sidebar.boundingBox();
    const mapAfter = await map.boundingBox();
    if (!sidebarAfter || !mapAfter)
      throw new Error('Split playback layout disappeared');
    expect(sidebarAfter.height).toBe(sidebarBefore.height);
    expect(mapAfter.height).toBeGreaterThan(mapBefore.height);
  });

  test('centers the step label in the space after playback buttons', async ({
    page,
  }) => {
    await loadFixture(page);

    const playback = await page.getByTestId('playback-controls').boundingBox();
    const buttons = await page.getByTestId('playback-buttons').boundingBox();
    const label = await page.getByTestId('playback-step-label').boundingBox();
    if (!playback || !buttons || !label)
      throw new Error('Playback bar not visible');
    const remainingCenter =
      (buttons.x + buttons.width + playback.x + playback.width - 16) / 2;
    const labelCenter = label.x + label.width / 2;
    expect(Math.abs(labelCenter - remainingCenter)).toBeLessThanOrEqual(5);
    await expect(page.getByTestId('playback-step-label')).toHaveCSS(
      'text-align',
      'center'
    );
  });

  test('keeps wide chart and playback available after collapsing the sidebar', async ({
    page,
  }) => {
    await loadFixture(page);
    await page.locator('button[title="Collapse sidebar"]').click();

    const chartBox = await page
      .getByTestId('metric-timeline-chart')
      .boundingBox();
    const trackBox = await page
      .locator('[data-thumb="step"]')
      .locator('..')
      .boundingBox();
    const mapBox = await page.locator('.bg-slate-950').first().boundingBox();
    if (!chartBox || !trackBox || !mapBox)
      throw new Error('Collapsed playback layout not visible');
    expect(Math.abs(chartBox.x - trackBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(chartBox.width - trackBox.width)).toBeLessThanOrEqual(1);
    expect(chartBox.x).toBeLessThan(mapBox.x + 20);
    expect(chartBox.width).toBeGreaterThan(mapBox.width * 0.85);

    await expect(page.getByTestId('playback-controls')).toBeVisible();
    await page.locator('button[title="Next step"]').click();
    await expect(page.getByTestId('playback-controls')).toContainText(
      'Step 2 / 2'
    );
  });

  test('keeps the graph cursor aligned when scores end before playback', async ({
    page,
  }) => {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    fixture.metric_scores = fixture.metric_scores.slice(0, 1);
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'partial-metrics.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    });

    await page.locator('button[title="Next step"]').click();
    const timeline = page.getByTestId('metric-timeline');
    await expect(timeline).toContainText('Confidentiality N/A');
    await expect(timeline).toContainText('Reward total -14.25');
    await expect(page.getByTestId('metric-timeline-marker')).toHaveAttribute(
      'x1',
      '1000'
    );
    await expect(page.locator('[data-thumb="step"]')).toHaveAttribute(
      'style',
      /left: 100%/
    );
  });

  test('leaves playback available when a trajectory has no metric scores', async ({
    page,
  }) => {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    fixture.metric_scores = [];
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'no-metrics.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    });

    await expect(page.getByTestId('metric-timeline')).toHaveCount(0);
    await expect(page.locator('[data-thumb="step"]')).toBeVisible();
    await page.locator('button[title="Next step"]').click();
    await expect(page.getByTestId('playback-controls')).toContainText(
      'Step 2 / 2'
    );
  });

  test('keeps the drag-and-drop hint inside the sidebar and loads a dropped file', async ({
    page,
  }) => {
    await page.route('**/data/trajectories/manifest.json', (route) =>
      route.fulfill({ json: { files: [] } })
    );
    await page.goto('/');

    const hint = page.getByText("or drag 'n drop");
    const loadButton = page.getByRole('button', { name: 'Load File' });
    const header = page.locator('header').first();
    await expect(hint).toBeVisible();
    const hintBox = await hint.boundingBox();
    const buttonBox = await loadButton.boundingBox();
    const headerBox = await header.boundingBox();
    if (!hintBox || !buttonBox || !headerBox)
      throw new Error('Sidebar header not visible');
    expect(hintBox.x + hintBox.width).toBeLessThanOrEqual(
      headerBox.x + headerBox.width
    );
    expect(hintBox.y).toBeGreaterThanOrEqual(buttonBox.y + buttonBox.height);
    expect(hintBox.x).toBeGreaterThanOrEqual(buttonBox.x - 20);

    await page.locator('#root > div').evaluate(async (element, path) => {
      const fixture = await fetch('/@fs' + path).then((response) =>
        response.text()
      );
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(
        new File([fixture], 'dropped-cotraining.json', {
          type: 'application/json',
        })
      );
      for (const type of ['dragover', 'drop']) {
        element.dispatchEvent(
          new DragEvent(type, {
            bubbles: true,
            cancelable: true,
            dataTransfer,
          })
        );
      }
    }, fixturePath);

    await expect(
      page.getByText('CC4 co-training — 3 hosts — Episode 7')
    ).toBeVisible();
    await expect(page.getByTestId('metrics-card')).toContainText('Phase 2');
  });
});
