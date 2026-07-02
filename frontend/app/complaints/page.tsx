"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Copy, CheckCheck } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Input, Textarea, Select, Alert } from "@/components/ui";

const TYPES = [
  { value: "police", labelEn: "Police complaint", labelNe: "प्रहरी उजुरी", icon: "🚔" },
  { value: "cyber_bureau", labelEn: "Cyber Bureau complaint", labelNe: "साइबर ब्यूरो उजुरी", icon: "🔒" },
  { value: "municipality", labelEn: "Municipality complaint", labelNe: "नगरपालिका उजुरी", icon: "🏛️" },
  { value: "consumer", labelEn: "Consumer complaint", labelNe: "उपभोक्ता उजुरी", icon: "🛒" },
  { value: "office_grievance", labelEn: "Office grievance letter", labelNe: "कार्यालय गुनासो पत्र", icon: "📋" },
];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();
  const [form, setForm] = useState({
    complaint_type: "police", full_name: "", address: "", contact_number: "",
    incident_date: "", incident_location: "", incident_description: "", respondent_name: "", additional_details: "",
  });
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return router.push("/login?next=/complaints");
    setLoading(true); setError(null);
    try {
      const res = await api.post("/complaints/generate", { ...form, language: lang });
      setGenerated(res.data.generated_text);
    } catch (e: any) { setError(getApiErrorMessage(e)); }
    finally { setLoading(false); }
  };

  const download = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `complaint-${form.complaint_type}-${Date.now()}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const copy = async () => {
    if (!generated) return;
    await navigator.clipboard.writeText(generated);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "उजुरी" : "Complaint"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">{t("nav_complaints")}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "मिनेटमै व्यावसायिक उजुरी पत्र तयार गर्नुहोस्।" : "Generate a professional complaint letter in minutes."}
        </p>
      </div>

      {/* Type selector */}
      <div className="animate-fade-up [animation-delay:60ms] mb-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
        {TYPES.map(ty => (
          <button
            key={ty.value}
            onClick={() => set("complaint_type", ty.value)}
            className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition-all duration-200 ${
              form.complaint_type === ty.value
                ? "border-ink bg-ink text-paper shadow-soft"
                : "border-slate-200 bg-white text-slate-600 hover:border-ink"
            }`}
          >
            <span className="text-xl">{ty.icon}</span>
            <span className="text-[11px] font-medium leading-tight">{lang === "ne" ? ty.labelNe : ty.labelEn}</span>
          </button>
        ))}
      </div>

      <div className="animate-fade-up [animation-delay:120ms] rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("full_name")} required value={form.full_name} onChange={e => set("full_name", e.target.value)} />
            <Input label={lang === "ne" ? "सम्पर्क नम्बर" : "Contact number"} required value={form.contact_number} onChange={e => set("contact_number", e.target.value)} />
          </div>
          <Input label={lang === "ne" ? "ठेगाना" : "Address"} required value={form.address} onChange={e => set("address", e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input type="date" label={lang === "ne" ? "घटना मिति" : "Incident date"} required value={form.incident_date} onChange={e => set("incident_date", e.target.value)} />
            <Input label={lang === "ne" ? "घटनास्थल" : "Incident location"} required value={form.incident_location} onChange={e => set("incident_location", e.target.value)} />
          </div>
          <Input label={lang === "ne" ? "विरुद्ध (वैकल्पिक)" : "Against (optional)"} value={form.respondent_name} onChange={e => set("respondent_name", e.target.value)} />
          <Textarea label={lang === "ne" ? "घटनाको विवरण" : "Incident description"} required rows={4} className="lang-ne" value={form.incident_description} onChange={e => set("incident_description", e.target.value)} />
          <Textarea label={lang === "ne" ? "थप विवरण (वैकल्पिक)" : "Additional details (optional)"} rows={2} className="lang-ne" value={form.additional_details} onChange={e => set("additional_details", e.target.value)} />
          {error && <Alert variant="error">{error}</Alert>}
          <Button type="submit" loading={loading} className="w-full" size="lg">{t("generate")}</Button>
        </form>
      </div>

      {generated && (
        <div className="mt-6 animate-fade-up rounded-3xl border border-slate-100 bg-white p-6 shadow-soft">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">{lang === "ne" ? "तयार पत्र" : "Generated letter"}</h3>
            <div className="flex gap-2">
              <button onClick={copy} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-ink hover:text-ink transition-all">
                {copied ? <CheckCheck size={14} className="text-emerald-500" /> : <Copy size={14} />}
                {copied ? (lang === "ne" ? "कपी!" : "Copied!") : (lang === "ne" ? "कपी" : "Copy")}
              </button>
              <button onClick={download} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:border-ink hover:text-ink transition-all">
                <Download size={14} /> {lang === "ne" ? "डाउनलोड" : "Download"}
              </button>
            </div>
          </div>
          <pre className="lang-ne whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm leading-relaxed text-ink font-body">{generated}</pre>
        </div>
      )}
    </div>
  );
}
