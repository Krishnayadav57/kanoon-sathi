"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, BadgeCheck, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Card, Input, Alert } from "@/components/ui";

type Lawyer = { id: string; full_name: string; specialization: string; bio_en: string; bio_ne: string; years_experience: number; consultation_fee_npr: number; photo_url: string };

export default function LawyersPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [booking, setBooking] = useState<{ lawyerId: string; date: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get("/lawyers/").then((res) => setLawyers(res.data));
  }, []);

  const submitBooking = async () => {
    if (!user) return router.push("/login?next=/lawyers");
    if (!booking?.date) return;
    setSubmitting(true);
    setMessage(null);
    try {
      await api.post("/lawyers/bookings", { lawyer_id: booking.lawyerId, scheduled_at: new Date(booking.date).toISOString() });
      setMessage(lang === "ne" ? "बुकिङ अनुरोध पठाइयो!" : "Booking request sent!");
      setBooking(null);
    } catch (e: any) {
      setMessage(getApiErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Gavel className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "वकिल बाजार" : "Lawyer Marketplace"}
        </h1>
      </div>
      <p className="mt-2 text-sm text-slate-500">
        {lang === "ne" ? "यी प्रोफाइलहरू डेमो डाटा हुन्। साइट लाइभ हुनुअघि वास्तविक प्रमाणित वकिलले बदलिनेछ।" : "These profiles are demo data and will be replaced with verified real lawyers before launch."}
      </p>

      {message && (
        <div className="mt-4">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {lawyers.map((l) => (
          <Card key={l.id}>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-base font-semibold text-ink">{l.full_name}</h3>
              <BadgeCheck size={15} className="text-pine-500" />
            </div>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-crimson-500">{l.specialization.replace("_", " ")}</p>
            <p className="lang-ne mt-2 text-sm text-slate-500">{lang === "ne" ? l.bio_ne : l.bio_en}</p>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-slate-400">{l.years_experience} {lang === "ne" ? "वर्ष अनुभव" : "yrs experience"}</span>
              <span className="font-semibold text-ink">NPR {l.consultation_fee_npr}</span>
            </div>

            {booking?.lawyerId === l.id ? (
              <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
                <Input type="datetime-local" value={booking.date} onChange={(e) => setBooking({ lawyerId: l.id, date: e.target.value })} />
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitBooking} loading={submitting} className="flex-1">
                    {lang === "ne" ? "पुष्टि गर्नुहोस्" : "Confirm"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setBooking(null)}>
                    {lang === "ne" ? "रद्द" : "Cancel"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="mt-4 w-full" onClick={() => setBooking({ lawyerId: l.id, date: "" })}>
                {lang === "ne" ? "सल्लाह बुक गर्नुहोस्" : "Book consultation"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
