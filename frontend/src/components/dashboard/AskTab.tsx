"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDashboard, HistoryItem } from "@/context/DashboardContext";
import { generateMockResponse } from "@/utils/mockAi";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";
import { Spinner } from "@/components/ui";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Plus, Mic, Copy, Check, Bitcoin, TrendingUp,
  Activity, Layers, ChevronDown, ChevronUp, Code2, RefreshCw
} from "lucide-react";

interface ChatMessage {
  role: "user" | "ai";
  content: string;
  latency?: number;
  score?: number;
  rawMeta?: HistoryItem;
}

const CHIPS = [
  { label: "Blockchains", icon: Layers },
  { label: "Crypto",      icon: Bitcoin },
  { label: "Trading",     icon: TrendingUp },
  { label: "Stake",       icon: Activity },
  { label: "Analysis",   icon: RefreshCw },
];

const QUICK_PROMPTS = [
  "Analyze Q1 revenue drivers and growth",
  "Show EBITDA margin breakdown for Nvidia",
  "Calculate debt/leverage covenants",
  "What is the cost of capital (WACC)?",
];

export const AskTab: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { config } = state;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState<number | null>(null);
  const [copied, setCopied] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (state.currentQuestion && messages.length === 0) {
      setInput(state.currentQuestion);
    }
  }, [state.currentQuestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;

    setInput("");
    setMessages(prev => [...prev, { role: "user", content: question }]);
    setLoading(true);

    const startTime = Date.now();
    let aiContent = "";
    let score = 0;
    let status: "success" | "error" = "success";

    if (config.useLiveAgent) {
      try {
        const response = await fetch("/api/run-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: question }),
        });
        const data = await response.json();
        if (response.ok && data.answer) {
          aiContent = data.answer;
          // Give live execution responses a perfect 100 quality score baseline or parse/grade
          score = 100;
        } else {
          aiContent = `### Agent 2 Error\n${data.error || "Failed to get response from Agent 2."}`;
          status = "error";
        }
      } catch (err: any) {
        aiContent = `### Connection Error\nCould not reach the local agent API: ${err.message}`;
        status = "error";
      }
    } else {
      const delay = config.delayMs + Math.random() * 400 - 200;
      await new Promise(r => setTimeout(r, Math.max(500, delay)));

      const isError = question.toLowerCase().includes("error") || question.toLowerCase().includes("fail");
      if (isError) {
        aiContent = "### Connection Error\nSimulated API timeout. Please check your network and retry.";
        status = "error";
      } else {
        const res = generateMockResponse(question, config.persona, config.systemPrompt, config.qualityScore);
        aiContent = res.answer;
        score = res.score;
      }
    }

    const latency = Math.round(Date.now() - startTime);
    const histItem: HistoryItem = {
      id: Math.random().toString(36).substring(2, 10),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      question,
      answer: aiContent,
      latency,
      score,
      status,
      persona: config.useLiveAgent ? "agent2" : config.persona,
    };

    dispatch({ type: "ADD_HISTORY_ITEM", payload: histItem });

    setMessages(prev => [...prev, {
      role: "ai",
      content: aiContent,
      latency,
      score,
      rawMeta: histItem,
    }]);
    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyMessage = (idx: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Copied to clipboard!" } });
  };

  // Empty state — POF_AI style hero
  const isEmpty = messages.length === 0;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">

      {/* ── EMPTY STATE HERO ── */}
      {isEmpty && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-4">
          {/* 3D Mascot placeholder */}
          <div className="mb-6 mascot-glow select-none">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-violet-200 to-indigo-200 dark:from-violet-900/40 dark:to-indigo-900/40 flex items-center justify-center shadow-xl shadow-violet-200/60 dark:shadow-violet-900/40">
                <span className="text-6xl">🤖</span>
              </div>
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-violet-400/20 blur-xl -z-10 scale-110" />
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white text-center mb-2">
            How can I help you?
          </h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm text-center max-w-sm mb-8">
            Ask anything about financial analysis, market intelligence, or equity research.
          </p>

          {/* Quick Prompt Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mb-8">
            {QUICK_PROMPTS.map((p, i) => (
              <button
                key={i}
                onClick={() => sendMessage(p)}
                className="text-left p-4 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                           text-sm text-gray-600 dark:text-gray-300 font-medium
                           hover:border-violet-300 dark:hover:border-violet-600 hover:shadow-md hover:shadow-violet-100/50
                           dark:hover:shadow-violet-900/20 transition-all cursor-pointer group"
              >
                <span className="group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  {p}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── CHAT MESSAGES ── */}
      {!isEmpty && (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-5">
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} gap-3`}
              >
                {msg.role === "ai" && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-violet-200 dark:shadow-violet-900/40">
                    AI
                  </div>
                )}

                <div className="flex flex-col gap-1.5 max-w-[75%]">
                  {msg.role === "user" ? (
                    <div className="bubble-user">{msg.content}</div>
                  ) : (
                    <div className="chat-card p-4 dark:bg-gray-800/60">
                      <MarkdownRenderer content={msg.content} />

                      {/* Toolbar */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                          {msg.score !== undefined && (
                            <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                              msg.score > 80
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                                : "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400"
                            }`}>
                              Score {msg.score}
                            </span>
                          )}
                          {msg.latency && (
                            <span className="text-[11px] text-gray-400 font-mono">{msg.latency}ms</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => copyMessage(idx, msg.content)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50
                                       dark:hover:bg-violet-950/30 transition-colors cursor-pointer"
                            title="Copy"
                          >
                            {copied === idx ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                          <button
                            onClick={() => setShowRaw(showRaw === idx ? null : idx)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-violet-500 hover:bg-violet-50
                                       dark:hover:bg-violet-950/30 transition-colors cursor-pointer"
                            title="Raw JSON"
                          >
                            <Code2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Raw JSON */}
                      <AnimatePresence>
                        {showRaw === idx && msg.rawMeta && (
                          <motion.pre
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700
                                       rounded-xl p-3 text-[11px] font-mono text-gray-500 dark:text-gray-400
                                       overflow-x-auto"
                          >
                            {JSON.stringify(msg.rawMeta, null, 2)}
                          </motion.pre>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-md shadow-violet-200 dark:shadow-violet-900/40">
                    S
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Loading skeleton */}
          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                AI
              </div>
              <div className="chat-card p-4 w-64 space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-3 w-3/5 rounded" />
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* ── AGENT STATE BADGE ── */}
      <div className="px-4 md:px-8 pb-2 flex justify-between items-center select-none text-[11px] font-sans">
        <span className="text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5">
          {config.useLiveAgent ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">
                ⚡ Live Agent Active (agent2.py)
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-indigo-400" />
              <span>Simulated Client Engine</span>
            </>
          )}
        </span>
      </div>

      {/* ── CHIP SHORTCUTS ── */}
      <div className="px-4 md:px-8 pb-2 flex gap-2 overflow-x-auto scrollbar-none shrink-0">
        {CHIPS.map(({ label, icon: Icon }) => (
          <button
            key={label}
            onClick={() => sendMessage(`Tell me about ${label} in financial markets`)}
            className="chip shrink-0"
          >
            <Icon className="h-3.5 w-3.5 text-violet-500" />
            {label}
          </button>
        ))}
      </div>

      {/* ── INPUT BAR ── */}
      <div className="px-4 md:px-8 pb-5 shrink-0">
        <div className="flex items-end gap-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700
                        shadow-lg shadow-violet-100/40 dark:shadow-violet-900/20 px-4 py-3">
          <button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-violet-500
                             dark:hover:text-violet-400 transition-colors cursor-pointer shrink-0">
            <Plus className="h-4 w-4" />
          </button>

          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            placeholder="Typing Here..."
            className="flex-1 resize-none outline-none bg-transparent text-sm text-gray-700 dark:text-gray-200
                       placeholder-gray-400 dark:placeholder-gray-500 max-h-32 overflow-y-auto leading-relaxed"
            style={{ height: "auto" }}
            onInput={e => {
              const t = e.currentTarget;
              t.style.height = "auto";
              t.style.height = Math.min(t.scrollHeight, 128) + "px";
            }}
            disabled={loading}
          />

          <div className="flex items-center gap-2 shrink-0">
            <button className="p-2 rounded-xl text-gray-400 hover:text-violet-500 dark:hover:text-violet-400
                               transition-colors cursor-pointer">
              <Mic className="h-4 w-4" />
            </button>
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center
                         text-white shadow-md shadow-violet-200 dark:shadow-violet-900/40
                         disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90
                         transition-all cursor-pointer"
            >
              {loading ? <Spinner className="h-4 w-4 text-white" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <p className="text-center text-[10px] text-gray-400 dark:text-gray-600 mt-2">
          AuraFinance AI · Simulated financial intelligence · Not real investment advice
        </p>
      </div>
    </div>
  );
};
