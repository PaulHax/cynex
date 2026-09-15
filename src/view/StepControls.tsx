import { useEffect, useRef, useState } from 'react';
import { MetricTimeline } from './MetricTimeline';
import { PlaybackControls } from './PlaybackControls';
import { StepSlider } from './RangeSlider';
import type { MetricScore, StepState } from '../trajectory/types';

type StepControlsProps = {
  currentStep: number;
  totalSteps: number;
  metricScores: MetricScore[];
  stepStates: StepState[];
  onStepChange: (step: number) => void;
  isPlaying: boolean;
  onPlayToggle: () => void;
  trailLength: number;
  onTrailLengthChange: (length: number) => void;
  sidebarCollapsed: boolean;
};

export const StepControls = ({
  currentStep,
  totalSteps,
  metricScores,
  stepStates,
  onStepChange,
  isPlaying,
  onPlayToggle,
  trailLength,
  onTrailLengthChange,
  sidebarCollapsed,
}: StepControlsProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!showSettings) return;
    const handleClick = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setShowSettings(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSettings]);

  const sliderRow = metricScores.length > 0 ? 'row-start-2' : 'row-start-1';
  const playbackRow = metricScores.length > 0 ? 'row-start-3' : 'row-start-2';

  return (
    <div
      data-testid="timeline-controls"
      className={`relative z-30 shrink-0 bg-slate-900 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 ${metricScores.length > 0 ? 'pb-2' : 'py-2'}`}
    >
      {metricScores.length > 0 && (
        <MetricTimeline
          scores={metricScores}
          stepStates={stepStates}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      )}
      <div className={`col-start-1 ${sliderRow} min-w-0 pl-4`}>
        <StepSlider
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={currentStep}
          onChange={onStepChange}
        />
      </div>
      <div className={`col-start-2 ${sliderRow} relative pr-4`}>
        <button
          ref={buttonRef}
          className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-slate-100 rounded transition-colors"
          onClick={() => setShowSettings((previous) => !previous)}
          title="Trail settings"
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
            className="absolute bottom-full right-0 z-50 mb-2 bg-slate-800 border border-slate-600 rounded-lg p-3 shadow-xl min-w-[200px]"
          >
            <label className="text-xs text-slate-400 block mb-1">
              Trace lookback steps: {trailLength}
            </label>
            <input
              type="range"
              min={0}
              max={totalSteps}
              value={trailLength}
              onChange={(event) =>
                onTrailLengthChange(Number(event.target.value))
              }
              className="w-full accent-blue-400"
            />
          </div>
        )}
      </div>
      {sidebarCollapsed && (
        <div className={`col-span-2 ${playbackRow}`}>
          <PlaybackControls
            currentStep={currentStep}
            totalSteps={totalSteps}
            onStepChange={onStepChange}
            isPlaying={isPlaying}
            onPlayToggle={onPlayToggle}
          />
        </div>
      )}
    </div>
  );
};
