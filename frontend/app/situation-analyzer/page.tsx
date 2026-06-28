"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileSearch, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Textarea, Card, Alert } from "@/components/ui";

type Result = {
  detected_category: string;
  category_name_en: string;
  category_name_ne: string;
  confidence: string;
  analysis: string;
  suggested_next_steps: string[];
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
    if (!user) {
      router.push("/login?next=/situation-analyzer");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/situation-analyzer/analyze", { description, language: lang });
      setResult(res.data);
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <FileSearch className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">{t("nav_analyzer")}</h1>
      </div>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            label={t("analyzer_title")}
            placeholder={t("analyzer_placeholder")}
            rows={5}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="lang-ne"
          />
          <Button type="submit" loading={loading} disabled={description.trim().length < 5}>
            {t("analyzer_submit")} <ArrowRight size={15} />
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mt-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {result && (
        <div className="mt-8 space-y-5">
          <Card>
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-pine-50 px-3 py-1 text-xs font-semibold text-pine-500">
                {lang === "ne" ? result.category_name_ne : result.category_name_en}
              </span>
              <span className="text-xs text-slate-400 capitalize">{result.confidence} confidence</span>
            </div>
            <p className="lang-ne mt-4 whitespace-pre-line text-sm leading-relaxed text-ink">{result.analysis}</p>
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-ink">
              {lang === "ne" ? "अर्को कदम" : "Suggested next steps"}
            </h3>
            <ol className="mt-3 space-y-2">
              {result.suggested_next_steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-slate-600">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-crimson-50 text-xs font-semibold text-crimson-500">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          {result.related_articles.length > 0 && (
            <Card>
              <h3 className="font-display text-base font-semibold text-ink">
                {lang === "ne" ? "सम्बन्धित कानून" : "Related law"}
              </h3>
              <ul className="mt-3 space-y-2">
                {result.related_articles.map((a) => (
                  <li key={a.id} className="text-sm text-slate-600">
                    • {lang === "ne" ? a.title_ne : a.title_en}{" "}
                    <span className="font-mono text-xs text-slate-400">({a.source_reference})</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <p className="text-center text-xs text-slate-400">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
