"use client";

import { useEffect, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Card } from "@/components/ui";

type Office = { id: string; office_type: string; name_en: string; name_ne: string; address: string; district: string; phone: string };

const TYPE_FILTERS = [
  { value: "", labelEn: "All", labelNe: "सबै" },
  { value: "police", labelEn: "Police", labelNe: "प्रहरी" },
  { value: "traffic", labelEn: "Traffic", labelNe: "ट्राफिक" },
  { value: "court", labelEn: "Court", labelNe: "अदालत" },
  { value: "government", labelEn: "Government", labelNe: "सरकारी" },
];

export default function OfficesPage() {
  const { lang } = useLang();
  const [offices, setOffices] = useState<Office[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const params = filter ? { office_type: filter } : {};
    api.get("/offices/", { params }).then((res) => setOffices(res.data));
  }, [filter]);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <MapPin className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "कार्यालय खोजकर्ता" : "Office Locator"}
        </h1>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TYPE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filter === f.value ? "bg-crimson-500 text-paper" : "bg-slate-50 text-slate-600"}`}
          >
            {lang === "ne" ? f.labelNe : f.labelEn}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {offices.map((o) => (
          <Card key={o.id} className="flex items-start justify-between gap-4">
            <div>
              <h3 className="lang-ne font-display text-base font-semibold text-ink">{lang === "ne" ? o.name_ne : o.name_en}</h3>
              <p className="mt-1 text-sm text-slate-500">{o.address}</p>
              <p className="text-xs text-slate-400">{o.district}</p>
            </div>
            {o.phone && (
              <a href={`tel:${o.phone}`} className="flex shrink-0 items-center gap-1.5 rounded-full bg-pine-50 px-3 py-1.5 text-xs font-semibold text-pine-500">
                <Phone size={13} /> {o.phone}
              </a>
            )}
          </Card>
        ))}
        {offices.length === 0 && <p className="text-sm text-slate-400">{lang === "ne" ? "कुनै कार्यालय फेला परेन।" : "No offices found."}</p>}
      </div>
    </div>
  );
}
