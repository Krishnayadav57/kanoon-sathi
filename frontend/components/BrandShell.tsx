"use client";
/**
 * NEW COMPONENT (Phase 2): BrandShell
 *
 * Recreates the layout from the reference screenshots:
 *  - Desktop: white left sidebar (nav links, active = navy pill) + topbar
 *    (search w/ ⌘K hint, language toggle, bell, avatar).
 *  - Mobile: compact top bar (logo + bell + menu) + fixed bottom tab bar
 *    (Home / Chat / Library / Saved / Profile).
 *
 * Uses the `brand.*` navy/gold Tailwind tokens added in Phase 1
 * (tailwind.config.js). Purely additive — does not touch the existing
 * Navbar/Footer components, so other pages keep working if you don't
 * switch them over yet.
 *
 * USAGE (in app/layout.tsx):
 *   import { AppShell } from "@/components/BrandShell";
 *   ...
 *   <AppShell>{children}</AppShell>
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Home, MessageCircle, Mic, FileSearch, FileText, ScanEye, BookOpen,
  GraduationCap, MapPin, Gavel, Building2, LayoutDashboard, Bookmark,
  Search, Bell, ChevronDown, Menu, X, Scale, User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";

const PRIMARY_NAV = [
  { href: "/", label_en: "Home", label_ne: "गृहपृष्ठ", icon: Home },
  { href: "/chat", label_en: "Legal Chat", label_ne: "कानूनी कुराकानी", icon: MessageCircle },
  { href: "/voice", label_en: "Voice Assistant", label_ne: "भ्वाइस सहायक", icon: Mic },
  { href: "/situation-analyzer", label_en: "Situation Analyzer", label_ne: "अवस्था विश्लेषक", icon: FileSearch },
  { href: "/complaints", label_en: "Complaint Generator", label_ne: "उजुरी निर्माता", icon: FileText },
  { href: "/documents", label_en: "Document Explainer", label_ne: "कागजात व्याख्या", icon: FileText },
  { href: "/scam-check", label_en: "Scam Check", label_ne: "ठगी जाँच", icon: ScanEye },
];

const SECONDARY_NAV = [
  { href: "/knowledge-base", label_en: "Knowledge Base", label_ne: "ज्ञान आधार", icon: BookOpen },
  { href: "/learning", label_en: "Learn", label_ne: "सिकाइ", icon: GraduationCap },
  { href: "/offices", label_en: "Find an Office", label_ne: "कार्यालय खोज्नुहोस्", icon: MapPin },
  { href: "/lawyers", label_en: "Find a Lawyer", label_ne: "वकिल खोज्नुहोस्", icon: Gavel },
  { href: "/compliance", label_en: "Business Compliance", label_ne: "व्यवसाय अनुपालन", icon: Building2 },
];

const TERTIARY_NAV = [
  { href: "/dashboard", label_en: "Dashboard", label_ne: "ड्यासबोर्ड", icon: LayoutDashboard },
  { href: "/saved", label_en: "Saved", label_ne: "सुरक्षित", icon: Bookmark },
];

const MOBILE_TABS = [
  { href: "/", label_en: "Home", label_ne: "गृह", icon: Home },
  { href: "/chat", label_en: "Chat", label_ne: "च्याट", icon: MessageCircle },
  { href: "/knowledge-base", label_en: "Library", label_ne: "पुस्तकालय", icon: BookOpen },
  { href: "/saved", label_en: "Saved", label_ne: "सुरक्षित", icon: Bookmark },
  { href: "/dashboard", label_en: "Profile", label_ne: "प्रोफाइल", icon: UserIcon },
];

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-navy">
        <Scale size={17} className="text-brand-gold" strokeWidth={2.5} />
      </span>
      <div className="leading-tight">
        <p className="font-display text-sm font-bold tracking-tight text-brand-navy">KANOON MITRA</p>
        <p className="text-[10px] font-medium text-brand-text-secondary">Your friend in Nepal's law</p>
      </div>
    </Link>
  );
}

function NavLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: any; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        active ? "bg-brand-navy text-white shadow-brand" : "text-brand-text-secondary hover:bg-brand-bg hover:text-brand-navy"
      }`}
    >
      <Icon size={17} className="shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function BrandSidebar() {
  const pathname = usePathname();
  const { lang } = useLang();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <aside className="hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-brand-border bg-white lg:sticky lg:top-0 lg:flex">
      <Logo />
      <nav className="flex-1 space-y-0.5 px-3 pb-4">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} active={isActive(item.href)}
            label={lang === "ne" ? item.label_ne : item.label_en} />
        ))}
        <div className="my-3 border-t border-brand-border" />
        {SECONDARY_NAV.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} active={isActive(item.href)}
            label={lang === "ne" ? item.label_ne : item.label_en} />
        ))}
        <div className="my-3 border-t border-brand-border" />
        {TERTIARY_NAV.map((item) => (
          <NavLink key={item.href} href={item.href} icon={item.icon} active={isActive(item.href)}
            label={lang === "ne" ? item.label_ne : item.label_en} />
        ))}
      </nav>
    </aside>
  );
}

export function BrandTopbar() {
  const { user, logout } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      {/* Desktop topbar */}
      <header className="sticky top-0 z-30 hidden items-center gap-4 border-b border-brand-border bg-white/95 px-6 py-3.5 backdrop-blur lg:flex">
        <div className="relative max-w-md flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-secondary" />
          <input
            placeholder={lang === "ne" ? "कानून, लेख, सेवा खोज्नुहोस्…" : "Search laws, articles, services…"}
            className="w-full rounded-xl border border-brand-border bg-brand-bg py-2.5 pl-10 pr-14 text-sm text-brand-text placeholder:text-brand-text-secondary focus:border-brand-navy focus:bg-white focus:outline-none transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-brand-border bg-white px-1.5 py-0.5 text-[10px] font-semibold text-brand-text-secondary">⌘K</kbd>
        </div>

        <button
          onClick={() => setLang(lang === "ne" ? "en" : "ne")}
          className="flex items-center gap-1 text-sm font-medium text-brand-text-secondary"
        >
          <span className={lang === "ne" ? "text-brand-navy font-semibold" : ""}>नेपाली</span>
          <span className="text-brand-border">|</span>
          <span className={lang === "en" ? "text-brand-navy font-semibold" : ""}>English</span>
        </button>

        <button className="relative rounded-lg p-2 text-brand-text-secondary hover:bg-brand-bg">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-danger" />
        </button>

        <div className="relative">
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-brand-bg">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">
              {user ? user.full_name[0] : <UserIcon size={14} />}
            </span>
            {user && <span className="text-sm font-medium text-brand-text">{user.full_name.split(" ")[0]}</span>}
            <ChevronDown size={14} className="text-brand-text-secondary" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 rounded-xl border border-brand-border bg-white p-1.5 shadow-brand">
              {user ? (
                <>
                  <Link href="/dashboard" className="block rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                  <button onClick={() => { logout(); setMenuOpen(false); }} className="block w-full rounded-lg px-3 py-2 text-left text-sm text-brand-danger hover:bg-brand-bg">Log out</button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg" onClick={() => setMenuOpen(false)}>Log in</Link>
                  <Link href="/register" className="block rounded-lg px-3 py-2 text-sm text-brand-text hover:bg-brand-bg" onClick={() => setMenuOpen(false)}>Sign up</Link>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Mobile topbar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-brand-border bg-brand-navy px-4 py-3.5 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Scale size={15} className="text-brand-gold" />
          </span>
          <span className="font-display text-sm font-bold text-white">KANOON MITRA</span>
        </Link>
        <div className="flex items-center gap-1">
          <button className="relative rounded-lg p-2 text-white/80">
            <Bell size={18} />
            <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand-gold" />
          </button>
          <button onClick={() => router.push("/knowledge-base")} className="rounded-lg p-2 text-white/80">
            <Menu size={18} />
          </button>
        </div>
      </header>
    </>
  );
}

export function BrandBottomNav() {
  const pathname = usePathname();
  const { lang } = useLang();
  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-brand-border bg-white px-2 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden">
      {MOBILE_TABS.map((tab) => {
        const active = isActive(tab.href);
        return (
          <Link key={tab.href} href={tab.href} className="flex flex-col items-center gap-1 px-3 py-1">
            <tab.icon size={20} className={active ? "text-brand-navy" : "text-brand-text-secondary"} />
            <span className={`text-[10px] font-medium ${active ? "text-brand-navy" : "text-brand-text-secondary"}`}>
              {lang === "ne" ? tab.label_ne : tab.label_en}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Full responsive shell: sidebar+topbar on desktop, topbar+bottom-tabs on mobile. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-brand-bg">
      <BrandSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <BrandTopbar />
        <main className="flex-1 pb-20 lg:pb-0">{children}</main>
      </div>
      <BrandBottomNav />
    </div>
  );
}
