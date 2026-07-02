"use client";

import Link from "next/link";
import {
  MessageCircle, BookOpen, FileSearch, FileText, ShieldAlert, GraduationCap,
  MapPin, Gavel, Building2, ArrowRight, Mic, CheckCircle2,
} from "lucide-react";
import { useLang } from "@/lib/lang-context";
import SealMark from "@/components/SealMark";

export default function HomePage() {
  const { lang, t } = useLang();

  const features = [
    { href: "/chat", icon: MessageCircle, titleEn: "AI Legal Chat", titleNe: "AI कानूनी कुराकानी", descEn: "Describe your situation, get a plain-language explanation grounded in Nepal law.", descNe: "आफ्नो अवस्था बताउनुहोस्, नेपाली कानूनमा आधारित सरल व्याख्या पाउनुहोस्।" },
    { href: "/voice", icon: Mic, titleEn: "Real-time Voice Assistant", titleNe: "रियल-टाइम भ्वाइस सहायक", descEn: "Talk to Kanoon Mitra naturally and get spoken answers, live.", descNe: "कानून मित्रसँग स्वाभाविक रूपमा बोल्नुहोस् र प्रत्यक्ष आवाजमा जवाफ पाउनुहोस्।" },
    { href: "/knowledge-base", icon: BookOpen, titleEn: "Law Library", titleNe: "कानून पुस्तकालय", descEn: "Browse traffic, cyber, labor, family, and other laws by topic.", descNe: "सवारी, साइबर, श्रम, पारिवारिक लगायतका कानून विषयअनुसार हेर्नुहोस्।" },
    { href: "/situation-analyzer", icon: FileSearch, titleEn: "Situation Analyzer", titleNe: "अवस्था विश्लेषक", descEn: "Get your situation categorized with clear next steps.", descNe: "आफ्नो अवस्था वर्गीकृत गरी स्पष्ट अर्को कदम पाउनुहोस्।" },
    { href: "/complaints", icon: FileText, titleEn: "Complaint Generator", titleNe: "उजुरी निर्माता", descEn: "Draft police, cyber, consumer, or municipality complaints in minutes.", descNe: "मिनेटमै प्रहरी, साइबर, उपभोक्ता वा नगरपालिका उजुरी तयार गर्नुहोस्।" },
    { href: "/scam-check", icon: ShieldAlert, titleEn: "Scam Detector", titleNe: "ठगी पत्ता लगाउने", descEn: "Paste a suspicious message and check the fraud risk.", descNe: "शंकास्पद म्यासेज पेस्ट गरी ठगीको जोखिम जाँच गर्नुहोस्।" },
    { href: "/learning", icon: GraduationCap, titleEn: "Legal Learning", titleNe: "कानूनी सिकाइ", descEn: "Daily tips and quizzes to build your legal awareness.", descNe: "कानूनी ज्ञान बढाउन दैनिक सुझाव र क्विज।" },
    { href: "/offices", icon: MapPin, titleEn: "Office Locator", titleNe: "कार्यालय खोजकर्ता", descEn: "Find the nearest police, court, or government office.", descNe: "नजिकैको प्रहरी, अदालत वा सरकारी कार्यालय भेट्टाउनुहोस्।" },
    { href: "/lawyers", icon: Gavel, titleEn: "Lawyer Marketplace", titleNe: "वकिल बाजार", descEn: "Book a consultation with a verified lawyer.", descNe: "प्रमाणित वकिलसँग सल्लाह बुक गर्नुहोस्।" },
    { href: "/compliance", icon: Building2, titleEn: "Business Compliance", titleNe: "व्यवसाय अनुपालन", descEn: "Track company renewals, tax deadlines, and checklists.", descNe: "कम्पनी नवीकरण, कर म्याद र चेकलिस्ट ट्र्याक गर्नुहोस्।" },
  ];

  const trustPoints = [
    { en: "8 legal categories, grounded answers", ne: "८ कानूनी क्षेत्र, प्रमाणित जवाफ" },
    { en: "Nepali and English, side by side", ne: "नेपाली र अंग्रेजी, सँगसँगै" },
    { en: "Always discloses its limits", ne: "सधैं आफ्नो सीमा स्पष्ट गर्छ" },
  ];

  return (
    <div className="overflow-x-clip">
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-100">
        {/* Ambient backdrop: a faint document-grid texture, the "verified paper" motif */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(#13151A 1px, transparent 1px), linear-gradient(90deg, #13151A 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
          aria-hidden="true"
        />

        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-8 lg:py-28">
          <div className="animate-fade-up">
            <span className="lang-ne inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {lang === "ne" ? "नेपालका लागि बनाइएको" : "Built for Nepal"}
            </span>

            <h1 className="mt-6 font-display text-[2.5rem] font-semibold leading-[1.08] tracking-tight text-ink sm:text-6xl">
              {t("hero_title")}
            </h1>

            <p className="lang-ne mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
              {t("hero_subtitle")}
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/chat"
                className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 text-sm font-semibold text-paper shadow-lifted transition-all duration-300 ease-smooth hover:bg-crimson-600 hover:-translate-y-0.5"
              >
                {t("hero_cta_primary")}
                <ArrowRight size={16} className="transition-transform duration-300 ease-smooth group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/knowledge-base"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-ink transition-all duration-300 ease-smooth hover:border-ink"
              >
                {t("hero_cta_secondary")}
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2">
              {trustPoints.map((p) => (
                <span key={p.en} className="lang-ne flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  {lang === "ne" ? p.ne : p.en}
                </span>
              ))}
            </div>

            <p className="mt-5 text-xs text-slate-400">{t("disclaimer_short")}</p>
          </div>

          {/* Signature visual: a "verified document" card with the scan-trace motion */}
          <div className="animate-fade-up [animation-delay:150ms] relative flex items-center justify-center">
            <div className="scan-trace-border relative w-full max-w-sm rounded-3xl border border-slate-150 bg-white p-7 shadow-lifted">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-paper">
                    <SealMark size={16} className="text-paper" />
                  </span>
                  <span className="font-display text-sm font-semibold text-ink">
                    {lang === "ne" ? "कानून मित्र" : "Kanoon Mitra"}
                  </span>
                </div>
                <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-500">
                  <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-emerald-500" />
                  {lang === "ne" ? "लाइभ" : "Live"}
                </span>
              </div>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-600">
                  {lang === "ne"
                    ? "मेरो घरबेटीले लिखित सूचना नदिई घर छोड्न भन्नुभयो..."
                    : "My landlord is asking me to leave without written notice…"}
                </div>
                <div className="rounded-2xl bg-ink px-4 py-3 text-xs leading-relaxed text-paper">
                  {lang === "ne"
                    ? "घरबहाल सम्झौता अनुसार, घरबेटीले उचित सूचना दिनुपर्छ। तपाईंको अधिकार र अर्को कदम यहाँ छ —"
                    : "Under tenancy norms, your landlord must give proper notice. Here's your right and the next step —"}
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-[10px] font-medium text-slate-400">
                <span>{lang === "ne" ? "सम्पत्ति कानून · पुष्टि गरिएको" : "Property Law · Verified"}</span>
                <span className="font-mono">NP-2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">
            {lang === "ne" ? "सुविधाहरू" : "Capabilities"}
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {lang === "ne" ? "एक ठाउँमा सबै कानूनी सहायता" : "Everything you need, in one place"}
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <Link
              key={f.href}
              href={f.href}
              className="reveal group scan-trace-border rounded-2xl border border-slate-100 bg-white p-6 shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-1 hover:shadow-lifted hover:border-slate-200"
              style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-ink transition-colors duration-300 ease-smooth group-hover:bg-ink group-hover:text-paper">
                <f.icon size={19} />
              </span>
              <h3 className="lang-ne mt-4 font-display text-lg font-semibold text-ink">
                {lang === "ne" ? f.titleNe : f.titleEn}
              </h3>
              <p className="lang-ne mt-2 text-sm leading-relaxed text-slate-500">
                {lang === "ne" ? f.descNe : f.descEn}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-crimson-500 opacity-0 transition-all duration-300 ease-smooth group-hover:translate-x-0.5 group-hover:opacity-100">
                {lang === "ne" ? "हेर्नुहोस्" : "Explore"} <ArrowRight size={14} />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-t border-slate-100 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <SealMark size={48} className="mx-auto text-slate-300" />
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
