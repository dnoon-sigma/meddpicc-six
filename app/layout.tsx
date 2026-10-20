import "./globals.css";
import { Bungee, Inter } from "next/font/google";
import { Nav } from "@/components/Nav";

const bungee = Bungee({ weight: "400", subsets: ["latin"], variable: "--font-bungee" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = { title: "MEDDPICC 6", description: "Stats, awards and curiosities from the MEDDPICC 6 fantasy league." };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${bungee.variable} ${inter.variable}`}>
      <body>
        <Nav />
        <div className="mx-auto max-w-4xl px-4 pb-16 pt-6 sm:px-6">{children}</div>
      </body>
    </html>
  );
}
