"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Circle, Plus, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Button, Card, Input, Select } from "@/components/ui";

type ChecklistItem = { item_en: string; item_ne: string };
type Reminder = { id: string; title: string; reminder_type: string; due_date: string; is_completed: boolean };

export default function CompliancePage() {
  const { user, loading } = useAuth();
  const { lang } = useLang();
  const router = useRouter();

  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("company_renewal");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    api.get("/compliance/checklist").then((res) => setChecklist(res.data));
  }, []);

  useEffect(() => {
    if (user) api.get("/compliance/reminders").then((res) => setReminders(res.data));
  }, [user]);

  const addReminder = async () => {
    if (!user) return router.push("/login?next=/compliance");
    if (!title.trim() || !dueDate) return;
    await api.post("/compliance/reminders", { title, reminder_type: type, due_date: new Date(dueDate).toISOString() });
    const res = await api.get("/compliance/reminders");
    setReminders(res.data);
    setTitle("");
    setDueDate("");
    setShowForm(false);
  };

  const completeReminder = async (id: string) => {
    await api.patch(`/compliance/reminders/${id}/complete`);
    setReminders((r) => r.map((x) => (x.id === id ? { ...x, is_completed: true } : x)));
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <Building2 className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "व्यवसाय अनुपालन" : "Business Compliance Assistant"}
        </h1>
      </div>

      <Card className="mt-6">
        <h3 className="font-display text-base font-semibold text-ink">{lang === "ne" ? "अनुपालन चेकलिस्ट" : "Compliance checklist"}</h3>
        <ul className="mt-3 space-y-2">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-pine-500" />
              {lang === "ne" ? item.item_ne : item.item_en}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="mt-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-base font-semibold text-ink">{lang === "ne" ? "मेरो रिमाइन्डरहरू" : "My reminders"}</h3>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {lang === "ne" ? "थप्नुहोस्" : "Add"}
          </Button>
        </div>

        {showForm && (
          <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
            <Input label={lang === "ne" ? "शीर्षक" : "Title"} value={title} onChange={(e) => setTitle(e.target.value)} />
            <Select label={lang === "ne" ? "प्रकार" : "Type"} value={type} onChange={(e) => setType(e.target.value)}>
              <option value="company_renewal">{lang === "ne" ? "कम्पनी नवीकरण" : "Company renewal"}</option>
              <option value="tax">{lang === "ne" ? "कर" : "Tax"}</option>
              <option value="license">{lang === "ne" ? "लाइसेन्स" : "License"}</option>
            </Select>
            <Input type="date" label={lang === "ne" ? "म्याद मिति" : "Due date"} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <Button onClick={addReminder} className="w-full" size="sm">
              {lang === "ne" ? "सेभ गर्नुहोस्" : "Save reminder"}
            </Button>
          </div>
        )}

        <div className="mt-4 space-y-2">
          {reminders.map((r) => (
            <div key={r.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => !r.is_completed && completeReminder(r.id)}>
                  {r.is_completed ? <CheckCircle2 size={18} className="text-pine-500" /> : <Circle size={18} className="text-slate-300" />}
                </button>
                <div>
                  <p className={`text-sm ${r.is_completed ? "text-slate-400 line-through" : "text-ink"}`}>{r.title}</p>
                  <p className="text-xs text-slate-400">{new Date(r.due_date).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
          {reminders.length === 0 && !showForm && (
            <p className="text-sm text-slate-400">{lang === "ne" ? "कुनै रिमाइन्डर छैन।" : "No reminders yet."}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
