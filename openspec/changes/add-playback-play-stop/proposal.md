# Change: Add Play/Stop Auto-Playback

## Why

Users need to watch trajectory playback automatically without manually clicking next for each of the ~100 steps. Auto-playback enables hands-free viewing of agent behavior over time.

## What Changes

- Add play button to start automatic step advancement
- Add stop button to pause auto-playback
- Play button toggles to stop when playing
- Auto-playback stops at the last step

## Impact

- Affected specs: `playback-controls`
- Affected code: `src/view/StepControls.tsx`, `src/App.tsx`
