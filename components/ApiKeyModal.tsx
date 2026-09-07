"use client";

import { useState, useEffect } from "react";
import { Key, Check, X, ExternalLink, Sparkles, ShieldCheck } from "lucide-react";

export const STORAGE_KEY = "zenbank_api_key";
export const STORAGE_PROVIDER = "zenbank_ai_provider";

export function getStoredApiKey(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(STORAGE_KEY);
}

export function getStoredProvider(): string {
  if (typeof window === "undefined") return "gemini";
  return localStorage.getItem(STORAGE_PROVIDER) || "gemini";
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (key: string, provider: string) => void;
}

export default function ApiKeyModal({ isOpen, onClose, onSaved }: ApiKeyModalProps) {
  const [provider, setProvider] = useState<string>("gemini");
  const [keyInput, setKeyInput] = useState<string>("");
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = getStoredApiKey() || "";
      const storedProv = getStoredProvider();
      setKeyInput(stored);
      setProvider(storedProv);
      setSavedSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = keyInput.trim();
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
      localStorage.setItem(STORAGE_PROVIDER, provider);
      setSavedSuccess(true);
      if (onSaved) onSaved(trimmed, provider);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 700);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      if (onSaved) onSaved("", provider);
      onClose();
    }
  };

  const handleClear = () => {
    localStorage.removeItem(STORAGE_KEY);
    setKeyInput("");
    if (onSaved) onSaved("", provider);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Key className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-white">AI Engine & Vision Settings</h3>
              <p className="text-[11px] text-slate-400">Configure AI model key for syllabus vision & generation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Provider Selector */}
        <div className="mt-5">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            Recommended Vision Provider
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setProvider("gemini")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all ${
                provider === "gemini"
                  ? "border-emerald-500/60 bg-emerald-500/15 text-white shadow-xs"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-xs font-black text-emerald-400">Gemini 2.0</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Top OCR (Free)</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("openai")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all ${
                provider === "openai"
                  ? "border-emerald-500/60 bg-emerald-500/15 text-white shadow-xs"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-xs font-black text-blue-400">OpenAI</span>
              <span className="text-[10px] text-slate-400 mt-0.5">GPT-4o mini</span>
            </button>

            <button
              type="button"
              onClick={() => setProvider("groq")}
              className={`flex flex-col items-center justify-center rounded-xl p-3 border text-center transition-all ${
                provider === "groq"
                  ? "border-emerald-500/60 bg-emerald-500/15 text-white shadow-xs"
                  : "border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
              }`}
            >
              <span className="text-xs font-black text-amber-400">Groq</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Fast Text</span>
            </button>
          </div>
        </div>

        {/* API Key Input */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {provider === "gemini"
                ? "Google Gemini API Key"
                : provider === "openai"
                ? "OpenAI API Key"
                : "Groq API Key"}
            </label>
            {provider === "gemini" && (
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:underline"
              >
                Get Free Key <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {provider === "openai" && (
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:underline"
              >
                Get Key <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder={
              provider === "gemini"
                ? "AIzaSy..."
                : provider === "openai"
                ? "sk-proj-..."
                : "gsk_..."
            }
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-2.5 text-xs font-mono text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none"
          />

          <div className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Your key is saved locally in your browser and used securely to process curriculum sheets and question banks.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleClear}
            className="rounded-xl px-3 py-2 text-xs font-bold text-slate-400 hover:text-red-400 transition-colors"
          >
            Clear Key
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-2 text-xs font-bold text-slate-300 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2 text-xs font-black text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-95 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5 text-slate-950" /> Saved!
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" /> Save Key
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
