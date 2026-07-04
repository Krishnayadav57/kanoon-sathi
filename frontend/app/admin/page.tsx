"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck, Users, DollarSign, Clock, Check, X, Loader2,
  Crown, Search, ChevronDown, RefreshCw, TrendingUp, AlertCircle,
  Settings, Image as ImageIcon, ToggleLeft, ToggleRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { Button, Card, Alert, Input, Select } from "@/components/ui";

import { AdminShell } from "@/components/AdminSidebar";
import { StatCard, PanelCard, QuickActionButton } from "@/components/AdminWidgets";

type Revenue = {
  total_revenue_npr: number; revenue_last_30_days_npr: number;
  total_users: number; total_premium_users: number;
  revenue_by_provider: Record<string, number>;
};
type PendingPayment = {
  id: string; user_id: string; provider: string; amount_npr: number;
  user_submitted_reference: string; screenshot_path: string; created_at: string;
};
type AdminUser = {
  id: string; full_name: string; email: string; role: string;
  subscription_plan: string; is_active: boolean; created_at: string;
  subscription_expires_at?: string | null;
};

type Tab = "overview" | "payments" | "users" | "subscriptions" | "settings";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [pending, setPending] = useState<PendingPayment[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [actioning, setActioning] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [newPlan, setNewPlan] = useState<"free" | "premium">("premium");
  const [planExpiry, setPlanExpiry] = useState("");
  const [priceOverride, setPriceOverride] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) router.push("/");
  }, [loading, user, router]);

  const loadAll = async () => {
    setRefreshing(true);
    try {
      const [rev, pend, usr] = await Promise.all([
        api.get("/admin/revenue/summary"),
        api.get("/payments/admin/pending-review"),
        api.get("/admin/users"),
      ]);
      setRevenue(rev.data);
      setPending(pend.data);
      setUsers(usr.data);
    } finally { setRefreshing(false); }
  };

  useEffect(() => { if (user?.role === "admin") loadAll(); }, [user]);

  const approve = async (id: string) => {
    setActioning(id);
    try {
      await api.post(`/payments/admin/${id}/approve`, new FormData());
      setMessage({ type: "success", text: "✅ Payment approved — user upgraded to Premium." });
      setPending(p => p.filter(x => x.id !== id));
      loadAll();
    } catch (e: any) {
      setMessage({ type: "error", text: e?.response?.data?.detail || "Approval failed." });
    } finally { setActioning(null); }
  };

  const reject = async (id: string) => {
    const notes = window.prompt("Reason for rejection (shown to admin only):") || "Not verified";
    if (!notes) return;
    setActioning(id);
    try {
      const fd = new FormData(); fd.append("notes", notes);
      await api.post(`/payments/admin/${id}/reject`, fd);
      setMessage({ type: "error", text: "Payment rejected." });
      setPending(p => p.filter(x => x.id !== id));
    } finally { setActioning(null); }
  };

  const toggleUser = async (userId: string) => {
    try {
      await api.patch(`/admin/users/${userId}/toggle-active`);
      setUsers(u => u.map(x => x.id === userId ? { ...x, is_active: !x.is_active } : x));
      setMessage({ type: "success", text: "User status updated." });
    } catch { setMessage({ type: "error", text: "Failed to update user." }); }
  };

  const applyPlanOverride = async () => {
    if (!selectedUser) return;
    try {
      const fd = new FormData();
      fd.append("plan", newPlan);
      if (planExpiry) fd.append("expires_at", new Date(planExpiry).toISOString());
      await api.patch(`/admin/users/${selectedUser.id}/set-plan`, fd);
      setMessage({ type: "success", text: `Plan updated to ${newPlan} for ${selectedUser.full_name}.` });
      setSelectedUser(null);
      loadAll();
    } catch {
      // Fallback: direct DB-style update not in original schema, show instruction
      setMessage({ type: "error", text: "Plan override API not yet wired — update user plan directly in Supabase table editor (users.subscription_plan column)." });
    }
  };

  const filteredUsers = users.filter(u =>
    userSearch === "" ||
    u.full_name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  if (loading || !user || user.role !== "admin") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-crimson-500" size={28} />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "overview", label: "Overview" },
    { id: "payments", label: "Payments", badge: pending.length },
    { id: "users", label: "Users", badge: users.length },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "settings", label: "Settings" },
  ];

  return (
  <AdminShell>
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink shadow-soft">
            <ShieldCheck size={20} className="text-paper" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold text-ink">Admin Dashboard</h1>
            <p className="text-xs text-slate-400">Kanoon Mitra Control Panel</p>
          </div>
        </div>
        <button
          onClick={loadAll}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 hover:border-ink hover:text-ink transition-all"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {message && (
        <div className="mb-5 animate-fade-in">
          <Alert variant={message.type}>{message.text}</Alert>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 overflow-x-auto border-b border-slate-100 pb-px">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-all ${
              tab === t.id
                ? "border-crimson-500 text-crimson-600"
                : "border-transparent text-slate-500 hover:text-ink"
            }`}
          >
            {t.label}
            {t.badge !== undefined && t.badge > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                tab === t.id ? "bg-crimson-500 text-paper" : "bg-slate-200 text-slate-600"
              }`}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* OVERVIEW */}
      {tab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total Revenue", value: `NPR ${revenue?.total_revenue_npr?.toLocaleString() ?? "—"}`, icon: DollarSign, color: "text-emerald-500 bg-emerald-50" },
              { label: "Last 30 days", value: `NPR ${revenue?.revenue_last_30_days_npr?.toLocaleString() ?? "—"}`, icon: TrendingUp, color: "text-crimson-500 bg-crimson-50" },
              { label: "Total Users", value: revenue?.total_users ?? "—", icon: Users, color: "text-ink bg-slate-100" },
              { label: "Premium Users", value: revenue?.total_premium_users ?? "—", icon: Crown, color: "text-brass-500 bg-brass-50" },
            ].map(s => (
              <Card key={s.label}>
                <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon size={18} />
                </span>
                <p className="mt-3 font-display text-2xl font-semibold text-ink">{s.value}</p>
                <p className="text-xs text-slate-500">{s.label}</p>
              </Card>
            ))}
          </div>

          {/* Revenue by provider */}
          {revenue?.revenue_by_provider && Object.keys(revenue.revenue_by_provider).length > 0 && (
            <Card>
              <h3 className="font-display text-sm font-semibold text-ink mb-4">Revenue by provider</h3>
              <div className="space-y-3">
                {Object.entries(revenue.revenue_by_provider).map(([provider, amount]) => {
                  const total = revenue.total_revenue_npr || 1;
                  const pct = Math.round((amount / total) * 100);
                  return (
                    <div key={provider}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-ink capitalize">{provider}</span>
                        <span className="text-slate-500">NPR {amount.toLocaleString()} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Pending payments preview */}
          {pending.length > 0 && (
            <Card className="border-brass-100 bg-brass-50">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={16} className="text-brass-500" />
                <h3 className="font-display text-sm font-semibold text-ink">
                  {pending.length} payment{pending.length > 1 ? "s" : ""} awaiting review
                </h3>
              </div>
              <Button size="sm" onClick={() => setTab("payments")}>Review now</Button>
            </Card>
          )}
        </div>
      )}

      {/* PAYMENTS */}
      {tab === "payments" && (
        <div className="animate-fade-up space-y-4">
          {pending.length === 0 ? (
            <div className="py-16 text-center">
              <Check size={32} className="mx-auto text-emerald-300" />
              <p className="mt-3 font-display text-base font-semibold text-slate-500">All caught up! No pending payments.</p>
            </div>
          ) : pending.map(p => (
            <Card key={p.id} className="border-brass-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100">
                    <ImageIcon size={20} className="text-slate-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-display text-base font-semibold text-ink capitalize">{p.provider}</span>
                      <span className="rounded-full bg-brass-100 px-2 py-0.5 text-xs font-bold text-brass-500">NPR {p.amount_npr}</span>
                    </div>
                    <p className="font-mono text-xs text-slate-500 mt-0.5">Ref: {p.user_submitted_reference}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(p.created_at).toLocaleString()}</p>
                    {p.screenshot_path && (
                      <p className="text-xs text-emerald-600 mt-0.5">📎 Screenshot attached</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 sm:shrink-0">
                  <Button size="sm" variant="secondary" onClick={() => approve(p.id)} loading={actioning === p.id}>
                    <Check size={14} /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => reject(p.id)} loading={actioning === p.id}>
                    <X size={14} /> Reject
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* USERS */}
      {tab === "users" && (
        <div className="animate-fade-up">
          <div className="mb-4 relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={userSearch}
              onChange={e => setUserSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-ink focus:outline-none focus:ring-2 focus:ring-crimson-100 shadow-soft transition-all"
            />
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-soft">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left">
                <tr>
                  {["Name", "Email", "Plan", "Role", "Status", "Joined", "Actions"].map(h => (
                    <th key={h} className="px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(u => (
                  <tr key={u.id} className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-ink">{u.full_name}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${
                        u.subscription_plan === "premium" ? "bg-brass-50 text-brass-500" : "bg-slate-100 text-slate-500"
                      }`}>
                        {u.subscription_plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 capitalize text-xs">{u.role}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${u.is_active ? "bg-emerald-50 text-emerald-600" : "bg-crimson-50 text-crimson-500"}`}>
                        {u.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => toggleUser(u.id)} title="Toggle active" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-ink hover:text-ink transition-all">
                          {u.is_active ? <ToggleRight size={14} className="text-emerald-500" /> : <ToggleLeft size={14} />}
                        </button>
                        <button onClick={() => { setSelectedUser(u); setNewPlan(u.subscription_plan as any); setTab("subscriptions"); }}
                          title="Manage subscription" className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-crimson-400 hover:text-crimson-500 transition-all">
                          <Crown size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="py-10 text-center text-sm text-slate-400">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* SUBSCRIPTIONS */}
      {tab === "subscriptions" && (
        <div className="animate-fade-up space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Free users</p>
              <p className="font-display text-3xl font-semibold text-ink">
                {revenue ? revenue.total_users - revenue.total_premium_users : "—"}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Premium users</p>
              <p className="font-display text-3xl font-semibold text-brass-500">
                {revenue?.total_premium_users ?? "—"}
              </p>
            </Card>
            <Card>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-1">Conversion rate</p>
              <p className="font-display text-3xl font-semibold text-emerald-500">
                {revenue && revenue.total_users > 0
                  ? `${Math.round((revenue.total_premium_users / revenue.total_users) * 100)}%`
                  : "—"}
              </p>
            </Card>
          </div>

          {/* Manual plan override */}
          <Card>
            <h3 className="font-display text-base font-semibold text-ink mb-4">
              <Crown size={15} className="inline mr-1.5 text-brass-500" /> Manual Plan Override
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              Override a user&apos;s subscription plan directly. This is the manual method until a backend
              `/admin/users/&lt;id&gt;/set-plan` endpoint is added. You can also do this directly in the
              <strong> Supabase Table Editor → users table → subscription_plan column.</strong>
            </p>

            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  placeholder="Search user by name or email…"
                  className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-4 text-sm focus:border-ink focus:outline-none transition-all"
                />
              </div>

              {userSearch && (
                <div className="rounded-xl border border-slate-100 bg-white overflow-hidden">
                  {filteredUsers.slice(0, 5).map(u => (
                    <button
                      key={u.id}
                      onClick={() => { setSelectedUser(u); setNewPlan(u.subscription_plan as any); setUserSearch(""); }}
                      className={`flex w-full items-center justify-between px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${selectedUser?.id === u.id ? "bg-crimson-50" : ""}`}
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{u.full_name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-bold capitalize ${u.subscription_plan === "premium" ? "bg-brass-50 text-brass-500" : "bg-slate-100 text-slate-500"}`}>
                        {u.subscription_plan}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {selectedUser && (
                <div className="rounded-2xl border border-crimson-100 bg-crimson-50 p-4 space-y-3">
                  <p className="text-sm font-semibold text-ink">
                    Editing: <span className="text-crimson-600">{selectedUser.full_name}</span>
                  </p>
                  <Select label="New plan" value={newPlan} onChange={e => setNewPlan(e.target.value as any)}>
                    <option value="free">Free</option>
                    <option value="premium">Premium</option>
                  </Select>
                  {newPlan === "premium" && (
                    <Input type="date" label="Premium expires (optional)" value={planExpiry} onChange={e => setPlanExpiry(e.target.value)} />
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={applyPlanOverride}>Apply override</Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedUser(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Premium users list */}
          <Card>
            <h3 className="font-display text-sm font-semibold text-ink mb-4">All premium subscribers</h3>
            <div className="space-y-2">
              {users.filter(u => u.subscription_plan === "premium").map(u => (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-brass-50 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-ink">{u.full_name}</p>
                    <p className="text-xs text-slate-400">{u.email}</p>
                  </div>
                  <span className="rounded-full bg-brass-100 px-2.5 py-1 text-xs font-bold text-brass-500">Premium</span>
                </div>
              ))}
              {users.filter(u => u.subscription_plan === "premium").length === 0 && (
                <p className="text-sm text-slate-400 py-4 text-center">No premium subscribers yet.</p>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* SETTINGS */}
      {tab === "settings" && (
        <div className="animate-fade-up space-y-5">
          <Card>
            <h3 className="font-display text-base font-semibold text-ink mb-2">
              <Settings size={15} className="inline mr-1.5" /> Pricing Configuration
            </h3>
            <p className="text-sm text-slate-500 mb-4">
              The subscription price is controlled by the <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">PREMIUM_MONTHLY_PRICE_NPR</code> environment
              variable on Render. To change the price:
            </p>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper font-bold mt-0.5">1</span>Go to Render → your backend service → Environment</li>
              <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper font-bold mt-0.5">2</span>Change <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono">PREMIUM_MONTHLY_PRICE_NPR</code> to the new value in NPR</li>
              <li className="flex gap-2"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-[10px] text-paper font-bold mt-0.5">3</span>Save — Render redeploys automatically, new price shows immediately on the pricing page</li>
            </ol>
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
              <span className="text-xs text-slate-500">Current default:</span>
              <span className="font-mono text-sm font-bold text-ink">NPR 499 / month</span>
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-ink mb-2">Free plan limits</h3>
            <p className="text-sm text-slate-500 mb-3">Also set via Render environment variables:</p>
            <div className="space-y-2">
              {[
                { var: "FREE_PLAN_DAILY_MESSAGES", desc: "AI chat messages per day (default: 10)" },
                { var: "FREE_PLAN_DAILY_VOICE_SECONDS", desc: "Voice assistant seconds per day (default: 300 = 5 min)" },
              ].map(item => (
                <div key={item.var} className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                  <p className="font-mono text-xs font-bold text-ink">{item.var}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <h3 className="font-display text-base font-semibold text-ink mb-2">AI Model</h3>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <CheckCircleIcon />
              <div>
                <p className="text-sm font-semibold text-ink">gemini-2.5-flash</p>
                <p className="text-xs text-slate-400">Current production model — stable, fast, no shutdown date.</p>
              </div>
            </div>
          </Card>
        </div>
            )}
    </div>
  </AdminShell>
  );
}

function CheckCircleIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="text-emerald-500 shrink-0">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
