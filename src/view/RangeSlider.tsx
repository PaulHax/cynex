import { useRef, useCallback, useState, useEffect } from 'react';

export type StepRange = {
  start: number;
  end: number;
};

type RangeSliderProps = {
  min: number;
  max: number;
  value: StepRange;
  onChange: (range: StepRange) => void;
};

export const RangeSlider = ({
  min,
  max,
  value,
  onChange,
}: RangeSliderProps) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<'start' | 'end' | null>(null);

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

      const clickedValue = getPositionFromEvent(e.clientX);
      const current = valueRef.current;
      if (clickedValue < current.start) {
        onChangeRef.current({ start: clickedValue, end: clickedValue });
      } else {
        onChangeRef.current({ ...current, end: clickedValue });
      }
    },
    [getPositionFromEvent]
  );

  const handleThumbMouseDown = useCallback(
    (thumb: 'start' | 'end') => (e: React.MouseEvent) => {
      e.stopPropagation();
      setDragging(thumb);
    },
    []
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newValue = getPositionFromEvent(e.clientX);
      const current = valueRef.current;
      if (dragging === 'start') {
        const clampedStart = Math.min(newValue, current.end);
        onChangeRef.current({ ...current, start: clampedStart });
      } else {
        if (newValue < current.start) {
          onChangeRef.current({ start: newValue, end: newValue });
        } else {
          onChangeRef.current({ ...current, end: newValue });
        }
      }
    };

    const handleMouseUp = () => setDragging(null);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, getPositionFromEvent]);

  const range = max - min || 1;
  const startPercent = ((value.start - min) / range) * 100;
  const endPercent = ((value.end - min) / range) * 100;

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className="relative h-2 bg-slate-700 rounded-lg cursor-pointer"
    >
      <div
        className="absolute h-full bg-blue-500/40 rounded-lg"
        style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
        }}
      />
      <div
        data-thumb="start"
        onMouseDown={handleThumbMouseDown('start')}
        className="absolute top-1/2 w-4 h-4 bg-slate-400 hover:bg-slate-300 rounded-full cursor-grab active:cursor-grabbing shadow-md"
        style={{
          left: `${startPercent}%`,
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
      <div
        data-thumb="end"
        onMouseDown={handleThumbMouseDown('end')}
        className="absolute top-1/2 w-4 h-4 bg-blue-500 hover:bg-blue-400 rounded-full cursor-grab active:cursor-grabbing shadow-md"
        style={{
          left: `${endPercent}%`,
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
    </div>
  );
};
