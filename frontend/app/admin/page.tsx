"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, DollarSign, Image as ImageIcon, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button, Card, Alert } from "@/components/ui";

type Revenue = { total_revenue_npr: number; revenue_last_30_days_npr: number; total_users: number; total_premium_users: number; revenue_by_provider: Record<string, number> };
type PendingPayment = { id: string; user_id: string; provider: string; amount_npr: number; user_submitted_reference: string; screenshot_path: string; created_at: string };
type AdminUser = { id: string; full_name: string; email: string; role: string; subscription_plan: string; is_active: boolean; created_at: string };

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [tab, setTab] = useState<"payments" | "users">("payments");

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/");
  }, [loading, user, router]);

  const loadAll = async () => {
    const [rev, pend, usr] = await Promise.all([
      api.get("/admin/revenue/summary"),
      api.get("/payments/admin/pending-review"),
      api.get("/admin/users"),
    ]);
    setRevenue(rev.data);
    setPending(pend.data);
    setUsers(usr.data);
  };

  useEffect(() => {
    if (user?.role === "admin") loadAll();
  }, [user]);

  const approve = async (id: string) => {
    setActioning(id);
    try {
      await api.post(`/payments/admin/${id}/approve`, new FormData());
      setMessage("Payment approved — user upgraded to Premium.");
      setPending((p) => p.filter((x) => x.id !== id));
    } finally {
      setActioning(null);
    }
  };

  const reject = async (id: string) => {
    const notes = window.prompt("Reason for rejection (shown internally):") || "Not verified";
    setActioning(id);
    try {
      const fd = new FormData();
      fd.append("notes", notes);
      await api.post(`/payments/admin/${id}/reject`, fd);
      setMessage("Payment rejected.");
      setPending((p) => p.filter((x) => x.id !== id));
    } finally {
      setActioning(null);
    }
  };

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-crimson-500" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <ShieldCheck className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">Admin Dashboard</h1>
      </div>

      {message && (
        <div className="mt-4">
          <Alert variant="success">{message}</Alert>
        </div>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <p className="text-xs text-slate-400">Total revenue</p>
          <p className="mt-1 text-xl font-semibold text-ink">NPR {revenue?.total_revenue_npr ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Last 30 days</p>
          <p className="mt-1 text-xl font-semibold text-ink">NPR {revenue?.revenue_last_30_days_npr ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Total users</p>
          <p className="mt-1 text-xl font-semibold text-ink">{revenue?.total_users ?? "—"}</p>
        </Card>
        <Card>
          <p className="text-xs text-slate-400">Premium users</p>
          <p className="mt-1 text-xl font-semibold text-ink">{revenue?.total_premium_users ?? "—"}</p>
        </Card>
      </div>

      <div className="mt-8 flex gap-2 border-b border-slate-100">
        {[
          { id: "payments", label: `Pending payments (${pending.length})` },
          { id: "users", label: "Users" },
        ].map((tb) => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id as any)}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === tb.id ? "border-crimson-500 text-crimson-500" : "border-transparent text-slate-500"}`}
          >
            {tb.label}
          </button>
        ))}
      </div>

      {tab === "payments" && (
        <div className="mt-5 space-y-3">
          {pending.map((p) => (
            <Card key={p.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-50 text-slate-400">
                  <ImageIcon size={20} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink capitalize">{p.provider} — NPR {p.amount_npr}</p>
                  <p className="font-mono text-xs text-slate-500">Ref: {p.user_submitted_reference}</p>
                  <p className="text-xs text-slate-400">{new Date(p.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => approve(p.id)} loading={actioning === p.id}>
                  <Check size={14} /> Approve
                </Button>
                <Button size="sm" variant="danger" onClick={() => reject(p.id)} loading={actioning === p.id}>
                  <X size={14} /> Reject
                </Button>
              </div>
            </Card>
          ))}
          {pending.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No pending payments. 🎉</p>}
        </div>
      )}

      {tab === "users" && (
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-400">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 text-ink">{u.full_name}</td>
                  <td className="px-4 py-3 text-slate-500">{u.email}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{u.subscription_plan}</td>
                  <td className="px-4 py-3 capitalize text-slate-500">{u.role}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
