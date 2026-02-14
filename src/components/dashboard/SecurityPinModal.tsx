import React, { useState, useEffect, useRef } from "react";
import { Lock, AlertTriangle, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAttempts,
  setAttempts,
  getLockoutUntil,
  setLockoutUntil,
  clearLockout,
} from "../../lib/utils";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (isAdminOverride?: boolean) => void;
  requiredRole?: string;
}

export default function SecurityPinModal({
  isOpen,
  onClose,
  onSuccess,
  requiredRole = "OWNER",
}: Props) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize State on Open
  useEffect(() => {
    if (isOpen) {
      const lockoutTime = getLockoutUntil();
      if (lockoutTime && lockoutTime > Date.now()) {
        setIsLocked(true);
        setCountdown(Math.ceil((lockoutTime - Date.now()) / 1000));
      } else {
        // Clear expired lockout
        if (lockoutTime) clearLockout();
        setIsLocked(false);
        setPin("");
        setError("");
        // Focus input
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [isOpen]);

  // Countdown Timer
  useEffect(() => {
    if (!isLocked) return;

    const timer = setInterval(() => {
      const lockoutTime = getLockoutUntil();
      if (lockoutTime && lockoutTime > Date.now()) {
        setCountdown(Math.ceil((lockoutTime - Date.now()) / 1000));
      } else {
        setIsLocked(false);
        setAttempts(0); // Reset attempts after lockout expires
        clearLockout(); // Clean up storage
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isLocked]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLocked) return;
    // Allow only numbers
    const val = e.target.value.replace(/\D/g, "").slice(0, 4);
    setPin(val);
    if (val.length < 4) setError(""); // Clear error when typing
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isLocked || pin.length !== 4) return;

    const demoPin = process.env.NEXT_PUBLIC_DEMO_PIN || "1234";

    // 1. Check Admin Override
    if (pin === "9999") {
      onSuccess(true);
      setPin("");
      clearLockout();
      return;
    }

    // 2. Validate PIN
    if (pin === demoPin) {
      onSuccess(false);
      setPin("");
      setError("");
      clearLockout();
    } else {
      handleFailedAttempt();
    }
  };

  const handleFailedAttempt = () => {
    const currentAttempts = getAttempts() + 1;
    setAttempts(currentAttempts);
    setPin("");

    if (currentAttempts >= 3) {
      const lockoutDuration = 60 * 1000; // 60 seconds
      setLockoutUntil(Date.now() + lockoutDuration);
      setIsLocked(true);
      setCountdown(60);
      setError("System Locked Attempt limit reached.");
    } else {
      setError(`Incorrect PIN. ${3 - currentAttempts} attempts remaining.`);
    }
  };

  // Handle Enter Key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && pin.length === 4) {
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-cream border border-cream-dim p-10 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden"
      >
        <div className="flex flex-col items-center mb-8 relative z-10">
          <h2 className="text-3xl font-serif text-bottleGreen tracking-tight mb-2">Identity Verification</h2>
          <p className="text-charcoal/60 text-sm text-center">
            {isLocked
              ? <span className="text-vibrant-red font-bold uppercase tracking-widest">System Locked</span>
              : `Please enter your 4-digit security PIN.`}
          </p>
        </div>

        {isLocked ? (
          <div className="bg-vibrant-red/10 border border-vibrant-red/20 rounded-xl p-8 text-center mb-6">
            <div className="text-5xl font-mono text-vibrant-red font-bold mb-3 tabular-nums">
              00:{countdown.toString().padStart(2, '0')}
            </div>
            <p className="text-vibrant-red/70 text-xs uppercase tracking-widest font-bold">
              Try again later
            </p>
          </div>
        ) : (
          <div className="space-y-10 relative">
            {/* Hidden Input for Logic */}
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={handlePinChange}
              onKeyDown={handleKeyDown}
              autoFocus
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-20"
              aria-label="Security PIN"
              aria-invalid={!!error}
              aria-describedby={error ? "pin-error" : undefined}
            />

            {/* Visual Bullets Layer */}
            <div className="flex justify-center items-center gap-6" aria-hidden="true">
              {/* Left Group */}
              <div className="flex gap-6">
                {[0, 1].map((i) => (
                  <div key={i} className="flex justify-center items-center">
                    {pin.length > i ? (
                      <div className="w-4 h-4 rounded-full bg-charcoal" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-charcoal/20" />
                    )}
                  </div>
                ))}
              </div>

              {/* Divider */}
              <div className="h-8 w-[1px] bg-charcoal/20"></div>

              {/* Right Group */}
              <div className="flex gap-6">
                {[2, 3].map((i) => (
                  <div key={i} className="flex justify-center items-center">
                    {pin.length > i ? (
                      <div className="w-4 h-4 rounded-full bg-charcoal" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-charcoal/20" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Error Message */}
            <div className="h-6">
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-vibrant-red text-xs text-center font-bold tracking-wide"
                  id="pin-error"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="button"
              disabled={pin.length !== 4}
              onClick={() => handleSubmit()}
              className={`w-full py-4 px-6 rounded-xl text-sm font-bold tracking-[0.2em] uppercase transition-all shadow-xl transform ${pin.length === 4
                  ? "bg-[#C19A6B] hover:bg-[#B0895D] text-white shadow-amber/20 active:scale-[0.98]"
                  : "bg-charcoal/10 text-charcoal/40 cursor-not-allowed"
                }`}
            >
              Authenticate &gt;
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onClose}
                className="text-xs text-charcoal/50 hover:text-charcoal font-medium uppercase tracking-widest transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
