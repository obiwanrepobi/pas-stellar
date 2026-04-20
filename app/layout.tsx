import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Image from "next/image";
import Link from "next/link";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "Stellar V.2 — Pocono Action Sports",
  description: "Fleet & Rental Management System",
};

const navItems = [
  { label: "Fleet Management", href: "/fleet", icon: "⚓", active: true },
  { label: "Reservations", href: "#", icon: "📅", active: false },
  { label: "CRM", href: "#", icon: "👥", active: false },
  { label: "Policies", href: "#", icon: "📋", active: false },
  { label: "Employees", href: "#", icon: "👷", active: false },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="h-full flex overflow-hidden bg-[#f0f7fb]">
        {/* Sidebar */}
        <aside className="w-56 flex-shrink-0 bg-[#081731] flex flex-col h-full">
          <div className="p-4 border-b border-[#1a3358] flex flex-col items-center gap-2">
            <Image
              src="/pas-logo.avif"
              alt="Pocono Action Sports"
              width={110}
              height={90}
              className="object-contain"
              unoptimized
            />
            <span className="text-[#5C9A9E] text-[10px] tracking-[0.2em] uppercase font-semibold">
              Stellar V.2
            </span>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                  item.active
                    ? "bg-[#5C9A9E] text-white font-medium shadow-sm"
                    : "text-[#7a9ab5] hover:bg-[#1a3358] hover:text-white"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-[#1a3358]">
            <p className="text-[#7a9ab5] text-xs">Apr 20, 2026 · Lake Wallenpaupack</p>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto">{children}</main>
      </body>
    </html>
  );
}
