"use client";

import { useState, useEffect } from "react";
import { Database, Search, Download, Loader2, CheckCircle2, Flag, FileText } from "lucide-react";

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

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "500" });
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, drafts: 0, verified: 0, flagged: 0 });
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchQuestions();
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
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-extrabold text-white flex items-center gap-2">
              <Database className="h-6 w-6 text-emerald-400" />
              Question Bank
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Browse, search, and export your entire verified question database.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-bold text-white hover:bg-slate-700 transition-all"
          >
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </button>
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
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/60 overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/60">
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Question</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden sm:table-cell">Grade</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden md:table-cell">Subject</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400 hidden lg:table-cell">Topic</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Confidence</th>
                    <th className="px-4 py-3 text-[10px] font-extrabold uppercase text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {questions.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
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
                      <td className="px-4 py-3 text-xs font-bold text-emerald-400 whitespace-nowrap">
                        {q.confidence}%
                      </td>
                      <td className="px-4 py-3">{statusBadge(q.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
