"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Database, 
  Search, 
  Download, 
  Loader2, 
  CheckCircle2, 
  Flag, 
  FileText, 
  Trash2, 
  CheckSquare, 
  Square, 
  AlertTriangle, 
  RefreshCw, 
  UserCheck,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  SlidersHorizontal
} from "lucide-react";

interface SyllabusPackSummary {
  id: number;
  title: string;
  gradeLevel: string;
  subject: string;
  createdAt: string;
}

interface QuestionItem {
  id: number;
  syllabusPackId?: number | null;
  syllabusPack?: SyllabusPackSummary | null;
  questionText: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer: string;
  explanation: string;
  gradeLevel: string;
  subject: string;
  topic: string;
  difficulty: string;
  confidence: number;
  status: string;
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

interface BatchItem {
  id: number;
  title: string;
  gradeLevel: string;
  subject: string;
  createdAt: string;
  totalQuestions: number;
  draftCount: number;
  verifiedCount: number;
  flaggedCount: number;
}

export default function BankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedBatchId, setSelectedBatchId] = useState("all");
  const [stats, setStats] = useState({ total: 0, drafts: 0, verified: 0, flagged: 0 });
  
  // Batches state
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [batchesLoading, setBatchesLoading] = useState(false);
  const [showBatchesPanel, setShowBatchesPanel] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [jumpPageInput, setJumpPageInput] = useState("");

  // Selection state for manual multi-delete
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  // Batch deletion confirmation modal state
  const [batchDeleteTarget, setBatchDeleteTarget] = useState<{
    id: number;
    title: string;
    count: number;
  } | null>(null);
  const [deletingBatch, setDeletingBatch] = useState(false);

  const fetchBatches = useCallback(async () => {
    setBatchesLoading(true);
    try {
      const res = await fetch("/api/batches");
      const data = await res.json();
      if (data.success && Array.isArray(data.batches)) {
        setBatches(data.batches);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    } finally {
      setBatchesLoading(false);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "1000" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (selectedBatchId !== "all") params.set("batchId", selectedBatchId);
      if (search) params.set("search", search);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, drafts: 0, verified: 0, flagged: 0 });
      setSelectedIds([]);
      setCurrentPage(1); // Reset to page 1 on filter changes
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, selectedBatchId, search]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
  };

  // Pagination slicing
  const totalQuestions = questions.length;
  const totalPages = Math.max(1, Math.ceil(totalQuestions / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedQuestions = useMemo(() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return questions.slice(start, start + pageSize);
  }, [questions, safeCurrentPage, pageSize]);

  const startIndex = totalQuestions === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const endIndex = Math.min(safeCurrentPage * pageSize, totalQuestions);

  // Generate pagination numbers (with ellipsis)
  const pageNumbers = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, safeCurrentPage]);

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(jumpPageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
      setJumpPageInput("");
    }
  };

  // Single Question Delete
  const handleDeleteSingle = async (id: number) => {
    if (!confirm("Are you sure you want to remove this question from the database?")) return;
    
    setActionLoading(true);
    try {
      const res = await fetch(`/api/questions/${id}`, { method: "DELETE" });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
        setSelectedIds((prev) => prev.filter((item) => item !== id));
        setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
        fetchBatches();
      }
    } catch (err) {
      console.error("Delete single error:", err);
      alert("Failed to delete question.");
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Delete Selected Questions
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete ${selectedIds.length} selected question(s)?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/questions/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions((prev) => prev.filter((q) => !selectedIds.includes(q.id)));
        setStats((prev) => ({
          ...prev,
          total: Math.max(0, prev.total - selectedIds.length),
        }));
        setSelectedIds([]);
        fetchBatches();
      } else {
        alert("Batch deletion failed.");
      }
    } catch (err) {
      console.error("Batch delete error:", err);
      alert("Failed to delete questions.");
    } finally {
      setActionLoading(false);
    }
  };

  // Shortcut to Delete an Entire Generation Batch
  const handleConfirmDeleteBatch = async () => {
    if (!batchDeleteTarget) return;

    setDeletingBatch(true);
    try {
      const res = await fetch(`/api/batches/${batchDeleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Remove questions belonging to this batch from memory
        setQuestions((prev) => prev.filter((q) => q.syllabusPackId !== batchDeleteTarget.id));
        setBatches((prev) => prev.filter((b) => b.id !== batchDeleteTarget.id));
        if (selectedBatchId === String(batchDeleteTarget.id)) {
          setSelectedBatchId("all");
        }
        setBatchDeleteTarget(null);
        fetchQuestions();
        fetchBatches();
      } else {
        alert("Could not delete batch: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Batch delete error:", err);
      alert("Failed to delete batch.");
    } finally {
      setDeletingBatch(false);
    }
  };

  // Select All on current page toggle
  const handleToggleSelectPage = () => {
    const pageIds = paginatedQuestions.map((q) => q.id);
    const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

    if (allPageSelected) {
      setSelectedIds((prev) => prev.filter((id) => !pageIds.includes(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Batch ID",
      "Grade",
      "Subject",
      "Topic",
      "Question",
      "Correct Answer",
      "Explanation",
      "Difficulty",
      "Status",
      "Verified By",
      "Confidence"
    ];
    const rows = questions.map((q) => [
      q.id,
      q.syllabusPackId || "N/A",
      q.gradeLevel,
      q.subject,
      q.topic,
      `"${q.questionText.replace(/"/g, '""')}"`,
      q.correctAnswer,
      `"${q.explanation.replace(/"/g, '""')}"`,
      q.difficulty,
      q.status,
      `"${(q.verifiedBy || "").replace(/"/g, '""')}"`,
      q.confidence,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `zenbank-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const statusBadge = (q: QuestionItem) => {
    switch (q.status) {
      case "verified":
        return (
          <div className="flex flex-col items-start gap-0.5">
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
            {q.verifiedBy && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                <UserCheck className="h-2.5 w-2.5 text-emerald-400" />
                {q.verifiedBy}
              </span>
            )}
          </div>
        );
      case "flagged":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
            <Flag className="h-3 w-3" /> Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
            <FileText className="h-3 w-3" /> Draft
          </span>
        );
    }
  };

  const activeBatch = batches.find((b) => String(b.id) === selectedBatchId);
  const pageIds = paginatedQuestions.map((q) => q.id);
  const isAllPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.includes(id));

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2.5">
              <Database className="h-6 w-6 text-emerald-400" />
              Question Bank Manager
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Paginated question library with batch tracking, batch filters, and 1-click batch removal.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                fetchQuestions();
                fetchBatches();
              }}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading || batchesLoading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </button>
            <button
              onClick={() => setShowBatchesPanel((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-bold transition-all shadow-xs ${
                showBatchesPanel
                  ? "border-cyan-500/50 bg-cyan-500/20 text-cyan-300"
                  : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
              }`}
            >
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              Batches ({batches.length})
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-center">
            <div className="font-display text-2xl font-extrabold text-white">{stats.total}</div>
            <div className="text-[11px] font-bold text-slate-400">Total Questions</div>
          </div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <div className="font-display text-2xl font-extrabold text-emerald-400">{stats.verified}</div>
            <div className="text-[11px] font-bold text-emerald-300">Verified & Live</div>
          </div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-center">
            <div className="font-display text-2xl font-extrabold text-amber-400">{stats.drafts}</div>
            <div className="text-[11px] font-bold text-amber-300">Pending Review</div>
          </div>
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center">
            <div className="font-display text-2xl font-extrabold text-red-400">{stats.flagged}</div>
            <div className="text-[11px] font-bold text-red-300">Flagged</div>
          </div>
        </div>

        {/* Collapsible Batches Overview Panel */}
        {showBatchesPanel && (
          <div className="mt-6 rounded-3xl border border-cyan-500/30 bg-slate-900/95 p-5 backdrop-blur-xl shadow-2xl animate-in fade-in slide-in-from-top-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-extrabold text-white">Generation Batches Overview</h3>
                <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-[10px] font-bold text-cyan-400 border border-cyan-500/20">
                  {batches.length} total packs
                </span>
              </div>
              <button
                onClick={() => setShowBatchesPanel(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {batches.length === 0 ? (
              <p className="mt-4 text-xs text-slate-400 text-center py-4">No generation batches found.</p>
            ) : (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
                {batches.map((batch) => {
                  const isSelected = selectedBatchId === String(batch.id);

                  return (
                    <div
                      key={batch.id}
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 transition-all ${
                        isSelected
                          ? "border-cyan-500/60 bg-cyan-500/10 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                          : "border-slate-800 bg-slate-950/60 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-[10px] font-black text-cyan-300">
                            Batch #{batch.id}
                          </span>
                          <span className="text-[10px] font-medium text-slate-500">
                            {new Date(batch.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        <h4 className="mt-2 text-xs font-bold text-white line-clamp-1">
                          {batch.title}
                        </h4>
                        <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-400">
                          <span>{batch.gradeLevel}</span>
                          <span>•</span>
                          <span>{batch.subject}</span>
                        </div>

                        <div className="mt-2.5 flex items-center gap-2 text-[10px] font-bold">
                          <span className="rounded-sm bg-slate-800 px-1.5 py-0.5 text-slate-300">
                            {batch.totalQuestions} Qs
                          </span>
                          <span className="text-emerald-400">
                            {batch.verifiedCount} verified
                          </span>
                          <span className="text-amber-400">
                            {batch.draftCount} draft
                          </span>
                        </div>
                      </div>

                      <div className="mt-3.5 flex items-center justify-between border-t border-slate-800/80 pt-2.5 gap-2">
                        <button
                          onClick={() => {
                            setSelectedBatchId(isSelected ? "all" : String(batch.id));
                            setCurrentPage(1);
                          }}
                          className={`flex-1 rounded-lg py-1 text-center text-[11px] font-bold transition-all ${
                            isSelected
                              ? "bg-cyan-500 text-slate-950 font-black"
                              : "bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-800"
                          }`}
                        >
                          {isSelected ? "Active Filter" : "Filter Questions"}
                        </button>
                        <button
                          onClick={() =>
                            setBatchDeleteTarget({
                              id: batch.id,
                              title: batch.title,
                              count: batch.totalQuestions,
                            })
                          }
                          className="inline-flex items-center justify-center h-7 w-7 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all shrink-0"
                          title="Delete entire batch and all its questions"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search, Status & Batch Filters Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by keyword, concept, or topic..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </form>

          {/* Batch Selector Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-1.5 text-xs">
            <Layers className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="font-bold text-slate-400 text-[11px]">Batch:</span>
            <select
              value={selectedBatchId}
              onChange={(e) => {
                setSelectedBatchId(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent font-bold text-white focus:outline-none cursor-pointer text-xs max-w-[180px] truncate"
            >
              <option value="all" className="bg-slate-900 text-white">
                All Batches ({batches.length})
              </option>
              {batches.map((b) => (
                <option key={b.id} value={String(b.id)} className="bg-slate-900 text-white">
                  Batch #{b.id}: {b.title} ({b.totalQuestions} Qs)
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {["all", "draft", "verified", "flagged"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStatusFilter(s);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  statusFilter === s
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        </div>

        {/* Active Batch Filter Banner with Quick 1-Click Delete Shortcut */}
        {activeBatch && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-500/40 bg-cyan-500/10 p-3.5 backdrop-blur-xl animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.5 text-xs font-black text-cyan-300">
                Batch #{activeBatch.id}
              </span>
              <span className="text-xs font-bold text-white">
                {activeBatch.title}
              </span>
              <span className="text-xs text-cyan-300 font-medium hidden sm:inline">
                ({activeBatch.totalQuestions} questions)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedBatchId("all");
                  setCurrentPage(1);
                }}
                className="rounded-xl px-3 py-1 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Clear Batch Filter
              </button>
              <button
                onClick={() =>
                  setBatchDeleteTarget({
                    id: activeBatch.id,
                    title: activeBatch.title,
                    count: activeBatch.totalQuestions,
                  })
                }
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-3.5 py-1.5 text-xs font-extrabold text-white shadow-md hover:bg-red-500 transition-all"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Entire Batch #{activeBatch.id}
              </button>
            </div>
          </div>
        )}

        {/* Floating Bulk Action Bar for Checked Items */}
        {selectedIds.length > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-2xl border border-red-500/40 bg-red-500/10 p-3.5 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2.5 text-xs font-extrabold text-red-300">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <span>{selectedIds.length} question(s) selected</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedIds([])}
                className="rounded-xl px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleDeleteSelected}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl bg-red-600 px-4 py-1.5 text-xs font-extrabold text-white shadow-md hover:bg-red-500 transition-all disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete Selected ({selectedIds.length})
              </button>
            </div>
          </div>
        )}

        {/* Questions Table */}
        {loading ? (
          <div className="mt-16 flex flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Loading questions library...</p>
          </div>
        ) : totalQuestions === 0 ? (
          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Database className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-400">No questions found matching your filter.</p>
            {selectedBatchId !== "all" && (
              <button
                onClick={() => setSelectedBatchId("all")}
                className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-400 hover:underline"
              >
                Reset batch filter to view all questions
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xl">
            {/* Top Table Summary Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 bg-slate-950/70 px-4 py-2.5 text-xs">
              <div className="font-semibold text-slate-400">
                Showing <span className="text-white font-bold">{startIndex}–{endIndex}</span> of{" "}
                <span className="text-white font-bold">{totalQuestions}</span> questions
                {totalPages > 1 && (
                  <span className="text-slate-500 ml-1">
                    (Page {safeCurrentPage} of {totalPages})
                  </span>
                )}
              </div>

              {/* Page Size Selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-bold">Show per page:</span>
                <div className="flex gap-1">
                  {[10, 20, 50, 100].map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      className={`rounded-md px-2 py-0.5 text-[11px] font-bold transition-all ${
                        pageSize === size
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70">
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={handleToggleSelectPage}
                        className="text-slate-400 hover:text-white"
                        title={isAllPageSelected ? "Deselect Page" : "Select All on Page"}
                      >
                        {isAllPageSelected ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="px-3 py-3 text-[10px] font-extrabold uppercase text-slate-400 w-24">Batch</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Question</th>
                    <th className="px-3 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden sm:table-cell">Grade</th>
                    <th className="px-3 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden md:table-cell">Subject</th>
                    <th className="px-3 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden lg:table-cell">Topic</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Status</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {paginatedQuestions.map((q) => {
                    const isSelected = selectedIds.includes(q.id);

                    return (
                      <tr 
                        key={q.id} 
                        className={`transition-colors ${
                          isSelected ? "bg-red-500/5 hover:bg-red-500/10" : "hover:bg-slate-800/40"
                        }`}
                      >
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleToggleSelectOne(q.id)}
                            className="text-slate-400 hover:text-white"
                          >
                            {isSelected ? (
                              <CheckSquare className="h-4 w-4 text-red-400" />
                            ) : (
                              <Square className="h-4 w-4 text-slate-600" />
                            )}
                          </button>
                        </td>

                        {/* Batch Column with Clickable Filter */}
                        <td className="px-3 py-3 whitespace-nowrap">
                          {q.syllabusPackId ? (
                            <button
                              onClick={() => {
                                setSelectedBatchId(String(q.syllabusPackId));
                                setCurrentPage(1);
                              }}
                              className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-extrabold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all"
                              title={`Filter to Batch #${q.syllabusPackId}: ${q.syllabusPack?.title || "Curriculum Pack"}`}
                            >
                              <Layers className="h-2.5 w-2.5 text-cyan-400" />
                              #{q.syllabusPackId}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-500 font-mono">-</span>
                          )}
                        </td>

                        <td className="px-4 py-3 max-w-sm">
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2">
                            {q.questionText}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-400 hidden sm:table-cell whitespace-nowrap">
                          {q.gradeLevel}
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-400 hidden md:table-cell">
                          {q.subject}
                        </td>
                        <td className="px-3 py-3 text-xs font-semibold text-slate-400 hidden lg:table-cell">
                          {q.topic}
                        </td>
                        <td className="px-4 py-3">{statusBadge(q)}</td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteSingle(q.id)}
                            disabled={actionLoading}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all disabled:opacity-40"
                            title="Delete this question"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-800 bg-slate-950/80 px-4 py-3 text-xs">
                {/* Previous & First Controls */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={safeCurrentPage === 1}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                  >
                    <ChevronsLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={safeCurrentPage === 1}
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </button>
                </div>

                {/* Numbered Page Pills */}
                <div className="flex items-center gap-1">
                  {pageNumbers.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`dots-${idx}`} className="px-1.5 text-slate-600 font-bold">
                          ...
                        </span>
                      );
                    }
                    const isCurrent = p === safeCurrentPage;
                    return (
                      <button
                        key={`page-${p}`}
                        onClick={() => setCurrentPage(p as number)}
                        className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold transition-all ${
                          isCurrent
                            ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                            : "border border-slate-800 bg-slate-900 text-slate-400 hover:text-white hover:border-slate-700"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>

                {/* Next & Last Controls + Jump to Page */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-8 items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all font-bold text-xs"
                  >
                    Next <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={safeCurrentPage === totalPages}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                  >
                    <ChevronsRight className="h-3.5 w-3.5" />
                  </button>

                  <form onSubmit={handleJumpPage} className="hidden sm:flex items-center gap-1 ml-2">
                    <span className="text-[11px] text-slate-500 font-medium">Go to:</span>
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      placeholder={String(safeCurrentPage)}
                      className="w-12 h-8 rounded-lg border border-slate-800 bg-slate-900 text-center text-xs font-bold text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
                    />
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1-Click Batch Deletion Safe Confirmation Modal */}
        {batchDeleteTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="relative w-full max-w-md rounded-3xl border border-red-500/40 bg-slate-900 p-6 shadow-2xl shadow-red-950/50">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Delete Entire Batch #{batchDeleteTarget.id}?
                  </h3>
                  <p className="text-xs text-slate-400">
                    Irreversible batch purging action
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3.5">
                <div className="text-xs font-bold text-white truncate">
                  {batchDeleteTarget.title}
                </div>
                <div className="mt-1 text-xs text-red-300 font-medium">
                  ⚠️ This will permanently remove all <span className="font-extrabold text-red-200">{batchDeleteTarget.count} questions</span> generated in this batch from your database.
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-2.5">
                <button
                  onClick={() => setBatchDeleteTarget(null)}
                  disabled={deletingBatch}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteBatch}
                  disabled={deletingBatch}
                  className="flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-red-600/30 hover:bg-red-500 transition-all disabled:opacity-50"
                >
                  {deletingBatch ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Deleting Batch...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      Yes, Delete Entire Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
