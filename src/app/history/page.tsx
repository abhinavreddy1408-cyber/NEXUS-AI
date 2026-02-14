"use client";

import { useState } from "react";
import { History, ArrowUpRight, ArrowDownRight, FileText, X } from "lucide-react";

// Augmented Mock Data with more details
const MOCK_HISTORY = [
  {
    id: 1,
    date: "Oct 24, 2026",
    sector: "Indian Pharma",
    profit: 82,
    risk: 15,
    rec: "Buy Aggressively",
    details: "The Indian Pharma sector is poised for a breakout due to new FDA approvals and low valuation multiples. Key targets: Sun Pharma, Dr. Reddy's."
  },
  {
    id: 2,
    date: "Oct 22, 2026",
    sector: "Crypto (INR)",
    profit: 45,
    risk: 88,
    rec: "Avoid Exposure",
    details: "Regulatory uncertainty in India relative to crypto taxation makes this a high-risk gamble despite global bitcoin rallies. Recommend staying cash-heavy."
  },
  {
    id: 3,
    date: "Oct 18, 2026",
    sector: "Green Energy",
    profit: 60,
    risk: 40,
    rec: "Hold Positions (Adani)",
    details: "Adani Green has secured major solar contracts. However, debt levels remain a concern. Hold current positions but do not accumulate further."
  },
  {
    id: 4,
    date: "Oct 15, 2026",
    sector: "IT Services",
    profit: 91,
    risk: 10,
    rec: "Strong Buy (TCS)",
    details: "Q2 results exceeded expectations. TCS and Infosys are showing robust deal pipelines in the US BFSI sector. Safe haven for Q4."
  },
];

export default function HistoryPage() {
  const [selectedReport, setSelectedReport] = useState<any>(null);

  return (
    <div className="container mx-auto px-6 py-12 max-w-6xl relative">
      <header className="mb-12 flex items-center gap-4 border-b border-cream-dim pb-6">
        <div className="w-12 h-12 bg-[#B06A20] rounded-xl flex items-center justify-center text-[#202124]">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-[#202124]">Decision History</h1>
          <p className="text-warmGray text-xs uppercase tracking-widest font-bold"> archived intelligence reports</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6">
        {MOCK_HISTORY.map((item) => (
          <div key={item.id} className="bg-[#202124] p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col md:flex-row items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-6 mb-4 md:mb-0 w-full md:w-auto">
              <div className="w-16 h-16 bg-[#1a1b1e] rounded-full flex items-center justify-center border-2 border-gray-700">
                <FileText className="w-6 h-6 text-[#F5EFE8]" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#F5EFE8] opacity-70 uppercase mb-1">{item.date}</div>
                <h3 className="text-xl font-serif text-[#F5EFE8]">{item.sector} Analysis</h3>
                <p className="text-sm text-[#B06A20] italic">"{item.rec}"</p>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
              <div className="text-center">
                <span className="block text-[10px] text-[#F5EFE8] opacity-70 uppercase font-bold">Profit Score</span>
                <span className="text-2xl font-serif text-vibrant-green flex items-center gap-1">
                  {item.profit}% <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="w-px h-10 bg-gray-700"></div>
              <div className="text-center">
                <span className="block text-[10px] text-[#F5EFE8] opacity-70 uppercase font-bold">Risk Factor</span>
                <span className="text-2xl font-serif text-vibrant-red flex items-center gap-1">
                  {item.risk}% <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <button
                onClick={() => setSelectedReport(item)}
                className="bg-[#1a1b1e] text-[#F5EFE8] border border-gray-700 px-6 py-2 rounded text-sm font-bold hover:bg-[#B06A20] transition-colors"
              >
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* REPORT DETAILS MODAL */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-[#202124] w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-700 overflow-hidden">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center bg-[#1a1b1e]">
              <div>
                <h2 className="text-2xl font-serif text-[#F5EFE8]">{selectedReport.sector} Analysis</h2>
                <p className="text-xs text-[#B06A20] font-bold uppercase tracking-widest">{selectedReport.date}</p>
              </div>
              <button onClick={() => setSelectedReport(null)} className="text-warmGray hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-4 mb-8 bg-white/5 p-4 rounded-xl border border-white/5">
                <div className="flex-1 text-center border-r border-gray-700">
                  <div className="text-sm text-warmGray uppercase tracking-wider mb-1">Profitability</div>
                  <div className="text-3xl font-serif text-vibrant-green">{selectedReport.profit}%</div>
                </div>
                <div className="flex-1 text-center">
                  <div className="text-sm text-warmGray uppercase tracking-wider mb-1">Risk Level</div>
                  <div className="text-3xl font-serif text-vibrant-red">{selectedReport.risk}%</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[#F5EFE8] font-medium border-b border-gray-700 pb-2">Executive Summary</h3>
                <p className="text-gray-300 leading-relaxed font-light text-lg">
                  {selectedReport.details}
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-800 flex justify-end">
                <button onClick={() => setSelectedReport(null)} className="px-6 py-2 bg-[#B06A20] text-white rounded font-bold hover:bg-[#8B5117] transition-colors">
                  Close Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
