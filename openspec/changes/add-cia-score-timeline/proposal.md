# Change: Add Cumulative CIA Score Timeline

## Why

Per-step CIA metrics are currently visible only for the selected step, which makes it difficult to understand how confidentiality, integrity, and availability scores accumulate across an episode. Some supported trajectories do not include CIA metrics, so the visualization must remain unobtrusive and compatible with those files.

## What Changes

- Add a cyber-themed bottom panel with three side-by-side plots for the running sums of C, I, and A scores across the loaded trajectory.
- Give all three CIA plots one shared, playback-responsive vertical scale and invert the axes so larger values fall lower, visually reading as a security-score drop over time.
- Add CIA plot settings that switch between cumulative sums and per-step CIA trends smoothed with a configurable trailing average.
- Default the trend smoothing window to 5 steps while allowing it to be adjusted for the loaded trajectory.
- Reveal each CIA line only through the selected playback step so the plots visibly progress with the episode, using a solid endpoint instead of a moving dotted guide.
- Add an up/down toggle that expands or collapses the panel while leaving a compact tab visible.
- Synchronize a current-step marker in the plot with playback and manual step navigation.
- Render neither the panel nor its tab when the trajectory has no valid CIA score samples.
- Allow trajectory files without `metric_scores` to load with an empty metrics collection.
- Implement the plot with responsive SVG and the existing React/Tailwind stack, without a new charting dependency.

## Impact

- Affected specs: `specs/cia-score-timeline/spec.md`, `specs/trajectory-loading/spec.md`
- Affected code: `src/App.tsx`, `src/trajectory/schema.ts`, `src/trajectory/types.ts`, `src/trajectory/normalize.ts`, new timeline view component(s), and Playwright coverage
- Dependencies: none
