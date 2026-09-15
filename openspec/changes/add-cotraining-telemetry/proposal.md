# Change: Display co-training trajectory telemetry

## Why

Co-trained Blue-versus-Red trajectories contain simultaneous multi-agent actions, rewards, CIA resilience scores, and reward components. Cynex already renders both teams' actions, but its V2 parser discards reward components and its metrics card chooses rewards instead of CIA scores when both are present.

## What Changes

- Preserve optional per-step reward breakdowns from V2 trajectory files.
- Preserve optional resilience host-role assignments and use them for host-role icons.
- Display reward, cumulative reward, CIA resilience scores, and available reward components together.
- Keep this change focused on selected-step values; reserve timeline plotting for a subsequent expandable bottom-panel change.
- Keep existing V1 and V2 trajectory files valid when the new telemetry is absent.
- Add end-to-end coverage using a multi-agent co-training trajectory fixture.

## Impact

- Affected specs: `trajectory-loading`, `action-sidebar`
- Affected code: `src/trajectory/`, `src/network/extractTopology.ts`, `src/view/MetricsCard.tsx`, Playwright fixtures and tests
