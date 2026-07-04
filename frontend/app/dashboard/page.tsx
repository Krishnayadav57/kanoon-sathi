"use client";
// PHASE 3: restyled to brand.* navy/gold tokens. All state, effects, API calls,
// and route logic are byte-for-byte identical to the original dashboard page —
// only className values changed.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, FileText, FileSearch, Crown, Loader2, ArrowRight, Mic } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";

type Summary = {
  user: { full_name: string; subscription_plan: string; subscription_expires_at: string | null; is_premium_active: boolean };
  stats: { total_chats: number; total_documents: number; total_complaints: number };
  last_payment: { amount_npr: number; status: string; provider: string; created_at: string } | null;
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => { if (!loading && !user) router.push("/login?next=/dashboard"); }, [loading, user, router]);
  useEffect(() => {
    if (user) api.get("/dashboard/summary").then((res) => setSummary(res.data)).catch(() => {});
  }, [user]);

  if (loading || !user) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-brand-navy" size={28} />
    </div>
  );

  const isPremium = summary?.user.is_premium_active;
  const firstName = user.full_name.split(" ")[0];

  const stats = [
    { icon: MessageCircle, label: t("dashboard_chats"), value: summary?.stats.total_chats ?? "—", color: "bg-brand-navy text-white" },
    { icon: FileSearch, label: t("dashboard_documents"), value: summary?.stats.total_documents ?? "—", color: "bg-emerald-500 text-white" },
    { icon: FileText, label: t("dashboard_complaints"), value: summary?.stats.total_complaints ?? "—", color: "bg-brand-danger text-white" },
    {
      icon: Crown,
      label: t("dashboard_plan"),
      value: isPremium ? (lang === "ne" ? "प्रिमियम" : "Premium") : (lang === "ne" ? "नि:शुल्क" : "Free"),
      color: isPremium ? "bg-brand-gold text-brand-navy" : "bg-brand-bg text-brand-text-secondary",
    },
  ];

  const quickActions = [
    { href: "/chat", icon: MessageCircle, label: lang === "ne" ? "कानूनी प्रश्न सोध्नुहोस्" : "Ask a legal question", desc: lang === "ne" ? "AI सँग कुराकानी" : "Chat with AI" },
    { href: "/voice", icon: Mic, label: lang === "ne" ? "भ्वाइस असिस्टेन्ट" : "Voice Assistant", desc: lang === "ne" ? "बोलेर सोध्नुहोस्" : "Ask by speaking" },
    { href: "/complaints", icon: FileText, label: lang === "ne" ? "उजुरी तयार गर्नुहोस्" : "Draft a complaint", desc: lang === "ne" ? "उजुरी निर्माता" : "Complaint generator" },
    { href: "/situation-analyzer", icon: FileSearch, label: lang === "ne" ? "अवस्था विश्लेषण" : "Analyze situation", desc: lang === "ne" ? "AI द्वारा विश्लेषण" : "AI-powered analysis" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-10 lg:py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-brand-text-secondary">{lang === "ne" ? "फिर्ता स्वागत छ" : "Welcome back"}</p>
          <h1 className="font-display text-2xl font-bold text-brand-text">{firstName} 👋</h1>
        </div>
        {isPremium ? (
          <span className="flex items-center gap-1.5 rounded-full bg-brand-gold-100 px-3 py-1.5 text-xs font-bold text-brand-gold">
            <Crown size={12} /> Premium
          </span>
        ) : (
          <Link href="/pricing" className="flex items-center gap-1.5 rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-navy">
            <Crown size={14} /> {t("upgrade_now")}
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand">
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon size={18} />
            </span>
            <p className="mt-3 font-display text-2xl font-bold text-brand-text">{s.value}</p>
            <p className="text-xs text-brand-text-secondary">{s.label}</p>
          </div>
        ))}
      </div>

      {!isPremium && (
        <div className="mt-6 rounded-2xl border border-brand-gold-100 bg-gradient-to-r from-brand-gold-100/50 to-white p-5 shadow-brand sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-base font-semibold text-brand-text">
              {lang === "ne" ? "असीमित कानूनी मार्गदर्शनको लागि अपग्रेड गर्नुहोस्" : "Upgrade for unlimited legal guidance"}
            </p>
            <p className="mt-1 text-sm text-brand-text-secondary">{t("pricing_premium_desc")}</p>
          </div>
          <Link href="/pricing" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white shadow-brand sm:mt-0">
            {t("upgrade_now")} <ArrowRight size={15} />
          </Link>
        </div>
      )}

      <div className="mt-8">
        <h2 className="mb-4 font-display text-base font-semibold text-brand-text">
          {lang === "ne" ? "छिटो पहुँच" : "Quick access"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((a) => (
            <Link key={a.href} href={a.href} className="group flex items-center gap-4 rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand transition-all hover:-translate-y-0.5 hover:border-brand-navy">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-navy/10 text-brand-navy transition-all group-hover:bg-brand-navy group-hover:text-white">
                <a.icon size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-display text-sm font-semibold text-brand-text">{a.label}</p>
                <p className="text-xs text-brand-text-secondary">{a.desc}</p>
              </div>
              <ArrowRight size={15} className="ml-auto shrink-0 text-brand-border transition-all group-hover:text-brand-navy group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      </div>

      {summary?.last_payment && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-base font-semibold text-brand-text">
            {lang === "ne" ? "अन्तिम भुक्तानी" : "Last payment"}
          </h2>
          <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-brand-text capitalize">
                  {summary.last_payment.provider} — NPR {summary.last_payment.amount_npr}
                </p>
                <p className="mt-1 text-xs text-brand-text-secondary">
                  {new Date(summary.last_payment.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", { dateStyle: "medium" })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                summary.last_payment.status === "success" ? "bg-emerald-50 text-emerald-600" :
                summary.last_payment.status === "awaiting_review" ? "bg-brand-gold-100 text-brand-gold" :
                "bg-brand-bg text-brand-text-secondary"
              }`}>
                {summary.last_payment.status}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
