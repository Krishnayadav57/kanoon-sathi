"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Alert } from "@/components/ui";

type Result = { risk_level: string; explanation: string; red_flags: string[]; recommended_action: string; disclaimer: string };

export default function ScamCheckPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [text, setText] = useState("");
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/login?next=/scam-check");
    setLoading(true); setError(null);
    try { const res = await api.post("/scam-detection/check", { text, language: lang }); setResult(res.data); }
    catch (e: any) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const riskConfig: Record<string, { bg: string; border: string; icon: React.ReactNode; label: string }> = {
    low: { bg: "bg-emerald-50", border: "border-emerald-200", icon: <CheckCircle2 size={18} className="text-emerald-500" />, label: lang === "ne" ? "कम जोखिम" : "Low Risk" },
    medium: { bg: "bg-brass-50", border: "border-brass-100", icon: <AlertTriangle size={18} className="text-brass-500" />, label: lang === "ne" ? "मध्यम जोखिम" : "Medium Risk" },
    high: { bg: "bg-crimson-50", border: "border-crimson-100", icon: <ShieldAlert size={18} className="text-crimson-500" />, label: lang === "ne" ? "उच्च जोखिम" : "High Risk" },
    unknown: { bg: "bg-slate-50", border: "border-slate-200", icon: <ShieldCheck size={18} className="text-slate-400" />, label: lang === "ne" ? "अज्ञात" : "Unknown" },
  };
  const cfg = result ? (riskConfig[result.risk_level] ?? riskConfig.unknown) : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "सुरक्षा" : "Security"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "ठगी जाँच" : "Scam Detector"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "शंकास्पद म्यासेज, इमेल वा विज्ञापन पेस्ट गर्नुहोस् — AI ले जोखिम विश्लेषण गर्नेछ।" : "Paste a suspicious message, email, or ad — the AI will analyze the fraud risk."}
        </p>
      </div>

      <div className="animate-fade-up [animation-delay:60ms] rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            required
            placeholder={lang === "ne" ? "शंकास्पद सन्देश यहाँ पेस्ट गर्नुहोस्…" : "Paste suspicious message here…"}
            className="lang-ne w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-ink placeholder:text-slate-400 transition-all focus:border-ink focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson-100"
          />
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" loading={loading} disabled={text.trim().length < 5} className="w-full" size="lg">
            {lang === "ne" ? "जाँच गर्नुहोस्" : "Analyze this message"}
          </Button>
        </form>
      </div>

      {result && cfg && (
        <div className="mt-6 animate-fade-up space-y-4">
          <div className={`rounded-3xl border p-6 ${cfg.bg} ${cfg.border}`}>
            <div className="flex items-center gap-3 mb-4">
              {cfg.icon}
              <span className="font-display text-lg font-semibold text-ink">{cfg.label}</span>
            </div>
            <p className="lang-ne text-sm leading-relaxed text-ink">{result.explanation}</p>
          </div>

          {result.red_flags.length > 0 && (
            <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
              <h4 className="font-display text-sm font-semibold text-ink mb-3">
                🚩 {lang === "ne" ? "रातो झण्डाहरू" : "Red flags"}
              </h4>
              <ul className="space-y-2">
                {result.red_flags.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-crimson-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
            <h4 className="font-display text-sm font-semibold text-ink mb-2">
              ✅ {lang === "ne" ? "सिफारिस गरिएको कदम" : "Recommended action"}
            </h4>
            <p className="text-sm text-slate-600">{result.recommended_action}</p>
          </div>

          <p className="text-center text-xs text-slate-400">{result.disclaimer}</p>
        </div>
      )}
    </div>
  );
}
