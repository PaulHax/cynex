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
  test.beforeEach(async ({ page }) => {
    await page.route('**/data/trajectories/manifest.json', (route) =>
      route.fulfill({ json: { files: [] } })
    );
  });

  test('shows multi-agent actions and combined selected-step metrics', async ({
    page,
  }) => {
    await loadFixture(page);

    await expect(page.getByText('CC4 co-training')).toBeVisible();
    await expect(page.getByText('B4')).toBeVisible();
    await expect(page.getByText('R5').first()).toBeVisible();

    const metrics = page.getByTestId('metrics-card');
    await expect(metrics.locator('..').locator('..')).not.toContainText(
      'Step 1 / 2'
    );
    await expect(page.getByTestId('playback-controls')).toContainText(
      'Step 1 / 2'
    );
    await expect(metrics).toContainText('Phase 2');
    await expect(metrics).toContainText('Reward -3.5');
    await expect(metrics).toContainText('Total -12.25');
    await expect(metrics).not.toContainText('C -10');
    const primaryRows = await page
      .getByTestId('primary-metrics')
      .locator(':scope > span')
      .evaluateAll(
        (elements) => new Set(elements.map((element) => element.offsetTop)).size
      );
    expect(primaryRows).toBe(1);
    await expect(page.getByTestId('metric-timeline')).toContainText(
      'Confidentiality -10'
    );

    const breakdown = page.getByTestId('reward-breakdown');
    await expect(breakdown).toBeVisible();
    await expect(metrics.locator('summary')).toHaveCount(0);
    await expect(breakdown).toContainText('RIA -1');
    await expect(breakdown).toContainText('LWF -2');
    await expect(breakdown).toContainText('ASF -0.5');
    await expect(breakdown).toContainText('Action cost 0');
    const breakdownBox = await breakdown.boundingBox();
    const primaryBox = await page.getByTestId('primary-metrics').boundingBox();
    if (!breakdownBox || !primaryBox) throw new Error('Metrics rows not found');
    expect(primaryBox.y).toBeLessThan(breakdownBox.y);
  });

  test('shows green agent work outcomes on host hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    fixture.green_agents = ['green_agent_0'];
    fixture.agent_actions.green_agent_0 = [
      {
        step: 0,
        Action: 'GreenAccessService',
        Status: 'TRUE',
        Host: 'op_server_host_0',
        Params: {},
      },
      {
        step: 1,
        Action: 'GreenAccessService',
        Status: 'FALSE',
        Host: 'op_server_host_0',
        Params: {},
      },
    ];

    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'green-work-trajectory.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(fixture)),
    });
    await page.locator('canvas').waitFor();
    await page.screenshot();

    await page.mouse.move(748, 150);
    const tooltip = page.getByTestId('host-tooltip');
    await expect(tooltip).toContainText('op_server_host_0');
    await expect(tooltip).toContainText('Green agent work: Successful');

    await page.getByTitle('Next step').click();
    await page.mouse.move(650, 300);
    await page.mouse.move(748, 150);
    await expect(tooltip).toContainText('Green agent work: Failed');
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

  test('loads a legacy trajectory and plots its recorded scores', async ({
    page,
  }) => {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    const legacy = {
      blue_agent_name: fixture.blue_agent_name,
      red_agent_name: fixture.red_agent_name,
      episode: fixture.episode,
      experiment_time: fixture.experiment_time,
      network_topology: fixture.network_topology,
      blue_actions: [
        { Action: 'Analyse', Status: 'TRUE', Host: 'op_server_host_1' },
        { Action: 'Remove', Status: 'TRUE', Host: 'op_server_host_2' },
      ],
      red_actions: [
        {
          Action: 'ExploitRemoteService',
          Status: 'TRUE',
          Host: 'op_server_host_0',
        },
        {
          Action: 'PrivilegeEscalate',
          Status: 'TRUE',
          Host: 'op_server_host_0',
        },
      ],
      metric_scores: fixture.metric_scores,
    };
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'legacy-trajectory.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(legacy)),
    });

    await expect(page.getByTestId('metric-timeline')).toContainText(
      'Confidentiality -10'
    );
    await expect(page.getByTestId('metric-timeline')).not.toContainText(
      'Reward'
    );
    await expect(page.getByTestId('metric-reward-axis')).toHaveCount(0);
    await expect(page.getByTestId('playback-controls')).toContainText(
      'Step 1 / 2'
    );
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
    const legendBox = await toggle.boundingBox();
    const controlsBox = await page
      .getByTestId('timeline-controls')
      .boundingBox();
    if (!legendBox || !controlsBox)
      throw new Error('Metrics legend not visible');
    expect(legendBox.height).toBeLessThanOrEqual(24);
    expect(Math.abs(legendBox.x - controlsBox.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(legendBox.width - controlsBox.width)).toBeLessThanOrEqual(
      1
    );
    expect(Math.abs(legendBox.y - controlsBox.y)).toBeLessThanOrEqual(1);
    await expect(toggle).toHaveCSS('border-top-left-radius', '0px');
    await page.mouse.click(legendBox.x + legendBox.width - 8, legendBox.y + 2);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const collapsedLegendBox = await toggle.boundingBox();
    if (!collapsedLegendBox) throw new Error('Collapsed legend not visible');
    await page.mouse.click(
      collapsedLegendBox.x + collapsedLegendBox.width - 8,
      collapsedLegendBox.y + 2
    );
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(timeline).toContainText('Confidentiality -10');
    await expect(timeline).toContainText('Integrity -20');
    await expect(timeline).toContainText('Availability -30');
    await expect(timeline).toContainText('Resilience -20');
    await expect(timeline).toContainText('Reward -12.25');
    await expect(chart.locator('path[data-series]')).toHaveCount(5);
    await timeline
      .getByRole('button', { name: 'Hide Confidentiality line' })
      .click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(chart.locator('path[data-series="C"]')).toHaveCount(0);
    await timeline
      .getByRole('button', { name: 'Show Confidentiality line' })
      .click();
    await expect(chart.locator('path[data-series="C"]')).toHaveCount(1);
    await timeline.getByRole('button', { name: 'Hide Reward line' }).click();
    await expect(chart.locator('path[data-series="Reward"]')).toHaveCount(0);
    await expect(page.getByTestId('metric-reward-axis')).toHaveCount(0);
    await timeline.getByRole('button', { name: 'Show Reward line' }).click();
    await expect(chart.locator('path[data-series="Reward"]')).toHaveCount(1);
    await expect(
      page.getByTestId('metric-score-axis').locator('span')
    ).toHaveText(['10', '0', '-10', '-20', '-30']);
    await expect(
      page.getByTestId('metric-reward-axis').locator('span')
    ).toHaveText(['5', '0', '-5', '-10', '-15']);
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

    const cLineBox = await chart.locator('path[data-series="C"]').boundingBox();
    if (!cLineBox) throw new Error('Confidentiality line not visible');
    await page.mouse.move(
      cLineBox.x + cLineBox.width * 0.9,
      cLineBox.y + cLineBox.height * 0.1
    );
    const tooltip = page.getByTestId('metric-timeline-tooltip');
    await expect(tooltip).toHaveText('Confidentiality -5');
    await expect(page.getByTestId('metric-timeline-dot')).toBeVisible();
    const tooltipBox = await tooltip.boundingBox();
    if (!tooltipBox) throw new Error('Metric tooltip not visible');
    expect(tooltipBox.width).toBeLessThan(180);
    expect(tooltipBox.height).toBeLessThan(25);
    expect(tooltipBox.x + tooltipBox.width).toBeLessThanOrEqual(
      controlsBox.x + controlsBox.width
    );
    await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + 30);
    await expect(tooltip).toHaveCount(0);

    const rewardLineBox = await chart
      .locator('path[data-series="Reward"]')
      .boundingBox();
    if (!rewardLineBox) throw new Error('Reward line not visible');
    await page.mouse.move(
      rewardLineBox.x + rewardLineBox.width * 0.9,
      rewardLineBox.y + rewardLineBox.height * 0.9
    );
    await expect(tooltip).toHaveText('Cumulative Blue reward -14.25');
    await page.mouse.move(chartBox.x + chartBox.width / 2, chartBox.y + 30);
    await expect(tooltip).toHaveCount(0);

    await page.locator('button[title="Next step"]').click();
    await expect(
      page.getByText('Step 2 / 2', { exact: true }).last()
    ).toBeVisible();
    await expect(timeline).not.toContainText('Step 2 / 2');
    await expect(timeline).toContainText('Confidentiality -5');
    await expect(timeline).toContainText('Reward -14.25');
    await expect(
      page.getByTestId('metric-timeline-marker')
    ).not.toHaveAttribute('x1', firstMarker ?? '');

    const metricTextBox = await timeline
      .getByText('Confidentiality -5')
      .boundingBox();
    if (!metricTextBox) throw new Error('Metrics legend text not visible');
    await page.mouse.click(
      metricTextBox.x + metricTextBox.width / 2,
      metricTextBox.y + metricTextBox.height / 2
    );
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toHaveAccessibleName('Expand metrics graph');
    await expect(chart).toHaveCount(0);
    await expect(timeline).toContainText('Confidentiality -5');
    await expect(page.locator('[data-thumb="step"]')).toBeVisible();
    await toggle.press('Enter');
    await expect(chart).toBeVisible();
  });

  test('keeps trail settings above the expanded graph', async ({ page }) => {
    await loadFixture(page);
    await page.getByTitle('Trail settings').click();

    const popover = page
      .getByText('Trace lookback steps:', { exact: false })
      .locator('..');
    await expect(popover).toBeVisible();
    const appearance = await popover.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      zIndex: Number(getComputedStyle(element).zIndex),
    }));
    expect(appearance.background).not.toBe('transparent');
    expect(appearance.background).not.toBe('rgba(0, 0, 0, 0)');
    expect(appearance.zIndex).toBeGreaterThan(20);
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

    await page
      .getByRole('button', { name: 'Collapse metrics graph' })
      .press('Enter');
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
    await expect(timeline).toContainText('Reward -14.25');
    await expect(page.getByTestId('metric-timeline-marker')).toHaveAttribute(
      'x1',
      '1000'
    );
    await expect(page.locator('[data-thumb="step"]')).toHaveAttribute(
      'style',
      /left: 100%/
    );
  });

  test('plots cumulative reward when a trajectory has no metric scores', async ({
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

    const timeline = page.getByTestId('metric-timeline');
    await expect(timeline).toContainText('Reward -12.25');
    await expect(timeline).not.toContainText('Confidentiality');
    await expect(page.locator('[data-series="Reward"]')).toBeVisible();
    await expect(page.getByTestId('metric-reward-axis')).toBeVisible();
    await expect(page.getByTestId('metric-score-axis')).toHaveCount(0);
    await expect(page.locator('[data-thumb="step"]')).toBeVisible();
    await page.locator('button[title="Next step"]').click();
    await expect(page.getByTestId('playback-controls')).toContainText(
      'Step 2 / 2'
    );
    await expect(timeline).toContainText('Reward -14.25');
  });

  test('hides the graph when neither scores nor rewards were recorded', async ({
    page,
  }) => {
    const fixture = JSON.parse(await readFile(fixturePath, 'utf8'));
    fixture.metric_scores = [];
    for (const state of fixture.step_states) state.cumulative_reward = {};
    await page.goto('/');
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Load File' }).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'no-graph-data.json',
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
