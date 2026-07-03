import type { Metadata, Viewport } from "next";
import { Lexend, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/lib/auth-context";
import { LangProvider } from "@/lib/lang-context";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

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

  manifest: "/manifest.json",

  applicationName: "Kanoon Mitra",

  icons: {
    icon: [
      {
        url: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/icons/icon-192.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Kanoon Mitra",
  },
};

export const viewport: Viewport = {
  themeColor: "#0B1F4D",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ne">
      <body
        className={`${display.variable} ${inter.variable} ${jbmono.variable} font-body antialiased bg-paper text-ink`}
      >
        <LangProvider>
          <AuthProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </AuthProvider>
        </LangProvider>
      </body>
    </html>
  );
}