"use client";

import React, { useState } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Menu, Search, Bell, Share2, Zap } from "lucide-react";

export const Header: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const [searchVal, setSearchVal] = useState("");

  const tabLabels: Record<string, string> = {
    ask: "Find your moment...",
    history: "Search audit logs...",
    batch: "Search batch runs...",
    metrics: "Search metrics...",
    config: "Search settings...",
  };

  return (
    <header
      className="fixed top-0 right-0 left-0 z-30 h-16 flex items-center justify-between px-6 gap-4
                 bg-white/80 backdrop-blur-md border-b border-gray-100
                 dark:bg-gray-900/80 dark:border-gray-800 select-none transition-colors"
    >
      {/* Left: hamburger + logo (when sidebar closed) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => dispatch({ type: "TOGGLE_SIDEBAR" })}
          className="p-2 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-500
                     dark:hover:bg-violet-950/30 dark:hover:text-violet-400 transition-colors cursor-pointer"
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {!state.sidebarOpen && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-sm text-gray-800 dark:text-white">AuraFinance</span>
          </div>
        )}
      </div>

      {/* Center: search bar */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          className="search-input"
          placeholder={tabLabels[state.activeTab] ?? "Find your moment..."}
          value={searchVal}
          onChange={e => setSearchVal(e.target.value)}
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-300 dark:text-gray-600 font-mono">
          Ctrl+/
        </span>
      </div>

      {/* Right: bell + share + avatar */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="p-2 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-500
                           dark:hover:bg-violet-950/30 dark:hover:text-violet-400 transition-colors cursor-pointer relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-violet-500 rounded-full ring-2 ring-white dark:ring-gray-900" />
        </button>
        <button className="p-2 rounded-xl text-gray-400 hover:bg-violet-50 hover:text-violet-500
                           dark:hover:bg-violet-950/30 dark:hover:text-violet-400 transition-colors cursor-pointer">
          <Share2 className="h-5 w-5" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-md shadow-violet-200 dark:shadow-violet-900/40 cursor-pointer">
          S
        </div>
      </div>
    </header>
  );
};
