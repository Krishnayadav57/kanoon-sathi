"use client";

import Link from "next/link";
import {
  MessageCircle, BookOpen, FileSearch, FileText, ShieldAlert, GraduationCap,
  MapPin, Gavel, Building2, ArrowRight,
} from "lucide-react";
import { useLang } from "@/lib/lang-context";
import SealMark from "@/components/SealMark";

export default function HomePage() {
  const { lang, t } = useLang();

  const features = [
    { href: "/chat", icon: MessageCircle, titleEn: "AI Legal Chat", titleNe: "AI कानूनी कुराकानी", descEn: "Describe your situation, get a plain-language explanation grounded in Nepal law.", descNe: "आफ्नो अवस्था बताउनुहोस्, नेपाली कानूनमा आधारित सरल व्याख्या पाउनुहोस्।" },
    { href: "/knowledge-base", icon: BookOpen, titleEn: "Law Library", titleNe: "कानून पुस्तकालय", descEn: "Browse traffic, cyber, labor, family, and other laws by topic.", descNe: "सवारी, साइबर, श्रम, पारिवारिक लगायतका कानून विषयअनुसार हेर्नुहोस्।" },
    { href: "/situation-analyzer", icon: FileSearch, titleEn: "Situation Analyzer", titleNe: "अवस्था विश्लेषक", descEn: "Get your situation categorized with clear next steps.", descNe: "आफ्नो अवस्था वर्गीकृत गरी स्पष्ट अर्को कदम पाउनुहोस्।" },
    { href: "/complaints", icon: FileText, titleEn: "Complaint Generator", titleNe: "उजुरी निर्माता", descEn: "Draft police, cyber, consumer, or municipality complaints in minutes.", descNe: "मिनेटमै प्रहरी, साइबर, उपभोक्ता वा नगरपालिका उजुरी तयार गर्नुहोस्।" },
    { href: "/scam-check", icon: ShieldAlert, titleEn: "Scam Detector", titleNe: "ठगी पत्ता लगाउने", descEn: "Paste a suspicious message and check the fraud risk.", descNe: "शंकास्पद म्यासेज पेस्ट गरी ठगीको जोखिम जाँच गर्नुहोस्।" },
    { href: "/learning", icon: GraduationCap, titleEn: "Legal Learning", titleNe: "कानूनी सिकाइ", descEn: "Daily tips and quizzes to build your legal awareness.", descNe: "कानूनी ज्ञान बढाउन दैनिक सुझाव र क्विज।" },
    { href: "/offices", icon: MapPin, titleEn: "Office Locator", titleNe: "कार्यालय खोजकर्ता", descEn: "Find the nearest police, court, or government office.", descNe: "नजिकैको प्रहरी, अदालत वा सरकारी कार्यालय भेट्टाउनुहोस्।" },
    { href: "/lawyers", icon: Gavel, titleEn: "Lawyer Marketplace", titleNe: "वकिल बाजार", descEn: "Book a consultation with a verified lawyer.", descNe: "प्रमाणित वकिलसँग सल्लाह बुक गर्नुहोस्।" },
    { href: "/compliance", icon: Building2, titleEn: "Business Compliance", titleNe: "व्यवसाय अनुपालन", descEn: "Track company renewals, tax deadlines, and checklists.", descNe: "कम्पनी नवीकरण, कर म्याद र चेकलिस्ट ट्र्याक गर्नुहोस्।" },
  ];

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div>
            <span className="lang-ne inline-flex items-center gap-2 rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-500">
              {lang === "ne" ? "नेपालका लागि बनाइएको" : "Built for Nepal"}
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.1] text-ink sm:text-5xl">
              {t("hero_title")}
            </h1>
            <p className="lang-ne mt-5 max-w-xl text-lg leading-relaxed text-slate-600">
              {t("hero_subtitle")}
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 rounded-full bg-crimson-500 px-6 py-3.5 text-sm font-semibold text-paper shadow-lifted transition-transform hover:-translate-y-0.5"
              >
                {t("hero_cta_primary")} <ArrowRight size={16} />
              </Link>
              <Link
                href="/knowledge-base"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3.5 text-sm font-semibold text-ink hover:border-crimson-400 hover:text-crimson-500"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">{t("disclaimer_short")}</p>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="absolute h-72 w-72 rounded-full bg-crimson-50 sm:h-96 sm:w-96" aria-hidden="true" />
            <div className="relative flex h-64 w-64 items-center justify-center rounded-full border border-crimson-100 bg-paper shadow-lifted sm:h-80 sm:w-80">
              <SealMark size={180} className="text-crimson-500" />
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            {lang === "ne" ? "एक ठाउँमा सबै कानूनी सहायता" : "Everything you need, in one place"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-2xl border border-slate-100 bg-white p-6 shadow-soft transition-all hover:-translate-y-1 hover:border-crimson-200 hover:shadow-lifted"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-500">
                <f.icon size={20} />
              </span>
              <h3 className="lang-ne mt-4 font-display text-lg font-semibold text-ink">
                {lang === "ne" ? f.titleNe : f.titleEn}
              </h3>
              <p className="lang-ne mt-2 text-sm leading-relaxed text-slate-500">
                {lang === "ne" ? f.descNe : f.descEn}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-crimson-500 opacity-0 transition-opacity group-hover:opacity-100">
                {lang === "ne" ? "हेर्नुहोस्" : "Explore"} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <SealMark size={56} className="mx-auto text-slate-300" />
          <p className="lang-ne mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-500">
            {lang === "ne"
              ? "कानून मित्रले संविधान, सवारी, साइबर, उपभोक्ता, श्रम, सम्पत्ति, व्यवसाय र पारिवारिक कानूनबाट तयार पारिएको ज्ञान आधारको प्रयोग गर्छ। यद्यपि, यो प्लेटफर्मले इजलासी वकिलको सेवा प्रतिस्थापन गर्दैन — विशेष अवस्थाको लागि सधैं योग्य वकिलसँग सल्लाह लिनुहोस्।"
              : "Kanoon Mitra draws on a curated knowledge base covering the Constitution, traffic, cyber, consumer, labor, property, business, and family law. This platform does not replace a licensed lawyer — always consult one for case-specific advice."}
          </p>
        </div>
      </section>
    </div>
  );
}
