type StepControlsProps = {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
};

export const StepControls = ({
  currentStep,
  totalSteps,
  onStepChange,
  isPlaying,
  onPlayToggle,
}: StepControlsProps) => {
  const handleFirst = () => onStepChange(0);
  const handlePrev = () => onStepChange(Math.max(0, currentStep - 1));
  const handleNext = () => onStepChange(Math.min(totalSteps - 1, currentStep + 1));
  const handleLast = () => onStepChange(totalSteps - 1);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onStepChange(parseInt(e.target.value, 10));
  };

  const buttonClass =
    "px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <button
          className={buttonClass}
          onClick={handleFirst}
          disabled={currentStep === 0}
          title="First step"
        >
          |◀
        </button>
        <button
          className={buttonClass}
          onClick={handlePrev}
          disabled={currentStep === 0}
          title="Previous step"
        >
          ◀
        </button>
        <button
          className={`${buttonClass} w-12`}
          onClick={onPlayToggle}
          disabled={currentStep >= totalSteps - 1 && !isPlaying}
          title={isPlaying ? "Stop" : "Play"}
        >
          {isPlaying ? "■" : "▶▶"}
        </button>
        <button
          className={buttonClass}
          onClick={handleNext}
          disabled={currentStep >= totalSteps - 1}
          title="Next step"
        >
          ▶
        </button>
        <button
          className={buttonClass}
          onClick={handleLast}
          disabled={currentStep >= totalSteps - 1}
          title="Last step"
        >
          ▶|
        </button>
        <span className="ml-2 text-sm text-slate-300 whitespace-nowrap">
          Step {currentStep + 1} / {totalSteps}
        </span>
      </div>
      <input
        type="range"
        min={0}
        max={totalSteps - 1}
        value={currentStep}
        onChange={handleSliderChange}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
};
