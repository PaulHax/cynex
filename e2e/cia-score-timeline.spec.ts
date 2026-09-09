import { test, expect, type Page } from '@playwright/test';

const createTrajectory = (includeMetrics: boolean) => ({
  blue_agent_name: 'BlueAgent',
  red_agent_name: 'RedAgent',
  episode: 7,
  experiment_time: '2026-08-28T00:00:00Z',
  network_topology: {
    User0: {
      Interface: [
        {
          'Interface Name': 'eth0',
          'IP Address': '10.0.0.10',
          Subnet: {
            network_address: '10.0.0.0',
            netmask: '255.255.255.0',
            _prefixlen: 24,
          },
        },
      ],
      Sessions: [],
      Processes: [],
      'User Info': [],
      'System info': {
        Hostname: 'User0',
        OSType: 'LINUX',
        OSDistribution: 'Ubuntu',
        OSVersion: '22.04',
        Architecture: 'x86_64',
      },
    },
  },
  blue_actions: [
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
    { Action: 'Monitor', Status: 'TRUE', Host: 'User0' },
  ],
  red_actions: [
    {
      Action: 'DiscoverRemoteSystems',
      Status: 'TRUE',
      Subnet: 'User',
    },
    { Action: 'Sleep', Status: 'UNKNOWN', Host: 'Sleep' },
    { Action: 'Sleep', Status: 'UNKNOWN', Host: 'Sleep' },
    { Action: 'Sleep', Status: 'UNKNOWN', Host: 'Sleep' },
    { Action: 'Sleep', Status: 'UNKNOWN', Host: 'Sleep' },
    { Action: 'Sleep', Status: 'UNKNOWN', Host: 'Sleep' },
  ],
  ...(includeMetrics
    ? {
        metric_scores: [
          { C: 1, I: 0.5, A: 2, Resilience: 0.9 },
          { C: 2, I: 0.5, A: -1, Resilience: 0.8 },
          { C: -1, I: 1, A: 0.5, Resilience: 0.7 },
          { C: 3, I: 2, A: 1, Resilience: 0.7 },
          { C: 1, I: 4, A: 3, Resilience: 0.6 },
          { C: -4, I: -6, A: -4, Resilience: 0.5 },
        ],
      }
    : {}),
});

const loadTrajectory = async (page: Page, includeMetrics: boolean) => {
  await page.route('**/data/trajectories/manifest.json', (route) =>
    route.fulfill({ json: { files: ['timeline-test.json'] } })
  );
  await page.route('**/data/trajectories/timeline-test.json', (route) =>
    route.fulfill({ json: createTrajectory(includeMetrics) })
  );
  await page.goto('/');
  await expect(page.getByText('BlueAgent vs RedAgent')).toBeVisible();
};

test.describe('Cumulative CIA score timeline', () => {
  test('plots separate downward cumulative values, follows the step, and toggles', async ({
    page,
  }) => {
    await loadTrajectory(page, true);

    const timeline = page.getByTestId('cia-score-timeline');
    const toggle = page.getByRole('button', {
      name: 'Collapse CIA score timeline',
    });

    await expect(timeline).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      timeline.getByTitle('Confidentiality cumulative value at selected step')
    ).toContainText('1.0');
    await expect(
      timeline.getByTitle('Integrity cumulative value at selected step')
    ).toContainText('0.5');
    await expect(
      timeline.getByTitle('Availability cumulative value at selected step')
    ).toContainText('2.0');

    const cPlot = timeline.getByTestId('cia-c-plot');
    const iPlot = timeline.getByTestId('cia-i-plot');
    const aPlot = timeline.getByTestId('cia-a-plot');
    for (const plot of [cPlot, iPlot, aPlot]) {
      await expect(plot).toBeVisible();
      await expect(plot).toHaveAttribute(
        'data-axis-direction',
        'increasing-downward'
      );
    }
    const initialMinimums = await Promise.all(
      [cPlot, iPlot, aPlot].map((plot) => plot.getAttribute('data-y-min'))
    );
    const initialMaximums = await Promise.all(
      [cPlot, iPlot, aPlot].map((plot) => plot.getAttribute('data-y-max'))
    );
    expect(new Set(initialMinimums).size).toBe(1);
    expect(new Set(initialMaximums).size).toBe(1);
    const initialMaximum = Number(initialMaximums[0]);

    const cLine = cPlot.locator('path[data-series="C"]');
    const iLine = iPlot.locator('path[data-series="I"]');
    const aLine = aPlot.locator('path[data-series="A"]');
    for (const line of [cLine, iLine, aLine]) {
      await expect(line).toHaveAttribute('data-visible-points', '1');
    }
    await expect(cPlot.locator('line[stroke-dasharray]')).toHaveCount(0);
    await expect(iPlot.locator('line[stroke-dasharray]')).toHaveCount(0);
    await expect(aPlot.locator('line[stroke-dasharray]')).toHaveCount(0);

    const [cBox, iBox, aBox] = await Promise.all([
      cPlot.boundingBox(),
      iPlot.boundingBox(),
      aPlot.boundingBox(),
    ]);
    expect(cBox).not.toBeNull();
    expect(iBox).not.toBeNull();
    expect(aBox).not.toBeNull();
    expect(cBox!.x).toBeLessThan(iBox!.x);
    expect(iBox!.x).toBeLessThan(aBox!.x);
    expect(Math.abs(cBox!.y - iBox!.y)).toBeLessThan(2);
    expect(Math.abs(iBox!.y - aBox!.y)).toBeLessThan(2);

    await expect(timeline.locator('[data-current-step]')).toHaveAttribute(
      'data-current-step',
      '0'
    );

    await page.getByTitle('Next step').click();
    await expect(timeline.locator('[data-current-step]')).toHaveAttribute(
      'data-current-step',
      '1'
    );
    for (const line of [cLine, iLine, aLine]) {
      await expect(line).toHaveAttribute('data-visible-points', '2');
      await expect(line).toHaveAttribute('d', / L /);
    }
    await expect(
      timeline.getByTitle('Confidentiality cumulative value at selected step')
    ).toContainText('3.0');
    const advancedMaximums = await Promise.all(
      [cPlot, iPlot, aPlot].map((plot) => plot.getAttribute('data-y-max'))
    );
    expect(new Set(advancedMaximums).size).toBe(1);
    expect(Number(advancedMaximums[0])).toBeGreaterThan(initialMaximum);

    await page.getByTitle('Previous step').click();
    for (const line of [cLine, iLine, aLine]) {
      await expect(line).toHaveAttribute('data-visible-points', '1');
    }
    for (const plot of [cPlot, iPlot, aPlot]) {
      await expect(plot).toHaveAttribute('data-y-max', String(initialMaximum));
    }

    await toggle.click();
    const expandToggle = page.getByRole('button', {
      name: 'Expand CIA score timeline',
    });
    await expect(expandToggle).toHaveAttribute('aria-expanded', 'false');
    await expect(timeline.locator('#cia-score-timeline-chart')).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    await expandToggle.click();
    await expect(
      page.getByRole('button', {
        name: 'Collapse CIA score timeline',
      })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  test('switches between sum and adjustable running-average modes', async ({
    page,
  }) => {
    await loadTrajectory(page, true);

    const timeline = page.getByTestId('cia-score-timeline');
    await expect(timeline).toHaveAttribute('data-plot-mode', 'sum');

    await page.getByTitle('Settings').click();
    const sumMode = page.getByRole('button', { name: /^SUM/ });
    const trendMode = page.getByRole('button', { name: /^TREND/ });
    await expect(sumMode).toHaveAttribute('aria-pressed', 'true');
    await expect(trendMode).toHaveAttribute('aria-pressed', 'false');
    await expect(
      page.getByRole('slider', { name: 'CIA running average window' })
    ).toHaveCount(0);

    await trendMode.click();
    await expect(timeline).toHaveAttribute('data-plot-mode', 'trend');
    await expect(page.getByText('CIA Alignment')).toBeVisible();

    const averageWindow = page.getByRole('slider', {
      name: 'CIA running average window',
    });
    await expect(averageWindow).toHaveValue('5');
    await averageWindow.fill('2');
    await expect(averageWindow).toHaveValue('2');
    await expect(page.getByText('CIA Alignment')).toBeVisible();

    await page.getByTitle('Last step').click();
    await expect(
      timeline.getByTitle('Confidentiality 2-step average at selected step')
    ).toContainText('-1.5');

    await page.getByTitle('Settings').click();
    await page.getByRole('button', { name: /^SUM/ }).click();
    await expect(timeline).toHaveAttribute('data-plot-mode', 'sum');
    await expect(page.getByText('Cumulative CIA Drop')).toBeVisible();
    await expect(
      timeline.getByTitle('Confidentiality cumulative value at selected step')
    ).toContainText('2.0');
  });

  test('does not render a tab when CIA metrics are absent', async ({
    page,
  }) => {
    await loadTrajectory(page, false);

    await expect(page.getByTestId('cia-score-timeline')).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /CIA score timeline/ })
    ).toHaveCount(0);

    await page.getByTitle('Settings').click();
    await expect(page.getByText('CIA plot')).toHaveCount(0);
  });
});
