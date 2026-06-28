"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Scale } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/chat", label: t("nav_chat") },
    { href: "/knowledge-base", label: t("nav_knowledge") },
    { href: "/situation-analyzer", label: t("nav_analyzer") },
    { href: "/complaints", label: t("nav_complaints") },
    { href: "/pricing", label: t("nav_pricing") },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-crimson-500 text-paper">
            <Scale size={18} strokeWidth={2} />
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            {lang === "ne" ? "कानून मित्र" : "Kanoon Mitra"}
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors hover:text-crimson-500 ${
                pathname === link.href ? "text-crimson-500" : "text-slate-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            onClick={() => setLang(lang === "ne" ? "en" : "ne")}
            className="rounded-full border border-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:border-crimson-400 hover:text-crimson-500"
            aria-label="Toggle language"
          >
            {lang === "ne" ? "EN" : "नेपाली"}
          </button>
          {user ? (
            <>
              <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-crimson-500">
                {t("nav_dashboard")}
              </Link>
              {user.role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-crimson-500">
                  {t("nav_admin")}
                </Link>
              )}
              <button
                onClick={logout}
                className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
              >
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-crimson-500">
                {t("nav_login")}
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-crimson-500 px-4 py-2 text-sm font-medium text-paper transition-opacity hover:opacity-90"
              >
                {t("nav_register")}
              </Link>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-paper px-4 py-4 lg:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="text-sm font-medium text-slate-700" onClick={() => setOpen(false)}>
                {link.label}
              </Link>
            ))}
            <button
              onClick={() => setLang(lang === "ne" ? "en" : "ne")}
              className="self-start rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
            >
              {lang === "ne" ? "Switch to English" : "नेपालीमा बदलनुहोस्"}
            </button>
            <div className="mt-2 flex gap-3 border-t border-slate-100 pt-3">
              {user ? (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-slate-700">{t("nav_dashboard")}</Link>
                  <button onClick={logout} className="text-sm font-medium text-crimson-500">{t("nav_logout")}</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="text-sm font-medium text-slate-700">{t("nav_login")}</Link>
                  <Link href="/register" className="text-sm font-medium text-crimson-500">{t("nav_register")}</Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
