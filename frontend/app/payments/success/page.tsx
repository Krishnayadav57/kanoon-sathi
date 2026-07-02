"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle, Crown } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/lib/lang-context";
import { Button } from "@/components/ui";

function SuccessContent() {
  const params = useSearchParams();
  const { lang } = useLang();
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "error">("checking");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) { setStatus("error"); return; }
    api.get(`/payments/stripe/verify-session/${sessionId}`)
      .then(r => setStatus(r.data.status === "success" ? "success" : "pending"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-up rounded-3xl border border-slate-100 bg-white p-10 shadow-lifted text-center">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto animate-spin text-crimson-500" size={36} />
            <p className="mt-4 text-sm text-slate-500">{lang === "ne" ? "भुक्तानी जाँच गरिँदैछ…" : "Verifying your payment…"}</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-4">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h1 className="font-display text-2xl font-semibold text-ink">
              {lang === "ne" ? "धन्यवाद!" : "Thank you!"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {lang === "ne" ? "तपाईं अब प्रिमियम सदस्य हुनुहुन्छ।" : "You're now a Premium member."}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brass-50 px-4 py-2 text-sm font-bold text-brass-500">
              <Crown size={14} /> Premium activated
            </div>
            <Link href="/dashboard" className="block mt-6">
              <Button className="w-full">{lang === "ne" ? "ड्यासबोर्डमा जानुहोस्" : "Go to Dashboard"}</Button>
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <Loader2 className="mx-auto animate-spin text-brass-400" size={36} />
            <p className="mt-4 text-sm text-slate-500">
              {lang === "ne" ? "भुक्तानी प्रक्रियामा छ। केहि बेरमा फेरि जाँच गर्नुहोस्।" : "Payment is processing. Check again shortly."}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-crimson-50 mb-4">
              <XCircle size={32} className="text-crimson-500" />
            </div>
            <p className="text-sm text-slate-500">
              {lang === "ne" ? "भुक्तानी स्थिति पुष्टि गर्न सकिएन।" : "Could not confirm payment status."}
            </p>
            <Link href="/pricing" className="block mt-6">
              <Button variant="ghost" className="w-full">{lang === "ne" ? "फिर्ता" : "Back to pricing"}</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return <Suspense fallback={null}><SuccessContent /></Suspense>;
}
