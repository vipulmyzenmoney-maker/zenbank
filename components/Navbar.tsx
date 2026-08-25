"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, CheckCircle, Database } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Generator", icon: Zap },
    { href: "/review", label: "Review Studio", icon: CheckCircle },
    { href: "/bank", label: "Question Bank", icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-extrabold text-sm shadow-md">
            Z
          </div>
          <span className="font-display text-lg font-extrabold text-slate-900 tracking-tight">
            ZenBank
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
