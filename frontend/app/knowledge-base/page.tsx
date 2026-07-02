"use client";

import { useEffect, useState } from "react";
import { BookOpen, Search, ChevronRight, X, ExternalLink } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Input } from "@/components/ui";

type Category = { slug: string; name_en: string; name_ne: string; icon: string; description_en: string; description_ne: string };
type ArticleItem = { id: string; category_slug: string; title_en: string; title_ne: string; summary_en: string; summary_ne: string; source_reference: string };
type ArticleDetail = ArticleItem & { full_text_en: string; full_text_ne: string };

const ICONS: Record<string, string> = {
  constitution: "📜", traffic: "🚗", cyber: "🔒", consumer: "🛒",
  labor: "💼", property: "🏠", business: "🏢", family: "👨‍👩‍👧",
};

export default function KnowledgeBasePage() {
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => { api.get("/knowledge-base/categories").then(r => setCategories(r.data)); }, []);
  useEffect(() => {
    const params: any = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;
    api.get("/knowledge-base/articles", { params }).then(r => setArticles(r.data));
  }, [activeCategory, search]);

  const openArticle = async (id: string) => {
    setLoadingArticle(true);
    try { const r = await api.get(`/knowledge-base/articles/${id}`); setSelected(r.data); }
    finally { setLoadingArticle(false); }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">
          {lang === "ne" ? "कानून" : "Law"}
        </span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "कानून पुस्तकालय" : "Law Library"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "नेपालका प्रमुख कानूनहरू सरल भाषामा" : "Nepal's key laws explained in plain language"}
        </p>
      </div>

      {/* Search */}
      <div className="animate-fade-up [animation-delay:80ms] mb-6">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={lang === "ne" ? "कानून खोज्नुहोस्…" : "Search laws…"}
            className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-ink placeholder:text-slate-400 shadow-soft focus:border-ink focus:outline-none focus:ring-2 focus:ring-crimson-100 transition-all"
          />
        </div>
      </div>

      {/* Category pills */}
      <div className="animate-fade-up [animation-delay:140ms] mb-8 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${!activeCategory ? "bg-ink text-paper shadow-soft" : "border border-slate-200 bg-white text-slate-600 hover:border-ink hover:text-ink"}`}
        >
          {lang === "ne" ? "सबै" : "All"}
        </button>
        {categories.map(c => (
          <button
            key={c.slug}
            onClick={() => setActiveCategory(c.slug)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 ${activeCategory === c.slug ? "bg-ink text-paper shadow-soft" : "border border-slate-200 bg-white text-slate-600 hover:border-ink hover:text-ink"}`}
          >
            <span>{ICONS[c.slug] || "📄"}</span>
            {lang === "ne" ? c.name_ne : c.name_en}
          </button>
        ))}
      </div>

      {/* Articles grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((a, i) => (
          <button
            key={a.id}
            onClick={() => openArticle(a.id)}
            className="reveal scan-trace-border group rounded-2xl border border-slate-100 bg-white p-5 text-left shadow-soft transition-all duration-300 ease-smooth hover:-translate-y-0.5 hover:shadow-lifted hover:border-slate-200"
            style={{ animationDelay: `${Math.min(i * 50, 400)}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wide text-crimson-500">
                  {ICONS[a.category_slug] || "📄"} {a.category_slug}
                </span>
                <h3 className="lang-ne mt-1.5 font-display text-base font-semibold text-ink leading-snug">
                  {lang === "ne" ? a.title_ne : a.title_en}
                </h3>
                <p className="lang-ne mt-2 text-sm leading-relaxed text-slate-500 line-clamp-2">
                  {lang === "ne" ? a.summary_ne : a.summary_en}
                </p>
              </div>
              <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300 transition-all group-hover:text-ink group-hover:translate-x-0.5" />
            </div>
            <p className="mt-3 font-mono text-[11px] text-slate-400 truncate">{a.source_reference}</p>
          </button>
        ))}
        {articles.length === 0 && (
          <div className="col-span-2 py-16 text-center">
            <BookOpen size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">{lang === "ne" ? "कुनै लेख फेला परेन।" : "No articles found."}</p>
          </div>
        )}
      </div>

      {/* Article detail modal */}
      {(selected || loadingArticle) && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6 animate-fade-in" onClick={() => setSelected(null)}>
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white shadow-lifted sm:rounded-3xl animate-fade-up"
            onClick={e => e.stopPropagation()}
          >
            {loadingArticle ? (
              <div className="flex items-center justify-center py-20">
                <Loader2Icon />
              </div>
            ) : selected && (
              <div className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wide text-crimson-500">
                      {ICONS[selected.category_slug] || "📄"} {selected.category_slug}
                    </span>
                    <h2 className="lang-ne mt-2 font-display text-xl font-semibold text-ink leading-snug">
                      {lang === "ne" ? selected.title_ne : selected.title_en}
                    </h2>
                  </div>
                  <button onClick={() => setSelected(null)} className="shrink-0 rounded-xl border border-slate-200 p-2 hover:bg-slate-50 transition-all">
                    <X size={18} />
                  </button>
                </div>
                <p className="lang-ne whitespace-pre-line text-sm leading-relaxed text-ink">
                  {lang === "ne" ? (selected.full_text_ne || selected.summary_ne) : (selected.full_text_en || selected.summary_en)}
                </p>
                <div className="mt-6 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3">
                  <ExternalLink size={14} className="text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-medium text-slate-400">{lang === "ne" ? "स्रोत" : "Source"}</p>
                    <p className="font-mono text-xs text-ink">{selected.source_reference}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Loader2Icon() {
  return (
    <svg className="animate-spin h-8 w-8 text-crimson-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}
