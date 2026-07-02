"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";
import { Scale, AlertTriangle } from "lucide-react";

export default function Footer() {
  const { lang, t } = useLang();

  const columns = [
    {
      title: lang === "ne" ? "सेवाहरू" : "Services",
      links: [
        { href: "/chat", label: t("nav_chat") },
        { href: "/voice", label: lang === "ne" ? "भ्वाइस सहायक" : "Voice Assistant" },
        { href: "/situation-analyzer", label: t("nav_analyzer") },
        { href: "/complaints", label: t("nav_complaints") },
        { href: "/documents", label: t("nav_documents") },
        { href: "/scam-check", label: lang === "ne" ? "ठगी जाँच" : "Scam Check" },
      ],
    },
    {
      title: lang === "ne" ? "जान्नुहोस्" : "Learn",
      links: [
        { href: "/knowledge-base", label: t("nav_knowledge") },
        { href: "/learning", label: t("nav_learning") },
        { href: "/offices", label: t("nav_offices") },
        { href: "/lawyers", label: t("nav_lawyers") },
        { href: "/compliance", label: lang === "ne" ? "व्यवसाय अनुपालन" : "Business Compliance" },
      ],
    },
    {
      title: lang === "ne" ? "खाता" : "Account",
      links: [
        { href: "/pricing", label: t("nav_pricing") },
        { href: "/dashboard", label: t("nav_dashboard") },
        { href: "/register", label: t("nav_register") },
        { href: "/login", label: t("nav_login") },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {/* Disclaimer bar */}
        <div className="mb-10 flex items-start gap-3 rounded-2xl border border-brass-100 bg-brass-50 px-5 py-4">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-brass-500" />
          <p className="lang-ne text-sm leading-relaxed text-slate-600">
            <span className="font-semibold text-ink">
              {lang === "ne" ? "महत्त्वपूर्ण: " : "Important: "}
            </span>
            {t("disclaimer_short")}{" "}
            {lang === "ne"
              ? "कानून मित्र इजलासी वकिल वा अदालत होइन।"
              : "Kanoon Mitra is not a law firm or a court of law."}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 sm:grid-cols-4">
          {/* Brand */}
          <div className="sm:col-span-1">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-paper">
                <Scale size={17} strokeWidth={2.5} />
              </span>
              <span className="font-display text-base font-semibold text-ink">
                {lang === "ne" ? "कानून मित्र" : "Kanoon Mitra"}
              </span>
            </Link>
            <p className="lang-ne mt-3 text-sm leading-relaxed text-slate-500">{t("tagline")}</p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-400">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="lang-ne text-sm text-slate-500 transition-colors duration-200 hover:text-ink"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-8 sm:flex-row">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} Kanoon Mitra.{" "}
            {lang === "ne" ? "सबै अधिकार सुरक्षित।" : "All rights reserved."}
          </p>
          <div className="flex gap-6">
            <Link href="/pricing" className="text-xs text-slate-400 hover:text-ink">
              {t("nav_pricing")}
            </Link>
            <Link href="/knowledge-base" className="text-xs text-slate-400 hover:text-ink">
              {t("nav_knowledge")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
