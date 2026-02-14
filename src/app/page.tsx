"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, ShieldAlert, Hexagon } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pin, setPin] = useState("");
  const [message, setMessage] = useState("Enter Access Code");

  // On mount, check if already authenticated (mock logic)
  useEffect(() => {
    const auth = localStorage.getItem("nexus_auth");
    if (auth === "true") {
      router.push("/dashboard");
    }
  }, [router]);

  const handlePinSubmit = () => {
    if (pin === "1234") {
      setIsAuthenticated(true);
      localStorage.setItem("nexus_auth", "true");
      router.push("/dashboard");
    } else {
      setMessage("Incorrect Access Code");
      setPin("");
    }
  };

  return (
    <main className="flex min-h-screen w-full font-sans bg-cream">
      {/* Left Side: Charcoal / Executive Brand */}
      <div className="hidden lg:flex w-1/2 bg-[#202124] flex-col justify-center items-center relative overflow-hidden p-12 text-[#F5EFE8]">
        {/* Floating Data Particles */}
        <div className="absolute inset-0">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="particle bg-[#B06A20] w-32 h-32 blur-3xl" style={{ left: `${Math.random() * 100}%`, animationDelay: `-${Math.random() * 20}s` }}></div>
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="flex items-center justify-center gap-4 mb-6">
            <Hexagon className="w-16 h-16 text-[#B06A20] fill-[#202124] stroke-[1.5]" />
          </div>
          <h1 className="text-6xl font-serif font-medium tracking-tight mb-2 text-[#F5EFE8] flex items-center justify-center gap-4">
            Nexus AI
          </h1>
          <p className="text-[#B06A20] opacity-80 uppercase tracking-[0.2em] text-sm font-bold">World's Paradise Edition</p>
        </div>
      </div>

      {/* Right Side: Cream / Login Form */}
      <div className="w-full lg:w-1/2 bg-[#F5EFE8] flex flex-col justify-center items-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex flex-col items-center">
            <div className="w-12 h-12 bg-[#202124] rounded-xl flex items-center justify-center mb-4 shadow-lg lg:hidden">
              <Hexagon className="w-8 h-8 text-[#B06A20]" />
            </div>
            <h2 className="text-2xl font-serif text-[#202124] mb-1">Identity Verification</h2>
            <p className="text-warmGray text-sm">Please enter your 4-digit security PIN.</p>
          </div>

          <div className="space-y-6">
            <div className="relative">
              <input
                type="password"
                className="w-full border-b-2 border-[#202124]/20 bg-transparent py-4 text-center text-3xl tracking-[1em] text-black outline-none transition focus:border-[#B06A20] placeholder-[#202124]/20"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                maxLength={4}
              />
              <div className="mt-2 text-center text-xs font-bold text-[#B06A20]">{message !== "Enter Access Code" ? message : ""}</div>
            </div>

            <button
              onClick={handlePinSubmit}
              disabled={pin.length !== 4}
              className="w-full bg-[#B06A20] text-[#F5EFE8] font-bold py-4 rounded shadow-[0_4px_16px_rgba(176,106,32,0.2)] flex items-center justify-center gap-2 hover:bg-[#8B5117] transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              AUTHENTICATE <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <p className="mt-12 text-center text-xs text-warmGray uppercase tracking-widest">
            Restricted Access • Level 5 Clearance
          </p>
        </div>
      </div>
    </main>
  );
}
