"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  LifeBuoy,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  Search,
  ExternalLink,
  Pencil,
  Save,
  X,
  Zap,
  BookOpen,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Tag,
  Check
} from "lucide-react";
import { SupportItem } from "../api/support/route";

export default function SupportPage() {
  const [items, setItems] = useState<SupportItem[]>([]);
  const [counts, setCounts] = useState({
    total: 0,
    open: 0,
    resolved: 0,
    questionComplaints: 0,
    topicRequests: 0,
    generalSupport: 0,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "question_complaint" | "topic_request" | "general_support" | "resolved">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Inline editing state for question complaints
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editOptions, setEditOptions] = useState<{ id: string; text: string; isCorrect: boolean }[]>([]);
  const [editCorrectAnswer, setEditCorrectAnswer] = useState<string>("");
  const [editQuestionText, setEditQuestionText] = useState("");
  const [editExplanation, setEditExplanation] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/support", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        if (data.counts) setCounts(data.counts);
      }
    } catch (err) {
      console.error("Failed to load support items:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleStartEdit = (item: SupportItem) => {
    setEditingItemId(item.id);
    setEditQuestionText(item.questionText || "");
    setEditExplanation(item.explanation || "");
    const rawOpts = item.options && item.options.length > 0
      ? item.options.map((o) => ({ ...o }))
      : [
          { id: "A", text: "", isCorrect: item.correctAnswer === "A" },
          { id: "B", text: "", isCorrect: item.correctAnswer === "B" },
          { id: "C", text: "", isCorrect: item.correctAnswer === "C" },
          { id: "D", text: "", isCorrect: item.correctAnswer === "D" },
        ];
    setEditOptions(rawOpts);
    setEditCorrectAnswer(item.correctAnswer || "A");
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
  };

  const handleSetCorrectOption = (optId: string) => {
    setEditCorrectAnswer(optId);
    setEditOptions((prev) =>
      prev.map((opt) => ({ ...opt, isCorrect: opt.id === optId }))
    );
  };

  const handleSaveAndResolve = async (item: SupportItem, resolveAfterSave = true) => {
    setActionLoadingId(item.id);
    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          source: item.source,
          questionId: item.questionId,
          questionCode: item.questionCode,
          action: resolveAfterSave ? "resolve" : "update",
          options: editOptions,
          correctAnswer: editCorrectAnswer,
          questionText: editQuestionText,
          explanation: editExplanation,
        }),
      });

      if (res.ok) {
        setEditingItemId(null);
        // Optimistic update
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id
              ? {
                  ...i,
                  status: resolveAfterSave ? "resolved" : i.status,
                  questionText: editQuestionText,
                  options: editOptions,
                  correctAnswer: editCorrectAnswer,
                  explanation: editExplanation,
                }
              : i
          )
        );
        await fetchItems();
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to save question edits");
      }
    } catch (err) {
      console.error("Failed to save and resolve question:", err);
      alert("Network error: Could not reach support API.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleStatus = async (item: SupportItem) => {
    const nextAction = item.status === "open" ? "resolve" : "reopen";
    setActionLoadingId(item.id);

    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id
          ? { ...i, status: nextAction === "resolve" ? "resolved" : "open" }
          : i
      )
    );

    try {
      const res = await fetch("/api/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: item.id,
          source: item.source,
          questionId: item.questionId,
          questionCode: item.questionCode,
          action: nextAction,
        }),
      });
      if (res.ok) {
        await fetchItems();
      } else {
        // Revert on error
        await fetchItems();
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to update status");
      }
    } catch (err) {
      console.error("Failed to toggle status:", err);
      await fetchItems();
      alert("Network error: Could not update status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter items
  const filteredItems = items.filter((item) => {
    if (activeTab === "resolved") {
      if (item.status !== "resolved") return false;
    } else if (activeTab === "question_complaint") {
      if (item.type !== "question_complaint" || item.status === "resolved") return false;
    } else if (activeTab === "topic_request") {
      if (item.type !== "topic_request" || item.status === "resolved") return false;
    } else if (activeTab === "general_support") {
      if (item.type !== "general_support" || item.status === "resolved") return false;
    } else {
      // "all" - show all open items by default, or all items
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = (
        (item.title || "") +
        " " +
        (item.description || "") +
        " " +
        (item.questionText || "") +
        " " +
        (item.topic || "") +
        " " +
        (item.submitterName || "")
      ).toLowerCase();
      if (!matchText.includes(q)) return false;
    }

    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Top Banner & Header */}
      <div className="border-b border-slate-800/80 bg-slate-900/40 py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 via-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/20">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Support & Feedback Hub
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-400 mt-0.5">
                  Dedicated desk for managing student question complaints, topic requests, and user tickets.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchItems}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
              Refresh
            </button>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition-all shadow-xs"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Review Studio
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8">
        {/* KPI Counter Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mb-8">
          {/* Question Complaints */}
          <div
            onClick={() => setActiveTab("question_complaint")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              activeTab === "question_complaint"
                ? "border-rose-500 bg-rose-500/15 shadow-lg shadow-rose-500/10"
                : "border-slate-800/80 bg-slate-900/50 hover:border-rose-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                Question Issues
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold">
                🔴
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
              {counts.questionComplaints}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Flagged in live quizzes
            </p>
          </div>

          {/* Topic Wishlist */}
          <div
            onClick={() => setActiveTab("topic_request")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              activeTab === "topic_request"
                ? "border-purple-500 bg-purple-500/15 shadow-lg shadow-purple-500/10"
                : "border-slate-800/80 bg-slate-900/50 hover:border-purple-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                Topic Requests
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold">
                🟣
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
              {counts.topicRequests}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Curriculum additions
            </p>
          </div>

          {/* General Inquiries */}
          <div
            onClick={() => setActiveTab("general_support")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              activeTab === "general_support"
                ? "border-blue-500 bg-blue-500/15 shadow-lg shadow-blue-500/10"
                : "border-slate-800/80 bg-slate-900/50 hover:border-blue-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                General Support
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold">
                🔵
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
              {counts.generalSupport}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Parent & student help
            </p>
          </div>

          {/* Resolved */}
          <div
            onClick={() => setActiveTab("resolved")}
            className={`cursor-pointer rounded-2xl border p-4 transition-all ${
              activeTab === "resolved"
                ? "border-emerald-500 bg-emerald-500/15 shadow-lg shadow-emerald-500/10"
                : "border-slate-800/80 bg-slate-900/50 hover:border-emerald-500/50 hover:bg-slate-900"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                Resolved / Closed
              </span>
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                🟢
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-white">
              {counts.resolved}
            </div>
            <p className="text-[11px] font-medium text-slate-400 mt-0.5">
              Fixed & verified
            </p>
          </div>
        </div>

        {/* Filter Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-1.5 rounded-2xl border border-slate-800 bg-slate-900/60 p-1 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab("all")}
              className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "all"
                  ? "bg-slate-800 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All Open ({counts.open})
            </button>
            <button
              onClick={() => setActiveTab("question_complaint")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "question_complaint"
                  ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                  : "text-slate-400 hover:text-rose-300"
              }`}
            >
              <span>🔴 Question Bugs</span>
              <span className="text-[10px] opacity-80">({counts.questionComplaints})</span>
            </button>
            <button
              onClick={() => setActiveTab("topic_request")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "topic_request"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                  : "text-slate-400 hover:text-purple-300"
              }`}
            >
              <span>🟣 Topic Wishlist</span>
              <span className="text-[10px] opacity-80">({counts.topicRequests})</span>
            </button>
            <button
              onClick={() => setActiveTab("general_support")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "general_support"
                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  : "text-slate-400 hover:text-blue-300"
              }`}
            >
              <span>🔵 Support</span>
              <span className="text-[10px] opacity-80">({counts.generalSupport})</span>
            </button>
            <button
              onClick={() => setActiveTab("resolved")}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                activeTab === "resolved"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "text-slate-400 hover:text-emerald-300"
              }`}
            >
              <span>🟢 Resolved</span>
              <span className="text-[10px] opacity-80">({counts.resolved})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900/80 pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Item List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="h-8 w-8 animate-spin text-emerald-400 mb-3" />
            <p className="text-sm font-semibold">Loading support items...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 rounded-3xl border border-dashed border-slate-800 bg-slate-900/30 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 mb-3">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-white">All Clear! No Open Feedback</h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              There are no pending question complaints or support tickets in this category.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isQuestion = item.type === "question_complaint";
              const isTopic = item.type === "topic_request";
              const isOpen = item.status === "open";
              const isEditing = editingItemId === item.id;

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border bg-slate-900/70 p-5 transition-all shadow-md ${
                    isQuestion
                      ? "border-l-4 border-l-rose-500 border-slate-800/80 hover:border-slate-700"
                      : isTopic
                      ? "border-l-4 border-l-purple-500 border-slate-800/80 hover:border-slate-700"
                      : "border-l-4 border-l-blue-500 border-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  {/* Card Top Row */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      {isQuestion ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[11px] font-black text-rose-300">
                          🔴 Question Bug
                        </span>
                      ) : isTopic ? (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-purple-500/15 border border-purple-500/30 px-2.5 py-0.5 text-[11px] font-black text-purple-300">
                          🟣 Topic Request
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/15 border border-blue-500/30 px-2.5 py-0.5 text-[11px] font-black text-blue-300">
                          🔵 General Support
                        </span>
                      )}

                      {item.questionId && (
                        <span className="rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-bold text-slate-300">
                          #zb-{item.questionId}
                        </span>
                      )}
                      {item.gradeLevel && (
                        <span className="rounded-lg bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                          {item.gradeLevel}
                        </span>
                      )}
                      {item.subject && (
                        <span className="rounded-lg bg-slate-800/80 px-2 py-0.5 text-[11px] font-semibold text-slate-400">
                          {item.subject}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${
                          isOpen
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        }`}
                      >
                        {isOpen ? "Action Needed" : "Resolved"}
                      </span>
                    </div>
                  </div>

                  {/* Complaint Reason Banner (for question bugs) */}
                  {isQuestion && item.description && (
                    <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-rose-300">Student Complaint: </span>
                          <span className="font-medium text-rose-100">{item.description}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Topic Request Content */}
                  {isTopic && (
                    <div className="mb-4 rounded-xl border border-purple-500/30 bg-purple-500/10 p-3 text-xs text-purple-200">
                      <div className="flex items-start gap-2">
                        <Sparkles className="h-4 w-4 text-purple-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-purple-300">Requested Curriculum: </span>
                          <span className="font-medium text-purple-100">{item.description || item.title}</span>
                          {item.submitterName && (
                            <span className="block text-[11px] text-purple-300/70 mt-1">
                              Requested by: {item.submitterName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* General Support Content */}
                  {!isQuestion && !isTopic && (
                    <div className="mb-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-xs text-blue-200">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-blue-300">Inquiry: </span>
                          <span className="font-medium text-blue-100">{item.description || item.title}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Question Stem & MCQ Options (When it's a question) */}
                  {isQuestion && item.questionText && (
                    <div className="mb-4">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Question Stem:
                            </label>
                            <textarea
                              value={editQuestionText}
                              onChange={(e) => setEditQuestionText(e.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Edit Options & Select Correct Answer:
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {editOptions.map((opt) => {
                                const isCorrect = editCorrectAnswer === opt.id || editCorrectAnswer === opt.text;
                                return (
                                  <div
                                    key={opt.id}
                                    className={`flex items-center gap-2 rounded-xl border p-2 transition-all ${
                                      isCorrect
                                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                                        : "border-slate-800 bg-slate-950 text-slate-300"
                                    }`}
                                  >
                                    <span className="font-mono text-xs font-black text-slate-400 w-4">
                                      {opt.id}
                                    </span>
                                    <input
                                      type="text"
                                      value={opt.text}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setEditOptions((prev) =>
                                          prev.map((o) => (o.id === opt.id ? { ...o, text: val } : o))
                                        );
                                      }}
                                      className="flex-1 bg-transparent text-xs text-white focus:outline-hidden"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleSetCorrectOption(opt.id)}
                                      className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                                        isCorrect
                                          ? "bg-emerald-500 text-slate-950"
                                          : "bg-slate-800 text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                                      }`}
                                    >
                                      {isCorrect ? "✓ Correct" : "Mark Correct"}
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-400 mb-1">
                              Explanation:
                            </label>
                            <textarea
                              value={editExplanation}
                              onChange={(e) => setEditExplanation(e.target.value)}
                              rows={2}
                              className="w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-xs text-white focus:border-emerald-500 focus:outline-hidden"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-sm font-bold text-white mb-2.5">
                            {item.questionText}
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {item.options?.map((opt) => {
                              const isCorrect =
                                opt.isCorrect ||
                                opt.id === item.correctAnswer ||
                                opt.text === item.correctAnswer;
                              return (
                                <div
                                  key={opt.id}
                                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                                    isCorrect
                                      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 font-bold"
                                      : "border-slate-800/80 bg-slate-950/60 text-slate-300"
                                  }`}
                                >
                                  <span className="font-mono text-[11px] text-slate-500 w-4">
                                    {opt.id}
                                  </span>
                                  <span className="flex-1">{opt.text}</span>
                                  {isCorrect && (
                                    <span className="text-[10px] text-emerald-400 font-extrabold uppercase">
                                      Answer Key
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                    <div className="flex items-center gap-2">
                      {/* For Questions: Inline Edit Button */}
                      {isQuestion && !isEditing && (
                        <button
                          onClick={() => handleStartEdit(item)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-800/70 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit Question & Options
                        </button>
                      )}

                      {isQuestion && isEditing && (
                        <>
                          <button
                            onClick={() => handleSaveAndResolve(item, true)}
                            disabled={actionLoadingId === item.id}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-emerald-500 transition-all shadow-xs"
                          >
                            <Save className="h-3 w-3" />
                            Save & Mark Resolved
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition-all"
                          >
                            <X className="h-3 w-3" />
                            Cancel
                          </button>
                        </>
                      )}

                      {/* For Topic Requests: 1-Click Launch Generator */}
                      {isTopic && (
                        <Link
                          href={`/?topic=${encodeURIComponent(item.topic || item.description || "")}&subject=${encodeURIComponent(item.subject || "")}&grade=${encodeURIComponent(item.gradeLevel || "")}`}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-3.5 py-1.5 text-xs font-black text-white hover:bg-purple-500 transition-all shadow-xs"
                        >
                          <Zap className="h-3 w-3 fill-white" />
                          Launch in Generator
                        </Link>
                      )}
                    </div>

                    {/* Status Toggle Button (Resolve / Reopen) */}
                    {!isEditing && (
                      <button
                        onClick={() => handleToggleStatus(item)}
                        disabled={actionLoadingId === item.id}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                          isOpen
                            ? "bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25"
                            : "bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25"
                        }`}
                      >
                        {isOpen ? (
                          <>
                            <Check className="h-3 w-3" />
                            Mark Resolved
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3" />
                            Reopen
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
