"use client";

import React, { createContext, useContext, useReducer, useEffect } from "react";

// Types
export interface HistoryItem {
  id: string;
  timestamp: string;
  question: string;
  answer: string;
  latency: number;
  score: number;
  status: "success" | "error";
  persona: string;
}

export interface BatchItem {
  id: string;
  input: string;
  answer?: string;
  latency?: number;
  score?: number;
  status: "pending" | "processing" | "success" | "error";
}

export interface BatchState {
  items: BatchItem[];
  progress: number;
  isProcessing: boolean;
}

export interface ToastItem {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

export interface DashboardConfig {
  theme: "dark" | "light";
  fontSize: "sm" | "base" | "lg";
  sidebarDefaultOpen: boolean;
  autoSave: boolean;
  persona: "analyst" | "research" | "banking" | "conservative" | "verbose" | "custom";
  systemPrompt: string;
  delayMs: number;
  qualityScore: number;
  useLiveAgent: boolean;
}

export interface DashboardMetrics {
  totalQueries: number;
  averageResponseTime: number;
  successRate: number;
  averageScore: number;
}

export interface DashboardState {
  activeTab: "ask" | "history" | "batch" | "metrics" | "config";
  theme: "dark" | "light";
  sidebarOpen: boolean;
  history: HistoryItem[];
  batchState: BatchState;
  currentQuestion: string;
  currentResponse: HistoryItem | null;
  loading: boolean;
  config: DashboardConfig;
  metrics: DashboardMetrics;
  toasts: ToastItem[];
}

// Actions
type DashboardAction =
  | { type: "SET_ACTIVE_TAB"; payload: DashboardState["activeTab"] }
  | { type: "TOGGLE_SIDEBAR" }
  | { type: "SET_SIDEBAR"; payload: boolean }
  | { type: "ADD_HISTORY_ITEM"; payload: HistoryItem }
  | { type: "DELETE_HISTORY_ITEM"; payload: string }
  | { type: "CLEAR_HISTORY" }
  | { type: "UPDATE_CONFIG"; payload: Partial<DashboardConfig> }
  | { type: "RESET_CONFIG" }
  | { type: "SET_CURRENT_QUESTION"; payload: string }
  | { type: "SET_CURRENT_RESPONSE"; payload: HistoryItem | null }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_BATCH_ITEMS"; payload: BatchItem[] }
  | { type: "START_BATCH_PROCESSING" }
  | { type: "UPDATE_BATCH_ITEM"; payload: { id: string; updates: Partial<BatchItem> } }
  | { type: "UPDATE_BATCH_PROGRESS"; payload: number }
  | { type: "COMPLETE_BATCH_PROCESSING" }
  | { type: "ADD_TOAST"; payload: Omit<ToastItem, "id"> }
  | { type: "REMOVE_TOAST"; payload: string }
  | { type: "LOAD_PERSISTED_STATE"; payload: { config?: DashboardConfig; history?: HistoryItem[]; metrics?: DashboardMetrics } };

// Default Initial Configurations
const DEFAULT_SYSTEM_PROMPTS = {
  analyst: "You are a professional Financial Analyst. Analyze the financial data, provide ratios (liquidity, profitability, efficiency), and point out warning flags or key performance indicators. Keep the formatting professional and concise.",
  research: "You are an Equity Research Analyst. Provide in-depth analysis on market position, competitive advantages, valuation estimates, and target price considerations based on financial disclosures.",
  banking: "You are an Investment Banking Analyst. Focus on transaction details, valuation multiples (EV/EBITDA, P/E), DCF assumptions, and strategic growth drivers or M&A opportunities.",
  conservative: "You are a Risk-Averse Conservative Financial Advisor. Focus on safety margin, debt levels, cash flow sustainability, and worst-case scenario analysis. Highlight risks and red flags.",
  verbose: "You are an Academic Finance Professor. Explain financial concepts in extreme detail with formulas, historical context, academic citations, and step-by-step breakdown of calculations.",
  custom: "Provide tailored financial intelligence based on user preferences."
};

const DEFAULT_CONFIG: DashboardConfig = {
  theme: "dark",
  fontSize: "base",
  sidebarDefaultOpen: true,
  autoSave: true,
  persona: "analyst",
  systemPrompt: DEFAULT_SYSTEM_PROMPTS.analyst,
  delayMs: 1500,
  qualityScore: 92,
  useLiveAgent: false
};

const DEFAULT_METRICS: DashboardMetrics = {
  totalQueries: 0,
  averageResponseTime: 0,
  successRate: 0,
  averageScore: 0
};

const INITIAL_STATE: DashboardState = {
  activeTab: "ask",
  theme: "dark",
  sidebarOpen: true,
  history: [],
  batchState: {
    items: [],
    progress: 0,
    isProcessing: false
  },
  currentQuestion: "",
  currentResponse: null,
  loading: false,
  config: DEFAULT_CONFIG,
  metrics: DEFAULT_METRICS,
  toasts: []
};

// Helper function to calculate metrics
const calculateMetrics = (history: HistoryItem[]): DashboardMetrics => {
  if (history.length === 0) {
    return DEFAULT_METRICS;
  }
  const totalQueries = history.length;
  const totalLatency = history.reduce((sum, item) => sum + item.latency, 0);
  const averageResponseTime = Math.round(totalLatency / totalQueries);
  const successCount = history.filter((item) => item.status === "success").length;
  const successRate = Math.round((successCount / totalQueries) * 100);
  const totalScore = history.reduce((sum, item) => sum + item.score, 0);
  const averageScore = Math.round(totalScore / totalQueries);

  return {
    totalQueries,
    averageResponseTime,
    successRate,
    averageScore
  };
};

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case "SET_ACTIVE_TAB":
      return { ...state, activeTab: action.payload };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR":
      return { ...state, sidebarOpen: action.payload };
    case "ADD_HISTORY_ITEM": {
      // Limit history to 100 items
      const updatedHistory = [action.payload, ...state.history].slice(0, 100);
      const updatedMetrics = calculateMetrics(updatedHistory);
      
      // Save history & metrics to localStorage if autosave enabled
      if (state.config.autoSave) {
        localStorage.setItem("financeai-history", JSON.stringify(updatedHistory));
        localStorage.setItem("financeai-metrics", JSON.stringify(updatedMetrics));
      }

      return {
        ...state,
        history: updatedHistory,
        metrics: updatedMetrics
      };
    }
    case "DELETE_HISTORY_ITEM": {
      const updatedHistory = state.history.filter((item) => item.id !== action.payload);
      const updatedMetrics = calculateMetrics(updatedHistory);

      if (state.config.autoSave) {
        localStorage.setItem("financeai-history", JSON.stringify(updatedHistory));
        localStorage.setItem("financeai-metrics", JSON.stringify(updatedMetrics));
      }

      return {
        ...state,
        history: updatedHistory,
        metrics: updatedMetrics
      };
    }
    case "CLEAR_HISTORY": {
      const updatedHistory: HistoryItem[] = [];
      const updatedMetrics = DEFAULT_METRICS;

      if (state.config.autoSave) {
        localStorage.setItem("financeai-history", JSON.stringify(updatedHistory));
        localStorage.setItem("financeai-metrics", JSON.stringify(updatedMetrics));
      }

      return {
        ...state,
        history: updatedHistory,
        metrics: updatedMetrics
      };
    }
    case "UPDATE_CONFIG": {
      const updatedConfig = { ...state.config, ...action.payload };
      
      // If persona changes, update systemPrompt unless custom without specific request
      if (action.payload.persona && action.payload.persona !== "custom") {
        updatedConfig.systemPrompt = DEFAULT_SYSTEM_PROMPTS[action.payload.persona];
      }

      if (updatedConfig.autoSave) {
        localStorage.setItem("financeai-config", JSON.stringify(updatedConfig));
      } else {
        // Remove configuration if autoSave turned off (optional, but let's keep config)
        localStorage.setItem("financeai-config", JSON.stringify(updatedConfig));
      }

      // Sync active page theme config
      return {
        ...state,
        config: updatedConfig,
        theme: updatedConfig.theme
      };
    }
    case "RESET_CONFIG": {
      localStorage.setItem("financeai-config", JSON.stringify(DEFAULT_CONFIG));
      return {
        ...state,
        config: DEFAULT_CONFIG,
        theme: DEFAULT_CONFIG.theme
      };
    }
    case "SET_CURRENT_QUESTION":
      return { ...state, currentQuestion: action.payload };
    case "SET_CURRENT_RESPONSE":
      return { ...state, currentResponse: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_BATCH_ITEMS":
      return {
        ...state,
        batchState: {
          items: action.payload,
          progress: 0,
          isProcessing: false
        }
      };
    case "START_BATCH_PROCESSING":
      return {
        ...state,
        batchState: {
          ...state.batchState,
          isProcessing: true,
          progress: 0
        }
      };
    case "UPDATE_BATCH_ITEM": {
      const updatedItems = state.batchState.items.map((item) =>
        item.id === action.payload.id ? { ...item, ...action.payload.updates } : item
      );
      return {
        ...state,
        batchState: {
          ...state.batchState,
          items: updatedItems
        }
      };
    }
    case "UPDATE_BATCH_PROGRESS":
      return {
        ...state,
        batchState: {
          ...state.batchState,
          progress: action.payload
        }
      };
    case "COMPLETE_BATCH_PROCESSING":
      return {
        ...state,
        batchState: {
          ...state.batchState,
          isProcessing: false,
          progress: 100
        }
      };
    case "ADD_TOAST": {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast = { id, ...action.payload };
      return {
        ...state,
        toasts: [...state.toasts, newToast]
      };
    }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload)
      };
    case "LOAD_PERSISTED_STATE":
      return {
        ...state,
        config: action.payload.config || state.config,
        theme: action.payload.config?.theme || state.theme,
        sidebarOpen: action.payload.config ? action.payload.config.sidebarDefaultOpen : state.sidebarOpen,
        history: action.payload.history || state.history,
        metrics: action.payload.metrics || state.metrics
      };
    default:
      return state;
  }
}

// Context
const DashboardContext = createContext<{
  state: DashboardState;
  dispatch: React.Dispatch<DashboardAction>;
} | null>(null);

export const DashboardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(dashboardReducer, INITIAL_STATE);

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("financeai-config");
      const savedHistory = localStorage.getItem("financeai-history");
      const savedMetrics = localStorage.getItem("financeai-metrics");

      const payload: { config?: DashboardConfig; history?: HistoryItem[]; metrics?: DashboardMetrics } = {};

      if (savedConfig) {
        payload.config = JSON.parse(savedConfig);
      }
      if (savedHistory) {
        payload.history = JSON.parse(savedHistory);
      }
      if (savedMetrics) {
        payload.metrics = JSON.parse(savedMetrics);
      }

      if (savedConfig || savedHistory || savedMetrics) {
        dispatch({ type: "LOAD_PERSISTED_STATE", payload });
      }
    } catch (e) {
      console.error("Error loading persisted dashboard state", e);
    }
  }, []);

  // Sync state.theme to html tag for global stylesheet access
  useEffect(() => {
    const root = window.document.documentElement;
    if (state.theme === "dark") {
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    } else {
      root.classList.remove("dark");
      root.style.colorScheme = "light";
    }
  }, [state.theme]);

  return (
    <DashboardContext.Provider value={{ state, dispatch }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
};
