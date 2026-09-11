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
  Sparkles,
  UserCheck,
  Tag,
  Lightbulb,
  Layers,
  RefreshCw,
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
  verifiedBy?: string | null;
  verifiedAt?: string | null;
}

export default function ReviewPage() {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");
  const [editOptions, setEditOptions] = useState<{ id: string; text: string; isCorrect: boolean }[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<string>("A");
  const [activeTab, setActiveTab] = useState<"draft" | "flagged">("draft");
  const [reviewerName, setReviewerName] = useState("Zen Admin");
  const [stats, setStats] = useState({ total: 0, drafts: 0, verified: 0, flagged: 0 });
  const [simplifyingExplanation, setSimplifyingExplanation] = useState(false);
  const [batchSize, setBatchSize] = useState<number>(200);

  useEffect(() => {
    const saved = localStorage.getItem("zen_reviewer_name");
    if (saved) setReviewerName(saved);
  }, []);

  const handleReviewerNameChange = (val: string) => {
    setReviewerName(val);
    localStorage.setItem("zen_reviewer_name", val);
  };

  const openEditMode = (q: QuestionItem) => {
    setEditText(q.questionText);
    setEditExplanation(q.explanation);
    const rawOpts = Array.isArray(q.options) && q.options.length > 0
      ? q.options.map((o) => ({ ...o }))
      : [
          { id: "A", text: "", isCorrect: q.correctAnswer === "A" },
          { id: "B", text: "", isCorrect: q.correctAnswer === "B" },
          { id: "C", text: "", isCorrect: q.correctAnswer === "C" },
          { id: "D", text: "", isCorrect: q.correctAnswer === "D" },
        ];
    setEditOptions(rawOpts);
    setEditCorrectAnswer(q.correctAnswer || "A");
    setEditMode(true);
  };

  const handleOptionTextChange = (id: string, text: string) => {
    setEditOptions((prev) =>
      prev.map((opt) => (opt.id === id ? { ...opt, text } : opt))
    );
  };

  const handleSetCorrectOption = (id: string) => {
    setEditCorrectAnswer(id);
    setEditOptions((prev) =>
      prev.map((opt) => ({ ...opt, isCorrect: opt.id === id }))
    );
  };

  const handleSimplifyForKids = async () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    setSimplifyingExplanation(true);
    try {
      const res = await fetch("/api/ai/simplify-explanation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: currentQ.questionText,
          correctAnswer: currentQ.correctAnswer,
          currentExplanation: currentQ.explanation,
          gradeLevel: currentQ.gradeLevel,
          subject: currentQ.subject,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.explanation) {
        const simplified = data.explanation;
        setQuestions((prev) =>
          prev.map((q, idx) =>
            idx === currentIdx ? { ...q, explanation: simplified } : q
          )
        );
        setEditExplanation(simplified);

        // Persist to database immediately
        await fetch(`/api/questions/${currentQ.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ explanation: simplified }),
        });
      }
    } catch (err) {
      console.error("Failed to simplify explanation:", err);
      alert("Failed to simplify explanation. Please try again.");
    } finally {
      setSimplifyingExplanation(false);
    }
  };

  const fetchDrafts = useCallback(async (customLimit?: number, customTab?: "draft" | "flagged") => {
    setLoading(true);
    const limitToUse = customLimit !== undefined ? customLimit : batchSize;
    const tabToUse = customTab !== undefined ? customTab : activeTab;
    try {
      const limitParam = limitToUse === 0 ? "5000" : String(limitToUse);
      const res = await fetch(`/api/questions?status=${tabToUse}&limit=${limitParam}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setStats(data.stats || { total: 0, drafts: 0, verified: 0, flagged: 0 });
      setCurrentIdx(0);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [batchSize, activeTab]);

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
            verifiedBy: action === "approve" ? (reviewerName || "Zen Reviewer") : null,
          }),
        });
      }
      const remainingCount = questions.length - 1;
      setQuestions((prev) => prev.filter((_, i) => i !== currentIdx));
      if (currentIdx >= questions.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
      const newDraftsCount = Math.max(0, stats.drafts - 1);
      setStats((prev) => ({
        ...prev,
        drafts: newDraftsCount,
        verified: action === "approve" ? prev.verified + 1 : prev.verified,
        flagged: action === "flag" ? prev.flagged + 1 : prev.flagged,
      }));

      // Auto-refill: if loaded chunk is emptied and there are still drafts in DB, automatically pull next slice!
      if (remainingCount === 0 && newDraftsCount > 0) {
        fetchDrafts();
      }
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
      const sanitizedOptions = editOptions.map((opt) => ({
        ...opt,
        isCorrect: opt.id === editCorrectAnswer,
      }));

      await fetch(`/api/questions/${current.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionText: editText,
          options: sanitizedOptions,
          correctAnswer: editCorrectAnswer,
          explanation: editExplanation,
          status: "verified",
          flagReason: null,
          verifiedBy: reviewerName || "Zen Reviewer",
        }),
      });
      const remainingCount = questions.length - 1;
      setQuestions((prev) => prev.filter((_, i) => i !== currentIdx));
      if (currentIdx >= questions.length - 1) setCurrentIdx(Math.max(0, currentIdx - 1));
      const newDraftsCount = activeTab === "draft" ? Math.max(0, stats.drafts - 1) : stats.drafts;
      const newFlaggedCount = activeTab === "flagged" ? Math.max(0, stats.flagged - 1) : stats.flagged;
      setStats((prev) => ({
        ...prev,
        drafts: newDraftsCount,
        flagged: newFlaggedCount,
        verified: prev.verified + 1,
      }));
      setEditMode(false);

      // Auto-refill: if loaded chunk is emptied and there are still drafts in DB, automatically pull next slice!
      if (remainingCount === 0 && (activeTab === "draft" ? newDraftsCount : newFlaggedCount) > 0) {
        fetchDrafts();
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchApprove = async () => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/questions/batch-approve", { 
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verifiedBy: reviewerName || "AI Auto-Verifier" })
      });
      const data = await res.json();
      alert(`${data.approvedCount || 0} high-confidence questions approved!`);
      fetchDrafts();
    } catch {
      // ignore
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurgeDrafts = async () => {
    if (!confirm(`Are you sure you want to permanently delete all ${stats.drafts} pending draft questions?`)) return;

    setActionLoading(true);
    try {
      const res = await fetch("/api/questions/purge-drafts", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setQuestions([]);
        setStats((prev) => ({ ...prev, drafts: 0 }));
        alert(`Successfully purged ${data.deletedCount || 0} draft questions.`);
      }
    } catch (err) {
      console.error("Purge drafts error:", err);
      alert("Failed to purge draft questions.");
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
          openEditMode(current);
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

          <div className="flex flex-wrap items-center gap-3">
            {/* Verified By Input */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1">
              <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-[11px] font-bold text-slate-400">Verified by:</span>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => handleReviewerNameChange(e.target.value)}
                placeholder="Reviewer Name"
                className="w-24 bg-transparent text-xs font-bold text-emerald-300 focus:outline-none placeholder-slate-600"
              />
            </div>

            {/* Queue Batch Size Selector */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950 px-2.5 py-1">
              <Layers className="h-3.5 w-3.5 text-cyan-400" />
              <span className="text-[11px] font-bold text-slate-400">Load:</span>
              <select
                value={batchSize}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setBatchSize(val);
                  fetchDrafts(val);
                }}
                className="bg-transparent text-xs font-bold text-cyan-300 focus:outline-none cursor-pointer"
              >
                <option value={100} className="bg-slate-900 text-white">100 / batch</option>
                <option value={200} className="bg-slate-900 text-white">200 / batch (Default)</option>
                <option value={500} className="bg-slate-900 text-white">500 / batch</option>
                <option value={1000} className="bg-slate-900 text-white">1,000 / batch</option>
                <option value={0} className="bg-slate-900 text-white">All Drafts ({stats.drafts})</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <button
                onClick={() => {
                  setActiveTab("draft");
                  fetchDrafts(batchSize, "draft");
                }}
                className={`rounded-lg px-2.5 py-1 transition-all ${
                  activeTab === "draft"
                    ? "bg-amber-500/20 border border-amber-500/60 text-amber-300 ring-1 ring-amber-500/40"
                    : "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                }`}
                title="Review pending draft questions"
              >
                {stats.drafts} Drafts
              </button>
              <Link
                href="/support"
                className="rounded-lg px-2.5 py-1 transition-all bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 flex items-center gap-1"
                title="Manage all student complaints & tickets in the dedicated Support Hub"
              >
                <Flag className="h-3 w-3 text-rose-400" />
                <span>{stats.flagged} Complaints</span>
                <span className="text-[10px] bg-rose-500/20 px-1 py-0.5 rounded text-rose-200 ml-0.5">Support Hub &rarr;</span>
              </Link>
              <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 text-emerald-400">
                {stats.verified} Verified
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

            <button
              onClick={handlePurgeDrafts}
              disabled={actionLoading || stats.drafts === 0}
              className="flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-40"
              title="Permanently delete all draft questions"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Purge Drafts
            </button>
          </div>
        </div>

        {/* Empty State */}
        {questions.length === 0 && !loading && (
          <div className="mt-16 rounded-3xl border border-slate-800 bg-slate-900/50 p-12 text-center backdrop-blur-xl">
            {stats.drafts > 0 ? (
              <>
                <Zap className="mx-auto h-12 w-12 text-amber-400 animate-pulse" />
                <h2 className="mt-3 font-display text-xl font-bold text-white">Batch Completed!</h2>
                <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
                  You finished reviewing this batch. There are still <span className="font-extrabold text-amber-300">{stats.drafts} drafts</span> remaining in your database.
                </p>
                <div className="mt-5">
                  <button
                    onClick={() => fetchDrafts()}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:opacity-90 transition-all shadow-md shadow-emerald-500/20"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    Load Next Batch ({Math.min(stats.drafts, batchSize || stats.drafts)} Qs)
                  </button>
                </div>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-400" />
                <h2 className="mt-3 font-display text-xl font-bold text-white">All Drafts Reviewed!</h2>
                <p className="mt-1 text-xs text-slate-400">
                  No pending questions in queue. Use the syllabus upload or generator to create more.
                </p>
                <div className="mt-5">
                  <Link
                    href="/"
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 hover:bg-emerald-400 transition-all"
                  >
                    Go to Syllabus Generator <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </>
            )}
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
              <div className="flex items-center gap-2">
                <span className="text-white font-extrabold">
                  Question {currentIdx + 1} of {questions.length} loaded
                </span>
                {stats.drafts > questions.length && (
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md hidden sm:inline-block">
                    {stats.drafts} total in queue
                  </span>
                )}
              </div>
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
              {/* Student Complaint / Flag Banner */}
              {current.flagReason && (
                <div className="mb-5 rounded-2xl border border-rose-500/40 bg-rose-500/15 p-4 text-xs animate-in fade-in">
                  <div className="flex items-center gap-2 font-black text-rose-300">
                    <Flag className="h-4 w-4 text-rose-400" />
                    <span>REPORTED COMPLAINT / REASON:</span>
                  </div>
                  <p className="mt-1.5 font-medium text-rose-100 text-xs sm:text-sm leading-relaxed">
                    {current.flagReason}
                  </p>
                  <p className="mt-2 text-[11px] text-rose-300/80 font-bold">
                    💡 Click <strong className="text-rose-200">Edit (E)</strong> below to fix the question text, modify option choices, change the correct answer, or clarify the explanation.
                  </p>
                </div>
              )}

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

              {/* Kid-Friendly Step-by-Step Explanation */}
              <div className="mt-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400">
                    <Lightbulb className="h-4 w-4 text-emerald-400" />
                    <span>Kid-Friendly Explanation & Helpful Tip</span>
                  </div>
                  <button
                    onClick={handleSimplifyForKids}
                    disabled={simplifyingExplanation || actionLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-500/60 transition-all disabled:opacity-40 shadow-xs"
                    title="Rewrite this explanation with AI to make it super simple, clear, and easy for kids"
                  >
                    {simplifyingExplanation ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin text-cyan-400" />
                        <span>Simplifying for Kids...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        <span>✨ Simplify for Kids</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {current.explanation}
                </p>
              </div>

              {/* Floating Action Buttons */}
              <div className="mt-6 flex flex-wrap items-center justify-between gap-2.5 border-t border-slate-800 pt-5">
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => handleAction("approve")}
                    disabled={actionLoading}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-40"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Approve (Enter)
                  </button>
                  <button
                    onClick={() => openEditMode(current)}
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

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Will be marked: <strong className="text-emerald-400">{reviewerName || "Zen Reviewer"}</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {current && editMode && (
          <div className="mt-6 rounded-3xl border border-slate-800 bg-slate-900/95 p-6 sm:p-8 backdrop-blur-xl shadow-2xl animate-in fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-display text-lg font-bold text-white">Edit Question & MCQ Options</h3>
                <p className="text-xs text-slate-400">Modify question wording, adjust option text, or change the correct answer.</p>
              </div>
              <button
                onClick={() => setEditMode(false)}
                className="rounded-lg px-2.5 py-1 text-xs font-bold text-slate-400 hover:bg-slate-800 hover:text-white transition-all"
              >
                ✕ Cancel
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Question Text</label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            {/* MCQ Options Editor */}
            <div className="mt-5">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-300">
                  Multiple Choice Options (Click "Mark Correct" to change correct option)
                </label>
                <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-lg">
                  Correct Answer: Option {editCorrectAnswer}
                </span>
              </div>

              <div className="space-y-3">
                {editOptions.map((opt) => {
                  const isCorrect = editCorrectAnswer === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 rounded-2xl border p-3 transition-all ${
                        isCorrect
                          ? "border-emerald-500/70 bg-emerald-500/15 shadow-sm"
                          : "border-slate-800 bg-slate-950/70"
                      }`}
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-xl text-xs font-black ${
                            isCorrect
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-800 text-slate-400"
                          }`}
                        >
                          {opt.id}
                        </span>
                      </div>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                        placeholder={`Option ${opt.id} text...`}
                        className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => handleSetCorrectOption(opt.id)}
                        className={`flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-extrabold transition-all shrink-0 ${
                          isCorrect
                            ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                            : "border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:border-slate-600"
                        }`}
                      >
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="h-4 w-4" />
                            Correct Answer
                          </>
                        ) : (
                          "Mark Correct"
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-5">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-300">
                  Kid-Friendly Explanation & Helpful Tip
                </label>
                <span className="text-[10px] text-emerald-400 font-semibold">
                  Simple, clear, and easy for students
                </span>
              </div>
              <textarea
                value={editExplanation}
                onChange={(e) => setEditExplanation(e.target.value)}
                rows={4}
                placeholder="Step 1: ... Step 2: ... 💡 Helpful Tip: ..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-white focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-6 flex items-center gap-3 border-t border-slate-800 pt-4">
              <button
                onClick={handleEdit}
                disabled={actionLoading}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-xs font-black text-slate-950 hover:bg-emerald-400 shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40"
              >
                <CheckCircle2 className="h-4 w-4" />
                Save & Approve as {reviewerName || "Zen Reviewer"}
              </button>
              <button
                onClick={() => setEditMode(false)}
                className="rounded-xl border border-slate-700 bg-slate-800 px-5 py-3 text-xs font-bold text-slate-400 hover:text-white transition-all"
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
