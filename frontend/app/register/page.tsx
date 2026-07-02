"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { getApiErrorMessage } from "@/lib/api";
import { Button, Input, Select, Alert } from "@/components/ui";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", password: "", preferred_language: "ne" });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ ...form, phone: form.phone || undefined });
      router.push("/dashboard");
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink shadow-lifted">
            <Scale size={26} className="text-paper" strokeWidth={2} />
          </div>
          <h1 className="mt-5 font-display text-2xl font-semibold text-ink">{t("register_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register_subtitle")}</p>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-8 shadow-soft">
          {error && <div className="mb-5"><Alert variant="error">{error}</Alert></div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input label={t("full_name")} required value={form.full_name} onChange={e => set("full_name", e.target.value)} />
            <Input label={t("email")} type="email" required value={form.email} onChange={e => set("email", e.target.value)} />
            <Input label={t("phone")} value={form.phone} onChange={e => set("phone", e.target.value)} />
            <div className="relative">
              <Input label={t("password")} type={showPw ? "text" : "password"} required minLength={8} value={form.password} onChange={e => set("password", e.target.value)} className="pr-10" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute bottom-2.5 right-3 text-slate-400 hover:text-ink">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <Select label={t("preferred_language")} value={form.preferred_language} onChange={e => set("preferred_language", e.target.value)}>
              <option value="ne">नेपाली</option>
              <option value="en">English</option>
            </Select>
            <Button type="submit" className="w-full" loading={submitting} size="lg">{t("submit")}</Button>
          </form>
          <p className="mt-5 text-center text-sm text-slate-500">
            {t("have_account")}{" "}
            <Link href="/login" className="font-semibold text-crimson-500 hover:underline">{t("nav_login")}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
