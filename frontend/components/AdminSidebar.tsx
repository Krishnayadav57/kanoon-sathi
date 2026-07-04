"use client";
/**
 * NEW COMPONENT (Phase 1): AdminSidebar
 *
 * Drop-in replacement for the admin nav shell shown in the screenshots —
 * navy background, gold accents, collapsible groups, active-route highlight.
 * Does NOT touch app/admin/page.tsx logic — wrap your existing admin page
 * content with <AdminShell> (see bottom of this file) to adopt it without
 * rewriting any of the working tab logic (payments/users/etc.).
 *
 * INTEGRATION:
 *   import { AdminShell } from "@/components/AdminSidebar";
 *   export default function AdminPage() {
 *     return <AdminShell>{...your existing JSX...}</AdminShell>
 *   }
 * Or use <AdminSidebar /> standalone in a new app/admin/layout.tsx.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Users, Scale, GraduationCap, FileText, Building2, Gavel,
  BrainCircuit, Mic, LayoutTemplate, CreditCard, Wallet, BarChart3, ShieldAlert,
  Settings, ScrollText, LifeBuoy, ChevronDown, HelpCircle,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: any; children?: { label: string; href: string }[] };

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Users Management", href: "/admin/users", icon: Users },
  { label: "Law Management", href: "/admin/laws", icon: Scale },
  { label: "Learning & Quizzes", href: "/admin/learning", icon: GraduationCap },
  { label: "Complaints & Documents", href: "/admin/complaints", icon: FileText },
  { label: "Government Offices", href: "/admin/offices", icon: Building2 },
  { label: "Lawyers Management", href: "/admin/lawyers", icon: Gavel },
  { label: "AI Knowledge Base", href: "/admin/ai-knowledge", icon: BrainCircuit },
  { label: "Voice Assistant", href: "/admin/voice", icon: Mic },
  { label: "Content Management", href: "/admin/content", icon: LayoutTemplate },
  { label: "Subscriptions & Plans", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Payments & Transactions", href: "/admin/payments", icon: Wallet },
  { label: "Analytics & Reports", href: "/admin/analytics", icon: BarChart3 },
  { label: "Moderation & Security", href: "/admin/security", icon: ShieldAlert },
  { label: "System Settings", href: "/admin/settings", icon: Settings },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Support & Feedback", href: "/admin/support", icon: LifeBuoy },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || (href !== "/admin" && pathname?.startsWith(href));

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col bg-brand-navy text-white">
      <div className="flex items-center gap-3 px-5 py-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
          <Scale size={20} className="text-brand-gold" />
        </span>
        <div>
          <p className="font-display text-sm font-bold leading-tight tracking-wide">KANOON MITRA</p>
          <p className="text-[10px] font-semibold tracking-widest text-white/50">ADMIN PANEL</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pb-4 scrollbar-thin">
        {NAV.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                active ? "bg-brand-gold text-brand-navy font-semibold shadow-brand" : "text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <item.icon size={17} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="m-3 rounded-2xl bg-white/10 p-4">
        <div className="mb-2 flex items-center gap-2">
          <HelpCircle size={16} className="text-brand-gold" />
          <p className="text-sm font-semibold">Need Help?</p>
        </div>
        <p className="mb-3 text-xs text-white/60">Get quick support</p>
        <button className="w-full rounded-lg bg-white/10 py-2 text-xs font-semibold hover:bg-white/20 transition-all">
          Contact Support
        </button>
      </div>
    </aside>
  );
}

/** Optional full-page shell (sidebar + light background) you can wrap existing admin content in. */
export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-bg text-brand-text">
      <AdminSidebar />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
