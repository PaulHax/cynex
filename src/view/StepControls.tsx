import { useState, useRef, useEffect } from 'react';
import { StepSlider } from './RangeSlider';
import type { CiaPlotMode } from './CiaScoreTimeline';

type CiaPlotSettings = {
  mode: CiaPlotMode;
  averageWindow: number;
  maxAverageWindow: number;
  onModeChange: (mode: CiaPlotMode) => void;
  onAverageWindowChange: (window: number) => void;
};

type StepControlsProps = {
  currentStep: number;
  totalSteps: number;
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  trailLength: number;
  onTrailLengthChange: (length: number) => void;
  ciaPlotSettings?: CiaPlotSettings;
};

export const StepControls = ({
  currentStep,
  totalSteps,
  onStepChange,
  isPlaying,
  onPlayToggle,
  trailLength,
  onTrailLengthChange,
  ciaPlotSettings,
}: StepControlsProps) => {
  const maxStep = totalSteps - 1;
  const [showSettings, setShowSettings] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettings]);

  const handleFirst = () => onStepChange(0);
  const handlePrev = () => onStepChange(Math.max(0, currentStep - 1));
  const handleNext = () => onStepChange(Math.min(maxStep, currentStep + 1));
  const handleLast = () => onStepChange(maxStep);

  const buttonClass =
    'px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed';

  return (
    <div className="relative z-30 bg-slate-900 px-4 py-2 flex items-center gap-4">
      <div className="flex items-center gap-1">
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
          disabled={currentStep >= maxStep && !isPlaying}
          title={isPlaying ? 'Stop' : 'Play'}
        >
          {isPlaying ? '■' : '▶▶'}
        </button>
        <button
          className={buttonClass}
          onClick={handleNext}
          disabled={currentStep >= maxStep}
          title="Next step"
        >
          ▶
        </button>
        <button
          className={buttonClass}
          onClick={handleLast}
          disabled={currentStep >= maxStep}
          title="Last step"
        >
          ▶|
        </button>
      </div>
      <div className="text-sm text-slate-300 whitespace-nowrap">
        Step {currentStep + 1} / {totalSteps}
      </div>
      <div className="flex-1">
        <StepSlider
          min={0}
          max={maxStep}
          value={currentStep}
          onChange={onStepChange}
        />
      </div>
      <div className="relative">
        <button
          ref={buttonRef}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 rounded transition-colors"
          onClick={() => setShowSettings(!showSettings)}
          title="Settings"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
        {showSettings && (
          <div
            ref={popoverRef}
            className="absolute bottom-full right-0 mb-2 min-w-[260px] rounded-lg border border-slate-600 bg-slate-800 p-3 shadow-xl"
          >
            <label className="mb-1 block text-xs text-slate-400">
              Trace lookback steps: {trailLength}
            </label>
            <input
              type="range"
              min={0}
              max={totalSteps}
              value={trailLength}
              onChange={(e) => onTrailLengthChange(Number(e.target.value))}
              className="w-full accent-blue-400"
            />

            {ciaPlotSettings && (
              <div className="mt-3 border-t border-slate-600/70 pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-300">
                    CIA plot
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">
                    Display mode
                  </span>
                </div>

                <div
                  className="grid grid-cols-2 gap-1 rounded bg-slate-900/70 p-1"
                  role="group"
                  aria-label="CIA plot mode"
                >
                  <button
                    type="button"
                    className={`rounded px-2 py-1.5 text-left transition-colors ${
                      ciaPlotSettings.mode === 'sum'
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/40'
                        : 'text-slate-400 hover:bg-slate-700/70 hover:text-slate-200'
                    }`}
                    aria-pressed={ciaPlotSettings.mode === 'sum'}
                    onClick={() => ciaPlotSettings.onModeChange('sum')}
                  >
                    <span className="block font-mono text-[10px] font-semibold">
                      SUM
                    </span>
                    <span className="block text-[9px] opacity-70">
                      Running total
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`rounded px-2 py-1.5 text-left transition-colors ${
                      ciaPlotSettings.mode === 'trend'
                        ? 'bg-cyan-400/15 text-cyan-200 ring-1 ring-cyan-400/40'
                        : 'text-slate-400 hover:bg-slate-700/70 hover:text-slate-200'
                    }`}
                    aria-pressed={ciaPlotSettings.mode === 'trend'}
                    onClick={() => ciaPlotSettings.onModeChange('trend')}
                  >
                    <span className="block font-mono text-[10px] font-semibold">
                      TREND
                    </span>
                    <span className="block text-[9px] opacity-70">
                      Running average
                    </span>
                  </button>
                </div>

                {ciaPlotSettings.mode === 'trend' && (
                  <label className="mt-3 block">
                    <span className="mb-1 flex items-center justify-between text-xs text-slate-400">
                      <span>Average window</span>
                      <output className="font-mono text-cyan-200">
                        {ciaPlotSettings.averageWindow} steps
                      </output>
                    </span>
                    <input
                      type="range"
                      min={1}
                      max={ciaPlotSettings.maxAverageWindow}
                      value={ciaPlotSettings.averageWindow}
                      onChange={(e) =>
                        ciaPlotSettings.onAverageWindowChange(
                          Number(e.target.value)
                        )
                      }
                      aria-label="CIA running average window"
                      className="w-full accent-cyan-400"
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
