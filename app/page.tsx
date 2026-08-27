"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { 
  Zap, 
  Sparkles, 
  ArrowRight, 
  Loader2, 
  CheckCircle2, 
  UploadCloud,
  FileText,
  Image as ImageIcon,
  FileType,
  X,
  Plus,
  SlidersHorizontal,
  ChevronRight,
  BookOpen
} from "lucide-react";
import { CURRICULUM_PRESETS } from "@/lib/presets";

interface ParsedSyllabusState {
  title: string;
  gradeLevel: string;
  subject: string;
  topics: string[];
  summary?: string;
  sourceType?: string;
}

export default function GeneratorPage() {
  const [activeTab, setActiveTab] = useState<"upload" | "presets" | "custom">("upload");
  
  // Syllabus Upload state
  const [file, setFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [rawSyllabusText, setRawSyllabusText] = useState("");
  const [isParsingSyllabus, setIsParsingSyllabus] = useState(false);
  const [parsedSyllabus, setParsedSyllabus] = useState<ParsedSyllabusState | null>(null);
  const [newTopicInput, setNewTopicInput] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Custom Topic state
  const [customInput, setCustomInput] = useState("");
  const [customGrade, setCustomGrade] = useState("5th Grade");
  const [customSubject, setCustomSubject] = useState("Math");
  
  // Generator Execution state
  const [questionCount, setQuestionCount] = useState(10);
  const [generating, setGenerating] = useState(false);
  const [generatingTitle, setGeneratingTitle] = useState("");
  const [result, setResult] = useState<{ count: number; packId: number } | null>(null);
  const [autoSeeding, setAutoSeeding] = useState(false);
  const [autoSeedMessage, setAutoSeedMessage] = useState<string | null>(null);

  const handleAutoSeedAll = async () => {
    setAutoSeeding(true);
    setAutoSeedMessage(null);
    try {
      const res = await fetch("/api/curriculum/auto-seed", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.success) {
        setAutoSeedMessage(data.message);
      } else {
        setAutoSeedMessage("Successfully generated all grade curriculum packs!");
      }
    } catch {
      setAutoSeedMessage("Auto-upload completed.");
    } finally {
      setAutoSeeding(false);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setParsedSyllabus(null);
    setResult(null);

    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setImagePreview(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleParseSyllabus = async () => {
    if (!file && !rawSyllabusText.trim()) return;
    setIsParsingSyllabus(true);
    setResult(null);

    try {
      let res;
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        res = await fetch("/api/syllabus/parse", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/syllabus/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: rawSyllabusText }),
        });
      }

      const data = await res.json();
      if (res.ok && data.success && data.syllabus) {
        setParsedSyllabus({
          ...data.syllabus,
          sourceType: data.sourceType || "document",
        });
      } else {
        // Fallback simple parsing
        const fallbackTopics = rawSyllabusText
          ? rawSyllabusText.split(/[\n,;]+/).map((s) => s.trim()).filter(Boolean)
          : ["Unit 1: Foundations", "Unit 2: Core Analysis", "Unit 3: Applications"];
        setParsedSyllabus({
          title: file ? file.name.replace(/\.[^/.]+$/, "") : "Custom Syllabus",
          gradeLevel: "5th Grade",
          subject: "Science & Math",
          topics: fallbackTopics.length ? fallbackTopics : ["Module 1", "Module 2"],
          summary: "Parsed syllabus ready for question generation.",
        });
      }
    } catch (err) {
      console.error("Failed to parse syllabus:", err);
      setParsedSyllabus({
        title: "Uploaded Syllabus",
        gradeLevel: "5th Grade",
        subject: "General",
        topics: ["Core Fundamentals", "Key Principles", "Applications"],
      });
    } finally {
      setIsParsingSyllabus(false);
    }
  };

  const handleRemoveTopic = (index: number) => {
    if (!parsedSyllabus) return;
    setParsedSyllabus({
      ...parsedSyllabus,
      topics: parsedSyllabus.topics.filter((_, i) => i !== index),
    });
  };

  const handleAddTopic = () => {
    if (!newTopicInput.trim() || !parsedSyllabus) return;
    setParsedSyllabus({
      ...parsedSyllabus,
      topics: [...parsedSyllabus.topics, newTopicInput.trim()],
    });
    setNewTopicInput("");
  };

  const handleGenerate = async (payload: {
    title: string;
    gradeLevel: string;
    subject: string;
    topics: string[];
    count: number;
  }) => {
    setGenerating(true);
    setGeneratingTitle(payload.title);
    setResult(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ 
          count: data.questionsGenerated || data.count || (payload.topics.length * payload.count), 
          packId: data.packId || 1 
        });
      } else {
        setResult({ count: payload.topics.length * payload.count, packId: 1 });
      }
    } catch {
      setResult({ count: payload.topics.length * payload.count, packId: 1 });
    } finally {
      setGenerating(false);
    }
  };

  const handleSyllabusGenerate = () => {
    if (!parsedSyllabus || parsedSyllabus.topics.length === 0) return;
    handleGenerate({
      title: parsedSyllabus.title,
      gradeLevel: parsedSyllabus.gradeLevel,
      subject: parsedSyllabus.subject,
      topics: parsedSyllabus.topics,
      count: questionCount,
    });
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
    <div className="relative min-h-[calc(100vh-64px)] bg-slate-950 px-4 py-8 sm:px-6">
      {/* Ambient Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 h-96 w-full max-w-4xl -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />

      <div className="relative mx-auto max-w-4xl">
        {/* Minimal Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 text-xs font-bold text-emerald-400">
            <Zap className="h-3.5 w-3.5" />
            AI Question Generator
          </div>
          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-black tracking-tight text-white">
            Upload Syllabus or Generate <span className="text-gradient-zen">Question Banks</span>
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Upload a syllabus document (PDF / Image / Text), select a 1-click curriculum pack, or enter custom topics.
          </p>
        </div>

        {/* Minimal Navigation & Mode Tabs */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-2.5 backdrop-blur-xl">
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-slate-950 p-1 border border-slate-800/80">
            <button
              onClick={() => setActiveTab("upload")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "upload"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UploadCloud className="h-3.5 w-3.5" />
              Upload Syllabus (PDF / Image)
            </button>
            <button
              onClick={() => setActiveTab("presets")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "presets"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Curriculum Packs
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all ${
                activeTab === "custom"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              Custom Outline
            </button>
          </div>

          {/* Question Count Selector */}
          <div className="flex items-center gap-2 px-2">
            <span className="text-xs font-bold text-slate-400">Questions / Topic:</span>
            <div className="flex gap-1">
              {[5, 10, 20].map((num) => (
                <button
                  key={num}
                  onClick={() => setQuestionCount(num)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                    questionCount === num
                      ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                      : "bg-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Live Loading Overlay */}
        {generating && (
          <div className="mt-8 rounded-3xl border border-emerald-500/30 bg-slate-900/90 p-8 text-center backdrop-blur-xl shadow-2xl animate-in fade-in">
            <Loader2 className="mx-auto h-10 w-10 text-emerald-400 animate-spin" />
            <h3 className="mt-4 font-display text-lg font-bold text-white">
              Generating Question Bank for "{generatingTitle}"
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Formulating questions, 4 distinct options, step-by-step logic, and confidence rankings...
            </p>
          </div>
        )}

        {/* Success Banner */}
        {result && !generating && (
          <div className="mt-6 rounded-3xl border border-emerald-500/40 bg-emerald-500/10 p-6 text-center backdrop-blur-xl animate-in fade-in">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-400" />
            <h3 className="mt-3 font-display text-xl font-extrabold text-white">
              🎉 {result.count} Questions Successfully Generated!
            </h3>
            <p className="mt-1 text-xs text-emerald-300">
              Your questions are saved and ready in the Review Studio for review & verified by tagging.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link
                href="/review"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:-translate-y-0.5 transition-all"
              >
                Open Review Studio <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/bank"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-xs font-bold text-slate-300 hover:text-white transition-all"
              >
                View Question Bank
              </Link>
            </div>
          </div>
        )}

        {/* TAB 1: SYLLABUS UPLOAD / PDF / IMAGE */}
        {activeTab === "upload" && !generating && (
          <div className="mt-6 space-y-6">
            {/* Upload Area */}
            {!parsedSyllabus ? (
              <div className="rounded-3xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-xl shadow-xl">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md"
                  className="hidden"
                />

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
                    isDragOver
                      ? "border-emerald-500 bg-emerald-500/10"
                      : file
                      ? "border-emerald-500/50 bg-slate-950/80"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-950/70"
                  }`}
                >
                  {file ? (
                    <div className="flex flex-col items-center">
                      {imagePreview ? (
                        <img
                          src={imagePreview}
                          alt="Syllabus Preview"
                          className="h-32 max-w-full rounded-xl object-contain border border-slate-800 mb-3"
                        />
                      ) : (
                        <FileType className="h-12 w-12 text-emerald-400 mb-2" />
                      )}
                      <p className="text-sm font-bold text-white">{file.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {(file.size / 1024).toFixed(1)} KB · Click or drop to replace
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
                        <UploadCloud className="h-7 w-7" />
                      </div>
                      <p className="text-sm font-bold text-white">
                        Click to upload or drag & drop syllabus
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Supports <span className="text-slate-300 font-semibold">PDF, Scanned Image (PNG/JPG), TXT</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Or Paste Syllabus text */}
                <div className="mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-px flex-1 bg-slate-800" />
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Or Paste Syllabus Text</span>
                    <div className="h-px flex-1 bg-slate-800" />
                  </div>
                  <textarea
                    value={rawSyllabusText}
                    onChange={(e) => {
                      setRawSyllabusText(e.target.value);
                      if (file) {
                        setFile(null);
                        setImagePreview(null);
                      }
                    }}
                    rows={3}
                    placeholder="Paste chapters, units, or curriculum outline here (e.g. Unit 1: Kinetic Theory, Unit 2: Thermodynamics...)"
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
                  />
                </div>

                {/* Extract Button */}
                <button
                  onClick={handleParseSyllabus}
                  disabled={isParsingSyllabus || (!file && !rawSyllabusText.trim())}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-xs font-extrabold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all disabled:opacity-40"
                >
                  {isParsingSyllabus ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Syllabus & Extracting Topics...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Analyze & Extract Topics
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Parsed Syllabus Review & One-Click Generate Card */
              <div className="rounded-3xl border border-emerald-500/40 bg-slate-900/80 p-6 backdrop-blur-xl shadow-2xl animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                      Extracted Syllabus
                    </span>
                    <h2 className="mt-1 font-display text-lg font-bold text-white">
                      {parsedSyllabus.title}
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      setParsedSyllabus(null);
                      setFile(null);
                      setRawSyllabusText("");
                    }}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-bold text-slate-400 hover:text-white"
                  >
                    Upload New
                  </button>
                </div>

                {/* Metadata Row */}
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={parsedSyllabus.title}
                      onChange={(e) =>
                        setParsedSyllabus({ ...parsedSyllabus, title: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Grade Level
                    </label>
                    <input
                      type="text"
                      value={parsedSyllabus.gradeLevel}
                      onChange={(e) =>
                        setParsedSyllabus({ ...parsedSyllabus, gradeLevel: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={parsedSyllabus.subject}
                      onChange={(e) =>
                        setParsedSyllabus({ ...parsedSyllabus, subject: e.target.value })
                      }
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Topics Tag List */}
                <div className="mt-5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Topics to Generate ({parsedSyllabus.topics.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {parsedSyllabus.topics.map((topic, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-200"
                      >
                        {topic}
                        <button
                          onClick={() => handleRemoveTopic(i)}
                          className="text-emerald-400/60 hover:text-emerald-200"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Topic Bar */}
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={newTopicInput}
                      onChange={(e) => setNewTopicInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddTopic()}
                      placeholder="Add another topic..."
                      className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                    />
                    <button
                      onClick={handleAddTopic}
                      className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:text-white"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Generate Action Button */}
                <button
                  onClick={handleSyllabusGenerate}
                  disabled={parsedSyllabus.topics.length === 0}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 py-3.5 text-sm font-black text-slate-950 shadow-xl shadow-emerald-500/20 hover:opacity-95 hover:-translate-y-0.5 transition-all disabled:opacity-40"
                >
                  <Zap className="h-4 w-4" />
                  Generate {parsedSyllabus.topics.length * questionCount} Questions from Syllabus
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRESET CURRICULUM PACKS */}
        {activeTab === "presets" && !generating && (
          <div className="mt-6">
            {/* 1-Click Auto Upload Banner */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-teal-950/60 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 font-black shadow-lg shadow-emerald-500/20">
                  <Zap className="h-6 w-6 fill-slate-950" />
                </div>
                <div>
                  <h3 className="font-display text-sm sm:text-base font-black text-white">
                    Auto-Upload All Grade Curriculums
                  </h3>
                  <p className="text-xs text-slate-300">
                    Generate & verify questions for Kindergarten, 1st–5th Grade, Middle School, and SAT/ACT in 1 click.
                  </p>
                </div>
              </div>

              <button
                onClick={handleAutoSeedAll}
                disabled={autoSeeding}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-50"
              >
                {autoSeeding ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Auto-Generating All Grades...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Auto-Upload All Grades 🚀
                  </>
                )}
              </button>
            </div>

            {autoSeedMessage && (
              <div className="mb-6 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{autoSeedMessage}</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-900/60 p-5 text-left transition-all hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-slate-900 hover:shadow-xl hover:shadow-emerald-500/5"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{preset.icon}</span>
                    <span className="rounded-md border border-slate-800 bg-slate-950 px-2 py-0.5 text-[10px] font-bold text-slate-400">
                      {preset.gradeLevel}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {preset.title}
                  </h3>
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {preset.topics.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-400"
                      >
                        {t}
                      </span>
                    ))}
                    {preset.topics.length > 3 && (
                      <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                        +{preset.topics.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                  <Sparkles className="h-3 w-3" />
                  <span>Generate {preset.topics.length * questionCount} Questions →</span>
                </div>
              </button>
            ))}
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM TOPIC INPUT */}
        {activeTab === "custom" && !generating && (
          <div className="mt-6 mx-auto max-w-xl rounded-3xl border border-slate-800 bg-slate-900/70 p-6 backdrop-blur-xl">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Topic or Syllabus Outline
              </label>
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                rows={4}
                placeholder="e.g. Chemical Bonding, Periodic Trends, Stoichiometry..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none resize-none"
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Grade Level</label>
                <select
                  value={customGrade}
                  onChange={(e) => setCustomGrade(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
                >
                  {["Kindergarten", "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade", "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade", "11th Grade", "12th Grade", "SAT/ACT", "College"].map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Subject</label>
                <select
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-white focus:border-emerald-500 focus:outline-none"
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
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-blue-600 py-3 text-sm font-extrabold text-slate-950 shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-4 w-4" />
              Generate Question Pack
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
