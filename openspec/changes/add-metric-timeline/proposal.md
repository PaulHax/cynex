# Change: Plot CIA and Resilience along playback

## Why

Selected-step CIA values do not show when or how resilience changed during an episode. A timeline plot makes those changes visible beside the existing scrubber.

## What Changes

- Plot C, I, A, and composite Resilience from trajectory metric scores alongside recorded cumulative Blue reward on a separate vertical scale.
- Put playback buttons and the step counter below the sidebar. Put the plot, slider, and trail settings below the map.
- When the sidebar is collapsed, keep playback buttons available in a separate row below the wide map-aligned slider.
- Match the plot's horizontal extent to the slider track.
- Show a selected-step marker aligned with the slider handle.
- Keep the metric legend visible and let a chevron collapse or expand the plot.
- Let plot expansion reduce map height without reducing sidebar height.
- Omit the plot when a trajectory has no metric scores; keep the playback controls unchanged.
- Repair the trajectory selector layout so the drag-and-drop hint remains directly below Load File inside the sidebar.
- Provide a separate ignored demo trajectory with explicitly labeled synthetic CIA scores. Keep the authentic evaluation artifact unchanged.

## Impact

- Affected specs: `playback-controls`, `trajectory-loading`
- Affected code: `src/view/MetricTimeline.tsx`, `src/view/PlaybackControls.tsx`, `src/view/StepControls.tsx`, `src/view/TrajectorySelector.tsx`, `src/App.tsx`, Playwright fixtures and tests
