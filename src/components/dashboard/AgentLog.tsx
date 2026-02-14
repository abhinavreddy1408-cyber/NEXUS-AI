// FILE: src/components/dashboard/AgentLog.tsx
import React, { useEffect, useState } from "react";
import { Download, RefreshCcw, Activity } from "lucide-react";
import { AuditEntry } from "@/lib/types";

export default function AgentLog() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/audit");
      const data = await res.json();
      if (Array.isArray(data)) setLogs(data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    // Simple polling for demo
    const interval = setInterval(fetchLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleDownload = () => {
    window.location.href = "/api/audit?format=csv";
  };

  // Keyboard shortcut for download
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "L") handleDownload();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-500" />
          Audit Trail
        </h3>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            className={`p-2 hover:bg-slate-800 rounded text-slate-400 transition-all ${loading ? "animate-spin" : ""}`}
            aria-label="Refresh Logs"
          >
            <RefreshCcw size={16} />
          </button>
          <button
            onClick={handleDownload}
            className="p-2 hover:bg-slate-800 rounded text-slate-400 flex items-center gap-1 text-xs"
            aria-label="Download CSV (Shortcut: L)"
          >
            <Download size={16} />
            CSV
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-thin scrollbar-thumb-slate-700">
        {logs.length === 0 ? (
          <div className="text-slate-500 text-center py-4 text-sm">
            No recent activity.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="text-sm border-b border-slate-800/50 pb-2 mb-2 last:border-0"
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="text-blue-400 font-mono">{log.action}</span>
                <span className="text-slate-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-slate-300 truncate">{log.details}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
