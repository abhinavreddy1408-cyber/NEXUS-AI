import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// Lockout Constants
const ATTEMPTS_KEY = "execubot_pin_attempts";
const LOCKOUT_KEY = "execubot_lockout_until";

export function getAttempts(): number {
    if (typeof window === "undefined") return 0;
    const val = localStorage.getItem(ATTEMPTS_KEY);
    return val ? parseInt(val, 10) : 0;
}

export function setAttempts(n: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(ATTEMPTS_KEY, n.toString());
}

export function getLockoutUntil(): number | null {
    if (typeof window === "undefined") return null;
    const val = localStorage.getItem(LOCKOUT_KEY);
    if (!val) return null;
    const time = parseInt(val, 10);
    // If time passed, it's effectively null (though we might keep key until clear)
    // But strict reading: return the timestamp. Caller checks Date.now()
    return time;
}

export function setLockoutUntil(ms: number): void {
    if (typeof window === "undefined") return;
    localStorage.setItem(LOCKOUT_KEY, ms.toString());
}

export function clearLockout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ATTEMPTS_KEY);
    localStorage.removeItem(LOCKOUT_KEY);
}
