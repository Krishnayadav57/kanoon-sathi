"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, Scale, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); }, [pathname]);

  const navLinks = [
    { href: "/chat", label: t("nav_chat") },
    { href: "/voice", label: lang === "ne" ? "भ्वाइस" : "Voice" },
    { href: "/knowledge-base", label: t("nav_knowledge") },
    { href: "/situation-analyzer", label: t("nav_analyzer") },
    { href: "/complaints", label: t("nav_complaints") },
    { href: "/pricing", label: t("nav_pricing") },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ease-smooth ${
        scrolled
          ? "border-b border-slate-200 bg-white/95 shadow-soft backdrop-blur-md"
          : "border-b border-slate-100 bg-paper/95 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper shadow-soft transition-all duration-300 ease-smooth group-hover:bg-crimson-600">
            <Scale size={17} strokeWidth={2.5} />
          </span>
          <span className="font-display text-[17px] font-semibold tracking-tight text-ink">
            {lang === "ne" ? "कानून मित्र" : "Kanoon Mitra"}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-smooth hover:bg-slate-50 hover:text-ink ${
                isActive(link.href)
                  ? "bg-crimson-50 text-crimson-600 font-semibold"
                  : "text-slate-500"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden items-center gap-2 lg:flex">
          <button
            onClick={() => setLang(lang === "ne" ? "en" : "ne")}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold tracking-wide text-slate-500 transition-all duration-200 hover:border-ink hover:text-ink"
            aria-label="Toggle language"
          >
            {lang === "ne" ? "EN" : "NE"}
          </button>

          {user ? (
            <>
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-ink"
                >
                  {t("nav_admin")}
                </Link>
              )}
              <Link
                href="/dashboard"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-ink"
              >
                {t("nav_dashboard")}
              </Link>
              <button
                onClick={logout}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-crimson-400 hover:text-crimson-600"
              >
                {t("nav_logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-all hover:text-ink"
              >
                {t("nav_login")}
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-ink px-5 py-2.5 text-sm font-semibold text-paper shadow-soft transition-all duration-300 ease-smooth hover:bg-crimson-600 hover:-translate-y-px hover:shadow-lifted"
              >
                {t("nav_register")}
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className={`transition-all duration-300 ${open ? "rotate-90 opacity-0 absolute" : ""}`}>
            <Menu size={18} />
          </span>
          <span className={`transition-all duration-300 ${!open ? "-rotate-90 opacity-0 absolute" : ""}`}>
            <X size={18} />
          </span>
        </button>
      </div>

      {/* Mobile drawer */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-smooth lg:hidden ${
          open ? "max-h-[600px] border-t border-slate-100" : "max-h-0"
        }`}
      >
        <div className="bg-white px-4 py-5">
          <nav className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                  isActive(link.href)
                    ? "bg-crimson-50 text-crimson-600 font-semibold"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 border-t border-slate-100 pt-4 flex flex-col gap-2">
            {user ? (
              <>
                {user.role === "admin" && (
                  <Link href="/admin" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                    {t("nav_admin")}
                  </Link>
                )}
                <Link href="/dashboard" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  {t("nav_dashboard")}
                </Link>
                <button onClick={logout} className="rounded-xl px-4 py-3 text-left text-sm font-medium text-crimson-500 hover:bg-crimson-50">
                  {t("nav_logout")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-xl px-4 py-3 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  {t("nav_login")}
                </Link>
                <Link href="/register" onClick={() => setOpen(false)} className="rounded-xl bg-ink px-4 py-3 text-center text-sm font-semibold text-paper">
                  {t("nav_register")}
                </Link>
              </>
            )}
            <button
              onClick={() => setLang(lang === "ne" ? "en" : "ne")}
              className="rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-500"
            >
              {lang === "ne" ? "Switch to English" : "नेपालीमा बदलनुहोस्"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
