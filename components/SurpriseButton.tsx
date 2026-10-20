"use client";
import { useRouter } from "next/navigation";

export function SurpriseButton({ hrefs, label = "Surprise me" }: { hrefs: string[]; label?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(hrefs[Math.floor(Math.random() * hrefs.length)])}
      className="rounded-full bg-gradient-to-r from-pink to-amber px-5 py-2.5 font-display text-sm tracking-wide text-black shadow-lg shadow-pink/20 transition hover:scale-105 active:scale-95"
    >
      🎲 {label}
    </button>
  );
}
