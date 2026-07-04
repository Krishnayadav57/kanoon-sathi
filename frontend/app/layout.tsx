import type { Metadata } from "next";
import { Lexend, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";
import { AppShell } from "@/components/BrandShell";

// PHASE 2 CHANGE: swapped the old <Navbar/> + <Footer/> pair for <AppShell>,
// which renders the new navy/gold sidebar (desktop) + bottom tab bar (mobile)
// from components/BrandShell.tsx. AuthProvider/LangProvider are untouched, so
// every existing page (chat, dashboard, admin, etc.) keeps working exactly as
// before — only the surrounding chrome changed.
//
// If you're not ready to switch every page over yet, you can instead keep the
// original layout.tsx and only wrap specific pages (e.g. app/page.tsx) in
// <AppShell> individually.

const display = Lexend({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jbmono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jbmono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Kanoon Mitra — Nepal Legal Awareness Platform",
  description:
    "Understand Nepal's laws in plain Nepali or English. Kanoon Mitra explains your legal situation, helps you draft complaints, and points you to the right office. General legal information only — not a substitute for a licensed lawyer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ne">
      <body className={`${display.variable} ${inter.variable} ${jbmono.variable} font-body antialiased bg-brand-bg text-brand-text`}>
        <LangProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}
