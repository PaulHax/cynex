# Change: Step Range Slider & Agent Movement Trails

## Why

Currently, users can only view one step at a time and see only the most recent agent movement trail. Analysts need to visualize agent movement patterns across multiple steps to understand attack progression and defense responses. A range slider would allow selecting a range of steps and displaying accumulated movement trails for that entire range.

## What Changes

- **BREAKING**: Replace single `currentStep` state with `stepRange: { start, end }` in App.tsx
- Replace single-thumb slider with dual-thumb range slider in StepControls
- Update play controls to advance `end` value while `start` remains user-controlled
- Update ActionHistory to highlight all steps in range with `end` as current marker
- Update NetworkGraph to render accumulated trails for all movements in range
- Node states continue to be computed at `stepRange.end`

## Impact

- Affected specs: `playback-controls`, `action-sidebar`, `network-graph`
- Affected code:
  - `src/App.tsx` - state changes from `currentStep` to `stepRange`
  - `src/view/StepControls.tsx` - integrate RangeSlider component
  - `src/view/RangeSlider.tsx` - new dual-thumb slider component
  - `src/view/ActionHistory.tsx` - range highlighting logic
  - `src/view/NetworkGraph.tsx` - accumulated trail rendering
  - `src/trajectory/computeTrails.ts` - new helper for range movements
