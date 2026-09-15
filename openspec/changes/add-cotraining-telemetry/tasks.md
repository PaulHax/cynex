## 1. Trajectory contract

- [x] 1.1 Extend V2 step-state types and validation with optional reward components.
- [x] 1.2 Preserve backward compatibility for trajectories without reward components or CIA scores.
- [x] 1.3 Preserve optional resilience host-role assignments and apply them during topology extraction.

## 2. Metrics display

- [x] 2.1 Display reward and cumulative reward when present.
- [x] 2.2 Display per-step C, I, A, and resilience values alongside rewards when present.
- [x] 2.3 Display available RIA, LWF, ASF, and action-cost reward components without inventing missing values.

## 3. Verification

- [x] 3.1 Add a multi-agent V2 trajectory fixture containing rewards, CIA scores, and reward components.
- [x] 3.2 Add focused Playwright coverage for the combined telemetry display.
- [x] 3.3 Verify dynamic AUTH, DB, and WEB role icons from the trajectory assignment.
