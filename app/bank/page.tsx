"use client";

import { useState, useEffect } from "react";
import { Database, Search, Download, Loader2, CheckCircle2, Flag, FileText, Trash2 } from "lucide-react";

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
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
            <CheckCircle2 className="h-3 w-3" /> Verified
          </span>
        );
      case "flagged":
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-red-50 border border-red-200 px-2 py-0.5 text-[10px] font-bold text-red-800">
            <Flag className="h-3 w-3" /> Flagged
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-800">
            <FileText className="h-3 w-3" /> Draft
          </span>
        );
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 page-enter">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Database className="h-6 w-6 text-emerald-600" />
            Question Bank
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse, search, filter, and export your entire question database.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-all"
        >
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </button>
      </div>

      {/* Stats Row */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs">
          <div className="font-display text-2xl font-extrabold text-slate-900">{stats.total}</div>
          <div className="text-[11px] font-bold text-slate-500">Total Questions</div>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center shadow-xs">
          <div className="font-display text-2xl font-extrabold text-emerald-800">{stats.verified}</div>
          <div className="text-[11px] font-bold text-emerald-600">Verified & Live</div>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center shadow-xs">
          <div className="font-display text-2xl font-extrabold text-amber-800">{stats.drafts}</div>
          <div className="text-[11px] font-bold text-amber-600">Pending Review</div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center shadow-xs">
          <div className="font-display text-2xl font-extrabold text-red-800">{stats.flagged}</div>
          <div className="text-[11px] font-bold text-red-600">Flagged</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions by keyword..."
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </form>

        <div className="flex gap-1.5">
          {["all", "draft", "verified", "flagged"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-all ${
                statusFilter === s
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
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
          <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
        </div>
      ) : questions.length === 0 ? (
        <div className="mt-16 text-center">
          <Database className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-2 text-sm font-semibold text-slate-500">No questions found.</p>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Question</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 hidden sm:table-cell">Grade</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 hidden md:table-cell">Subject</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500 hidden lg:table-cell">Topic</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Confidence</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 max-w-xs">
                      <span className="text-xs font-semibold text-slate-800 line-clamp-2">
                        {q.questionText}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 hidden sm:table-cell whitespace-nowrap">
                      {q.gradeLevel}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-600 hidden md:table-cell">
                      {q.subject}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-slate-500 hidden lg:table-cell">
                      {q.topic}
                    </td>
                    <td className="px-4 py-3 text-xs font-bold text-slate-700 whitespace-nowrap">
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
  );
}
