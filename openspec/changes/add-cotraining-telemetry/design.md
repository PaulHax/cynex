## Context

Jaxborg's V2 trajectory format stores agent actions and step state separately. The exporter already emits reward components inside each step state, while CIA values use the existing `metric_scores` array. A resilience run also assigns AUTH, DB, and WEB roles dynamically. Cynex validates the metric structures but currently drops reward components, renders either rewards or CIA values, and infers roles only from legacy hostnames.

## Goals / Non-Goals

- Goals: preserve supported telemetry, show all available metrics at the selected step, and retain compatibility with existing files.
- Non-Goals: calculate metrics in the browser, add a backend, or redesign trajectory playback.

## Decisions

- Keep CIA values in the existing `metric_scores` array and reward data in `step_states`; the UI joins them by step index.
- Add `reward_breakdown` as an optional step-state object because older V2 files omit it.
- Add `host_resilience_roles` as an optional top-level map and prefer it over legacy hostname inference when assigning host-role icons.
- Render only fields supplied by the trajectory rather than substituting zero for missing measurements.
- Keep selected-step telemetry in the existing sidebar card. Show phase, step reward, cumulative reward, and composite resilience as the primary row; show C, I, and A as a compact secondary row.
- Put RIA, LWF, ASF, and action cost in a disclosure within the card that is collapsed by default. These components are diagnostic detail rather than the primary reading task.
- Defer time-series plots to a separate full-width bottom drawer. That follow-up can plot reward and CIA series against the shared playback cursor without coupling chart design to this data-contract change.

## Risks / Trade-offs

- The metrics card can become dense when every value is present. Keep primary values visible, group CIA values separately, and collapse the reward breakdown by default.
- Arrays can be shorter than `total_steps`. Existing indexed access remains optional so missing step telemetry does not break playback.

## Migration Plan

No migration is required. Existing V1 and V2 trajectory files remain valid.
