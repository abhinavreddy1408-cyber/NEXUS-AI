// FILE: src/components/dashboard/ValidationPanel.tsx
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, AlertTriangle, PlayCircle } from "lucide-react";
import { ValidationStep } from "@/lib/types";
import SecurityPinModal from "./SecurityPinModal";
import ValidationHistory from "./ValidationHistory";
import { Toast } from "../ui/Toast";

// Default Steps
const INITIAL_STEPS: ValidationStep[] = [
  {
    id: "1",
    question: "Is the data source verified?",
    status: "PENDING",
    timestamp: "",
  },
  {
    id: "2",
    question: "Are privacy compliance checks passed?",
    status: "PENDING",
    timestamp: "",
  },
  {
    id: "3",
    question: "Does this align with Q3 KPIs?",
    status: "PENDING",
    timestamp: "",
  },
];

export default function ValidationPanel({ currentUser }: { currentUser: any }) {
  // State History Stack (Past, Present)
  const [history, setHistory] = useState<ValidationStep[][]>([INITIAL_STEPS]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const [steps, setSteps] = useState<ValidationStep[]>(INITIAL_STEPS);
  const [isPinOpen, setIsPinOpen] = useState(false);
  const [toast, setToast] = useState<{
    msg: string;
    type: "info" | "success" | "warning";
  } | null>(null);

  // Collaboration Channel
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  useEffect(() => {
    const bc = new BroadcastChannel("execubot_collab");
    bc.onmessage = (event) => {
      if (event.data.type === "UPDATE_STEPS") {
        // Sync incoming state
        setSteps(event.data.payload);
        setToast({ msg: "Steps updated by another user", type: "info" });
      }
    };
    setChannel(bc);
    return () => bc.close();
  }, []);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "z") undo(); // Standard Undo
      if (e.key === "u" || e.key === "U") undo(); // Custom shortcut
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [historyIndex]);

  const updateSteps = async (newSteps: ValidationStep[]) => {
    // 1. Update State
    setSteps(newSteps);

    // 2. Push to History
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newSteps);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    // 3. Broadcast
    channel?.postMessage({ type: "UPDATE_STEPS", payload: newSteps });

    // 4. Server Audit
    await fetch("/api/audit", {
      method: "POST",
      body: JSON.stringify({
        action: "VALIDATION_UPDATE",
        details: "Steps updated",
        userId: currentUser?.id,
        metadata: { steps: newSteps },
      }),
    });
  };

  const undo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const prevSteps = history[prevIndex];
      setSteps(prevSteps);
      setHistoryIndex(prevIndex);
      setToast({ msg: "Undid last action", type: "info" });

      // Audit Undo
      fetch("/api/audit", {
        method: "POST",
        body: JSON.stringify({
          action: "UNDO",
          details: "Reverted validation step",
          userId: currentUser?.id,
        }),
      });
    }
  };

  const handleDecision = (id: string, decision: "YES" | "NO") => {
    const newSteps = steps.map((s) =>
      s.id === id
        ? { ...s, status: decision, timestamp: new Date().toISOString() }
        : s,
    );
    updateSteps(newSteps);
  };

  const handleSignOff = () => {
    if (currentUser.role === "VIEWER") {
      setToast({ msg: "Viewers cannot sign off", type: "warning" });
      return;
    }
    setIsPinOpen(true);
  };

  const finalizeSignOff = async (isAdminOverride = false) => {
    setIsPinOpen(false);

    await fetch("/api/audit", {
      method: "POST",
      body: JSON.stringify({
        action: "SIGN_OFF",
        details: isAdminOverride ? "Admin Override Sign-off" : "Owner Sign-off",
        userId: currentUser?.id,
      }),
    });

    setToast({ msg: "Validation Finalized & Logged", type: "success" });
  };

  const allValid = steps.every((s) => s.status === "YES");

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <CheckCircle className="text-emerald-500" size={20} />
          Validation Loop
        </h3>
        {allValid && (
          <span className="text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded border border-emerald-800 animate-pulse">
            Ready for Sign-off
          </span>
        )}
      </div>

      <ValidationHistory
        history={history}
        currentIndex={historyIndex}
        onUndo={undo}
        canUndo={historyIndex > 0}
      />

      <div className="space-y-4">
        {steps.map((step) => (
          <motion.div
            key={step.id}
            layout
            className={`p-4 rounded border flex items-center justify-between ${
              step.status === "PENDING"
                ? "bg-slate-800 border-slate-700"
                : step.status === "YES"
                  ? "bg-emerald-900/10 border-emerald-800"
                  : "bg-red-900/10 border-red-800"
            }`}
          >
            <span className="text-slate-300 text-sm">{step.question}</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleDecision(step.id, "YES")}
                className={`p-1.5 rounded transition-colors ${step.status === "YES" ? "bg-emerald-600 text-white" : "hover:bg-slate-700 text-slate-500"}`}
                aria-label="Validate Yes"
              >
                <CheckCircle size={18} />
              </button>
              <button
                onClick={() => handleDecision(step.id, "NO")}
                className={`p-1.5 rounded transition-colors ${step.status === "NO" ? "bg-red-600 text-white" : "hover:bg-slate-700 text-slate-500"}`}
                aria-label="Validate No"
              >
                <XCircle size={18} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-800 flex justify-between items-center">
        <div className="text-xs text-slate-500">
          {allValid
            ? "AI-assisted confidence: 92%"
            : "Pending human verification"}
        </div>
        <button
          onClick={handleSignOff}
          disabled={!allValid}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-6 py-2 rounded font-medium transition-colors flex items-center gap-2"
        >
          <PlayCircle size={18} />
          Execute Decision
        </button>
      </div>

      <SecurityPinModal
        isOpen={isPinOpen}
        onClose={() => setIsPinOpen(false)}
        onSuccess={finalizeSignOff}
        requiredRole="OWNER"
      />

      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
