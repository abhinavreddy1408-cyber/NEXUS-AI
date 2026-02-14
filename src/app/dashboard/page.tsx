"use client";

import { useState } from "react";

import MarketDashboard from "@/components/MarketDashboard";
import { BarChart3, ShieldAlert, Users, Send } from "lucide-react";
import clsx from "clsx";

export default function DashboardPage() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; content: string }[]>([
    { role: "ai", content: "Based on the latest RBI MPC minutes, I recommend reallocating Q4 budget reserves to the Indian Banking Sector. The trend suggests a 15% upside in PSU banks." }
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ industry: "Global Market", problem: userMsg })
      });

      const data = await response.json();

      const aiResponse = data.recommendation
        ? `${data.recommendation} ${data.reasoning}`
        : "I couldn't process that request. Please try analyzing a specific sector.";

      setMessages(prev => [...prev, { role: "ai", content: aiResponse }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: "ai", content: "Connection interrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 py-10 max-w-7xl animate-fade-in-up">
      <header className="flex justify-between items-end mb-10 border-b border-bottleGreen/10 pb-6">
        <div>
          <h1 className="text-4xl font-serif font-light tracking-tight text-bottleGreen mb-2">
            Good afternoon, <span className="text-amber">Director.</span>
          </h1>
          <p className="text-warmGray text-xs uppercase tracking-widest font-bold">Executive Briefing &bull; Q4 2026</p>
        </div>
        <div className="text-right flex gap-6">
          <div className="text-center">
            <div className="text-2xl font-serif text-bottleGreen">78<span className="text-lg text-amber">%</span></div>
            <div className="text-[10px] text-warmGray uppercase font-bold tracking-wider">Sentiment</div>
          </div>
          <div className="text-center border-l border-warmGray/20 pl-6">
            <div className="text-2xl font-serif text-bottleGreen">94<span className="text-lg text-amber">/100</span></div>
            <div className="text-[10px] text-warmGray uppercase font-bold tracking-wider">Sec Score</div>
          </div>
        </div>
      </header>

      {/* Market Dashboard Component */}
      <MarketDashboard />

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
        {[
          { title: "Revenue Forecast", value: "₹4.2Cr", icon: BarChart3, color: "text-[#B06A20]" },
          { title: "Active Risks", value: "2 High", icon: ShieldAlert, color: "text-[#FF4D6D]" },
          { title: "User Growth", value: "+12%", icon: Users, color: "text-[#19C37D]" }
        ].map((item, i) => (
          <div key={i} className="bg-[#202124] p-6 rounded-xl shadow-sm border border-gray-800 flex flex-col justify-between h-36 hover-lift cursor-pointer group">
            <div className="flex justify-between items-start">
              <span className="text-xs text-[#F5EFE8] opacity-70 uppercase tracking-wide font-bold">{item.title}</span>
              <item.icon className={clsx("w-5 h-5 opacity-80 group-hover:scale-110 transition-transform", item.color)} />
            </div>
            <div className="text-3xl font-serif text-[#F5EFE8]">{item.value}</div>
          </div>
        ))}
      </div>

      {/* DARK THEME CHAT SECTION */}
      <section className="bg-[#202124] rounded-xl shadow-2xl overflow-hidden animate-fade-in-up border border-gray-800" style={{ animationDelay: '0.6s' }}>
        <div className="bg-[#1a1b1e] p-4 flex justify-between items-center border-b border-gray-800">
          <h3 className="font-serif text-[#F5EFE8] text-lg tracking-wide">Intelligence Feed</h3>
          <div className="flex gap-2 opacity-50">
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
            <div className="w-2 h-2 rounded-full bg-white"></div>
          </div>
        </div>

        <div className="p-8 space-y-6 max-h-[400px] overflow-y-auto custom-scrollbar">
          {messages.map((msg, i) => (
            <div key={i} className={clsx("flex gap-4", msg.role === "user" ? "justify-end" : "justify-start")}>
              {msg.role === "ai" && (
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-[#B06A20] font-serif italic text-xl border border-white/10 shrink-0">AI</div>
              )}
              <div className={clsx(
                "p-4 rounded-xl max-w-2xl text-[#F5EFE8] border border-white/5 backdrop-blur-sm",
                msg.role === "user" ? "bg-[#B06A20]/20 rounded-tr-none" : "bg-white/5 rounded-tl-none"
              )}>
                <p className="font-light leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-white/10 shrink-0"></div>
              <div className="bg-white/5 h-12 w-48 rounded-xl"></div>
            </div>
          )}
        </div>

        <div className="p-4 bg-[#1a1b1e] border-t border-gray-800">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type a command for executive analysis..."
              className="w-full bg-[#202124] border border-gray-700 p-4 pl-6 rounded-lg text-white placeholder-gray-500 focus:ring-1 focus:ring-[#B06A20] focus:border-[#B06A20] transition-all shadow-inner"
            />
            <button
              onClick={handleSend}
              disabled={isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B06A20] hover:text-white transition-colors p-2 disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
