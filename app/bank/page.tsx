"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw
} from "lucide-react";

interface QuestionItem {
  id: number;
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
}

export default function BankPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState({ total: 0, drafts: 0, verified: 0, flagged: 0 });
  
  // Selection state for deletion
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, drafts: 0, verified: 0, flagged: 0 });
      setSelectedIds([]); // reset selection
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
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
      }
    } catch (err) {
      console.error("Delete single error:", err);
      alert("Failed to delete question.");
    } finally {
      setActionLoading(false);
    }
  };

  // Batch Delete Selected
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

  // Select All / Deselect All Toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === questions.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map((q) => q.id));
    }
  };

  const handleToggleSelectOne = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Grade", "Subject", "Topic", "Question", "Correct Answer", "Explanation", "Difficulty", "Status", "Confidence"];
    const rows = questions.map((q) => [
      q.id,
      q.gradeLevel,
      q.subject,
      q.topic,
      `"${q.questionText.replace(/"/g, '""')}"`,
      q.correctAnswer,
      `"${q.explanation.replace(/"/g, '""')}"`,
      q.difficulty,
      q.status,
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

  const statusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
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

  return (
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" />
              Question Bank Manager
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Review, filter, export, or remove questions from your central database.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchQuestions}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2 text-xs font-bold text-slate-300 hover:text-white transition-all shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
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

        {/* Search & Filter Bar */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <form onSubmit={handleSearch} className="flex-1 min-w-[220px]">
            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions by keyword..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </form>

          <div className="flex gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-1">
            {["all", "draft", "verified", "flagged"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
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

        {/* Floating Bulk Action Bar */}
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
          <div className="mt-16 flex justify-center">
            <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center">
            <Database className="mx-auto h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm font-bold text-slate-400">No questions found in this view.</p>
          </div>
        ) : (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/70">
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={handleToggleSelectAll}
                        className="text-slate-400 hover:text-white"
                        title={selectedIds.length === questions.length ? "Deselect All" : "Select All"}
                      >
                        {selectedIds.length > 0 && selectedIds.length === questions.length ? (
                          <CheckSquare className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <Square className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Question</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden sm:table-cell">Grade</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden md:table-cell">Subject</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden lg:table-cell">Topic</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Status</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {questions.map((q) => {
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
                        <td className="px-4 py-3 max-w-sm">
                          <span className="text-xs font-semibold text-slate-200 line-clamp-2">
                            {q.questionText}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-400 hidden sm:table-cell whitespace-nowrap">
                          {q.gradeLevel}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-400 hidden md:table-cell">
                          {q.subject}
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-slate-400 hidden lg:table-cell">
                          {q.topic}
                        </td>
                        <td className="px-4 py-3">{statusBadge(q.status)}</td>
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
          </div>
        )}
      </div>
    </div>
  );
}
