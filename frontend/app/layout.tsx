import type { Metadata } from "next";
import { Lexend, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Analytics } from "@vercel/analytics/next";

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
      <body className={`${display.variable} ${inter.variable} ${jbmono.variable} font-body antialiased bg-paper text-ink`}>
        <LangProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </LangProvider>
        <Analytics />
      </body>
    </html>
  );
}
