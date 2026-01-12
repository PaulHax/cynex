import { RangeSlider, type StepRange } from './RangeSlider';

type StepControlsProps = {
  stepRange: StepRange;
  totalSteps: number;
  onStepRangeChange: (range: StepRange) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
};

export const StepControls = ({
  stepRange,
  totalSteps,
  onStepRangeChange,
  isPlaying,
  onPlayToggle,
}: StepControlsProps) => {
  const maxStep = totalSteps - 1;

  const handleFirst = () =>
    onStepRangeChange({ ...stepRange, end: stepRange.start });
  const handlePrev = () =>
    onStepRangeChange({
      ...stepRange,
      end: Math.max(stepRange.start, stepRange.end - 1),
    });
  const handleNext = () =>
    onStepRangeChange({
      ...stepRange,
      end: Math.min(maxStep, stepRange.end + 1),
    });
  const handleLast = () => onStepRangeChange({ ...stepRange, end: maxStep });

  const buttonClass =
    'px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="bg-slate-900 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-1">
        <button
          className={buttonClass}
          onClick={handleFirst}
          disabled={stepRange.end === stepRange.start}
          title="Collapse range (end = start)"
        >
          |◀
        </button>
        <button
          className={buttonClass}
          onClick={handlePrev}
          disabled={stepRange.end === stepRange.start}
          title="Previous step"
        >
          ◀
        </button>
        <button
          className={`${buttonClass} w-12`}
          onClick={onPlayToggle}
          disabled={stepRange.end >= maxStep && !isPlaying}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '■' : '▶▶'}
        </button>
        <button
          className={buttonClass}
          onClick={handleNext}
          disabled={stepRange.end >= maxStep}
          title="Next step"
        >
          ▶
        </button>
        <button
          className={buttonClass}
          onClick={handleLast}
          disabled={stepRange.end >= maxStep}
          title="Last step"
        >
          ▶|
        </button>
      </div>
      <div className="text-sm text-slate-300 whitespace-nowrap">
        Steps {stepRange.start + 1} - {stepRange.end + 1} / {totalSteps}
      </div>
      <div className="flex-1">
        <RangeSlider
          min={0}
          max={maxStep}
          value={stepRange}
          onChange={onStepRangeChange}
        />
      </div>
    </div>
  );
};
