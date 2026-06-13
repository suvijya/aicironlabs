"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquarePlus, MessageSquareText, History, Layers, BarChart3,
  Settings, Zap, Star, BookOpen
} from "lucide-react";

const recentChats = [
  "What is the Q1 revenue trend?",
  "Show EBITDA margin breakdown",
  "How can I trade OTC market...",
  "What type crypto Platform...",
];

export const Sidebar: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { activeTab, sidebarOpen } = state;

  const navItems = [
    { id: "ask",     label: "Ask AI",              icon: MessageSquareText },
    { id: "history", label: "Audit History",        icon: History },
    { id: "batch",   label: "Batch Testing",        icon: Layers },
    { id: "metrics", label: "Analytics & Metrics",  icon: BarChart3 },
    { id: "config",  label: "Configuration",        icon: Settings },
  ] as const;

  return (
    <AnimatePresence>
      {sidebarOpen && (
        <motion.aside
          initial={{ x: -280, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -280, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed left-0 top-0 bottom-0 z-40 w-[240px] flex flex-col
                     bg-white border-r border-gray-100
                     dark:bg-gray-900 dark:border-gray-800
                     shadow-[4px_0_24px_rgba(108,99,255,0.06)]"
        >
          {/* Brand */}
          <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100 dark:border-gray-800 shrink-0">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-violet-200 dark:shadow-violet-900">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">
              AuraFinance
            </span>
          </div>

          {/* New Chat CTA */}
          <div className="px-4 pt-4">
            <button
              onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "ask" })}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl
                         bg-gradient-to-r from-violet-500 to-indigo-500
                         text-white text-sm font-semibold shadow-md shadow-violet-200
                         dark:shadow-violet-900/30 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <MessageSquarePlus className="h-4 w-4" />
              New Chat
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 pt-4 space-y-0.5 overflow-y-auto">
            {navItems.map(({ id, label, icon: Icon }) => {
              const active = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: id })}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    active
                      ? "nav-active"
                      : "text-gray-500 dark:text-gray-400 hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/30 dark:hover:text-violet-400"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${active ? "text-violet-500" : ""}`} />
                  {label}
                </button>
              );
            })}

            {/* Chat History Section */}
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 pb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Chat History
                </span>
                <button className="text-gray-400 hover:text-violet-500 transition-colors cursor-pointer">
                  <BookOpen className="h-3.5 w-3.5" />
                </button>
              </div>
              {recentChats.map((chat, i) => (
                <button
                  key={i}
                  onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "history" })}
                  className="w-full text-left px-3 py-2 rounded-lg text-xs text-gray-500 dark:text-gray-400
                             hover:bg-violet-50 hover:text-violet-600 dark:hover:bg-violet-950/20
                             dark:hover:text-violet-400 transition-colors cursor-pointer truncate"
                >
                  {chat}
                </button>
              ))}
            </div>
          </nav>

          {/* Upgrade Card */}
          <div className="px-4 pb-5 pt-2 shrink-0">
            <div className="upgrade-card">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-bold">Upgrade Your plan</span>
              </div>
              <p className="text-xs text-white/80 mb-3 leading-relaxed">
                Enjoy increased limits, premium tools and priority support when you upgrade.
              </p>
              <button
                onClick={() => dispatch({ type: "SET_ACTIVE_TAB", payload: "config" })}
                className="w-full bg-white/20 hover:bg-white/30 border border-white/30
                           text-white text-xs font-semibold py-2 rounded-lg
                           transition-all cursor-pointer"
              >
                Upgrade Now
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
