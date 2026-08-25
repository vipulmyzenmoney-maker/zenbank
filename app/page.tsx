"use client";

import { useState } from "react";
import { Zap, Sparkles, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";
import { CURRICULUM_PRESETS } from "@/lib/presets";

export default function GeneratorPage() {
  const [mode, setMode] = useState<"presets" | "custom">("presets");
  const [customInput, setCustomInput] = useState("");
  const [customGrade, setCustomGrade] = useState("5th Grade");
  const [customSubject, setCustomSubject] = useState("Math");
  const [questionCount, setQuestionCount] = useState(20);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ count: number; packId: number } | null>(null);

  const handleGenerate = async (payload: {
    title: string;
    gradeLevel: string;
    subject: string;
    topics: string[];
    count: number;
  }) => {
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ count: data.questionsGenerated, packId: data.packId });
      } else {
        alert(data.error || "Generation failed");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handlePresetClick = (preset: (typeof CURRICULUM_PRESETS)[0]) => {
    handleGenerate({
      title: preset.title,
      gradeLevel: preset.gradeLevel,
      subject: preset.subject,
      topics: preset.topics,
      count: questionCount,
    });
  };

  const handleCustomSubmit = () => {
    if (!customInput.trim()) return;
    const topics = customInput
      .split(/[\n,;]+/)
      .map((t) => t.trim())
      .filter(Boolean);
    handleGenerate({
      title: `Custom: ${topics[0] || customSubject}`,
      gradeLevel: customGrade,
      subject: customSubject,
      topics,
      count: questionCount,
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 page-enter">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-4 py-1.5 text-xs font-bold text-emerald-800">
          <Zap className="h-3.5 w-3.5" />
          AI Question Generator
        </div>
        <h1 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-slate-900">
          Generate Questions in <span className="text-gradient-zen">1 Click</span>
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-lg mx-auto">
          Pick a pre-loaded curriculum pack or enter any topic. The AI generates questions, options, explanations, and confidence scores automatically.
        </p>
      </div>

      {/* Question Count Slider */}
      <div className="mt-8 flex items-center justify-center gap-4">
        <span className="text-xs font-bold text-slate-500">Questions per topic:</span>
        <div className="flex items-center gap-2">
          {[5, 10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => setQuestionCount(n)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                questionCount === n
                  ? "bg-emerald-600 text-white shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => setMode("presets")}
          className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
            mode === "presets"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          1-Click Presets
        </button>
        <button
          onClick={() => setMode("custom")}
          className={`rounded-xl px-5 py-2 text-sm font-bold transition-all ${
            mode === "custom"
              ? "bg-slate-900 text-white shadow-md"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Custom Topic
        </button>
      </div>

      {/* Success Result Banner */}
      {result && (
        <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
          <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
          <h3 className="mt-2 font-display text-lg font-bold text-emerald-900">
            {result.count} Questions Generated!
          </h3>
          <p className="mt-1 text-xs text-emerald-700">
            Pack #{String(result.packId)} is ready in the Review Studio.
          </p>
          <a
            href="/review"
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-all"
          >
            Open Review Studio <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Generating Spinner */}
      {generating && (
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-10 w-10 text-emerald-600 animate-spin" />
          <p className="text-sm font-bold text-slate-700">
            AI is generating {questionCount} questions per topic...
          </p>
          <p className="text-xs text-slate-400">This takes 10-30 seconds depending on the topic count.</p>
        </div>
      )}

      {/* Preset Cards Grid */}
      {mode === "presets" && !generating && (
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {CURRICULUM_PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => handlePresetClick(preset)}
              className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-xs hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{preset.icon}</span>
                <div>
                  <h3 className="font-display text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    {preset.title}
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-400">
                    {preset.gradeLevel} · {preset.subject} · {preset.topics.length} topics
                  </p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {preset.topics.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500"
                  >
                    {t}
                  </span>
                ))}
                {preset.topics.length > 3 && (
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                    +{preset.topics.length - 3} more
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">
                <Sparkles className="h-3.5 w-3.5" />
                Click to Generate {questionCount * preset.topics.length} Questions
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Custom Topic Input */}
      {mode === "custom" && !generating && (
        <div className="mt-8 mx-auto max-w-2xl">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <label className="block text-xs font-bold text-slate-600 mb-1.5">
              Enter Topics (one per line, or comma-separated)
            </label>
            <textarea
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              rows={4}
              placeholder="e.g. Fractions, Decimals, Percentages&#10;or paste a syllabus outline..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:outline-none resize-none"
            />

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Grade Level</label>
                <select
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {["Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade", "SAT/ACT", "College"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject</label>
                <select
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 focus:border-emerald-500 focus:outline-none"
                >
                  {["Math", "Reading", "Science", "History", "Coding", "Chemistry", "Physics", "Biology", "English"].map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={handleCustomSubmit}
              disabled={!customInput.trim()}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              Generate {questionCount} Questions per Topic
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
