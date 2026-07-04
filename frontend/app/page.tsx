"use client";
/**
 * REDESIGNED (Phase 2): Homepage matching the reference screenshot.
 * Replaces frontend/app/page.tsx. Uses the brand.* navy/gold tokens from
 * Phase 1's tailwind.config.js and is rendered inside <AppShell> (sidebar
 * desktop / bottom-tabs mobile) from BrandShell.tsx.
 *
 * All feature links/routes are identical to the existing app (chat, voice,
 * knowledge-base, situation-analyzer, complaints, documents, scam-check) —
 * nothing about routing or auth changes, only presentation.
 */
import Link from "next/link";
import {
  MessageCircle, Mic, FileSearch, FileText, ScanEye, ArrowRight,
  Users, Home as HomeIcon, Briefcase, ShieldAlert, AlertTriangle,
} from "lucide-react";
import { useLang } from "@/lib/lang-context";

const FEATURES = [
  { href: "/chat", icon: MessageCircle, en: "Legal Chat", ne: "कानूनी कुराकानी", descEn: "Get answers to your legal questions", descNe: "आफ्नो कानूनी प्रश्नको जवाफ पाउनुहोस्" },
  { href: "/voice", icon: Mic, en: "Voice Assistant", ne: "भ्वाइस सहायक", descEn: "Talk and get legal information", descNe: "बोलेर कानूनी जानकारी पाउनुहोस्" },
  { href: "/situation-analyzer", icon: FileSearch, en: "Situation Analyzer", ne: "अवस्था विश्लेषक", descEn: "Analyze your situation, step by step", descNe: "आफ्नो अवस्था चरणबद्ध विश्लेषण गर्नुहोस्" },
  { href: "/complaints", icon: FileText, en: "Complaint Generator", ne: "उजुरी निर्माता", descEn: "Create formal complaints easily", descNe: "सजिलैसँग औपचारिक उजुरी बनाउनुहोस्" },
  { href: "/documents", icon: FileText, en: "Document Explainer", ne: "कागजात व्याख्या", descEn: "Understand any legal document", descNe: "कुनै पनि कानूनी कागजात बुझ्नुहोस्" },
  { href: "/scam-check", icon: ScanEye, en: "Scam Check", ne: "ठगी जाँच", descEn: "Check if it's a scam or legal", descNe: "ठगी हो कि वैध जाँच गर्नुहोस्" },
];

const TOPICS = [
  { icon: Users, bg: "bg-violet-100 text-violet-600", en: "Family Law", ne: "पारिवारिक कानून", descEn: "Marriage, divorce, custody, property rights", descNe: "विवाह, सम्बन्ध विच्छेद, संरक्षण, सम्पत्ति अधिकार", count: 24 },
  { icon: HomeIcon, bg: "bg-blue-100 text-blue-600", en: "Property Law", ne: "सम्पत्ति कानून", descEn: "Land, house buying/selling, tenancy", descNe: "जग्गा जमिन, घर जग्गा खरिद बिक्री, भाडा सम्झौता", count: 32 },
  { icon: Briefcase, bg: "bg-amber-100 text-amber-700", en: "Labor Law", ne: "श्रम कानून", descEn: "Employment, wages, workplace rights", descNe: "रोजगारी, तलब, सेवा सुविधा, श्रमिक अधिकार", count: 18 },
  { icon: ShieldAlert, bg: "bg-violet-100 text-violet-700", en: "Criminal Law", ne: "फौजदारी कानून", descEn: "Crimes, procedure, penalties, bail", descNe: "अपराध, मुद्दा प्रक्रिया, जरिवाना, जमानत", count: 27 },
];

export default function HomePage() {
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      {/* HERO */}
      <section className="animate-fade-up overflow-hidden rounded-2xl border border-brand-border bg-gradient-to-br from-brand-gold-100/60 via-white to-white p-6 sm:p-10 lg:flex lg:items-center lg:gap-10 lg:p-12">
        <div className="flex-1">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-border bg-white px-3 py-1.5 text-xs font-semibold text-brand-text-secondary">
            🇳🇵 {lang === "ne" ? "नेपालका लागि बनाइएको" : "Built for Nepal"}
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold leading-tight tracking-tight text-brand-navy sm:text-4xl lg:text-5xl">
            {lang === "ne" ? "कानून बुझ्नुहोस्।" : "Understand the law."}
            <br />
            <span className="text-brand-gold">{lang === "ne" ? "आफ्नै भाषामा।" : "In your language."}</span>
          </h1>
          <p className="lang-ne mt-4 max-w-lg text-[15px] leading-relaxed text-brand-text-secondary">
            {lang === "ne"
              ? "कानून मित्रले नेपालका कानून सरल नेपाली वा अंग्रेजीमा बुझाउँछ, उजुरी लेख्न मदत गर्छ, र सही कार्यालय देखाउँछ।"
              : "Kanoon Mitra explains Nepal's laws in plain Nepali or English, helps you write complaints, and points you to the right office."}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/chat" className="inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-3 text-sm font-semibold text-white shadow-brand transition-transform hover:-translate-y-0.5">
              <MessageCircle size={16} /> {lang === "ne" ? "कानूनी प्रश्न सोध्नुहोस्" : "Ask a Legal Question"}
            </Link>
            <Link href="/knowledge-base" className="inline-flex items-center gap-2 rounded-xl border border-brand-border bg-white px-5 py-3 text-sm font-semibold text-brand-navy transition-all hover:border-brand-navy">
              {lang === "ne" ? "कानून पुस्तकालय हेर्नुहोस्" : "Browse the Law Library"}
            </Link>
          </div>
        </div>
        <div className="mt-8 hidden shrink-0 lg:mt-0 lg:block">
          <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-white/70 text-7xl">⚖️</div>
        </div>
      </section>

      {/* FEATURE GRID */}
      <section className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4">
        {FEATURES.map((f) => (
          <Link
            key={f.href}
            href={f.href}
            className="group rounded-2xl border border-brand-border bg-white p-4 shadow-brand transition-all hover:-translate-y-0.5 hover:border-brand-navy sm:p-5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy transition-colors group-hover:bg-brand-navy group-hover:text-white">
              <f.icon size={18} />
            </span>
            <h3 className="lang-ne mt-3 font-display text-sm font-semibold text-brand-text">
              {lang === "ne" ? f.ne : f.en}
            </h3>
            <p className="lang-ne mt-1 text-xs leading-relaxed text-brand-text-secondary">
              {lang === "ne" ? f.descNe : f.descEn}
            </p>
          </Link>
        ))}
      </section>

      {/* Mobile-only disclaimer card (matches phone mock in reference) */}
      <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-4 lg:hidden">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="lang-ne text-xs leading-relaxed text-amber-800">
          {lang === "ne"
            ? "महत्त्वपूर्ण सूचना: कानून मित्रले सामान्य कानूनी जानकारी प्रदान गर्छ, यो वकिल वा अदालत होइन।"
            : "Important: Kanoon Mitra provides general legal information — it is not a lawyer or a court."}
        </p>
      </div>

      {/* POPULAR TOPICS */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-brand-text">
            {lang === "ne" ? "लोकप्रिय कानूनी विषयहरू" : "Popular Legal Topics"}
          </h2>
          <Link href="/knowledge-base" className="flex items-center gap-1 text-sm font-medium text-brand-navy hover:underline">
            {lang === "ne" ? "सबै हेर्नुहोस्" : "View all"} <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TOPICS.map((t) => (
            <Link
              key={t.en}
              href={`/knowledge-base?category=${t.en.toLowerCase().split(" ")[0]}`}
              className="rounded-2xl border border-brand-border bg-white p-5 shadow-brand transition-all hover:-translate-y-0.5 hover:border-brand-navy"
            >
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${t.bg}`}>
                <t.icon size={19} />
              </span>
              <h3 className="lang-ne mt-3 font-display text-sm font-semibold text-brand-text">
                {lang === "ne" ? t.ne : t.en}
              </h3>
              <p className="lang-ne mt-1 text-xs leading-relaxed text-brand-text-secondary line-clamp-2">
                {lang === "ne" ? t.descNe : t.descEn}
              </p>
              <p className="mt-3 text-xs font-semibold text-brand-navy">
                {t.count} {lang === "ne" ? "लेखहरू" : "Articles"}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
