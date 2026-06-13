"use client";

import React from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Database, Clock, Zap, CheckCircle2, Save } from "lucide-react";

export const Statusbar: React.FC = () => {
  const { state } = useDashboard();
  const { config, history, metrics } = state;

  const personaMap: Record<string, string> = {
    analyst: "Financial Analyst", research: "Equity Research",
    banking: "Investment Banking", conservative: "Conservative",
    verbose: "Professor", custom: "Custom",
  };

  return (
    <footer className="fixed bottom-0 right-0 left-0 z-30 h-9 flex items-center justify-between px-6
                       bg-white/70 dark:bg-gray-900/70 backdrop-blur-md
                       border-t border-gray-100 dark:border-gray-800
                       text-[11px] font-mono text-gray-400 dark:text-gray-500 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-gray-600 dark:text-gray-400">Engine Online</span>
        </div>
        <span className="text-gray-200 dark:text-gray-700">·</span>
        <div className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-violet-400" />
          <span>{personaMap[config.persona] ?? "AI"}</span>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-2">
        {config.autoSave ? (
          <div className="flex items-center gap-1 text-emerald-500 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            <span>Auto-saved</span>
          </div>
        ) : (
          <div className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
            <Save className="h-3 w-3" />
            <span>Auto-save off</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1">
          <Database className="h-3 w-3 text-violet-400" />
          <span>{history.length}<span className="text-gray-300 dark:text-gray-600">/100</span> queries</span>
        </div>
        <span className="text-gray-200 dark:text-gray-700">·</span>
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 text-violet-400" />
          <span>{metrics.averageResponseTime}ms avg</span>
        </div>
      </div>
    </footer>
  );
};
