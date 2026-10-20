"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/live", label: "Live", icon: "📡" },
  { href: "/weeks", label: "Weeks", icon: "📅" },
  { href: "/reports", label: "Reports", icon: "🔎" },
  { href: "/compare", label: "Compare", icon: "⚔️" },
];

export function Nav() {
  const path = usePathname();
  const active = (href: string) => (href === "/" ? path === "/" || path.startsWith("/teams") : path.startsWith(href));
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-ink/85 backdrop-blur">
      <nav className="mx-auto flex max-w-4xl items-center gap-1 overflow-x-auto px-4 py-2.5 no-scrollbar">
        <Link href="/" className="mr-3 shrink-0 font-display text-base tracking-wide">
          🏈 <span className="bg-gradient-to-r from-lime to-cyan bg-clip-text text-transparent">THE LEAGUE</span>
        </Link>
        {NAV.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition ${
              active(n.href) ? "bg-white/15 text-white" : "text-slate-400 hover:bg-white/10 hover:text-white"
            }`}
          >
            <span className="mr-1">{n.icon}</span>
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
