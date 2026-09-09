## 1. Trajectory Data

- [x] 1.1 Make `metric_scores` optional during trajectory parsing and normalize missing scores to an empty array.
- [x] 1.2 Detect CIA availability from finite C, I, and A values without treating Resilience as a chart requirement.

## 2. CIA Timeline

- [x] 2.1 Add a responsive SVG timeline that computes and plots running sums for C, I, and A across all available score samples.
- [x] 2.2 Add readable axes, grid lines, a CIA legend, cumulative endpoint values, and a marker for the selected trajectory step.
- [x] 2.3 Style the panel to match the existing slate cyber theme with cyan, violet, and amber series accents.

## 3. Bottom-Panel Integration

- [x] 3.1 Place the CIA timeline immediately above the existing playback bar without obscuring the network graph or controls.
- [x] 3.2 Add an accessible up/down toggle that retains a compact tab when collapsed.
- [x] 3.3 Hide the entire panel and toggle for trajectories without valid CIA metrics, including empty or omitted `metric_scores`.
- [x] 3.4 Reset the panel to its default expanded state when a different trajectory is loaded.

## 4. Verification

- [x] 4.1 Add Playwright coverage for conditional visibility, expanding/collapsing, and the current-step marker.
- [x] 4.2 Run the production build and lint checks.
- [x] 4.3 Run the focused Playwright tests for the CIA timeline.

## 5. Small-Multiple Plot Refinement

- [x] 5.1 Split the combined CIA chart into three equal-width, side-by-side C, I, and A plots.
- [x] 5.2 Invert each plot axis so cumulative loss increases downward.
- [x] 5.3 Retain synchronized current-step markers, cumulative totals, responsive styling, and collapse behavior.
- [x] 5.4 Update focused browser coverage and visually verify the plots with example trajectory data.

## 6. Plot Mode Settings

- [x] 6.1 Add SUM and TREND mode controls to the existing settings popover when CIA data is available.
- [x] 6.2 Add an adjustable trailing-average window for TREND mode with a default of 5 steps.
- [x] 6.3 Transform CIA samples into either cumulative sums or trailing averages without changing step alignment.
- [x] 6.4 Update plot labels and displayed values to reflect the selected mode.
- [x] 6.5 Add focused browser coverage for mode switching, the default window, and window adjustment.

## 7. Playback-Synchronized Reveal

- [x] 7.1 Clip each CIA line and shaded area to the selected playback step while retaining the full time axis.
- [x] 7.2 Remove the dotted vertical step guide and use the line's solid endpoint to identify the selected value.
- [x] 7.3 Update header values to reflect the selected step in both SUM and TREND modes.
- [x] 7.4 Add focused browser coverage and visually verify line growth during step navigation.

## 8. Shared Dynamic CIA Scale

- [x] 8.1 Compute one vertical domain from all C, I, and A values revealed through the selected step.
- [x] 8.2 Apply identical y-axis ticks and scaling to all three plots.
- [x] 8.3 Recalculate the shared domain as playback advances or rewinds.
- [x] 8.4 Add focused browser coverage and visually verify the shared dynamic range.
