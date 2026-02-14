"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, BrainCircuit, Newspaper, AlertTriangle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

export default function AnalysisPage() {
  const [step, setStep] = useState(1);
  const [industry, setIndustry] = useState("");
  const [problem, setProblem] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setResult(null); // Clear previous

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry, problem })
      });

      if (!response.ok) throw new Error("Analysis Failed");

      const data = await response.json();
      setResult(data);
      setStep(3);

    } catch (error) {
      console.error(error);
      alert("Failed to connect to Nexus Intelligence Engine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-5xl">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-serif text-[#202124] mb-2 flex items-center justify-center gap-3">
          <BrainCircuit className="w-10 h-10 text-[#B06A20]" />
          Augmented Intelligence
        </h1>
        <p className="text-warmGray text-sm uppercase tracking-widest font-bold">Predictive Market Analysis Module</p>
      </header>

      {/* WIZARD UI - FORCED CHARCOAL THEME */}
      <div className="bg-[#202124] rounded-2xl shadow-xl border border-gray-800 overflow-hidden min-h-[500px] flex flex-col">
        {/* Progress Bar */}
        <div className="flex border-b border-gray-800">
          {[1, 2, 3].map((s) => (
            <div key={s} className={clsx("flex-1 h-2", s <= step ? "bg-[#B06A20]" : "bg-[#202124]")}></div>
          ))}
        </div>

        <div className="flex-1 p-12 flex flex-col items-center justify-center">
          {step === 1 && (
            <div className="w-full max-w-2xl animate-fade-in-up">
              <h2 className="text-3xl font-serif text-center mb-8 text-[#F5EFE8]">Select Target Sector</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['Technology', 'Healthcare', 'Finance', 'Retail', 'Energy', 'Logistics'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => { setIndustry(sec); setStep(2); }}
                    className="p-6 border-2 border-gray-700 rounded-xl hover:border-[#B06A20] hover:bg-[#B06A20]/10 transition-all text-lg font-medium text-[#F5EFE8] hover:scale-105"
                  >
                    {sec}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="w-full max-w-2xl animate-fade-in-up">
              <h2 className="text-3xl font-serif text-center mb-2 text-[#F5EFE8]">Define Strategic Problem</h2>
              <p className="text-center text-warmGray mb-8">What challenge would you like the Nexus AI to simulate?</p>

              <textarea
                value={problem}
                onChange={(e) => setProblem(e.target.value)}
                placeholder="e.g., Should we acquire Competitor X given the current antitrust climate?"
                className="w-full h-40 p-6 bg-[#1a1b1e] border border-gray-700 rounded-xl text-lg resize-none text-[#F5EFE8] focus:border-[#B06A20] focus:ring-1 focus:ring-[#B06A20] outline-none mb-8 placeholder-gray-500"
              />

              <button
                onClick={handleAnalyze}
                disabled={!problem || loading}
                className="w-full py-4 bg-[#B06A20] text-[#F5EFE8] text-xl font-bold rounded-xl hover:bg-[#8B5117] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Sparkles className="w-6 h-6 animate-spin" /> Analyzing 3 Billion Data Points...
                  </>
                ) : (
                  <>
                    Run Simulation <ArrowRight className="w-6 h-6" />
                  </>
                )}
              </button>
            </div>
          )}

          {step === 3 && result && (
            <div className="w-full max-w-4xl animate-fade-in-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Result Cards */}
                <div className="bg-[#1a1b1e] rounded-xl p-8 border border-gray-800 flex flex-col items-center text-center">
                  <div className="text-sm font-bold text-warmGray uppercase mb-2">Profit Probability</div>
                  <div className="text-6xl font-serif text-vibrant-green mb-2">{result.profitScore}%</div>
                  <div className="text-xs text-[#F5EFE8]">Based on historical trends</div>
                </div>
                <div className="bg-[#1a1b1e] rounded-xl p-8 border border-gray-800 flex flex-col items-center text-center">
                  <div className="text-sm font-bold text-warmGray uppercase mb-2">Risk Factor</div>
                  <div className="text-6xl font-serif text-vibrant-red mb-2">{result.riskScore}%</div>
                  <div className="text-xs text-[#F5EFE8]">Market volatility index</div>
                </div>
              </div>

              <div className="bg-[#1a1b1e] text-[#F5EFE8] p-8 rounded-xl mb-8 shadow-lg border-l-4 border-[#B06A20]">
                <h3 className="font-serif text-2xl mb-4 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-[#B06A20]" /> Strategic Recommendation
                </h3>
                <p className="text-lg leading-relaxed opacity-90">{result.recommendation}</p>
              </div>

              <div className="bg-[#1a1b1e] p-6 border-t border-gray-800">
                <h4 className="font-bold text-warmGray uppercase text-xs mb-4 flex items-center gap-2">
                  <Newspaper className="w-4 h-4" /> Contextual News Injected
                </h4>
                <ul className="space-y-2">
                  {(result.news || []).map((n: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#F5EFE8]">
                      <CheckCircle2 className="w-4 h-4 text-vibrant-green mt-0.5 shrink-0" /> {n}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center mt-8">
                <button onClick={() => { setStep(1); setProblem(""); }} className="text-[#B06A20] font-bold hover:underline">
                  Start New Analysis
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
