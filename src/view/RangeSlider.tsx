import { useRef, useCallback, useEffect } from 'react';

export type StepRange = {
  start: number;
  end: number;
};

type StepSliderProps = {
  min: number;
  max: number;
  value: number;
  onChange: (step: number) => void;
};

export const StepSlider = ({ min, max, value, onChange }: StepSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const getPositionFromEvent = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percent = (clientX - rect.left) / rect.width;
      const rawValue = min + percent * (max - min);
      return Math.round(Math.max(min, Math.min(max, rawValue)));
    },
    [min, max]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.dataset.thumb) return;
      onChangeRef.current(getPositionFromEvent(e.clientX));
    },
    [getPositionFromEvent]
  );

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    draggingRef.current = true;
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!draggingRef.current) return;
      onChangeRef.current(getPositionFromEvent(e.clientX));
    },
    [getPositionFromEvent]
  );

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  const range = max - min || 1;
  const percent = ((value - min) / range) * 100;

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className="relative h-3 bg-slate-700 rounded-lg cursor-pointer"
    >
      <div
        className="absolute top-0 left-0 h-full bg-blue-500/30 rounded-lg pointer-events-none"
        style={{ width: `${percent}%` }}
      />
      <div
        data-thumb="step"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 w-5 h-5 bg-blue-300 hover:bg-blue-200 rounded-full cursor-grab active:cursor-grabbing shadow-md touch-none"
        style={{
          left: `${percent}%`,
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
    </div>
  );
};
