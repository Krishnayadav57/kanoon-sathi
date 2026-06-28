"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useLang } from "@/lib/lang-context";
import { Card, Button } from "@/components/ui";

function PaymentSuccessContent() {
  const params = useSearchParams();
  const { lang } = useLang();
  const [status, setStatus] = useState<"checking" | "success" | "pending" | "error">("checking");

  useEffect(() => {
    const sessionId = params.get("session_id");
    if (!sessionId) {
      setStatus("error");
      return;
    }
    api
      .get(`/payments/stripe/verify-session/${sessionId}`)
      .then((res) => setStatus(res.data.status === "success" ? "success" : "pending"))
      .catch(() => setStatus("error"));
  }, [params]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <Card className="w-full max-w-md text-center">
        {status === "checking" && (
          <>
            <Loader2 className="mx-auto animate-spin text-crimson-500" size={32} />
            <p className="mt-4 text-sm text-slate-500">{lang === "ne" ? "भुक्तानी जाँच गरिँदैछ…" : "Verifying your payment…"}</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-pine-500" size={40} />
            <h1 className="mt-4 font-display text-xl font-semibold text-ink">
              {lang === "ne" ? "धन्यवाद! तपाईं अब प्रिमियम सदस्य हुनुहुन्छ।" : "Thank you! You're now a Premium member."}
            </h1>
            <Link href="/dashboard">
              <Button className="mt-6">{lang === "ne" ? "ड्यासबोर्डमा जानुहोस्" : "Go to Dashboard"}</Button>
            </Link>
          </>
        )}
        {status === "pending" && (
          <>
            <Loader2 className="mx-auto animate-spin text-gold-400" size={32} />
            <p className="mt-4 text-sm text-slate-500">
              {lang === "ne" ? "भुक्तानी प्रक्रियामा छ। केहि बेरमा फेरि जाँच गर्नुहोस्।" : "Payment is still processing. Please check again shortly."}
            </p>
          </>
        )}
        {status === "error" && (
          <>
            <XCircle className="mx-auto text-red-500" size={36} />
            <p className="mt-4 text-sm text-slate-500">
              {lang === "ne" ? "भुक्तानी स्थिति पुष्टि गर्न सकिएन।" : "Could not confirm payment status."}
            </p>
            <Link href="/pricing">
              <Button variant="ghost" className="mt-6">{lang === "ne" ? "फिर्ता जानुहोस्" : "Back to pricing"}</Button>
            </Link>
          </>
        )}
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
