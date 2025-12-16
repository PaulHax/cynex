# Change: Add center drag to RangeSlider

## Why

When reviewing trajectories, users often want to scrub through steps while keeping a fixed "window" of steps visible. Currently, dragging the highlighted range region does nothing, requiring users to manually adjust both thumbs to move the window.

## What Changes

- The highlighted range region between thumbs becomes draggable
- Dragging the center shifts both start and end by the same delta
- The range width stays constant (unless hitting min/max bounds)
- Adds visual feedback (grab cursor) on the center region

## Impact

- Affected specs: `playback-controls`
- Affected code: `src/view/RangeSlider.tsx`
