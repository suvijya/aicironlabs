"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "@/context/DashboardContext";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Statusbar } from "@/components/layout/Statusbar";
import { ToastContainer } from "@/components/ui/Toast";
import { AskTab } from "@/components/dashboard/AskTab";
import { HistoryTab } from "@/components/dashboard/HistoryTab";
import { BatchTab } from "@/components/dashboard/BatchTab";
import { MetricsTab } from "@/components/dashboard/MetricsTab";
import { ConfigTab } from "@/components/dashboard/ConfigTab";
import { AnimatePresence, motion } from "framer-motion";

export default function DashboardPage() {
  const { state } = useDashboard();
  const { activeTab, sidebarOpen, config } = state;
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gradient-to-br from-violet-50 to-indigo-100 dark:from-gray-950 dark:to-indigo-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-300/50 animate-pulse">
            <span className="text-2xl">🤖</span>
          </div>
          <p className="text-sm font-medium text-violet-400">Initializing AuraFinance AI...</p>
        </div>
      </div>
    );
  }

  const renderTab = () => {
    switch (activeTab) {
      case "ask":      return <AskTab />;
      case "history":  return <HistoryTab />;
      case "batch":    return <BatchTab />;
      case "metrics":  return <MetricsTab />;
      case "config":   return <ConfigTab />;
      default:         return <AskTab />;
    }
  };

  const fontClass = { sm: "font-sz-sm", base: "font-sz-base", lg: "font-sz-lg" }[config.fontSize] ?? "font-sz-base";

  // Sidebar is exactly 240px wide when open, 0 when closed
  const sidebarW = sidebarOpen ? 240 : 0;

  return (
    <div className={`min-h-screen ${fontClass}`}>
      <ToastContainer />
      <Sidebar />
      <Header />

      {/* Main content shifts right when sidebar open */}
      <main
        className="main-gradient min-h-screen transition-all duration-300 ease-in-out"
        style={{ paddingLeft: sidebarW, paddingTop: 64, paddingBottom: 36 }}
      >
        {/* Non-chat tabs get a scrollable padded container */}
        {activeTab === "ask" ? (
          renderTab()
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className="px-6 py-8 md:px-10 max-w-6xl mx-auto"
            >
              {renderTab()}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      <Statusbar />
    </div>
  );
}
