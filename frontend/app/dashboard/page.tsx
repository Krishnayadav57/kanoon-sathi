"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, FileText, FileSearch, Crown, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) api.get("/dashboard/summary").then((res) => setSummary(res.data)).catch(() => {});
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-crimson-500" size={28} />
      </div>
    );
  }

  const isPremium = summary?.user.is_premium_active;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {t("dashboard_welcome")}, {user.full_name.split(" ")[0]}
      </h1>

      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-crimson-50 text-crimson-500">
            <MessageCircle size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold text-ink">{summary?.stats.total_chats ?? "—"}</p>
            <p className="text-xs text-slate-500">{t("dashboard_chats")}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-pine-50 text-pine-500">
            <FileSearch size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold text-ink">{summary?.stats.total_documents ?? "—"}</p>
            <p className="text-xs text-slate-500">{t("dashboard_documents")}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold-100 text-gold-500">
            <FileText size={20} />
          </span>
          <div>
            <p className="text-2xl font-semibold text-ink">{summary?.stats.total_complaints ?? "—"}</p>
            <p className="text-xs text-slate-500">{t("dashboard_complaints")}</p>
          </div>
        </Card>
        <Card className={`flex items-center gap-4 ${isPremium ? "bg-ink text-paper" : ""}`}>
          <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${isPremium ? "bg-gold-400 text-ink" : "bg-slate-50 text-slate-500"}`}>
            <Crown size={20} />
          </span>
          <div>
            <p className={`text-base font-semibold capitalize ${isPremium ? "text-paper" : "text-ink"}`}>
              {summary?.user.subscription_plan ?? user.subscription_plan}
            </p>
            <p className={`text-xs ${isPremium ? "text-slate-300" : "text-slate-500"}`}>{t("dashboard_plan")}</p>
          </div>
        </Card>
      </div>

      {!isPremium && (
        <Card className="mt-6 flex flex-col items-start justify-between gap-4 border-crimson-100 bg-crimson-50 sm:flex-row sm:items-center">
          <div>
            <p className="font-display text-base font-semibold text-ink">
              {lang === "ne" ? "असीमित कानूनी मार्गदर्शनको लागि अपग्रेड गर्नुहोस्" : "Upgrade for unlimited legal guidance"}
            </p>
            <p className="mt-1 text-sm text-slate-600">{t("pricing_premium_desc")}</p>
          </div>
          <Link href="/pricing">
            <Button>{t("upgrade_now")}</Button>
          </Link>
        </Card>
      )}

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Link href="/chat">
          <Card className="transition-all hover:-translate-y-0.5 hover:shadow-lifted">
            <h3 className="font-display text-lg font-semibold text-ink">{t("nav_chat")}</h3>
            <p className="mt-1 text-sm text-slate-500">{lang === "ne" ? "नयाँ कुराकानी सुरु गर्नुहोस्" : "Start a new conversation"}</p>
          </Card>
        </Link>
        <Link href="/complaints">
          <Card className="transition-all hover:-translate-y-0.5 hover:shadow-lifted">
            <h3 className="font-display text-lg font-semibold text-ink">{t("nav_complaints")}</h3>
            <p className="mt-1 text-sm text-slate-500">{lang === "ne" ? "उजुरी पत्र तयार गर्नुहोस्" : "Draft a complaint letter"}</p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
