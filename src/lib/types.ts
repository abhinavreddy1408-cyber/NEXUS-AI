// FILE: src/lib/types.ts
export type UserRole = "VIEWER" | "ANALYST" | "OWNER";

export interface User {
  id: string;
  email: string;
  role: UserRole;
}

export interface ValidationStep {
  id: string;
  question: string;
  status: "PENDING" | "YES" | "NO" | "SKIPPED";
  comment?: string;
  timestamp: string; // ISO string
}

// Extended for AI response
export interface Insight {
  id: string;
  text: string;
  confidence: number;
}

export interface AiResponse {
  pros: Insight[];
  cons: Insight[];
  notes: string;
  warnings?: string[];
  forecast?: string; // e.g., "Positive Outlook"
  score?: number; // 0-100
}

export interface AuditEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  userEmail?: string;
}
