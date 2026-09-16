import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  loadTrajectoryManifest,
  loadTrajectory,
  parseTrajectoryFile,
} from '../trajectory/loader';
import type { Trajectory } from '../trajectory/types';

type TrajectorySelectorProps = {
  onTrajectoryLoad: (trajectory: Trajectory, name: string) => void;
  currentName: string | null;
  loading?: boolean;
  error?: string | null;
};

export const TrajectorySelector = ({
  onTrajectoryLoad,
  currentName,
  loading: externalLoading,
  error: externalError,
}: TrajectorySelectorProps) => {
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLoading = loading || externalLoading;
  const displayError = error || externalError;

  useEffect(() => {
    loadTrajectoryManifest().then((m) => setAvailableFiles(m.files));
  }, []);

  const handleSelect = async (filename: string) => {
    if (!filename) return;
    setLoading(true);
    setError(null);
    try {
      const trajectory = await loadTrajectory(`/data/trajectories/${filename}`);
      onTrajectoryLoad(trajectory, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load trajectory');
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const trajectory = await parseTrajectoryFile(file);
      onTrajectoryLoad(trajectory, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid trajectory file');
    } finally {
      setLoading(false);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const hasAvailableFiles = availableFiles.length > 0;

  return (
    <div className="w-full min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {hasAvailableFiles && (
          <select
            className="bg-slate-700 text-slate-200 px-2 py-1 rounded border border-slate-600 text-sm min-w-0 flex-1"
            value={
              currentName && availableFiles.includes(currentName)
                ? currentName
                : ''
            }
            onChange={(e) => handleSelect(e.target.value)}
            disabled={isLoading}
          >
            <option value="">Select...</option>
            {availableFiles.map((f) => (
              <option key={f} value={f}>
                {f.replace('.json', '')}
              </option>
            ))}
          </select>
        )}

        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-2 py-1 rounded text-sm disabled:opacity-50 whitespace-nowrap"
          >
            Load File
          </button>
          <span className="text-slate-500 text-xs whitespace-nowrap">
            or drag 'n drop
          </span>
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInput}
        className="hidden"
      />

      {isLoading && <span className="text-slate-400 text-sm">Loading...</span>}
      {displayError && (
        <span className="text-red-400 text-sm">{displayError}</span>
      )}
    </div>
  );
};
