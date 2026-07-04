"use client";
// PHASE 3: restyled to brand.* tokens. Stripe/eSewa/Khalti logic, state, and
// API calls are unchanged from the original pricing page.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Smartphone, Upload, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";

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
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-10">
      <div className="text-center">
        <span className="text-xs font-bold uppercase tracking-wider text-brand-gold">
          {lang === "ne" ? "मूल्य" : "Pricing"}
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">
          {lang === "ne" ? "सरल, पारदर्शी मूल्य" : "Simple, transparent pricing"}
        </h1>
        <p className="mt-3 text-brand-text-secondary">
          {lang === "ne" ? "जुनसुकै बेला अपग्रेड वा रद्द गर्नुहोस्।" : "Upgrade or cancel anytime."}
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-brand">
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-text-secondary">{t("pricing_free")}</p>
          <p className="mt-1 text-sm text-brand-text-secondary">{t("pricing_free_desc")}</p>
          <p className="mt-4 font-display text-4xl font-bold text-brand-text">
            NPR 0 <span className="text-sm font-normal text-brand-text-secondary">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3">
            {freeFeatures.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <Check size={16} className="shrink-0 text-brand-text-secondary" /> {f}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative overflow-hidden rounded-2xl border-2 border-brand-navy bg-brand-card p-6 shadow-brand">
          <div className="absolute right-0 top-0 rounded-bl-2xl bg-brand-navy px-4 py-1.5">
            <span className="flex items-center gap-1 text-xs font-bold text-white">
              <Crown size={11} className="text-brand-gold" />
              {lang === "ne" ? "सर्वोत्तम" : "Best value"}
            </span>
          </div>
          <p className="font-display text-sm font-semibold uppercase tracking-wide text-brand-gold">{t("pricing_premium")}</p>
          <p className="mt-1 text-sm text-brand-text-secondary">{t("pricing_premium_desc")}</p>
          <p className="mt-4 font-display text-4xl font-bold text-brand-text">
            NPR {price} <span className="text-sm font-normal text-brand-text-secondary">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3">
            {premiumFeatures.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-brand-text-secondary">
                <Check size={16} className="shrink-0 text-brand-navy" /> {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {message && (
        <div className="mx-auto mt-8 max-w-xl">
          <div className={`rounded-xl border px-4 py-3 text-sm ${message.type === "success" ? "border-emerald-100 bg-emerald-50 text-emerald-600" : "border-red-100 bg-red-50 text-brand-danger"}`}>
            {message.text}
          </div>
        </div>
      )}

      <div className="mx-auto mt-12 max-w-xl">
        <h2 className="mb-6 text-center font-display text-lg font-semibold text-brand-text">{t("pay_with")}</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-navy text-white shadow-brand">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="font-medium text-brand-text">{lang === "ne" ? "कार्ड (अन्तर्राष्ट्रिय)" : "Card (International)"}</p>
                <p className="text-xs text-brand-text-secondary">Visa, Mastercard via Stripe</p>
              </div>
            </div>
            <button onClick={handleStripe} disabled={stripeLoading} className="rounded-xl bg-brand-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {stripeLoading ? "…" : t("pricing_subscribe")}
            </button>
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500 text-white shadow-brand">
                  <Smartphone size={18} />
                </span>
                <div>
                  <p className="font-medium text-brand-text">eSewa</p>
                  <p className="text-xs text-brand-text-secondary">{lang === "ne" ? "सिधा भुक्तानी" : "Direct payment"}</p>
                </div>
              </div>
              <button
                onClick={() => { if (!user) return requireLogin(); setActiveProvider(activeProvider === "esewa" ? null : "esewa"); }}
                className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-navy"
              >
                {activeProvider === "esewa" ? (lang === "ne" ? "बन्द" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </button>
            </div>
            {activeProvider === "esewa" && instructions && (
              <ManualPayForm receiverNumber={instructions.esewa.number} receiverName={instructions.esewa.name}
                amount={instructions.esewa.amount_npr} reference={reference} setReference={setReference}
                screenshot={screenshot} setScreenshot={setScreenshot} submitting={submitting} onSubmit={handleManualSubmit} lang={lang} />
            )}
          </div>

          <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-brand">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-danger text-white shadow-brand">
                  <Smartphone size={18} />
                </span>
                <div>
                  <p className="font-medium text-brand-text">Khalti</p>
                  <p className="text-xs text-brand-text-secondary">{lang === "ne" ? "सिधा भुक्तानी" : "Direct payment"}</p>
                </div>
              </div>
              <button
                onClick={() => { if (!user) return requireLogin(); setActiveProvider(activeProvider === "khalti" ? null : "khalti"); }}
                className="rounded-xl border border-brand-border px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-navy"
              >
                {activeProvider === "khalti" ? (lang === "ne" ? "बन्द" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </button>
            </div>
            {activeProvider === "khalti" && instructions && (
              <ManualPayForm receiverNumber={instructions.khalti.number} receiverName={instructions.khalti.name}
                amount={instructions.khalti.amount_npr} reference={reference} setReference={setReference}
                screenshot={screenshot} setScreenshot={setScreenshot} submitting={submitting} onSubmit={handleManualSubmit} lang={lang} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ManualPayForm({ receiverNumber, receiverName, amount, reference, setReference, screenshot, setScreenshot, submitting, onSubmit, lang }: any) {
  return (
    <div className="mt-4 border-t border-brand-border pt-4">
      <div className="rounded-xl bg-brand-bg p-4 text-sm">
        <p className="text-xs font-medium text-brand-text-secondary mb-2">{lang === "ne" ? "यो नम्बरमा पठाउनुहोस्:" : "Send payment to:"}</p>
        <p className="font-mono text-lg font-bold text-brand-text">{receiverNumber || "—"}</p>
        <p className="text-xs text-brand-text-secondary">{receiverName}</p>
        <p className="mt-2 text-xs text-brand-text-secondary">
          {lang === "ne" ? "रकम:" : "Amount:"} <span className="font-bold text-brand-text">NPR {amount}</span>
        </p>
      </div>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text-secondary">
            {lang === "ne" ? "कारोबार ID / सन्दर्भ नम्बर" : "Transaction ID / Reference"}
          </label>
          <input
            required value={reference} onChange={(e: any) => setReference(e.target.value)}
            placeholder={lang === "ne" ? "भुक्तानी एपको कारोबार ID" : "From your payment app receipt"}
            className="w-full rounded-xl border border-brand-border bg-white px-4 py-2.5 text-sm text-brand-text placeholder:text-brand-text-secondary focus:border-brand-navy focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-brand-text-secondary">
            {lang === "ne" ? "स्क्रिनशट अपलोड" : "Upload screenshot"}
          </label>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border py-6 text-sm text-brand-text-secondary hover:border-brand-navy transition-all">
            <Upload size={18} />
            {screenshot ? screenshot.name : lang === "ne" ? "फाइल छान्नुहोस्" : "Choose file"}
            <input type="file" accept="image/*" className="hidden" onChange={(e: any) => setScreenshot(e.target.files?.[0] ?? null)} required />
          </label>
        </div>
        <button type="submit" disabled={submitting || !reference.trim() || !screenshot} className="w-full rounded-xl bg-brand-navy py-2.5 text-sm font-semibold text-white disabled:opacity-50">
          {submitting ? "…" : (lang === "ne" ? "प्रमाण पठाउनुहोस्" : "Submit proof of payment")}
        </button>
        <p className="text-center text-xs text-brand-text-secondary">
          {lang === "ne" ? "सामान्यतया २४ घण्टाभित्र जाँच गरिनेछ" : "Usually reviewed within 24 hours"}
        </p>
      </form>
    </div>
  );
}
