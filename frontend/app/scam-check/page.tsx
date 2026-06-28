"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Textarea, Card, Alert } from "@/components/ui";

type Result = { risk_level: string; explanation: string; red_flags: string[]; recommended_action: string; disclaimer: string };

const RISK_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  low: { bg: "bg-pine-50", text: "text-pine-600", icon: CheckCircle2 },
  medium: { bg: "bg-gold-100", text: "text-gold-500", icon: AlertTriangle },
  high: { bg: "bg-red-50", text: "text-red-600", icon: AlertTriangle },
  unknown: { bg: "bg-slate-50", text: "text-slate-500", icon: ShieldAlert },
};

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
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/scam-detection/check", { text, language: lang });
      setResult(res.data);
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const style = result ? RISK_STYLES[result.risk_level] ?? RISK_STYLES.unknown : null;
  const RiskIcon = style?.icon;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <ShieldAlert className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "ठगी जाँच" : "Scam Detector"}
        </h1>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {lang === "ne"
          ? "शंकास्पद म्यासेज, इमेल वा विज्ञापनको टेक्स्ट यहाँ पेस्ट गर्नुहोस्।"
          : "Paste a suspicious message, email, or ad text below."}
      </p>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea rows={6} required value={text} onChange={(e) => setText(e.target.value)} className="lang-ne" />
          <Button type="submit" loading={loading} disabled={text.trim().length < 5} className="w-full">
            {lang === "ne" ? "जाँच गर्नुहोस्" : "Check this message"}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mt-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {result && style && RiskIcon && (
        <Card className="mt-6">
          <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${style.bg} ${style.text}`}>
            <RiskIcon size={16} />
            {result.risk_level.toUpperCase()} {lang === "ne" ? "जोखिम" : "RISK"}
          </div>
          <p className="lang-ne mt-4 text-sm leading-relaxed text-ink">{result.explanation}</p>

          {result.red_flags.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-ink">{lang === "ne" ? "रातो झण्डाहरू" : "Red flags"}</h4>
              <ul className="mt-2 space-y-1 text-sm text-slate-600">
                {result.red_flags.map((f, i) => (
                  <li key={i}>• {f}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <h4 className="text-sm font-semibold text-ink">{lang === "ne" ? "सिफारिस गरिएको कदम" : "Recommended action"}</h4>
            <p className="mt-1 text-sm text-slate-600">{result.recommended_action}</p>
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">{result.disclaimer}</p>
        </Card>
      )}
    </div>
  );
}
