"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Loader2, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Alert } from "@/components/ui";

type Result = {
  detected_category: string; category_name_en: string; category_name_ne: string;
  confidence: string; analysis: string; suggested_next_steps: string[];
  related_articles: { id: string; title_en: string; title_ne: string; source_reference: string }[];
  disclaimer: string;
};

export default function SituationAnalyzerPage() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/login?next=/situation-analyzer");
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await api.post("/situation-analyzer/analyze", { description, language: lang });
      setResult(res.data);
    } catch (e: any) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const confidenceColor = (c: string) =>
    c === "high" ? "text-emerald-600 bg-emerald-50" : c === "medium" ? "text-brass-500 bg-brass-50" : "text-slate-500 bg-slate-50";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "विश्लेषण" : "Analysis"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{t("nav_analyzer")}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "आफ्नो अवस्था विस्तारमा लेख्नुहोस् — AI ले सही कानून र अर्को कदम बताउनेछ।" : "Describe your situation in detail — the AI will identify the relevant law and what to do next."}
        </p>
      </div>

      <div className="animate-fade-up [animation-delay:80ms] rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={t("analyzer_placeholder")}
            rows={5}
            required
            className="lang-ne w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-all focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson-100"
          />
          <Button type="submit" loading={loading} disabled={description.trim().length < 10} size="lg" className="w-full sm:w-auto">
            {t("analyzer_submit")} <ArrowRight size={15} />
          </Button>
        </form>
      </div>

      {error && <div className="mt-5 animate-fade-in"><Alert variant="error">{error}</Alert></div>}

      {result && (
        <div className="mt-8 space-y-5 animate-fade-up">
          {/* Category & analysis */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <span className="font-display text-lg font-semibold text-ink">
                {lang === "ne" ? result.category_name_ne : result.category_name_en}
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${confidenceColor(result.confidence)}`}>
                {result.confidence} confidence
              </span>
            </div>
            <p className="lang-ne whitespace-pre-line text-sm leading-relaxed text-ink">{result.analysis}</p>
          </div>

          {/* Next steps */}
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <h3 className="font-display text-base font-semibold text-ink mb-4">
              {lang === "ne" ? "सिफारिस गरिएका अर्का कदमहरू" : "Recommended next steps"}
            </h3>
            <ol className="space-y-3">
              {result.suggested_next_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-paper mt-0.5">{i + 1}</span>
                  <span className="lang-ne">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Related law */}
          {result.related_articles.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
              <h3 className="font-display text-base font-semibold text-ink mb-4">
                {lang === "ne" ? "सम्बन्धित कानून" : "Related law"}
              </h3>
              <div className="space-y-2">
                {result.related_articles.map(a => (
                  <div key={a.id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-2.5">
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-500" />
                    <div className="min-w-0">
                      <p className="lang-ne text-sm font-medium text-ink truncate">{lang === "ne" ? a.title_ne : a.title_en}</p>
                      <p className="font-mono text-[11px] text-slate-400 truncate">{a.source_reference}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-xs text-slate-400">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
