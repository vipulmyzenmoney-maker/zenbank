"use client";

import { useState, useEffect, useCallback } from "react";
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
        drafts: prev.drafts - 1,
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
      setStats((prev) => ({ ...prev, drafts: prev.drafts - 1, verified: prev.verified + 1 }));
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
      alert(`${data.approvedCount} high-confidence questions approved!`);
      fetchDrafts();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (editMode) return;
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleAction("approve");
      } else if (e.key === "f" || e.key === "F") {
        handleAction("flag", "Needs review");
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 page-enter">
      {/* Header Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-slate-900">Review Studio</h1>
          <p className="text-xs text-slate-500">
            Press <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold">Enter</kbd> to approve,{" "}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold">F</kbd> to flag,{" "}
            <kbd className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold">E</kbd> to edit
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex gap-2 text-xs font-bold">
            <span className="rounded-lg bg-amber-50 border border-amber-200 px-2.5 py-1 text-amber-800">
              {stats.drafts} Drafts
            </span>
            <span className="rounded-lg bg-emerald-50 border border-emerald-200 px-2.5 py-1 text-emerald-800">
              {stats.verified} Verified
            </span>
            <span className="rounded-lg bg-red-50 border border-red-200 px-2.5 py-1 text-red-800">
              {stats.flagged} Flagged
            </span>
          </div>
          <button
            onClick={handleBatchApprove}
            disabled={actionLoading}
            className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            <Zap className="h-3.5 w-3.5" />
            Approve All 95%+
          </button>
        </div>
      </div>

      {/* Empty State */}
      {questions.length === 0 && (
        <div className="mt-16 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
          <h2 className="mt-3 font-display text-xl font-bold text-slate-900">All Caught Up!</h2>
          <p className="mt-1 text-sm text-slate-500">
            No draft questions to review. Go to the Generator to create more.
          </p>
          <a
            href="/"
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
          >
            Open Generator <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Question Review Card */}
      {current && !editMode && (
        <div className="mt-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentIdx((i) => Math.max(i - 1, 0))}
              disabled={currentIdx === 0}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>
            <span className="text-xs font-bold text-slate-400">
              {currentIdx + 1} of {questions.length}
            </span>
            <button
              onClick={() => setCurrentIdx((i) => Math.min(i + 1, questions.length - 1))}
              disabled={currentIdx === questions.length - 1}
              className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30 transition-colors"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {current.gradeLevel}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {current.subject}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {current.topic}
              </span>
              <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 capitalize">
                {current.difficulty}
              </span>
              <span
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold ${
                  current.confidence >= 95
                    ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                    : current.confidence >= 80
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-red-50 border border-red-200 text-red-800"
                }`}
              >
                <Star className="h-3 w-3" />
                {current.confidence}% confidence
              </span>
            </div>

            {/* Question */}
            <h2 className="font-display text-lg font-bold text-slate-900 leading-relaxed">
              {current.questionText}
            </h2>

            {/* Options */}
            <div className="mt-4 space-y-2">
              {current.options.map((opt: { id: string; text: string; isCorrect: boolean }) => (
                <div
                  key={opt.id}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${
                    opt.isCorrect
                      ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                      : "border-slate-200 bg-slate-50 text-slate-700"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      opt.isCorrect
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {opt.id}
                  </span>
                  {opt.text}
                  {opt.isCorrect && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600 shrink-0" />}
                </div>
              ))}
            </div>

            {/* Explanation */}
            <div className="mt-4 rounded-xl bg-blue-50 border border-blue-200 p-4">
              <div className="text-[10px] font-bold uppercase text-blue-600 mb-1">Explanation</div>
              <p className="text-sm text-blue-900 leading-relaxed">{current.explanation}</p>
            </div>

            {/* Action Bar */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => handleAction("approve")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
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
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
              >
                <Pencil className="h-4 w-4" />
                Edit (E)
              </button>
              <button
                onClick={() => handleAction("flag", "Needs review")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 hover:bg-amber-100 transition-all disabled:opacity-50"
              >
                <Flag className="h-4 w-4" />
                Flag (F)
              </button>
              <button
                onClick={() => handleAction("delete")}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100 transition-all disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Inline Edit Mode */}
      {current && editMode && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-md">
          <h3 className="font-display text-lg font-bold text-slate-900 mb-4">Edit Question</h3>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Question Text</label>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="mt-4">
            <label className="block text-xs font-bold text-slate-600 mb-1">Explanation</label>
            <textarea
              value={editExplanation}
              onChange={(e) => setEditExplanation(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 focus:border-emerald-500 focus:outline-none resize-none"
            />
          </div>

          <div className="mt-5 flex items-center gap-2.5">
            <button
              onClick={handleEdit}
              disabled={actionLoading}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              Save & Approve
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
