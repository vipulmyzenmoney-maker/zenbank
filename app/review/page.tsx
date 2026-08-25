"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Pencil,
  Flag,
  Trash2,
  ArrowRight,
  Loader2,
  Zap,
  Star,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Sparkles,
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
  flagReason: string | null;
}

export default function ReviewPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [stats, setStats] = useState({ total: 0, drafts: 0, verified: 0, flagged: 0 });

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/questions?status=draft&limit=200");
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, drafts: 0, verified: 0, flagged: 0 });
      setCurrentIdx(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDrafts();
  }, [fetchDrafts]);

  const current = questions[currentIdx] || null;

  const handleAction = async (action: "approve" | "flag" | "delete", reason?: string) => {
    if (!current) return;
    setActionLoading(true);
    try {
      if (action === "delete") {
        await fetch(`/api/questions/${current.id}`, { method: "DELETE" });
      } else {
        await fetch(`/api/questions/${current.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: action === "approve" ? "verified" : "flagged",
            flagReason: reason || null,
          }),
        });
      }
      setQuestions((prev) => prev.filter((_, i) => i !== currentIdx));
      if (currentIdx >= questions.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
      setStats((prev) => ({
        ...prev,
        drafts: Math.max(0, prev.drafts - 1),
        verified: action === "approve" ? prev.verified + 1 : prev.verified,
        flagged: action === "flag" ? prev.flagged + 1 : prev.flagged,
      }));
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!current) return;
    setActionLoading(true);
    try {
      await fetch(`/api/questions/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editText,
          explanation: editExplanation,
          status: "verified",
        }),
      });
      setQuestions((prev) => prev.filter((_, i) => i !== currentIdx));
      if (currentIdx >= questions.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
      setStats((prev) => ({ ...prev, drafts: Math.max(0, prev.drafts - 1), verified: prev.verified + 1 }));
      setEditMode(false);
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/questions/batch-approve", { method: "POST" });
      const data = await res.json();
      alert(`${data.approvedCount || 0} high-confidence questions approved!`);
      fetchDrafts();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editMode) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAction("approve");
      } else if (e.key === "f" || e.key === "F") {
        handleAction("flag", "Flagged by reviewer");
      } else if (e.key === "e" || e.key === "E") {
        if (current) {
          setEditText(current.questionText);
          setEditExplanation(current.explanation);
          setEditMode(true);
        }
      } else if (e.key === "ArrowRight") {
        setCurrentIdx((i) => Math.min(i + 1, questions.length - 1));
      } else if (e.key === "ArrowLeft") {
        setCurrentIdx((i) => Math.max(i - 1, 0));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-xl">
          <div>
            <h1 className="font-display text-xl font-extrabold text-white">Review Studio</h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Press <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">Enter</kbd> to Approve · <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">F</kbd> to Flag · <kbd className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-300">E</kbd> to Edit
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <span className="rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-400">
                {stats.drafts} Drafts
              </span>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-400">
                {stats.verified} Verified
              </span>
              <span className="rounded-lg bg-red-500/10 border border-red-500/30 px-2.5 py-1 text-red-400">
                {stats.flagged} Flagged
              </span>
            </div>

            <button
              onClick={handleBatchApprove}
              disabled={actionLoading || stats.drafts === 0}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3.5 py-1.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-40"
            >
              <Zap className="h-3.5 w-3.5" />
              Approve 95%+
            </button>
          </div>
        </div>

        {/* Empty State */}
        {questions.length === 0 && (
          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-xl">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
            <h2 className="mt-3 font-display text-xl font-bold text-white">All Drafts Reviewed!</h2>
            <p className="mt-1 text-xs text-slate-400">
              No pending questions in queue. Use the generator to create more.
            </p>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all"
              >
                Go to Generator <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        )}

        {/* Question Review Card */}
        {current && !editMode && (
          <div className="mt-6">
            {/* Top Stepper */}
            <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400">
              <button
                onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
                disabled={currentIdx === 0}
                className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <button
                onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
                disabled={currentIdx === questions.length - 1}
                className="flex items-center gap-1 hover:text-white disabled:opacity-30 transition-colors"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Main Dark Card */}
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                  {current.gradeLevel}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                  {current.subject}
                </span>
                <span className="rounded-md border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[11px] font-bold text-slate-300">
                  {current.topic}
                </span>
                <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400">
                  ⭐ {current.confidence}% AI Confidence
                </span>
              </div>

              {/* Question Text */}
              <h2 className="font-display text-lg sm:text-xl font-bold text-white leading-relaxed">
                {current.questionText}
              </h2>

              {/* Options */}
              <div className="mt-6 space-y-2.5">
                {current.options.map((opt) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3.5 rounded-2xl border p-3.5 text-sm font-semibold transition-all ${
                      opt.isCorrect
                        ? "border-emerald-500/50 bg-emerald-500/15 text-emerald-200"
                        : "border-slate-800 bg-slate-950/60 text-slate-300"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        opt.isCorrect
                          ? "bg-emerald-500 text-slate-950 font-black"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {opt.id}
                    </span>
                    <span className="flex-1">{opt.text}</span>
                    {opt.isCorrect && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>

              {/* Step-by-Step Explanation */}
              <div className="mt-5 rounded-2xl border border-blue-500/20 bg-blue-500/10 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">
                  Step-by-Step Logic & Explanation
                </div>
                <p className="text-xs sm:text-sm text-blue-200 leading-relaxed">
                  {current.explanation}
                </p>
              </div>

              {/* Floating Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-slate-800 pt-5">
                <button
                  onClick={() => handleAction("approve")}
                  disabled={actionLoading}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-40"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Approve (Enter)
                </button>
                <button
                  onClick={() => {
                    setEditText(current.questionText);
                    setEditExplanation(current.explanation);
                    setEditMode(true);
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit (E)
                </button>
                <button
                  onClick={() => handleAction("flag", "Flagged by reviewer")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs font-bold text-amber-400 hover:bg-amber-500/20 transition-all disabled:opacity-40"
                >
                  <Flag className="h-3.5 w-3.5" />
                  Flag (F)
                </button>
                <button
                  onClick={() => handleAction("delete")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {current && editMode && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl">
            <h3 className="font-display text-lg font-bold text-white mb-4">Edit Question</h3>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Question Text</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-xs font-bold text-slate-400 mb-1">Explanation</label>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-5 flex items-center gap-2.5">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save & Approve
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
