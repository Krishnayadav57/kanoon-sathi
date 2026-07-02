"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Smartphone, Upload, Crown, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Card, Input, Alert } from "@/components/ui";

type ManualInstructions = {
  esewa: { number: string; name: string; amount_npr: number };
  khalti: { number: string; name: string; amount_npr: number };
};

export default function PricingPage() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();
  const [instructions, setInstructions] = useState<ManualInstructions | null>(null);
  const [activeProvider, setActiveProvider] = useState<"esewa" | "khalti" | null>(null);
  const [reference, setReference] = useState("");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    api.get("/payments/manual-instructions").then(r => setInstructions(r.data)).catch(() => {});
  }, []);

  const requireLogin = () => router.push("/login?next=/pricing");

  const handleStripe = async () => {
    if (!user) return requireLogin();
    setStripeLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/payments/stripe/create-checkout-session");
      window.location.href = res.data.checkout_url;
    } catch (e: any) {
      setMessage({ type: "error", text: getApiErrorMessage(e) });
      setStripeLoading(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return requireLogin();
    if (!activeProvider || !screenshot || !reference.trim()) return;
    setSubmitting(true);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("provider", activeProvider);
      fd.append("transaction_reference", reference.trim());
      fd.append("screenshot", screenshot);
      const res = await api.post("/payments/manual/submit", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setMessage({ type: "success", text: res.data.message });
      setReference("");
      setScreenshot(null);
      setActiveProvider(null);
    } catch (e: any) {
      setMessage({ type: "error", text: getApiErrorMessage(e) });
    } finally {
      setSubmitting(false);
    }
  };

  const price = instructions?.esewa.amount_npr ?? 499;

  const freeFeatures = [
    lang === "ne" ? "दैनिक १० AI म्यासेज" : "10 AI messages per day",
    lang === "ne" ? "दैनिक ५ मिनेट भ्वाइस" : "5 min voice/day",
    lang === "ne" ? "पूर्ण ज्ञान आधार पहुँच" : "Full knowledge base access",
    lang === "ne" ? "विज्ञापन समावेश" : "Ads included",
  ];
  const premiumFeatures = [
    lang === "ne" ? "असीमित AI कुराकानी" : "Unlimited AI chat",
    lang === "ne" ? "असीमित भ्वाइस सहायक" : "Unlimited voice assistant",
    lang === "ne" ? "विज्ञापन रहित" : "No ads",
    lang === "ne" ? "उन्नत कागजात विश्लेषण" : "Advanced document analysis",
    lang === "ne" ? "प्राथमिकता जवाफ" : "Priority responses",
    lang === "ne" ? "व्यवसाय अनुपालन उपकरण" : "Business compliance tools",
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <div className="animate-fade-up text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">
          {lang === "ne" ? "मूल्य" : "Pricing"}
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          {lang === "ne" ? "सरल, पारदर्शी मूल्य" : "Simple, transparent pricing"}
        </h1>
        <p className="mt-3 text-slate-500">
          {lang === "ne" ? "जुनसुकै बेला अपग्रेड वा रद्द गर्नुहोस्।" : "Upgrade or cancel anytime."}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Free */}
        <Card className="animate-fade-up [animation-delay:100ms]">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-slate-400">{t("pricing_free")}</p>
          <p className="mt-1 text-sm text-slate-500">{t("pricing_free_desc")}</p>
          <p className="mt-4 font-display text-4xl font-semibold text-ink">
            NPR 0 <span className="text-sm font-normal text-slate-400">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check size={16} className="shrink-0 text-slate-400" /> {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Premium */}
        <Card className="animate-fade-up [animation-delay:180ms] relative overflow-hidden border-2 border-ink">
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-ink px-4 py-1.5">
            <span className="flex items-center gap-1 text-xs font-bold text-paper">
              <Crown size={11} className="text-brass-400" />
              {lang === "ne" ? "सर्वोत्तम" : "Best value"}
            </span>
          </div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-crimson-500">{t("pricing_premium")}</p>
          <p className="mt-1 text-sm text-slate-500">{t("pricing_premium_desc")}</p>
          <p className="mt-4 font-display text-4xl font-semibold text-ink">
            NPR {price} <span className="text-sm font-normal text-slate-400">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3">
            {premiumFeatures.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                <Check size={16} className="shrink-0 text-crimson-500" /> {f}
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {message && (
        <div className="mx-auto mt-8 max-w-xl">
          <Alert variant={message.type === "success" ? "success" : "error"}>{message.text}</Alert>
        </div>
      )}

      <div className="mx-auto mt-12 max-w-xl animate-fade-up [animation-delay:260ms]">
        <h2 className="mb-6 text-center font-display text-lg font-semibold text-ink">{t("pay_with")}</h2>

        <div className="space-y-4">
          {/* Stripe */}
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink text-paper shadow-soft">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="font-medium text-ink">{lang === "ne" ? "कार्ड (अन्तर्राष्ट्रिय)" : "Card (International)"}</p>
                <p className="text-xs text-slate-400">Visa, Mastercard via Stripe</p>
              </div>
            </div>
            <Button onClick={handleStripe} loading={stripeLoading} size="sm">{t("pricing_subscribe")}</Button>
          </Card>

          {/* eSewa */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-paper shadow-soft">
                  <Smartphone size={18} />
                </span>
                <div>
                  <p className="font-medium text-ink">eSewa</p>
                  <p className="text-xs text-slate-400">{lang === "ne" ? "सिधा भुक्तानी" : "Direct payment"}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (!user) return requireLogin(); setActiveProvider(activeProvider === "esewa" ? null : "esewa"); }}>
                {activeProvider === "esewa" ? (lang === "ne" ? "बन्द" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </Button>
            </div>
            {activeProvider === "esewa" && instructions && (
              <ManualPayForm provider="esewa" receiverNumber={instructions.esewa.number} receiverName={instructions.esewa.name}
                amount={instructions.esewa.amount_npr} reference={reference} setReference={setReference}
                screenshot={screenshot} setScreenshot={setScreenshot} submitting={submitting} onSubmit={handleManualSubmit} lang={lang} />
            )}
          </Card>

          {/* Khalti */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-crimson-500 text-paper shadow-soft">
                  <Smartphone size={18} />
                </span>
                <div>
                  <p className="font-medium text-ink">Khalti</p>
                  <p className="text-xs text-slate-400">{lang === "ne" ? "सिधा भुक्तानी" : "Direct payment"}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { if (!user) return requireLogin(); setActiveProvider(activeProvider === "khalti" ? null : "khalti"); }}>
                {activeProvider === "khalti" ? (lang === "ne" ? "बन्द" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </Button>
            </div>
            {activeProvider === "khalti" && instructions && (
              <ManualPayForm provider="khalti" receiverNumber={instructions.khalti.number} receiverName={instructions.khalti.name}
                amount={instructions.khalti.amount_npr} reference={reference} setReference={setReference}
                screenshot={screenshot} setScreenshot={setScreenshot} submitting={submitting} onSubmit={handleManualSubmit} lang={lang} />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ManualPayForm({ provider, receiverNumber, receiverName, amount, reference, setReference, screenshot, setScreenshot, submitting, onSubmit, lang }: any) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="rounded-2xl bg-slate-50 p-4 text-sm">
        <p className="text-xs font-medium text-slate-500 mb-2">{lang === "ne" ? "यो नम्बरमा पठाउनुहोस्:" : "Send payment to:"}</p>
        <p className="font-mono text-lg font-bold text-ink">{receiverNumber || "—"}</p>
        <p className="text-xs text-slate-500">{receiverName}</p>
        <p className="mt-2 text-xs text-slate-500">
          {lang === "ne" ? "रकम:" : "Amount:"}{" "}
          <span className="font-bold text-ink">NPR {amount}</span>
        </p>
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Input label={lang === "ne" ? "कारोबार ID / सन्दर्भ नम्बर" : "Transaction ID / Reference"}
          required value={reference} onChange={(e: any) => setReference(e.target.value)}
          placeholder={lang === "ne" ? "भुक्तानी एपको कारोबार ID" : "From your payment app receipt"} />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-600">
            {lang === "ne" ? "स्क्रिनशट अपलोड" : "Upload screenshot"}
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 py-6 text-sm text-slate-400 hover:border-ink hover:text-ink transition-all">
            <Upload size={18} />
            {screenshot ? screenshot.name : lang === "ne" ? "फाइल छान्नुहोस्" : "Choose file"}
            <input type="file" accept="image/*" className="hidden" onChange={(e: any) => setScreenshot(e.target.files?.[0] ?? null)} required />
          </label>
        </div>
        <Button type="submit" className="w-full" loading={submitting} disabled={!reference.trim() || !screenshot}>
          {lang === "ne" ? "प्रमाण पठाउनुहोस्" : "Submit proof of payment"}
        </Button>
        <p className="text-center text-xs text-slate-400">
          {lang === "ne" ? "सामान्यतया २४ घण्टाभित्र जाँच गरिनेछ" : "Usually reviewed within 24 hours"}
        </p>
      </form>
    </div>
  );
}
