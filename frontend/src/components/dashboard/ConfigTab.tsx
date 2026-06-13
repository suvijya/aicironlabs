"use client";

import React, { useState, useEffect } from "react";
import { useDashboard, DashboardConfig } from "@/context/DashboardContext";
import { Card, Button, Toggle, Slider, Textarea } from "@/components/ui";
import { Settings, User, Sliders, Layout, RotateCcw, AlertTriangle, Save, Eye, Zap } from "lucide-react";

export const ConfigTab: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { config } = state;

  const [promptText, setPromptText] = useState(config.systemPrompt);
  const maxPromptChars = 1000;

  // Sync local text state when system prompt changes in store (e.g. on persona switch or load)
  useEffect(() => {
    setPromptText(config.systemPrompt);
  }, [config.systemPrompt]);

  const handlePersonaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextPersona = e.target.value as DashboardConfig["persona"];
    dispatch({ type: "UPDATE_CONFIG", payload: { persona: nextPersona } });
    dispatch({ type: "ADD_TOAST", payload: { type: "info", message: `AI Persona set to ${e.target.options[e.target.selectedIndex].text}` } });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, maxPromptChars);
    setPromptText(val);
    dispatch({ type: "UPDATE_CONFIG", payload: { systemPrompt: val } });
  };

  const updateConfigValue = (key: keyof DashboardConfig, val: any) => {
    dispatch({ type: "UPDATE_CONFIG", payload: { [key]: val } });
  };

  const handleReset = () => {
    dispatch({ type: "RESET_CONFIG" });
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Configuration reset to default settings." } });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* 0. Live Agent Settings */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md space-y-4">
        <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border/40 pb-3 select-none">
          <Zap className="h-4.5 w-4.5 text-indigo-500" />
          <span>Python Execution Settings</span>
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="select-none space-y-1">
            <label htmlFor="agent2-toggle" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">
              Enable Live Python Agent (agent2.py)
            </label>
            <p className="text-xs text-muted-foreground font-sans">
              Queries will run locally via <code>agent2.py</code> instead of the simulated browser engine.
            </p>
          </div>
          <Toggle
            id="agent2-toggle"
            checked={config.useLiveAgent}
            onChange={(checked) => {
              updateConfigValue("useLiveAgent", checked);
              dispatch({
                type: "ADD_TOAST",
                payload: {
                  type: "success",
                  message: checked ? "Live local Python execution enabled!" : "Mock simulation engine enabled."
                }
              });
            }}
          />
        </div>
      </Card>

      {/* 1. AI Persona configuration */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md space-y-4">
        <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border/40 pb-3 select-none">
          <User className="h-4.5 w-4.5 text-indigo-400" />
          <span>AI Persona Settings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 select-none space-y-1">
            <label htmlFor="persona-select" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Active Persona</label>
            <p className="text-xs text-muted-foreground font-sans">
              Select the behavioral model persona for generating financial responses.
            </p>
          </div>

          <div className="md:col-span-2">
            <select
              id="persona-select"
              value={config.persona}
              onChange={handlePersonaChange}
              className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent select-none cursor-pointer"
            >
              <option value="analyst">Financial Analyst (Default ratios/efficiency)</option>
              <option value="research">Equity Research (Positioning & competitive moat)</option>
              <option value="banking">Investment Banking (EV/EBITDA multiples & leverage)</option>
              <option value="conservative">Conservative Advisor (Risk-avoidance & margins)</option>
              <option value="verbose">Academic Professor (Detail, histories, formulas)</option>
              <option value="custom">Custom (Provide your own system prompt below)</option>
            </select>
          </div>
        </div>

        {/* System Prompt Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-3">
          <div className="md:col-span-1 select-none space-y-1">
            <label htmlFor="system-prompt-input" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">System Instructions</label>
            <p className="text-xs text-muted-foreground font-sans">
              Base guidelines injected into the local AI responder context.
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <Textarea
              id="system-prompt-input"
              value={promptText}
              onChange={handlePromptChange}
              disabled={config.persona !== "custom"}
              placeholder="e.g. You are a debt underwriting director. Detail credit worthiness..."
              className={`min-h-[100px] text-sm font-sans ${
                config.persona !== "custom" ? "bg-muted/20 text-muted-foreground cursor-not-allowed" : "border-border"
              }`}
            />
            
            <div className="flex justify-between items-center select-none text-[11px] text-zinc-500 font-mono">
              <span>
                {config.persona !== "custom" ? "*Set to Custom to edit system prompt" : "Editable System Instruction"}
              </span>
              <span>
                {promptText.length} / {maxPromptChars} chars
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* 2. Simulation Sliders */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md space-y-6">
        <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border/40 pb-3 select-none">
          <Sliders className="h-4.5 w-4.5 text-indigo-400" />
          <span>Local Engine Simulation Settings</span>
        </h3>

        {/* Delay Slider */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 select-none space-y-1">
            <label htmlFor="delay-slider" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Mock Response Delay</label>
            <p className="text-xs text-muted-foreground font-sans">
              Configures the simulated networking and model computation latency.
            </p>
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <Slider
              id="delay-slider"
              value={config.delayMs}
              min={500}
              max={4000}
              step={100}
              onChangeValue={(val) => updateConfigValue("delayMs", val)}
              className="flex-1"
            />
            <span className="w-20 text-right text-sm font-mono font-bold text-indigo-400 select-none bg-indigo-500/5 px-2 py-1 border border-indigo-500/20 rounded">
              {config.delayMs}ms
            </span>
          </div>
        </div>

        {/* Quality Score Slider */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 select-none space-y-1">
            <label htmlFor="quality-slider" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Simulated Response Quality</label>
            <p className="text-xs text-muted-foreground font-sans">
              Base indicator for accuracy and validation scores of outputs.
            </p>
          </div>

          <div className="md:col-span-2 flex items-center gap-4">
            <Slider
              id="quality-slider"
              value={config.qualityScore}
              min={50}
              max={100}
              step={1}
              onChangeValue={(val) => updateConfigValue("qualityScore", val)}
              className="flex-1"
            />
            <span className="w-20 text-right text-sm font-mono font-bold text-indigo-400 select-none bg-indigo-500/5 px-2 py-1 border border-indigo-500/20 rounded">
              {config.qualityScore}%
            </span>
          </div>
        </div>
      </Card>

      {/* 3. UI settings */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md space-y-6">
        <h3 className="text-base font-semibold font-display text-foreground flex items-center gap-2 border-b border-border/40 pb-3 select-none">
          <Layout className="h-4.5 w-4.5 text-indigo-400" />
          <span>UI Preferences</span>
        </h3>

        {/* Dark Mode toggle */}
        <div className="flex items-center justify-between">
          <div className="select-none space-y-1">
            <label htmlFor="theme-toggle" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Dark Theme Mode</label>
            <p className="text-xs text-muted-foreground font-sans">
              Switch between premium dark theme and light theme layouts.
            </p>
          </div>
          <Toggle
            id="theme-toggle"
            checked={config.theme === "dark"}
            onChange={(checked) => updateConfigValue("theme", checked ? "dark" : "light")}
          />
        </div>

        {/* Font size selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="md:col-span-1 select-none space-y-1">
            <label htmlFor="font-size-select" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Font Scale Size</label>
            <p className="text-xs text-muted-foreground font-sans">
              Scale the text across the dashboard panels dynamically.
            </p>
          </div>

          <div className="md:col-span-2">
            <select
              id="font-size-select"
              value={config.fontSize}
              onChange={(e) => updateConfigValue("fontSize", e.target.value)}
              className="w-full h-10 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent select-none cursor-pointer"
            >
              <option value="sm">Small (14px baseline)</option>
              <option value="base">Medium (16px baseline)</option>
              <option value="lg">Large (18px baseline)</option>
            </select>
          </div>
        </div>

        {/* Sidebar Default Open */}
        <div className="flex items-center justify-between pt-2">
          <div className="select-none space-y-1">
            <label htmlFor="sidebar-toggle" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Sidebar Expanded by Default</label>
            <p className="text-xs text-muted-foreground font-sans">
              If enabled, navigation panel opens expanded when workspace is loaded.
            </p>
          </div>
          <Toggle
            id="sidebar-toggle"
            checked={config.sidebarDefaultOpen}
            onChange={(checked) => updateConfigValue("sidebarDefaultOpen", checked)}
          />
        </div>

        {/* Auto-save Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div className="select-none space-y-1">
            <label htmlFor="autosave-toggle" className="text-sm font-semibold text-gray-700 dark:text-zinc-300 font-display">Persist via localStorage</label>
            <p className="text-xs text-muted-foreground font-sans">
              Automatically sync configuration, run metrics, and history logs to browser cache.
            </p>
          </div>
          <Toggle
            id="autosave-toggle"
            checked={config.autoSave}
            onChange={(checked) => updateConfigValue("autoSave", checked)}
          />
        </div>
      </Card>

      {/* 4. Action bar */}
      <div className="flex justify-end gap-3 select-none">
        <Button variant="outline" onClick={handleReset} className="gap-2 cursor-pointer">
          <RotateCcw className="h-4 w-4" />
          <span>Reset Defaults</span>
        </Button>
      </div>
    </div>
  );
};
