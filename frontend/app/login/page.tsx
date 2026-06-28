"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { getApiErrorMessage } from "@/lib/api";
import { Button, Input, Alert, Card } from "@/components/ui";
import SealMark from "@/components/SealMark";

function LoginForm() {
  const { login } = useAuth();
  const { t } = useLang();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.push(params.get("next") || "/dashboard");
    } catch (e: any) {
      setError(getApiErrorMessage(e, "Login failed."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <SealMark size={48} className="text-crimson-500" />
          <h1 className="mt-4 font-display text-2xl font-semibold text-ink">{t("login_title")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t("login_subtitle")}</p>
        </div>

        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label={t("email")} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Input label={t("password")} type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" className="w-full" loading={submitting}>
            {t("submit")}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-slate-500">
          {t("no_account")}{" "}
          <Link href="/register" className="font-semibold text-crimson-500">
            {t("nav_register")}
          </Link>
        </p>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
