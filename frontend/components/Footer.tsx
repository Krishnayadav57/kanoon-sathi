"use client";

import Link from "next/link";
import { useLang } from "@/lib/lang-context";

export default function Footer() {
  const { lang, t } = useLang();

  return (
    <footer className="border-t border-slate-100 bg-paper">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-crimson-50 px-5 py-4 text-sm text-crimson-700">
          <strong className="font-semibold">{lang === "ne" ? "महत्त्वपूर्ण: " : "Important: "}</strong>
          {t("disclaimer_short")}{" "}
          {lang === "ne"
            ? "कानून मित्र इजलासी वकिल वा अदालत होइन।"
            : "Kanoon Mitra is not a law firm or a court of law."}
        </div>

        <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-ink">
              {lang === "ne" ? "कानून मित्र" : "Kanoon Mitra"}
            </p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">{t("tagline")}</p>
          </div>

          <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
            <Link href="/knowledge-base" className="hover:text-crimson-500">{t("nav_knowledge")}</Link>
            <Link href="/offices" className="hover:text-crimson-500">{t("nav_offices")}</Link>
            <Link href="/lawyers" className="hover:text-crimson-500">{t("nav_lawyers")}</Link>
            <Link href="/learning" className="hover:text-crimson-500">{t("nav_learning")}</Link>
            <Link href="/pricing" className="hover:text-crimson-500">{t("nav_pricing")}</Link>
          </div>
        </div>

        <p className="mt-8 text-xs text-slate-400">
          © {new Date().getFullYear()} Kanoon Mitra. {lang === "ne" ? "सबै अधिकार सुरक्षित।" : "All rights reserved."}
        </p>
      </div>
    </footer>
  );
}
