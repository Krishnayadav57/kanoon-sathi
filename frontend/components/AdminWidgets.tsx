"use client";
/**
 * NEW COMPONENT (Phase 1): Admin dashboard widgets (stat card, panel card).
 * Pure presentational — feed it real numbers from your existing
 * /admin/revenue/summary, /admin/users, /payments/admin/pending-review calls.
 */
import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export function StatCard({
  icon: Icon, label, value, deltaPct, deltaLabel = "vs last period", tone = "navy",
}: {
  icon: any; label: string; value: string | number; deltaPct?: number; deltaLabel?: string;
  tone?: "navy" | "gold" | "success" | "danger";
}) {
  const toneMap = {
    navy: "bg-brand-navy/10 text-brand-navy",
    gold: "bg-brand-gold/15 text-brand-gold",
    success: "bg-brand-success/10 text-brand-success",
    danger: "bg-brand-danger/10 text-brand-danger",
  } as const;
  const positive = (deltaPct ?? 0) >= 0;

  return (
    <div className="rounded-brand border border-brand-border bg-brand-card p-5 shadow-brand">
      <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneMap[tone]}`}>
        <Icon size={18} />
      </span>
      <p className="mt-4 font-display text-2xl font-bold text-brand-text">{value}</p>
      <p className="text-xs font-medium text-brand-text-secondary">{label}</p>
      {deltaPct !== undefined && (
        <p className={`mt-2 flex items-center gap-1 text-xs font-semibold ${positive ? "text-brand-success" : "text-brand-danger"}`}>
          {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
          {Math.abs(deltaPct)}% <span className="font-normal text-brand-text-secondary">{deltaLabel}</span>
        </p>
      )}
    </div>
  );
}

export function PanelCard({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-brand border border-brand-border bg-brand-card p-5 shadow-brand">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold text-brand-text">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

export function QuickActionButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 rounded-xl border border-brand-border bg-brand-bg px-3 py-4 text-center transition-all hover:border-brand-navy hover:bg-white"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-navy/10 text-brand-navy">
        <Icon size={16} />
      </span>
      <span className="text-xs font-medium text-brand-text">{label}</span>
    </button>
  );
}
