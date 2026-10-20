import "./globals.css";
import Link from "next/link";

export const metadata = { title: "Fantasy League", description: "Stats and curiosities from our league." };

const NAV = [
  { href: "/", label: "Standings" },
  { href: "/weeks", label: "Weeks" },
  { href: "/reports", label: "Reports" },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-100">
        <header className="border-b border-neutral-800">
          <nav className="mx-auto flex max-w-3xl items-center gap-6 px-6 py-3 text-sm">
            <span className="font-semibold">🏈 Fantasy League</span>
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="text-neutral-400 hover:text-white">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto max-w-3xl p-6">{children}</div>
      </body>
    </html>
  );
}
