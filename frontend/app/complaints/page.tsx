"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Download, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Input, Textarea, Select, Card, Alert } from "@/components/ui";

const TYPES = [
  { value: "police", labelEn: "Police complaint", labelNe: "प्रहरी उजुरी" },
  { value: "cyber_bureau", labelEn: "Cyber Bureau complaint", labelNe: "साइबर ब्यूरो उजुरी" },
  { value: "municipality", labelEn: "Municipality complaint", labelNe: "नगरपालिका उजुरी" },
  { value: "consumer", labelEn: "Consumer complaint", labelNe: "उपभोक्ता उजुरी" },
  { value: "office_grievance", labelEn: "Office grievance letter", labelNe: "कार्यालय गुनासो पत्र" },
];

export default function ComplaintsPage() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();

  const [form, setForm] = useState({
    complaint_type: "police",
    full_name: "",
    address: "",
    contact_number: "",
    incident_date: "",
    incident_location: "",
    incident_description: "",
    respondent_name: "",
    additional_details: "",
  });
  const [generated, setGenerated] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login?next=/complaints");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/complaints/generate", { ...form, language: lang });
      setGenerated(res.data.generated_text);
    } catch (e: any) {
      setError(getApiErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const downloadText = () => {
    if (!generated) return;
    const blob = new Blob([generated], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `complaint-${form.complaint_type}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <FileText className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">{t("nav_complaints")}</h1>
      </div>

      <Card className="mt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select label={t("complaint_type")} value={form.complaint_type} onChange={(e) => update("complaint_type", e.target.value)}>
            {TYPES.map((ty) => (
              <option key={ty.value} value={ty.value}>
                {lang === "ne" ? ty.labelNe : ty.labelEn}
              </option>
            ))}
          </Select>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={t("full_name")} required value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
            <Input label={lang === "ne" ? "सम्पर्क नम्बर" : "Contact number"} required value={form.contact_number} onChange={(e) => update("contact_number", e.target.value)} />
          </div>

          <Input label={lang === "ne" ? "ठेगाना" : "Address"} required value={form.address} onChange={(e) => update("address", e.target.value)} />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input type="date" label={lang === "ne" ? "घटना मिति" : "Incident date"} required value={form.incident_date} onChange={(e) => update("incident_date", e.target.value)} />
            <Input label={lang === "ne" ? "घटनास्थल" : "Incident location"} required value={form.incident_location} onChange={(e) => update("incident_location", e.target.value)} />
          </div>

          <Input
            label={lang === "ne" ? "विरुद्ध (वैकल्पिक)" : "Against (optional)"}
            placeholder={lang === "ne" ? "व्यक्ति/संस्थाको नाम" : "Name of person/entity"}
            value={form.respondent_name}
            onChange={(e) => update("respondent_name", e.target.value)}
          />

          <Textarea
            label={lang === "ne" ? "घटनाको विवरण" : "Incident description"}
            required
            rows={4}
            className="lang-ne"
            value={form.incident_description}
            onChange={(e) => update("incident_description", e.target.value)}
          />

          <Textarea
            label={lang === "ne" ? "थप विवरण (वैकल्पिक)" : "Additional details (optional)"}
            rows={2}
            className="lang-ne"
            value={form.additional_details}
            onChange={(e) => update("additional_details", e.target.value)}
          />

          <Button type="submit" loading={loading} className="w-full">
            {t("generate")}
          </Button>
        </form>
      </Card>

      {error && (
        <div className="mt-5">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {generated && (
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-base font-semibold text-ink">
              {lang === "ne" ? "तयार पत्र" : "Generated letter"}
            </h3>
            <Button variant="ghost" size="sm" onClick={downloadText}>
              <Download size={14} /> {t("download")}
            </Button>
          </div>
          <pre className="lang-ne mt-4 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-ink">
            {generated}
          </pre>
        </Card>
      )}
    </div>
  );
}
