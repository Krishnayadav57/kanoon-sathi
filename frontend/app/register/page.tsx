"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { getApiErrorMessage } from "@/lib/api";
import { Button, Input, Select, Alert, Card } from "@/components/ui";
import SealMark from "@/components/SealMark";

export default function RegisterPage() {
  const { register } = useAuth();
  const { t } = useLang();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [preferredLanguage, setPreferredLanguage] = useState("ne");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register({ full_name: fullName, email, phone: phone || undefined, password, preferred_language: preferredLanguage });
      router.push("/dashboard");
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Registration failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <SealMark size={48} className="text-crimson-500" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t("register_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("register_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("full_name")} required value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <Input label={t("email")} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t("phone")} value={phone} onChange={(e) => setPhone(e.target.value)} />
          <Input label={t("password")} type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          <Select label={t("preferred_language")} value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
            <option value="ne">नेपाली (Nepali)</option>
            <option value="en">English</option>
          </Select>
          <Button type="submit" className="w-full" loading={submitting}>
            {t("submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {t("have_account")}{" "}
          <Link href="/login" className="font-semibold text-crimson-500">
            {t("nav_login")}
          </Link>
        </p>
      </Card>
    </div>
  );
}
