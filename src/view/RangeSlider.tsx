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
  const [dragging, setDragging] = useState<'start' | 'end' | 'center' | null>(
    null
  );
  const dragStartRef = useRef<{
    clientX: number;
    start: number;
    end: number;
  } | null>(null);

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

  const handlePointerDown = useCallback(
    (thumb: 'start' | 'end') => (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragging(thumb);
    },
    []
  );

  const handleCenterPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragStartRef.current = {
      clientX: e.clientX,
      start: valueRef.current.start,
      end: valueRef.current.end,
    };
    setDragging('center');
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging) return;
      const current = valueRef.current;

      if (dragging === 'center') {
        if (!dragStartRef.current || !trackRef.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const pixelDelta = e.clientX - dragStartRef.current.clientX;
        const valueDelta = Math.round((pixelDelta / rect.width) * (max - min));
        const rangeWidth =
          dragStartRef.current.end - dragStartRef.current.start;

        let newStart = dragStartRef.current.start + valueDelta;
        let newEnd = dragStartRef.current.end + valueDelta;

        if (newStart < min) {
          newStart = min;
          newEnd = min + rangeWidth;
        }
        if (newEnd > max) {
          newEnd = max;
          newStart = max - rangeWidth;
        }

        onChangeRef.current({ start: newStart, end: newEnd });
        return;
      }

      const newValue = getPositionFromEvent(e.clientX);
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
    },
    [dragging, getPositionFromEvent, min, max]
  );

  const handlePointerUp = useCallback(() => {
    setDragging(null);
  }, []);

  const range = max - min || 1;
  const startPercent = ((value.start - min) / range) * 100;
  const endPercent = ((value.end - min) / range) * 100;

  return (
    <div
      ref={trackRef}
      onClick={handleTrackClick}
      className="relative h-3 bg-slate-700 rounded-lg cursor-pointer"
    >
      <div
        data-thumb="center"
        onPointerDown={handleCenterPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 -translate-y-1/2 h-5 bg-blue-500 hover:bg-blue-400 rounded cursor-grab active:cursor-grabbing touch-none"
        style={{
          left: `${startPercent}%`,
          width: `${endPercent - startPercent}%`,
        }}
      />
      <div
        data-thumb="start"
        onPointerDown={handlePointerDown('start')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 w-5 h-5 bg-slate-400 hover:bg-slate-300 rounded-full cursor-grab active:cursor-grabbing shadow-md touch-none"
        style={{
          left: `${startPercent}%`,
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
      <div
        data-thumb="end"
        onPointerDown={handlePointerDown('end')}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="absolute top-1/2 w-5 h-5 bg-blue-300 hover:bg-blue-200 rounded-full cursor-grab active:cursor-grabbing shadow-md touch-none"
        style={{
          left: `${endPercent}%`,
          transform: 'translateX(-50%) translateY(-50%)',
        }}
      />
    </div>
  );
};
