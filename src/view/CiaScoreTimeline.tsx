import { useMemo } from 'react';
import type { MetricScore } from '../trajectory/types';

type CiaScoreTimelineProps = {
  scores: MetricScore[];
  currentStep: number;
  expanded: boolean;
  mode: CiaPlotMode;
  averageWindow: number;
  onExpandedChange: (expanded: boolean) => void;
};

type CiaMetric = 'C' | 'I' | 'A';

type CumulativePoint = Record<CiaMetric, number>;

export type CiaPlotMode = 'sum' | 'trend';

type PlotDomain = {
  minimum: number;
  maximum: number;
};

type SeriesDefinition = {
  key: CiaMetric;
  label: string;
  color: string;
  textClass: string;
  chipClass: string;
};

const SERIES: ReadonlyArray<SeriesDefinition> = [
  {
    key: 'C',
    label: 'Confidentiality',
    color: '#22d3ee',
    textClass: 'text-cyan-300',
    chipClass: 'border-cyan-400/30 bg-cyan-400/10',
  },
  {
    key: 'I',
    label: 'Integrity',
    color: '#a78bfa',
    textClass: 'text-violet-300',
    chipClass: 'border-violet-400/30 bg-violet-400/10',
  },
  {
    key: 'A',
    label: 'Availability',
    color: '#fbbf24',
    textClass: 'text-amber-300',
    chipClass: 'border-amber-400/30 bg-amber-400/10',
  },
];

const formatScore = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  if (Math.abs(value) >= 10) {
    return value.toFixed(0);
  }
  return value.toFixed(1);
};

const getSharedDomain = (
  points: CumulativePoint[],
  selectedIndex: number
): PlotDomain => {
  const values = points
    .slice(0, selectedIndex + 1)
    .flatMap((point) => [point.C, point.I, point.A]);
  let minimum = Math.min(0, ...values);
  let maximum = Math.max(0, ...values);

  if (minimum === maximum) {
    maximum = minimum + 1;
  } else {
    const padding = (maximum - minimum) * 0.08;
    if (minimum < 0) minimum -= padding;
    if (maximum > 0) maximum += padding;
  }

  return { minimum, maximum };
};

type MetricPlotProps = {
  points: CumulativePoint[];
  series: SeriesDefinition;
  selectedIndex: number;
  mode: CiaPlotMode;
  averageWindow: number;
  domain: PlotDomain;
};

const MetricPlot = ({
  points,
  series,
  selectedIndex,
  mode,
  averageWindow,
  domain,
}: MetricPlotProps) => {
  const chart = useMemo(() => {
    const xForIndex = (index: number) =>
      points.length === 1 ? 0 : (index / (points.length - 1)) * 100;
    const yForValue = (value: number) =>
      ((value - domain.minimum) / (domain.maximum - domain.minimum)) * 100;

    const visiblePoints = points.slice(0, selectedIndex + 1);
    const linePath = visiblePoints
      .map(
        (point, index) =>
          `${index === 0 ? 'M' : 'L'} ${xForIndex(index)} ${yForValue(point[series.key])}`
      )
      .join(' ');
    const areaPath = `M 0 0 ${visiblePoints
      .map(
        (point, index) =>
          `L ${xForIndex(index)} ${yForValue(point[series.key])}`
      )
      .join(' ')} L ${xForIndex(selectedIndex)} 0 Z`;

    return {
      xForIndex,
      yForValue,
      linePath,
      areaPath,
      visiblePointCount: visiblePoints.length,
      gridValues: Array.from(
        { length: 4 },
        (_, index) =>
          domain.minimum + ((domain.maximum - domain.minimum) * index) / 3
      ),
    };
  }, [points, series.key, selectedIndex, domain.minimum, domain.maximum]);

  const selectedPoint = points[selectedIndex];
  const selectedX = chart.xForIndex(selectedIndex);
  const selectedY = chart.yForValue(selectedPoint[series.key]);
  const gradientId = `cia-drop-fill-${series.key.toLowerCase()}`;
  const glowId = `cia-drop-glow-${series.key.toLowerCase()}`;
  const valueTitle =
    mode === 'sum'
      ? `${series.label} cumulative value at step ${selectedIndex + 1}`
      : `${series.label} ${averageWindow}-step average at step ${selectedIndex + 1}`;
  const plotDescription =
    mode === 'sum'
      ? `${series.label} cumulative drop`
      : `${series.label} ${averageWindow}-step running average`;

  return (
    <article
      className="flex min-w-0 flex-col overflow-hidden rounded border border-slate-700/70 bg-slate-900/75 shadow-inner"
      data-testid={`cia-${series.key.toLowerCase()}-plot`}
      data-axis-direction="increasing-downward"
      data-y-min={domain.minimum}
      data-y-max={domain.maximum}
    >
      <header className="flex h-8 flex-shrink-0 items-center gap-2 border-b border-slate-700/60 bg-slate-800/60 px-2">
        <span
          className={`font-mono text-base font-bold ${series.textClass}`}
          aria-hidden="true"
        >
          {series.key}
        </span>
        <span className="truncate font-mono text-[10px] uppercase tracking-[0.12em] text-slate-300">
          {series.label}
        </span>
        <span className="ml-auto whitespace-nowrap font-mono text-[9px] uppercase tracking-wider text-slate-500">
          {mode === 'sum' ? 'Sum ↓' : `Avg ${averageWindow} ↓`}
        </span>
        <span
          className={`min-w-12 text-right font-mono text-[11px] ${series.textClass}`}
          title={valueTitle}
        >
          {formatScore(selectedPoint[series.key])}
        </span>
      </header>

      <div className="relative min-h-0 flex-1 pb-4 pl-10 pr-2 pt-2">
        <div className="relative h-full">
          {chart.gridValues.map((value, index) => (
            <span
              key={`${value}-${index}`}
              className="absolute -left-10 w-8 -translate-y-1/2 text-right font-mono text-[8px] text-slate-500"
              style={{ top: `${(index / 3) * 100}%` }}
            >
              {formatScore(value)}
            </span>
          ))}

          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            role="img"
            aria-label={`${plotDescription} across ${points.length} steps; values increase downward; selected step ${selectedIndex + 1}`}
          >
            <title>{plotDescription} by trajectory step</title>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series.color} stopOpacity="0.04" />
                <stop
                  offset="100%"
                  stopColor={series.color}
                  stopOpacity="0.22"
                />
              </linearGradient>
              <filter id={glowId} x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="0.7" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {chart.gridValues.map((_, index) => (
              <line
                key={`horizontal-${index}`}
                x1="0"
                x2="100"
                y1={(index / 3) * 100}
                y2={(index / 3) * 100}
                stroke="#334155"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {[0, 25, 50, 75, 100].map((position) => (
              <line
                key={`vertical-${position}`}
                x1={position}
                x2={position}
                y1="0"
                y2="100"
                stroke="#1e293b"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            ))}

            <path
              d={chart.areaPath}
              data-series-area={series.key}
              fill={`url(#${gradientId})`}
            />
            <path
              d={chart.linePath}
              data-series={series.key}
              data-visible-points={chart.visiblePointCount}
              fill="none"
              stroke={series.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
              vectorEffect="non-scaling-stroke"
              filter={`url(#${glowId})`}
            />
          </svg>

          <span
            className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-slate-950 shadow-[0_0_8px_currentColor]"
            style={{
              left: `${selectedX}%`,
              top: `${selectedY}%`,
              color: series.color,
              backgroundColor: series.color,
            }}
            title={`${series.label}: ${formatScore(selectedPoint[series.key])}`}
          />

          <span className="absolute -bottom-4 left-0 font-mono text-[8px] text-slate-500">
            STEP 1
          </span>
          {points.length > 1 && (
            <span className="absolute -bottom-4 right-0 font-mono text-[8px] text-slate-500">
              STEP {points.length}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export const CiaScoreTimeline = ({
  scores,
  currentStep,
  expanded,
  mode,
  averageWindow,
  onExpandedChange,
}: CiaScoreTimelineProps) => {
  const points = useMemo<CumulativePoint[]>(() => {
    if (mode === 'trend') {
      const window = Math.min(
        Math.max(1, Math.floor(averageWindow)),
        scores.length
      );
      const totals: CumulativePoint = { C: 0, I: 0, A: 0 };

      return scores.map((score, index) => {
        totals.C += score.C;
        totals.I += score.I;
        totals.A += score.A;

        if (index >= window) {
          const expired = scores[index - window];
          totals.C -= expired.C;
          totals.I -= expired.I;
          totals.A -= expired.A;
        }

        const sampleCount = Math.min(index + 1, window);
        return {
          C: totals.C / sampleCount,
          I: totals.I / sampleCount,
          A: totals.A / sampleCount,
        };
      });
    }

    const totals: CumulativePoint = { C: 0, I: 0, A: 0 };
    return scores.map((score) => {
      totals.C += score.C;
      totals.I += score.I;
      totals.A += score.A;
      return { ...totals };
    });
  }, [scores, mode, averageWindow]);

  if (points.length === 0) return null;

  const selectedIndex = Math.min(Math.max(currentStep, 0), points.length - 1);
  const summaryPoint = points[selectedIndex];
  const sharedDomain = getSharedDomain(points, selectedIndex);
  const heading = mode === 'sum' ? 'Cumulative CIA Drop' : 'CIA Alignment';

  return (
    <section
      className="relative z-30 flex-shrink-0 border-t border-cyan-400/20 bg-slate-950 shadow-[0_-8px_30px_rgba(8,145,178,0.08)]"
      data-testid="cia-score-timeline"
      data-plot-mode={mode}
    >
      <button
        type="button"
        className="group flex h-10 w-full items-center gap-4 border-b border-slate-800/80 bg-slate-900/95 px-4 text-left transition-colors hover:bg-slate-800/95 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-400"
        aria-expanded={expanded}
        aria-controls="cia-score-timeline-chart"
        aria-label={`${expanded ? 'Collapse' : 'Expand'} CIA score timeline`}
        onClick={() => onExpandedChange(!expanded)}
      >
        <span className="flex items-center gap-2 whitespace-nowrap">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-300" />
          </span>
          <span className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-slate-200">
            {heading}
          </span>
        </span>

        <span className="hidden flex-1 items-center justify-end gap-2 sm:flex">
          {SERIES.map((series) => (
            <span
              key={series.key}
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 font-mono text-[11px] ${series.chipClass}`}
              title={
                mode === 'sum'
                  ? `${series.label} cumulative value at selected step`
                  : `${series.label} ${averageWindow}-step average at selected step`
              }
            >
              <span className={series.textClass}>{series.key}</span>
              <span className="text-slate-300">
                {formatScore(summaryPoint[series.key])}
              </span>
            </span>
          ))}
        </span>

        <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:ml-0">
          {expanded ? 'Hide' : 'Show'}
          <svg
            className={`h-4 w-4 text-cyan-300 transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="m5 15 7-7 7 7"
            />
          </svg>
        </span>
      </button>

      <div
        id="cia-score-timeline-chart"
        className={`overflow-hidden transition-[height,opacity] duration-300 ease-out ${expanded ? 'h-52 opacity-100' : 'h-0 opacity-0'}`}
        aria-hidden={!expanded}
      >
        <div className="relative h-52 overflow-x-auto bg-gradient-to-b from-cyan-950/15 via-slate-950 to-slate-950 p-2">
          <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(34,211,238,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.7)_1px,transparent_1px)] [background-size:24px_24px]" />
          <div
            className="relative grid h-full min-w-[720px] grid-cols-3 gap-2"
            data-current-step={selectedIndex}
          >
            {SERIES.map((series) => (
              <MetricPlot
                key={series.key}
                points={points}
                series={series}
                selectedIndex={selectedIndex}
                mode={mode}
                averageWindow={averageWindow}
                domain={sharedDomain}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
