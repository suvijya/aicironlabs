"use client";

import React, { useState } from "react";
import { useDashboard, HistoryItem } from "@/context/DashboardContext";
import { Button, Card, Input, Modal, Badge } from "@/components/ui";
import { Search, Trash2, ArrowUpRight, ShieldAlert, Filter, Calendar, Clock, Sparkles } from "lucide-react";

export const HistoryTab: React.FC = () => {
  const { state, dispatch } = useDashboard();
  const { history } = state;

  const [searchQuery, setSearchQuery] = useState("");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Search & Filter Logic
  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPersona = personaFilter === "all" || item.persona === personaFilter;
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    return matchesSearch && matchesPersona && matchesStatus;
  });

  const handleReload = (item: HistoryItem) => {
    dispatch({ type: "SET_CURRENT_QUESTION", payload: item.question });
    dispatch({ type: "SET_CURRENT_RESPONSE", payload: item });
    dispatch({ type: "SET_ACTIVE_TAB", payload: "ask" });
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "Interaction reloaded into Ask tab!" } });
  };

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      dispatch({ type: "DELETE_HISTORY_ITEM", payload: itemToDelete });
      dispatch({ type: "ADD_TOAST", payload: { type: "info", message: "Audit item deleted." } });
      setItemToDelete(null);
    }
  };

  const handleClearAll = () => {
    dispatch({ type: "CLEAR_HISTORY" });
    dispatch({ type: "ADD_TOAST", payload: { type: "success", message: "All interaction logs cleared." } });
    setIsClearModalOpen(false);
  };

  const getPersonaLabel = (p: string) => {
    const map: Record<string, string> = {
      analyst: "Financial Analyst",
      research: "Equity Research",
      banking: "Investment Banking",
      conservative: "Conservative Review",
      verbose: "Academic Prof",
      custom: "Custom Agent",
    };
    return map[p] || p;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Search & Filter Toolbar */}
      <Card hoverGlow={false} className="border-border/60 bg-card/45 backdrop-blur-md">
        <div className="flex flex-col md:flex-row items-center gap-4 justify-between select-none">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-muted-foreground" />
            <Input
              placeholder="Search audit prompt/answers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 border-border"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-zinc-500" />
              <span className="text-xs text-muted-foreground">Filter:</span>
            </div>

            <select
              value={personaFilter}
              onChange={(e) => setPersonaFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent select-none cursor-pointer"
            >
              <option value="all">All Personas</option>
              <option value="analyst">Financial Analyst</option>
              <option value="research">Equity Research</option>
              <option value="banking">Investment Banking</option>
              <option value="conservative">Conservative Advisor</option>
              <option value="verbose">Academic Prof</option>
              <option value="custom">Custom Agent</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-10 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-transparent select-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="success">Success Only</option>
              <option value="error">Errors Only</option>
            </select>

            <Button
              variant="danger"
              onClick={() => setIsClearModalOpen(true)}
              disabled={history.length === 0}
              className="h-10 text-sm gap-2 ml-auto md:ml-0"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* History List */}
      <div className="space-y-4">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-16 px-4 rounded-xl border border-dashed border-border/40 bg-zinc-950/20 max-w-md mx-auto">
            <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-5 w-5 text-zinc-500" />
            </div>
            <h3 className="text-base font-semibold font-display text-foreground mb-1">No Entries Found</h3>
            <p className="text-sm text-muted-foreground font-sans max-w-sm mx-auto">
              {history.length === 0
                ? "You haven't run any AI intelligence analyses yet. Go to the Ask tab to start."
                : "No entries match your active query and filter criteria."}
            </p>
          </div>
        ) : (
          <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-3">
            {filteredHistory.map((item) => (
              <Card
                key={item.id}
                hoverGlow={true}
                className={`border-border/60 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/30 backdrop-blur-sm ${
                  item.status === "error" ? "border-danger/20 hover:border-danger/45" : ""
                }`}
              >
                {/* Left Info */}
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[12px] font-mono text-zinc-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {item.timestamp}
                    </span>
                    <span className="text-zinc-700 select-none">•</span>
                    <Badge variant={item.status === "success" ? "success" : "error"}>
                      {item.status === "success" ? `Quality Score ${item.score}` : "Failure"}
                    </Badge>
                    <span className="text-zinc-700 select-none">•</span>
                    <span className="text-[12px] font-mono text-indigo-400 bg-indigo-500/5 px-2 py-0.5 border border-indigo-500/15 rounded">
                      {getPersonaLabel(item.persona)}
                    </span>
                  </div>

                  <p className="text-sm font-semibold text-foreground line-clamp-2 pr-4 font-display">
                    {item.question}
                  </p>
                  
                  <p className="text-xs text-muted-foreground line-clamp-2 font-sans opacity-95">
                    {item.answer.substring(0, 160).replace(/[#*|]/g, "")}...
                  </p>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 select-none md:self-center">
                  <span className="text-xs font-mono text-zinc-500 mr-2 shrink-0">{item.latency}ms</span>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleReload(item)}
                    className="h-9 px-3 gap-1.5 shrink-0 text-xs"
                    title="Reload question and response into Ask Tab"
                  >
                    <span>Restore</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-zinc-400" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteClick(item.id)}
                    className="h-9 w-9 p-0 shrink-0 hover:bg-red-500/10 hover:text-red-400 cursor-pointer"
                    title="Delete log entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Clear All */}
      <Modal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        title="Clear Audit History"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsClearModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleClearAll}>
              Delete All Logs
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1 font-display">Are you absolutely sure?</p>
            <p className="text-sm text-muted-foreground font-sans">
              This action will permanently delete all **{history.length}** simulated financial logs in this browser session. This operation is destructive and cannot be undone.
            </p>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Individual Item Delete */}
      <Modal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        title="Delete History Log"
        footer={
          <>
            <Button variant="ghost" onClick={() => setItemToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Delete Entry
            </Button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-6 w-6 text-danger shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-foreground mb-1 font-display">Delete Log Entry?</p>
            <p className="text-sm text-muted-foreground font-sans">
              Are you sure you want to remove this specific log? This will remove it from your persisted local database logs.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};
