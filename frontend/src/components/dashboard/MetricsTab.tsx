"use client";

import React, { useState, useEffect } from "react";
import { useDashboard, HistoryItem } from "@/context/DashboardContext";
import { Card, Button, Badge, Spinner } from "@/components/ui";
import { BarChart3, TrendingUp, Clock, Percent, Award, RefreshCw, Layers, DatabaseZap, Sparkles } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export const MetricsTab: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { history, metrics } = state;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Seed history with 15 rich records for demonstration
  const seedDemoData = () => {
    const demoItems: HistoryItem[] = [
      { id: "a1", timestamp: "09:15:22 AM", question: "Explain AMD Q1 2026 revenue drivers and growth", answer: "### Revenue Assessment\nConsolidated revenue up 14.5% YoY...", latency: 1200, score: 95, status: "success", persona: "analyst" },
      { id: "a2", timestamp: "09:30:10 AM", question: "Show Apple EBITDA margin breakdown and COGS ratios", answer: "### EBITDA Decomposition\nEBITDA margin reached 32.7%...", latency: 1650, score: 92, status: "success", persona: "analyst" },
      { id: "a3", timestamp: "10:05:45 AM", question: "What is Tesla capital expenditures trend?", answer: "### CAPEX Trend Analysis\nInvestments in Gigafactories increased 18%...", latency: 2100, score: 88, status: "success", persona: "research" },
      { id: "a4", timestamp: "10:45:12 AM", question: "Audit debt covenants and interest coverage for Ford", answer: "### Debt Assessment\nNet debt/EBITDA stands at 0.18x...", latency: 1400, score: 90, status: "success", persona: "banking" },
      { id: "a5", timestamp: "11:20:00 AM", question: "Analyze Nvidia quarterly valuation multiples (P/E, EV/EBITDA)", answer: "### Valuation Multiple Audit\nTrading at 22.5x Forward P/E...", latency: 1800, score: 94, status: "success", persona: "banking" },
      { id: "a6", timestamp: "12:05:33 PM", question: "Simulate API Timeout Error", answer: "### [API Error]\nSimulated execution failed.", latency: 2400, score: 0, status: "error", persona: "analyst" },
      { id: "a7", timestamp: "01:15:10 PM", question: "Assess liquidity and current ratios of Microsoft", answer: "### Balance Sheet Audit\nCurrent ratio is at 2.15x showing secure buffers...", latency: 1100, score: 96, status: "success", persona: "conservative" },
      { id: "a8", timestamp: "02:00:44 PM", question: "What is the theoretical definition of EBITDA multiple expansion?", answer: "### Academic Review\nExpansion occurs when EV growth outpaces EBITDA...", latency: 2900, score: 98, status: "success", persona: "verbose" },
      { id: "a9", timestamp: "03:10:22 PM", question: "Evaluate risk indicators for corporate bonds", answer: "### Risk Indicators\nCovenants checked. Safety margins are stable...", latency: 1300, score: 91, status: "success", persona: "conservative" },
      { id: "a10", timestamp: "03:45:50 PM", question: "Run segment review for Amazon Web Services growth", answer: "### AWS Performance\nAWS segment grew 22% YoY. Margin is at 37.5%...", latency: 1700, score: 93, status: "success", persona: "research" },
      { id: "a11", timestamp: "04:15:15 PM", question: "Simulate prompt fail trigger", answer: "### [API Error]\nSimulated execution failed.", latency: 1950, score: 0, status: "error", persona: "research" },
      { id: "a12", timestamp: "04:50:33 PM", question: "Analyze cash flow conversion rate for Alphabet", answer: "### Cash Flow Analysis\nFCF conversion of EBITDA sits at 72%...", latency: 1550, score: 90, status: "success", persona: "analyst" },
      { id: "a13", timestamp: "05:10:05 PM", question: "Determine cost of capital (WACC) for Netflix", answer: "### WACC Calculation\nEstimated WACC is at 8.2%...", latency: 1600, score: 91, status: "success", persona: "banking" },
      { id: "a14", timestamp: "05:40:12 PM", question: "What are the core risks in semi-conductor supply chains?", answer: "### Supply Chain Risks\nHigh customer concentration represents 24% volatility...", latency: 1450, score: 89, status: "success", persona: "research" },
      { id: "a15", timestamp: "06:15:00 PM", question: "Compare YoY consolidated sales for Intel", answer: "### Sales Assessment\nIntel consolidated sales grew 6.8% YoY...", latency: 1250, score: 92, status: "success", persona: "analyst" },
    ];

    // Add them in reverse chronological order so they display correctly
    demoItems.forEach((itm) => {
      dispatch({ type: "ADD_HISTORY_ITEM", payload: itm });
    });

    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Sandbox demo history seeded successfully!" } });
  };

  const clearHistory = () => {
    dispatch({ type: "CLEAR_HISTORY" });
    dispatch({ type: "ADD_TOAST", payload: { type: "info", message: "Metrics history cleared." } });
  };

  if (!isMounted) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  // Check if history is empty
  const hasHistory = history.length > 0;

  // 1. Line Chart Data (Latency Trend) - Last 10 items (chronological order)
  const lineChartData = [...history]
    .slice(0, 10)
    .reverse()
    .map((item, idx) => ({
      name: `Run ${idx + 1}`,
      latency: item.latency,
      score: item.score,
      query: item.question.substring(0, 20) + "...",
    }));

  // 2. Bar Chart Data (Persona Distribution)
  const personaCounts = history.reduce((acc: Record<string, number>, item) => {
    acc[item.persona] = (acc[item.persona] || 0) + 1;
    return acc;
  }, {});

  const personaLabels = {
    analyst: "Analyst",
    research: "Research",
    banking: "Banking",
    conservative: "Conservative",
    verbose: "Professor",
    custom: "Custom",
  };

  const barChartData = Object.keys(personaCounts).map((key) => ({
    name: personaLabels[key] || key,
    queries: personaCounts[key],
  }));

  // 3. Donut Chart Data (Status Breakdown)
  const successCount = history.filter((item) => item.status === "success").length;
  const errorCount = history.filter((item) => item.status === "error").length;

  const donutChartData = [
    { name: "Success", value: successCount },
    { name: "Error", value: errorCount },
  ].filter((d) => d.value > 0);

  const DONUT_COLORS = ["#10b981", "#ef4444"]; // Emerald, Red

  // 4. Area Chart Data (Quality Score Trend over last 10 runs)
  const areaChartData = [...history]
    .slice(0, 10)
    .reverse()
    .map((item, idx) => ({
      name: `Run ${idx + 1}`,
      score: item.score,
      latency: item.latency,
    }));

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        {/* KPI 1 */}
        <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
            <BarChart3 className="h-5 w-5 text-indigo-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">Total Queries</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">{metrics.totalQueries}</p>
          </div>
        </Card>

        {/* KPI 2 */}
        <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Clock className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">Avg Latency</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {metrics.averageResponseTime}
              <span className="text-xs font-sans font-medium text-zinc-500 ml-1">ms</span>
            </p>
          </div>
        </Card>

        {/* KPI 3 */}
        <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shrink-0">
            <Percent className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">Success Rate</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {metrics.successRate}
              <span className="text-xs font-sans font-medium text-zinc-500 ml-1">%</span>
            </p>
          </div>
        </Card>

        {/* KPI 4 */}
        <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md p-5 flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
            <Award className="h-5 w-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-sans">Average Score</p>
            <p className="text-xl font-bold font-mono text-foreground mt-0.5">
              {metrics.averageScore}
              <span className="text-xs font-sans font-medium text-zinc-500 ml-1">/100</span>
            </p>
          </div>
        </Card>
      </div>

      {/* Empty State Banner */}
      {!hasHistory && (
        <Card hoverGlow={false} className="border-dashed border-border/50 bg-zinc-950/20 py-12 text-center select-none max-w-xl mx-auto">
          <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="h-5 w-5 text-zinc-500" />
          </div>
          <h3 className="text-base font-semibold font-display text-foreground mb-1">No Data Visualizations</h3>
          <p className="text-sm text-muted-foreground font-sans max-w-sm mx-auto mb-6">
            The analytics suite calculates metrics based on locally saved audit history. Seed mock data to preview charts.
          </p>
          <div className="flex justify-center gap-3">
            <Button onClick={seedDemoData} className="gap-1.5 px-5 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Seed Sandbox Data</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Chart Grid */}
      {hasHistory && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Chart 1: Line Chart (Latency Trend) */}
          <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
            <h4 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-1.5 select-none">
              <Clock className="h-4 w-4 text-indigo-400" />
              <span>Response Latency Trend (Last 10 Runs)</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} fontClassName="font-mono" />
                  <YAxis stroke="#71717a" fontSize={11} fontClassName="font-mono" unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f0f12", borderColor: "#27272a", borderRadius: "8px" }}
                    labelStyle={{ color: "#fafafa", fontFamily: "var(--font-dm-sans)", fontSize: "12px", fontWeight: 600 }}
                    itemStyle={{ color: "#818cf8", fontFamily: "var(--font-jetbrains-mono)", fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="latency"
                    name="Latency"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    activeDot={{ r: 6 }}
                    dot={{ strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 2: Area Chart (Quality Score Trend) */}
          <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
            <h4 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-1.5 select-none">
              <Award className="h-4 w-4 text-emerald-400" />
              <span>Model Quality Score Trend (Last 10 Runs)</span>
            </h4>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={areaChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f0f12", borderColor: "#27272a", borderRadius: "8px" }}
                    labelStyle={{ color: "#fafafa", fontSize: "12px", fontWeight: 600 }}
                    itemStyle={{ color: "#10b981", fontSize: "12px" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    name="Score"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Chart 3: Bar Chart (Persona Distribution) */}
          <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
            <h4 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-1.5 select-none">
              <DatabaseZap className="h-4 w-4 text-blue-400" />
              <span>Query Volume by Active Persona</span>
            </h4>
            <div className="h-64 w-full">
              {barChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">No persona data logged.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" opacity={0.4} />
                    <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "#0f0f12", borderColor: "#27272a", borderRadius: "8px" }}
                      itemStyle={{ color: "#60a5fa", fontSize: "12px" }}
                    />
                    <Bar dataKey="queries" name="Queries Run" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          {/* Chart 4: Donut Chart (Status Breakdown) */}
          <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
            <h4 className="text-sm font-semibold font-display text-foreground mb-4 flex items-center gap-1.5 select-none">
              <Percent className="h-4 w-4 text-emerald-400" />
              <span>Call Resolution Status (Success vs Error)</span>
            </h4>
            <div className="h-64 w-full flex flex-col items-center justify-center">
              {donutChartData.length === 0 ? (
                <div className="flex h-full items-center justify-center text-xs text-zinc-500">No status data logged.</div>
              ) : (
                <div className="relative w-full h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {donutChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.name === "Success" ? "#10b981" : "#ef4444"} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0f0f12", borderColor: "#27272a", borderRadius: "8px" }}
                        itemStyle={{ fontSize: "12px" }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconSize={10} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Absolute Center Stats */}
                  <div className="absolute flex flex-col items-center justify-center select-none">
                    <span className="text-2xl font-bold font-mono text-foreground">
                      {metrics.successRate}%
                    </span>
                    <span className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                      Success Ratio
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Quick Utilities Row */}
      {hasHistory && (
        <div className="flex justify-end gap-3 select-none">
          <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs gap-1 cursor-pointer">
            <RefreshCw className="h-3 w-3" />
            <span>Reset Analytics</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={seedDemoData} className="text-xs gap-1.5 cursor-pointer">
            <Sparkles className="h-3 w-3" />
            <span>Seed 15 More Runs</span>
          </Button>
        </div>
      )}
    </div>
  );
};
