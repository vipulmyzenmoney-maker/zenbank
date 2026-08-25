"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, CheckCircle2, Database, Sparkles, ExternalLink } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Generator", icon: Zap },
    { href: "/review", label: "Review Studio", icon: CheckCircle2 },
    { href: "/bank", label: "Question Bank", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-blue-600 text-slate-950 font-black text-sm shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            ⚡
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base sm:text-lg font-extrabold tracking-tight text-white leading-none">
              ZenBank<span className="text-emerald-400">.</span>
            </span>
            <span className="text-[10px] font-bold text-slate-400 mt-0.5">
              AI Question Engine
            </span>
          </div>
        </Link>

        {/* Minimal Navigation */}
        <nav className="flex items-center gap-1.5 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs sm:text-sm font-bold transition-all ${
                  isActive
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* External Link to Main App */}
        <div className="hidden sm:flex items-center">
          <a
            href="https://myzenlearning.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 px-3 py-1.5 text-xs font-semibold text-slate-400 hover:border-slate-700 hover:text-white transition-all"
          >
            <span>My Zen Learning</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </header>
  );
}
