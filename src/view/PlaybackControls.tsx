type PlaybackControlsProps = {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
};

export const PlaybackControls = ({
  currentStep,
  totalSteps,
  onStepChange,
  isPlaying,
  onPlayToggle,
}: PlaybackControlsProps) => {
  const maxStep = totalSteps - 1;
  const buttonClass =
    'px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div
      data-testid="playback-controls"
      className="flex items-center gap-2 px-4 py-2 bg-slate-900 shrink-0"
    >
      <div
        data-testid="playback-buttons"
        className="flex items-center gap-1 shrink-0"
      >
        <button
          className={buttonClass}
          onClick={() => onStepChange(0)}
          disabled={currentStep === 0}
          title="First step"
        >
          |◀
        </button>
        <button
          className={buttonClass}
          onClick={() => onStepChange(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          title="Previous step"
        >
          ◀
        </button>
        <button
          className={`${buttonClass} w-12`}
          onClick={onPlayToggle}
          disabled={currentStep >= maxStep && !isPlaying}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '■' : '▶▶'}
        </button>
        <button
          className={buttonClass}
          onClick={() => onStepChange(Math.min(maxStep, currentStep + 1))}
          disabled={currentStep >= maxStep}
          title="Next step"
        >
          ▶
        </button>
        <button
          className={buttonClass}
          onClick={() => onStepChange(maxStep)}
          disabled={currentStep >= maxStep}
          title="Last step"
        >
          ▶|
        </button>
      </div>
      <div
        data-testid="playback-step-label"
        className="flex-1 min-w-0 text-center text-sm text-slate-300 whitespace-nowrap"
      >
        Step {currentStep + 1} / {totalSteps}
      </div>
    </div>
  );
};
