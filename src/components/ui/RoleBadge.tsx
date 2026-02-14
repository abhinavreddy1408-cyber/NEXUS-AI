// FILE: src/components/ui/RoleBadge.tsx
import React from "react";
import { UserRole } from "@/lib/types";

const colors: Record<string, string> = {
  VIEWER: "bg-gray-800 text-gray-300 border-gray-600",
  ANALYST: "bg-blue-900/50 text-blue-200 border-blue-700",
  OWNER: "bg-amber-900/50 text-amber-200 border-amber-700",
};

export default function RoleBadge({ role }: { role: UserRole | string }) {
  return (
    <span
      className={`px-2 py-0.5 text-xs font-mono border rounded ${colors[role] || "bg-slate-800 text-slate-400 border-slate-700"}`}
    >
      {role}
    </span>
  );
}
