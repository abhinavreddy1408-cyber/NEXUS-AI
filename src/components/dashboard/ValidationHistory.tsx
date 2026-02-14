// FILE: src/components/dashboard/ValidationHistory.tsx
import React from "react";
import { ValidationStep } from "@/lib/types";
import { Undo, History } from "lucide-react";

interface Props {
  history: ValidationStep[][];
  currentIndex: number;
  onUndo: () => void;
  canUndo: boolean;
}

export default function ValidationHistory({
  history,
  currentIndex,
  onUndo,
  canUndo,
}: Props) {
  return (
    <div className="flex items-center gap-2 mb-4 p-2 bg-slate-800/50 rounded border border-slate-700">
      <History size={16} className="text-slate-400" />
      <span className="text-xs text-slate-300 font-mono">
        Version: {currentIndex + 1} / {history.length}
      </span>
      <div className="flex-1" />
      <button
        onClick={onUndo}
        disabled={!canUndo}
        className="flex items-center gap-1 px-2 py-1 text-xs bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-white transition-colors"
        aria-label="Undo last action"
      >
        <Undo size={12} />
        Undo (U)
      </button>
    </div>
  );
}
