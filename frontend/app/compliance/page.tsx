"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, CheckCircle2, Circle, Plus, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Button, Card, Input, Select } from "@/components/ui";

type ChecklistItem = { item_en: string; item_ne: string };
type Reminder = { id: string; title: string; reminder_type: string; due_date: string; is_completed: boolean };

export default function CompliancePage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("company_renewal");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => { api.get("/compliance/checklist").then(r => setChecklist(r.data)); }, []);
  useEffect(() => { if (user) api.get("/compliance/reminders").then(r => setReminders(r.data)); }, [user]);

  const addReminder = async () => {
    if (!user) return router.push("/login?next=/compliance");
    if (!title.trim() || !dueDate) return;
    await api.post("/compliance/reminders", { title, reminder_type: type, due_date: new Date(dueDate).toISOString() });
    const res = await api.get("/compliance/reminders");
    setReminders(res.data); setTitle(""); setDueDate(""); setShowForm(false);
  };

  const complete = async (id: string) => {
    await api.patch(`/compliance/reminders/${id}/complete`);
    setReminders(r => r.map(x => x.id === id ? { ...x, is_completed: true } : x));
  };

  const daysUntil = (date: string) => Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "व्यवसाय" : "Business"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "व्यवसाय अनुपालन" : "Business Compliance Assistant"}
        </h1>
      </div>

      <Card className="mb-6 animate-fade-up [animation-delay:60ms]">
        <h3 className="font-display text-base font-semibold text-ink mb-4">
          ✅ {lang === "ne" ? "अनुपालन चेकलिस्ट" : "Compliance checklist"}
        </h3>
        <ul className="space-y-2.5">
          {checklist.map((item, i) => (
            <li key={i} className="flex items-center gap-2.5 text-sm text-slate-600">
              <CheckCircle2 size={15} className="shrink-0 text-emerald-500" />
              {lang === "ne" ? item.item_ne : item.item_en}
            </li>
          ))}
        </ul>
      </Card>

      <Card className="animate-fade-up [animation-delay:120ms]">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-base font-semibold text-ink">
            <Bell size={15} className="inline mr-1.5 text-crimson-500" />
            {lang === "ne" ? "मेरा रिमाइन्डरहरू" : "My reminders"}
          </h3>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} /> {lang === "ne" ? "थप्नुहोस्" : "Add"}
          </Button>
        </div>

        {showForm && (
          <div className="mb-5 space-y-3 rounded-2xl bg-slate-50 p-4 border border-slate-100">
            <Input label={lang === "ne" ? "शीर्षक" : "Title"} value={title} onChange={e => setTitle(e.target.value)} />
            <Select label={lang === "ne" ? "प्रकार" : "Type"} value={type} onChange={e => setType(e.target.value)}>
              <option value="company_renewal">{lang === "ne" ? "कम्पनी नवीकरण" : "Company renewal"}</option>
              <option value="tax">{lang === "ne" ? "कर" : "Tax"}</option>
              <option value="license">{lang === "ne" ? "लाइसेन्स" : "License"}</option>
            </Select>
            <Input type="date" label={lang === "ne" ? "म्याद मिति" : "Due date"} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            <Button onClick={addReminder} size="sm" className="w-full" disabled={!title.trim() || !dueDate}>
              {lang === "ne" ? "सेभ" : "Save reminder"}
            </Button>
          </div>
        )}

        <div className="space-y-2">
          {reminders.map(r => {
            const days = daysUntil(r.due_date);
            const urgent = days <= 7 && !r.is_completed;
            return (
              <div key={r.id} className={`flex items-center justify-between rounded-2xl border px-4 py-3 transition-all ${r.is_completed ? "border-slate-100 bg-slate-50 opacity-60" : urgent ? "border-crimson-100 bg-crimson-50" : "border-slate-100 bg-white"}`}>
                <div className="flex items-center gap-3">
                  <button onClick={() => !r.is_completed && complete(r.id)} className="shrink-0">
                    {r.is_completed ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Circle size={18} className="text-slate-300" />}
                  </button>
                  <div>
                    <p className={`text-sm font-medium ${r.is_completed ? "line-through text-slate-400" : "text-ink"}`}>{r.title}</p>
                    <p className="text-xs text-slate-400">{new Date(r.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
                {!r.is_completed && (
                  <span className={`text-xs font-semibold ${urgent ? "text-crimson-500" : "text-slate-400"}`}>
                    {days > 0 ? `${days}d` : lang === "ne" ? "म्याद सकियो" : "Overdue"}
                  </span>
                )}
              </div>
            );
          })}
          {reminders.length === 0 && !showForm && (
            <p className="py-6 text-center text-sm text-slate-400">{lang === "ne" ? "कुनै रिमाइन्डर छैन।" : "No reminders yet."}</p>
          )}
        </div>
      </Card>
    </div>
  );
}
