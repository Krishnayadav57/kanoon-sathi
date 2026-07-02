"use client";
import { useEffect, useState } from "react";
import { MapPin, Phone, Building } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";

type Office = { id: string; office_type: string; name_en: string; name_ne: string; address: string; district: string; phone: string };

const TYPE_FILTERS = [
  { value: "", labelEn: "All", labelNe: "सबै", icon: "🏢" },
  { value: "police", labelEn: "Police", labelNe: "प्रहरी", icon: "🚔" },
  { value: "traffic", labelEn: "Traffic", labelNe: "ट्राफिक", icon: "🚦" },
  { value: "court", labelEn: "Court", labelNe: "अदालत", icon: "⚖️" },
  { value: "government", labelEn: "Government", labelNe: "सरकारी", icon: "🏛️" },
];

export default function OfficesPage() {
  const { lang } = useLang();
  const [offices, setOffices] = useState<Office[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = filter ? { office_type: filter } : {};
    api.get("/offices/", { params }).then(r => setOffices(r.data));
  }, [filter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "स्थान" : "Locations"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "कार्यालय खोजकर्ता" : "Office Locator"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "नजिकैको सरकारी कार्यालय र सम्पर्क जानकारी।" : "Find nearby government offices and contact information."}
        </p>
      </div>

      <div className="animate-fade-up [animation-delay:60ms] mb-6 flex flex-wrap gap-2">
        {TYPE_FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${
              filter === f.value ? "bg-ink text-paper shadow-soft" : "border border-slate-200 bg-white text-slate-600 hover:border-ink"
            }`}
          >
            <span>{f.icon}</span> {lang === "ne" ? f.labelNe : f.labelEn}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {offices.map((o, i) => (
          <div key={o.id} className="reveal animate-fade-up rounded-2xl border border-slate-100 bg-white p-5 shadow-soft transition-all hover:shadow-lifted"
            style={{ animationDelay: `${Math.min(i * 60, 360)}ms` }}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-lg">
                  {TYPE_FILTERS.find(f => f.value === o.office_type)?.icon || "🏢"}
                </span>
                <div className="min-w-0">
                  <h3 className="lang-ne font-display text-base font-semibold text-ink">
                    {lang === "ne" ? o.name_ne : o.name_en}
                  </h3>
                  <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin size={12} className="shrink-0" /> {o.address}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{o.district}</p>
                </div>
              </div>
              {o.phone && (
                <a href={`tel:${o.phone}`}
                  className="flex shrink-0 items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-all">
                  <Phone size={13} /> {o.phone}
                </a>
              )}
            </div>
          </div>
        ))}
        {offices.length === 0 && (
          <div className="py-16 text-center">
            <Building size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">{lang === "ne" ? "कुनै कार्यालय फेला परेन।" : "No offices found."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
