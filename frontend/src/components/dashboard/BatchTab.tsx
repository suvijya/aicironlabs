"use client";

import React, { useState, useRef } from "react";
import { useDashboard, BatchItem } from "@/context/DashboardContext";
import { generateMockResponse } from "@/utils/mockAi";
import { Button, Card, Modal, Badge, Spinner } from "@/components/ui";
import { Upload, FileJson, Play, RefreshCw, Eye, Download, ShieldAlert, CheckCircle, HelpCircle } from "lucide-react";
import { MarkdownRenderer } from "@/components/ui/MarkdownRenderer";

export const BatchTab: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { batchState, config } = state;
  const { items, progress, isProcessing } = batchState;

  const [isDragActive, setIsDragActive] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<BatchItem | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setValidationError(null);
    if (file.type !== "application/json" && !file.name.endsWith(".json")) {
      setValidationError("Invalid file type. Please upload a .json file.");
      dispatch({ type: "ADD_TOAST", payload: { type: "error", message: "Invalid file type." } });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);

        if (!Array.isArray(parsed)) {
          throw new Error("JSON structure must be an array of objects: [ { 'input': '...' } ]");
        }

        const validatedItems: BatchItem[] = parsed.map((item: any, index: number) => {
          if (typeof item !== "object" || item === null || !("input" in item)) {
            throw new Error(`Item at index ${index} is missing the required 'input' property.`);
          }
          return {
            id: Math.random().toString(36).substring(2, 9),
            input: String(item.input),
            status: "pending",
          };
        });

        dispatch({ type: "SET_BATCH_ITEMS", payload: validatedItems });
        dispatch({ type: "ADD_TOAST", payload: { type: "success", message: `Loaded ${validatedItems.length} batch items.` } });
      } catch (err: any) {
        setValidationError(`JSON Validation Error: ${err.message}`);
        dispatch({ type: "ADD_TOAST", payload: { type: "error", message: "Failed to parse batch JSON." } });
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Run Batch simulation
  const runBatch = async () => {
    if (items.length === 0 || isProcessing) return;

    dispatch({ type: "START_BATCH_PROCESSING" });
    
    const total = items.length;
    for (let i = 0; i < total; i++) {
      const currentItem = items[i];
      dispatch({
        type: "UPDATE_BATCH_ITEM",
        payload: { id: currentItem.id, updates: { status: "processing" } },
      });

      // Simulate step latency
      const stepDelay = Math.round(config.delayMs * 0.6 + (Math.random() * 200 - 100)); // slightly faster for batch
      await new Promise((resolve) => setTimeout(resolve, stepDelay));

      const isError = currentItem.input.toLowerCase().includes("error") || currentItem.input.toLowerCase().includes("fail");
      
      const startTime = performance.now();
      let answer = "";
      let score = 0;
      let status: "success" | "error" = "success";

      if (isError) {
        answer = "### [API Error]\nSimulated execution failed for batch item due to invalid context trigger.";
        score = 0;
        status = "error";
      } else {
        const res = generateMockResponse(currentItem.input, config.persona, config.systemPrompt, config.qualityScore);
        answer = res.answer;
        score = res.score;
      }

      const latency = Math.round(performance.now() - startTime + stepDelay);

      dispatch({
        type: "UPDATE_BATCH_ITEM",
        payload: {
          id: currentItem.id,
          updates: {
            answer,
            score,
            latency,
            status,
          },
        },
      });

      // Add to general logs if successful/autoSave enabled
      dispatch({
        type: "ADD_HISTORY_ITEM",
        payload: {
          id: currentItem.id,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          question: currentItem.input,
          answer,
          latency,
          score,
          status,
          persona: config.persona,
        },
      });

      // Update progress bar
      const nextProgress = Math.round(((i + 1) / total) * 100);
      dispatch({ type: "UPDATE_BATCH_PROGRESS", payload: nextProgress });
    }

    dispatch({ type: "COMPLETE_BATCH_PROCESSING" });
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Batch processing completed!" } });
  };

  // Retry single item
  const retryItem = async (id: string) => {
    const itemToRetry = items.find((itm) => itm.id === id);
    if (!itemToRetry) return;

    dispatch({
      type: "UPDATE_BATCH_ITEM",
      payload: { id, updates: { status: "processing" } },
    });

    const stepDelay = config.delayMs;
    await new Promise((resolve) => setTimeout(resolve, stepDelay));

    const isError = itemToRetry.input.toLowerCase().includes("error") || itemToRetry.input.toLowerCase().includes("fail");
    let answer = "";
    let score = 0;
    let status: "success" | "error" = "success";

    if (isError) {
      answer = "### [API Error]\nSimulated execution failed for batch item.";
      score = 0;
      status = "error";
    } else {
      const res = generateMockResponse(itemToRetry.input, config.persona, config.systemPrompt, config.qualityScore);
      answer = res.answer;
      score = res.score;
    }

    dispatch({
      type: "UPDATE_BATCH_ITEM",
      payload: {
        id,
        updates: {
          answer,
          score,
          latency: stepDelay + 100,
          status,
        },
      },
    });

    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Batch item updated." } });
  };

  // Export JSON
  const exportJson = () => {
    if (items.length === 0) return;
    const jsonStr = JSON.stringify(items, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auraai-batch-export-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "JSON export downloaded." } });
  };

  // Export CSV
  const exportCsv = () => {
    if (items.length === 0) return;
    
    // Header
    let csvContent = "ID,Input,Status,Score,Latency(ms),AnswerSnippet\n";
    
    items.forEach((item) => {
      const safeInput = `"${item.input.replace(/"/g, '""')}"`;
      const safeSnippet = item.answer
        ? `"${item.answer.substring(0, 100).replace(/\n/g, " ").replace(/"/g, '""')}"`
        : '""';
      csvContent += `${item.id},${safeInput},${item.status},${item.score || 0},${item.latency || 0},${safeSnippet}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `auraai-batch-export-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "CSV export downloaded." } });
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Upload area Card */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/40 pb-3 select-none">
            <div>
              <h3 className="text-base font-semibold font-display text-foreground">Import Batch Jobs</h3>
              <p className="text-xs text-muted-foreground font-sans">
                Upload a JSON array of financial queries to execute them concurrently inside the browser.
              </p>
            </div>
            
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const sample = [
                  { input: "What is Apple's revenue and gross margins?" },
                  { input: "Show EBITDA margin changes for Nvidia" },
                  { input: "Calculate solvency covenants for Ford debt" },
                ];
                const blob = new Blob([JSON.stringify(sample, null, 2)], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "auraai-batch-sample.json";
                a.click();
              }}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Get Sample Template
            </a>
          </div>

          {/* Drag and Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer select-none ${
              isDragActive
                ? "border-primary bg-primary/5 scale-[0.99]"
                : "border-border hover:border-zinc-700/80 hover:bg-zinc-900/10"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="hidden"
            />
            
            <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center border border-border">
              <Upload className="h-5 w-5 text-zinc-400 animate-pulse" />
            </div>
            
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground font-display">
                Drag & Drop JSON file or <span className="text-primary hover:underline">browse files</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1 font-mono">
                Accepts JSON array of inputs (max 50 items recommended)
              </p>
            </div>
          </div>

          {/* Friendly Validation Error Display */}
          {validationError && (
            <div className="rounded-lg border border-danger/30 bg-danger-muted/5 p-3.5 flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 text-danger shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-danger font-display">Schema Verification Failed</p>
                <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{validationError}</p>
              </div>
            </div>
          )}

          {/* Progress bar overlay */}
          {isProcessing && (
            <div className="space-y-2 select-none border-t border-border pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground flex items-center gap-1.5">
                  <Spinner className="h-3.5 w-3.5 text-primary" />
                  Running browser queue simulation...
                </span>
                <span className="font-mono text-zinc-400">{progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload summary and controls */}
          {items.length > 0 && !isProcessing && (
            <div className="flex justify-between items-center border-t border-border pt-4 select-none">
              <div className="flex items-center gap-2">
                <FileJson className="h-4.5 w-4.5 text-indigo-400" />
                <span className="text-xs text-muted-foreground">
                  File uploaded successfully (<strong className="text-gray-900 dark:text-zinc-200">{items.length} runs</strong> queued)
                </span>
              </div>

              <div className="flex gap-2">
                <Button onClick={runBatch} size="sm" className="gap-1.5">
                  <Play className="h-3.5 w-3.5" />
                  <span>Execute Batch</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Results grid Table */}
      {items.length > 0 && (
        <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md overflow-hidden p-0">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 select-none">
            <h3 className="text-sm font-semibold font-display text-foreground">Batch Execution Table</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={exportCsv}
                disabled={isProcessing}
                className="h-8 text-xs gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportJson}
                disabled={isProcessing}
                className="h-8 text-xs gap-1"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export JSON</span>
              </Button>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-zinc-400 font-mono text-[11px] uppercase">
                <tr>
                  <th className="px-5 py-3 font-semibold">ID</th>
                  <th className="px-5 py-3 font-semibold">Prompt Query</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold text-center">Score</th>
                  <th className="px-5 py-3 text-center font-semibold">Latency</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 text-gray-800 dark:text-zinc-300">
                {items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-zinc-800/10 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-zinc-500">{item.id}</td>
                    <td className="px-5 py-3 font-medium text-foreground max-w-xs truncate font-display">
                      {item.input}
                    </td>
                    <td className="px-5 py-3 select-none">
                      {item.status === "pending" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 font-mono">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                          Pending
                        </span>
                      )}
                      {item.status === "processing" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-mono animate-pulse">
                          <Spinner className="h-3 w-3 text-indigo-400" />
                          Processing
                        </span>
                      )}
                      {item.status === "success" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-mono">
                          <CheckCircle className="h-3.5 w-3.5" />
                          Success
                        </span>
                      )}
                      {item.status === "error" && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-danger font-mono">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          Error
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {item.score !== undefined ? (
                        <Badge variant={item.status === "success" ? "success" : "error"}>
                          {item.score}
                        </Badge>
                      ) : (
                        <span className="text-zinc-600 font-mono text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center font-mono text-xs">
                      {item.latency !== undefined ? (
                        <span className="text-zinc-400">{item.latency}ms</span>
                      ) : (
                        <span className="text-zinc-600 font-mono">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={item.status === "pending" || item.status === "processing"}
                          onClick={() => setSelectedItem(item)}
                          className="h-8 w-8 p-0"
                          title="View Details"
                        >
                          <Eye className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isProcessing || item.status === "processing"}
                          onClick={() => retryItem(item.id)}
                          className="h-8 w-8 p-0"
                          title="Retry Item"
                        >
                          <RefreshCw className="h-3.5 w-3.5 text-zinc-400" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Details View Modal */}
      <Modal
        isOpen={selectedItem !== null}
        onClose={() => setSelectedItem(null)}
        title="View Batch Query Details"
        footer={
          <Button onClick={() => setSelectedItem(null)} variant="secondary">
            Close
          </Button>
        }
      >
        {selectedItem && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Input Prompt</p>
              <p className="text-sm font-semibold text-foreground mt-1 font-display leading-relaxed">
                {selectedItem.input}
              </p>
            </div>
            
            <div className="border-t border-border/50 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Generated Answer</span>
                <div className="flex gap-2">
                  <Badge variant={selectedItem.status === "success" ? "success" : "error"}>
                    {selectedItem.status === "success" ? `Quality Score ${selectedItem.score}` : "Error"}
                  </Badge>
                  <span className="text-xs font-mono text-zinc-400">{selectedItem.latency}ms</span>
                </div>
              </div>
              
              <div className="bg-zinc-950/40 border border-border p-4 rounded-lg overflow-y-auto max-h-[40vh] prose prose-invert">
                {selectedItem.answer ? (
                  <MarkdownRenderer content={selectedItem.answer} />
                ) : (
                  <p className="text-sm text-zinc-500 italic">No output text generated.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
