import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "Stellar V.2 — Pocono Action Sports",
  description: "Fleet & Rental Management System",
};

const nav: { label: string; href: string }[] = [];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full flex flex-col bg-[#f5f5f5]">
        {/* Top navigation bar */}
        <header className="bg-black text-white flex-shrink-0 z-40">
          <div className="flex items-center justify-between px-8 h-14">
            {/* Left: logo + brand */}
            <div className="flex items-center gap-4">
              <Image
                src="/pas-logo.avif"
                alt="Pocono Action Sports"
                width={36}
                height={30}
                className="object-contain invert"
                unoptimized
              />
              <div className="w-px h-5 bg-white/20" />
              <span className="font-bold text-sm tracking-tight">Stellar</span>
              <span className="text-white/30 text-xs font-medium">V.2</span>
            </div>

            {/* Center: nav */}
            <nav className="flex items-center gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-1.5 rounded-full text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Right: context */}
            <div className="flex items-center gap-3">
              <span className="text-white/30 text-xs">Apr 20, 2026</span>
              <div className="w-7 h-7 rounded-full bg-[#5C9A9E] flex items-center justify-center text-white text-xs font-bold">
                S
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
