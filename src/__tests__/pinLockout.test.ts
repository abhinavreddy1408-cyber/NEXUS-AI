import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { getAttempts, setAttempts, getLockoutUntil, setLockoutUntil, clearLockout } from '../lib/utils';

// Mock localStorage
const localStorageMock = (function () {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

// Assign to global
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

describe('PIN Lockout Utilities', () => {
    beforeEach(() => {
        localStorageMock.clear();
    });

    it('should initialize attempts to 0', () => {
        expect(getAttempts()).toBe(0);
    });

    it('should persist attempts', () => {
        setAttempts(2);
        expect(getAttempts()).toBe(2);
        expect(localStorage.getItem('execubot_pin_attempts')).toBe('2');
    });

    it('should handle lockout timestamps', () => {
        expect(getLockoutUntil()).toBeNull();

        const future = Date.now() + 60000;
        setLockoutUntil(future);

        expect(getLockoutUntil()).toBe(future);
        expect(localStorage.getItem('execubot_lockout_until')).toBe(future.toString());
    });

    it('should clear lockout and attempts', () => {
        setAttempts(3);
        setLockoutUntil(Date.now() + 50000);

        clearLockout();

        expect(getAttempts()).toBe(0);
        expect(getLockoutUntil()).toBeNull();
    });
});
