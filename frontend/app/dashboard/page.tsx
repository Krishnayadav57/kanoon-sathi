"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, FileText, FileSearch, Crown, Loader2, ArrowRight, Bell, Mic } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Card, Button } from "@/components/ui";

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
      <Loader2 className="animate-spin text-crimson-500" size={28} />
    </div>
  );

  const isPremium = summary?.user.is_premium_active;
  const firstName = user.full_name.split(" ")[0];

  const stats = [
    { icon: MessageCircle, label: t("dashboard_chats"), value: summary?.stats.total_chats ?? "—", color: "bg-ink text-paper" },
    { icon: FileSearch, label: t("dashboard_documents"), value: summary?.stats.total_documents ?? "—", color: "bg-emerald-500 text-paper" },
    { icon: FileText, label: t("dashboard_complaints"), value: summary?.stats.total_complaints ?? "—", color: "bg-crimson-500 text-paper" },
    {
      icon: Crown,
      label: t("dashboard_plan"),
      value: isPremium ? (lang === "ne" ? "प्रिमियम" : "Premium") : (lang === "ne" ? "नि:शुल्क" : "Free"),
      color: isPremium ? "bg-brass-400 text-ink" : "bg-slate-100 text-slate-500",
    },
  ];

  const quickActions = [
    { href: "/chat", icon: MessageCircle, label: lang === "ne" ? "कानूनी प्रश्न सोध्नुहोस्" : "Ask a legal question", desc: lang === "ne" ? "AI सँग कुराकानी" : "Chat with AI" },
    { href: "/voice", icon: Mic, label: lang === "ne" ? "भ्वाइस असिस्टेन्ट" : "Voice Assistant", desc: lang === "ne" ? "बोलेर सोध्नुहोस्" : "Ask by speaking" },
    { href: "/complaints", icon: FileText, label: lang === "ne" ? "उजुरी तयार गर्नुहोस्" : "Draft a complaint", desc: lang === "ne" ? "उजुरी निर्माता" : "Complaint generator" },
    { href: "/situation-analyzer", icon: FileSearch, label: lang === "ne" ? "अवस्था विश्लेषण" : "Analyze situation", desc: lang === "ne" ? "AI द्वारा विश्लेषण" : "AI-powered analysis" },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{lang === "ne" ? "फिर्ता स्वागत छ" : "Welcome back"}</p>
          <h1 className="font-display text-2xl font-semibold text-ink">{firstName} 👋</h1>
        </div>
        {isPremium ? (
          <span className="flex items-center gap-1.5 rounded-full bg-brass-50 px-3 py-1.5 text-xs font-bold text-brass-500">
            <Crown size={12} /> Premium
          </span>
        ) : (
          <Link href="/pricing">
            <Button size="sm" variant="ghost">
              <Crown size={14} /> {t("upgrade_now")}
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s, i) => (
          <Card key={s.label} className="animate-fade-up" style={{ animationDelay: `${i * 60}ms` } as any}>
            <span className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-soft ${s.color}`}>
              <s.icon size={18} />
            </span>
            <p className="mt-3 text-2xl font-semibold text-ink">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Upgrade nudge */}
      {!isPremium && (
        <Card className="mt-6 animate-fade-up border-crimson-100 bg-gradient-to-r from-crimson-50 to-white" style={{ animationDelay: "240ms" } as any}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-display text-base font-semibold text-ink">
                {lang === "ne" ? "असीमित कानूनी मार्गदर्शनको लागि अपग्रेड गर्नुहोस्" : "Upgrade for unlimited legal guidance"}
              </p>
              <p className="mt-1 text-sm text-slate-500">{t("pricing_premium_desc")}</p>
            </div>
            <Link href="/pricing" className="shrink-0">
              <Button>{t("upgrade_now")} <ArrowRight size={15} /></Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Quick actions */}
      <div className="mt-8">
        <h2 className="mb-4 font-display text-base font-semibold text-ink">
          {lang === "ne" ? "छिटो पहुँच" : "Quick access"}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {quickActions.map((a, i) => (
            <Link key={a.href} href={a.href}>
              <Card interactive className="animate-fade-up group flex items-center gap-4" style={{ animationDelay: `${300 + i * 60}ms` } as any}>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-ink transition-all duration-300 group-hover:bg-ink group-hover:text-paper">
                  <a.icon size={20} />
                </span>
                <div className="min-w-0">
                  <p className="font-display text-sm font-semibold text-ink">{a.label}</p>
                  <p className="text-xs text-slate-500">{a.desc}</p>
                </div>
                <ArrowRight size={15} className="ml-auto shrink-0 text-slate-300 transition-all group-hover:text-ink group-hover:translate-x-0.5" />
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Last payment */}
      {summary?.last_payment && (
        <div className="mt-8">
          <h2 className="mb-4 font-display text-base font-semibold text-ink">
            {lang === "ne" ? "अन्तिम भुक्तानी" : "Last payment"}
          </h2>
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-ink capitalize">
                  {summary.last_payment.provider} — NPR {summary.last_payment.amount_npr}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {new Date(summary.last_payment.created_at).toLocaleDateString(lang === "ne" ? "ne-NP" : "en-US", { dateStyle: "medium" })}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                summary.last_payment.status === "success" ? "bg-emerald-50 text-emerald-600" :
                summary.last_payment.status === "awaiting_review" ? "bg-brass-50 text-brass-500" :
                "bg-slate-50 text-slate-500"
              }`}>
                {summary.last_payment.status}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
