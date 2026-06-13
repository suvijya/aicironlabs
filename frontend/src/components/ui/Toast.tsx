"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDashboard } from "@/context/DashboardContext";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ToastProps {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const Toast: React.FC<ToastProps> = ({ id, message, type }) => {
  const { dispatch } = useDashboard();

  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: id });
    }, 4000);

    return () => clearTimeout(timer);
  }, [id, dispatch]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-success" />,
    error: <AlertCircle className="h-5 w-5 text-danger" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
  };

  const borderColors = {
    success: "border-success/30",
    error: "border-danger/30",
    info: "border-blue-500/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.9, transition: { duration: 0.2 } }}
      className={`flex w-80 items-center justify-between gap-3 rounded-lg border bg-card p-4 shadow-xl select-none ${borderColors[type]}`}
    >
      <div className="flex items-center gap-3">
        {icons[type]}
        <p className="text-sm font-medium text-foreground">{message}</p>
      </div>
      <button
        onClick={() => dispatch({ type: "REMOVE_TOAST", payload: id })}
        className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export const ToastContainer: React.FC = () => {
  const { state } = useDashboard();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <div className="flex flex-col gap-2 pointer-events-auto">
        <AnimatePresence>
          {state.toasts.map((toast) => (
            <Toast key={toast.id} {...toast} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
