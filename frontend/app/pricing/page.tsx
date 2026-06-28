"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, Smartphone, Loader2, Upload } from "lucide-react";
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);

  useEffect(() => {
    api.get("/payments/manual-instructions").then((res) => setInstructions(res.data)).catch(() => {});
  }, []);

  const requireLogin = () => {
    router.push("/login?next=/pricing");
  };

  const handleStripeCheckout = async () => {
    if (!user) return requireLogin();
    setStripeLoading(true);
    setMessage(null);
    try {
      const res = await api.post("/payments/stripe/create-checkout-session");
      window.location.href = res.data.checkout_url;
    } catch (e: any) {
      setMessage({ type: "error", text: getApiErrorMessage(e, "Could not start Stripe checkout.") });
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
      const formData = new FormData();
      formData.append("provider", activeProvider);
      formData.append("transaction_reference", reference.trim());
      formData.append("screenshot", screenshot);
      const res = await api.post("/payments/manual/submit", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessage({ type: "success", text: res.data.message });
      setReference("");
      setScreenshot(null);
      setActiveProvider(null);
    } catch (e: any) {
      setMessage({ type: "error", text: getApiErrorMessage(e, "Submission failed.") });
    } finally {
      setSubmitting(false);
    }
  };

  const price = instructions?.esewa.amount_npr ?? 499;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="font-display text-3xl font-semibold text-ink">
          {lang === "ne" ? "सरल, पारदर्शी मूल्य" : "Simple, transparent pricing"}
        </h1>
        <p className="mt-2 text-slate-500">
          {lang === "ne" ? "जुनसुकै बेला अपग्रेड वा रद्द गर्नुहोस्।" : "Upgrade or cancel anytime."}
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <h3 className="font-display text-xl font-semibold text-ink">{t("pricing_free")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("pricing_free_desc")}</p>
          <p className="mt-4 text-3xl font-semibold text-ink">
            NPR 0 <span className="text-sm font-normal text-slate-400">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {[
              lang === "ne" ? "दैनिक १० AI म्यासेज" : "10 AI messages per day",
              lang === "ne" ? "पूर्ण ज्ञान आधार पहुँच" : "Full knowledge base access",
              lang === "ne" ? "विज्ञापन समावेश" : "Ads included",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-pine-500" /> {item}
              </li>
            ))}
          </ul>
        </Card>

        <Card className="border-crimson-200 ring-1 ring-crimson-100">
          <span className="inline-block rounded-full bg-gold-100 px-3 py-1 text-xs font-semibold text-gold-500">
            {lang === "ne" ? "सबैभन्दा लोकप्रिय" : "Most popular"}
          </span>
          <h3 className="mt-3 font-display text-xl font-semibold text-ink">{t("pricing_premium")}</h3>
          <p className="mt-1 text-sm text-slate-500">{t("pricing_premium_desc")}</p>
          <p className="mt-4 text-3xl font-semibold text-ink">
            NPR {price} <span className="text-sm font-normal text-slate-400">{t("pricing_per_month")}</span>
          </p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {[
              lang === "ne" ? "असीमित AI कुराकानी" : "Unlimited AI chat",
              lang === "ne" ? "विज्ञापन रहित" : "No ads",
              lang === "ne" ? "उन्नत कागजात विश्लेषण" : "Advanced document analysis",
              lang === "ne" ? "प्राथमिकता जवाफ" : "Priority responses",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check size={16} className="mt-0.5 shrink-0 text-crimson-500" /> {item}
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

      <div className="mx-auto mt-10 max-w-xl">
        <h2 className="text-center font-display text-lg font-semibold text-ink">{t("pay_with")}</h2>

        <div className="mt-5 space-y-4">
          {/* Stripe */}
          <Card className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
                <CreditCard size={18} />
              </span>
              <div>
                <p className="font-medium text-ink">{lang === "ne" ? "कार्ड (अन्तर्राष्ट्रिय)" : "Card (International)"}</p>
                <p className="text-xs text-slate-400">Visa, Mastercard via Stripe</p>
              </div>
            </div>
            <Button onClick={handleStripeCheckout} loading={stripeLoading} size="sm">
              {t("pricing_subscribe")}
            </Button>
          </Card>

          {/* eSewa */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-pine-500 text-paper">
                  <Smartphone size={18} />
                </span>
                <p className="font-medium text-ink">eSewa</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!user) return requireLogin();
                  setActiveProvider(activeProvider === "esewa" ? null : "esewa");
                }}
              >
                {activeProvider === "esewa" ? (lang === "ne" ? "बन्द गर्नुहोस्" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </Button>
            </div>
            {activeProvider === "esewa" && instructions && (
              <ManualPayForm
                provider="esewa"
                receiverNumber={instructions.esewa.number}
                receiverName={instructions.esewa.name}
                amount={instructions.esewa.amount_npr}
                reference={reference}
                setReference={setReference}
                screenshot={screenshot}
                setScreenshot={setScreenshot}
                submitting={submitting}
                onSubmit={handleManualSubmit}
                lang={lang}
              />
            )}
          </Card>

          {/* Khalti */}
          <Card>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-crimson-500 text-paper">
                  <Smartphone size={18} />
                </span>
                <p className="font-medium text-ink">Khalti</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (!user) return requireLogin();
                  setActiveProvider(activeProvider === "khalti" ? null : "khalti");
                }}
              >
                {activeProvider === "khalti" ? (lang === "ne" ? "बन्द गर्नुहोस्" : "Close") : (lang === "ne" ? "तिर्नुहोस्" : "Pay")}
              </Button>
            </div>
            {activeProvider === "khalti" && instructions && (
              <ManualPayForm
                provider="khalti"
                receiverNumber={instructions.khalti.number}
                receiverName={instructions.khalti.name}
                amount={instructions.khalti.amount_npr}
                reference={reference}
                setReference={setReference}
                screenshot={screenshot}
                setScreenshot={setScreenshot}
                submitting={submitting}
                onSubmit={handleManualSubmit}
                lang={lang}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ManualPayForm({
  provider, receiverNumber, receiverName, amount, reference, setReference, screenshot, setScreenshot, submitting, onSubmit, lang,
}: {
  provider: string; receiverNumber: string; receiverName: string; amount: number;
  reference: string; setReference: (v: string) => void;
  screenshot: File | null; setScreenshot: (f: File | null) => void;
  submitting: boolean; onSubmit: (e: React.FormEvent) => void; lang: string;
}) {
  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <div className="rounded-xl bg-slate-50 p-4 text-sm">
        <p className="text-slate-500">{lang === "ne" ? "यो नम्बरमा पठाउनुहोस्:" : "Send payment to:"}</p>
        <p className="mt-1 font-mono text-base font-semibold text-ink">{receiverNumber || "—"}</p>
        <p className="text-xs text-slate-500">{receiverName}</p>
        <p className="mt-2 text-xs text-slate-500">
          {lang === "ne" ? "रकम:" : "Amount:"} <span className="font-semibold text-ink">NPR {amount}</span>
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <Input
          label={lang === "ne" ? "कारोबार सन्दर्भ नम्बर / ID" : "Transaction reference / ID"}
          required
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder={lang === "ne" ? "तपाईंको पेमेन्ट एपको कारोबार ID" : "From your payment app's receipt"}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            {lang === "ne" ? "स्क्रिनशट अपलोड गर्नुहोस्" : "Upload screenshot"}
          </label>
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-sm text-slate-500 hover:border-crimson-300">
            <Upload size={16} />
            {screenshot ? screenshot.name : lang === "ne" ? "फाइल छान्नुहोस्" : "Choose file"}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="hidden"
              onChange={(e) => setScreenshot(e.target.files?.[0] ?? null)}
              required
            />
          </label>
        </div>
        <Button type="submit" className="w-full" loading={submitting} disabled={!reference.trim() || !screenshot}>
          {lang === "ne" ? "प्रमाण पठाउनुहोस्" : "Submit proof of payment"}
        </Button>
        <p className="text-center text-xs text-slate-400">
          {lang === "ne" ? "तपाईंको भुक्तानी म्यानुअल रूपमा जाँच गरिनेछ, सामान्यतया २४ घण्टाभित्र।" : "Your payment will be manually reviewed, usually within 24 hours."}
        </p>
      </form>
    </div>
  );
}
