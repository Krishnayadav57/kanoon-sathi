"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gavel, BadgeCheck, Calendar, Star } from "lucide-react";
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
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { api.get("/lawyers/").then(r => setLawyers(r.data)); }, []);

  const submitBooking = async () => {
    if (!user) return router.push("/login?next=/lawyers");
    if (!booking?.date) return;
    setSubmitting(true); setError(null);
    try {
      await api.post("/lawyers/bookings", { lawyer_id: booking.lawyerId, scheduled_at: new Date(booking.date).toISOString() });
      setMessage(lang === "ne" ? "बुकिङ अनुरोध पठाइयो!" : "Booking request sent!");
      setBooking(null);
    } catch (e: any) { setError(getApiErrorMessage(e)); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "वकिल" : "Lawyers"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "वकिल बाजार" : "Lawyer Marketplace"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "यी डेमो प्रोफाइलहरू हुन् — लाइभ हुनुअघि वास्तविक वकिलले बदलिनेछ।" : "Demo profiles — will be replaced with verified real lawyers before launch."}
        </p>
      </div>

      {message && <div className="mb-5 animate-fade-in"><Alert variant="success">{message}</Alert></div>}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {lawyers.map((l, i) => (
          <Card key={l.id} className="animate-fade-up" style={{ animationDelay: `${i * 80}ms` } as any}>
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-ink text-paper font-display font-bold text-lg shadow-soft">
                {l.full_name[0]}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display text-base font-semibold text-ink truncate">{l.full_name}</h3>
                  <BadgeCheck size={15} className="shrink-0 text-emerald-500" />
                </div>
                <p className="text-xs font-semibold text-crimson-500 capitalize">{l.specialization.replace("_", " ")}</p>
              </div>
            </div>
            <p className="lang-ne text-sm text-slate-500 mb-4 line-clamp-2">{lang === "ne" ? l.bio_ne : l.bio_en}</p>
            <div className="flex items-center justify-between mb-4 text-sm">
              <span className="flex items-center gap-1 text-slate-400"><Star size={13} /> {l.years_experience} {lang === "ne" ? "वर्ष" : "yrs"}</span>
              <span className="font-semibold text-ink">NPR {l.consultation_fee_npr}</span>
            </div>

            {booking?.lawyerId === l.id ? (
              <div className="space-y-3 border-t border-slate-100 pt-4">
                <Input type="datetime-local" value={booking.date} onChange={e => setBooking({ lawyerId: l.id, date: e.target.value })} />
                {error && <Alert variant="error">{error}</Alert>}
                <div className="flex gap-2">
                  <Button size="sm" onClick={submitBooking} loading={submitting} className="flex-1">
                    <Calendar size={14} /> {lang === "ne" ? "पुष्टि" : "Confirm"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setBooking(null)}>
                    {lang === "ne" ? "रद्द" : "Cancel"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button size="sm" className="w-full" onClick={() => setBooking({ lawyerId: l.id, date: "" })}>
                <Calendar size={14} /> {lang === "ne" ? "सल्लाह बुक गर्नुहोस्" : "Book consultation"}
              </Button>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
