import { useState, useEffect, useCallback, useRef, type DragEvent, type ChangeEvent } from "react";
import { loadTrajectoryManifest, loadTrajectory, parseTrajectoryFile } from "../trajectory/loader";
import type { TrajectoryFile } from "../trajectory/types";

type TrajectorySelectorProps = {
  onTrajectoryLoad: (trajectory: TrajectoryFile, name: string) => void;
  currentName: string | null;
};

export const TrajectorySelector = ({ onTrajectoryLoad, currentName }: TrajectorySelectorProps) => {
  const [availableFiles, setAvailableFiles] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadTrajectoryManifest().then(m => setAvailableFiles(m.files));
  }, []);

  const handleSelect = async (filename: string) => {
    if (!filename) return;
    setLoading(true);
    setError(null);
    try {
      const trajectory = await loadTrajectory(`/data/trajectories/${filename}`);
      onTrajectoryLoad(trajectory, filename);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load trajectory");
    } finally {
      setLoading(false);
    }
  };

  const handleFileInput = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await loadFromFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const loadFromFile = async (file: File) => {
    setLoading(true);
    setError(null);
    try {
      const trajectory = await parseTrajectoryFile(file);
      onTrajectoryLoad(trajectory, file.name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid trajectory file");
    } finally {
      setLoading(false);
    }
  };

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".json")) {
      await loadFromFile(file);
    } else {
      setError("Please drop a JSON file");
    }
  }, []);

  const hasAvailableFiles = availableFiles.length > 0;

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {hasAvailableFiles && (
        <select
          className="bg-slate-800 text-slate-200 px-3 py-1.5 rounded border border-slate-600 text-sm"
          value={currentName && availableFiles.includes(currentName) ? currentName : ""}
          onChange={e => handleSelect(e.target.value)}
          disabled={loading}
        >
          <option value="">Select trajectory...</option>
          {availableFiles.map(f => (
            <option key={f} value={f}>{f.replace(".json", "")}</option>
          ))}
        </select>
      )}

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={loading}
        className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-1.5 rounded text-sm disabled:opacity-50"
      >
        Load File...
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileInput}
        className="hidden"
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`px-3 py-1.5 rounded border-2 border-dashed text-sm transition-colors ${
          isDragging
            ? "border-blue-400 bg-blue-400/10 text-blue-300"
            : "border-slate-600 text-slate-400"
        }`}
      >
        {isDragging ? "Drop here" : "or drag JSON"}
      </div>

      {loading && <span className="text-slate-400 text-sm">Loading...</span>}
      {error && <span className="text-red-400 text-sm">{error}</span>}
    </div>
  );
};
