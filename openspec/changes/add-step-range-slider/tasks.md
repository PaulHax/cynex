# Implementation Tasks

## 1. State Changes

- [ ] 1.1 Replace `currentStep` with `stepRange: { start, end }` state in App.tsx
- [ ] 1.2 Update play effect to advance `end` instead of `currentStep`
- [ ] 1.3 Update `nodeStates` memo to use `stepRange.end`

## 2. Range Slider Component

- [ ] 2.1 Create RangeSlider.tsx with dual-thumb slider
- [ ] 2.2 Implement track click-to-seek behavior
- [ ] 2.3 Add highlighted region between thumbs
- [ ] 2.4 Enforce `start <= end` constraint on drag

## 3. StepControls Updates

- [ ] 3.1 Update props to accept `stepRange` and `onStepRangeChange`
- [ ] 3.2 Replace single slider with RangeSlider
- [ ] 3.3 Update button handlers (First/Prev/Next/Last affect `end`)
- [ ] 3.4 Update display to show "Steps X - Y / Total"

## 4. ActionHistory Updates

- [ ] 4.1 Update props to accept `stepRange` and `onEndChange`
- [ ] 4.2 Implement range highlighting (all steps in [start, end])
- [ ] 4.3 Add current marker styling for step at `end`
- [ ] 4.4 Update click handler to set `end` to clicked step

## 5. Trail Accumulation

- [ ] 5.1 Create computeTrails.ts with `getMovementsInRange` helper
- [ ] 5.2 Update NetworkGraph props to accept `stepRange`
- [ ] 5.3 Remove single-step trail logic (previous/current action props)
- [ ] 5.4 Compute trails for all movements in range
- [ ] 5.5 Render accumulated trail segments

## 6. Integration

- [ ] 6.1 Wire all components in App.tsx with new range state
- [ ] 6.2 Verify action labels show actions at `stepRange.end`

## 7. Testing

- [ ] 7.1 Verify range slider thumb dragging
- [ ] 7.2 Verify play advances end while start stays fixed
- [ ] 7.3 Verify ActionHistory highlights range correctly
- [ ] 7.4 Verify accumulated trails render for range
- [ ] 7.5 Verify node states reflect `stepRange.end`
