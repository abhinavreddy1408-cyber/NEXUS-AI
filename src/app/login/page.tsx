"use client";

import React from "react";

export default function LoginPage() {
  const [pin, setPin] = React.useState("123456");
  const [error, setError] = React.useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!pin || pin.length !== 6) {
      setError("Please enter a 6-digit PIN");
      return;
    }

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Store user info and redirect
        localStorage.setItem("user_email", data.user?.email || "User@2");
        window.location.href = "/dashboard";
      } else {
        setError(data.error || "Invalid PIN. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred. Please try again.");
    }
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(value);
    setError("");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-full max-w-md px-6">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="mb-6 flex justify-center">
            {/* Wireframe Cube Logo with "code" text */}
            <div className="relative w-24 h-24">
              <svg
                className="w-24 h-24 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
                viewBox="0 0 100 100"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                {/* Front face */}
                <rect x="20" y="30" width="40" height="40" />
                {/* Back face (offset) */}
                <rect x="30" y="20" width="40" height="40" />
                {/* Connecting lines */}
                <line x1="20" y1="30" x2="30" y2="20" />
                <line x1="60" y1="30" x2="70" y2="20" />
                <line x1="20" y1="70" x2="30" y2="60" />
                <line x1="60" y1="70" x2="70" y2="60" />
                {/* "code" text on front face */}
                <text
                  x="40"
                  y="55"
                  fontSize="12"
                  fill="currentColor"
                  opacity="0.6"
                  textAnchor="middle"
                  className="font-mono"
                >
                  code
                </text>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-cyan-400 mb-1 tracking-wider">
            NEXUS.AI
          </h1>
          <h2 className="text-5xl font-bold text-cyan-400 mb-2 tracking-wider">
            WELCOME BACK
          </h2>
          <p className="text-slate-300 text-sm font-light">
            Augmented Intelligence for Business Decisions
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="bg-slate-900/80 backdrop-blur-sm rounded-xl p-8 border border-slate-800 shadow-2xl">
            <div className="mb-6">
              <label className="block text-white text-sm mb-2 font-medium">
                PIN
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-slate-950 border border-cyan-400/50 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 text-center text-2xl tracking-widest font-mono"
                required
              />
              {error && (
                <p className="text-red-400 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase tracking-wider text-sm shadow-lg shadow-cyan-400/20"
            >
              LOGIN
            </button>

            <div className="text-center mt-4">
              <span className="text-slate-400 text-sm">
                Don't have an account?{" "}
                <a href="#" className="text-cyan-400 hover:text-cyan-300">
                  Register
                </a>
              </span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
