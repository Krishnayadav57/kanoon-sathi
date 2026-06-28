"use client";

import { useEffect, useState } from "react";
import { Search, BookOpen, ChevronRight, X } from "lucide-react";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Input, Card } from "@/components/ui";

type Category = { slug: string; name_en: string; name_ne: string; icon: string; description_en: string; description_ne: string };
type ArticleListItem = { id: string; category_slug: string; title_en: string; title_ne: string; summary_en: string; summary_ne: string; source_reference: string };
type ArticleDetail = ArticleListItem & { full_text_en: string; full_text_ne: string };

export default function KnowledgeBasePage() {
  const { lang } = useLang();
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ArticleDetail | null>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  useEffect(() => {
    api.get("/knowledge-base/categories").then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    const params: any = {};
    if (activeCategory) params.category = activeCategory;
    if (search) params.search = search;
    api.get("/knowledge-base/articles", { params }).then((res) => setArticles(res.data));
  }, [activeCategory, search]);

  const openArticle = async (id: string) => {
    setLoadingArticle(true);
    try {
      const res = await api.get(`/knowledge-base/articles/${id}`);
      setSelected(res.data);
    } finally {
      setLoadingArticle(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <BookOpen className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "कानून पुस्तकालय" : "Law Library"}
        </h1>
      </div>

      <div className="mt-6">
        <Input
          placeholder={lang === "ne" ? "खोज्नुहोस्…" : "Search…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold ${!activeCategory ? "bg-crimson-500 text-paper" : "bg-slate-50 text-slate-600"}`}
        >
          {lang === "ne" ? "सबै" : "All"}
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => setActiveCategory(c.slug)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${activeCategory === c.slug ? "bg-crimson-500 text-paper" : "bg-slate-50 text-slate-600"}`}
          >
            {lang === "ne" ? c.name_ne : c.name_en}
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {articles.map((a) => (
          <button key={a.id} onClick={() => openArticle(a.id)} className="text-left">
            <Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-lifted">
              <div className="flex items-start justify-between gap-3">
                <h3 className="lang-ne font-display text-base font-semibold text-ink">
                  {lang === "ne" ? a.title_ne : a.title_en}
                </h3>
                <ChevronRight size={16} className="mt-1 shrink-0 text-slate-300" />
              </div>
              <p className="lang-ne mt-2 text-sm leading-relaxed text-slate-500">
                {lang === "ne" ? a.summary_ne : a.summary_en}
              </p>
              <p className="mt-3 font-mono text-[11px] text-slate-400">{a.source_reference}</p>
            </Card>
          </button>
        ))}
        {articles.length === 0 && (
          <p className="col-span-2 py-10 text-center text-sm text-slate-400">
            {lang === "ne" ? "कुनै लेख फेला परेन।" : "No articles found."}
          </p>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}>
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-6 shadow-lifted sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h2 className="lang-ne font-display text-xl font-semibold text-ink">
                {lang === "ne" ? selected.title_ne : selected.title_en}
              </h2>
              <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            <p className="lang-ne mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">
              {lang === "ne" ? selected.full_text_ne : selected.full_text_en}
            </p>
            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">
              <p className="text-xs text-slate-500">{lang === "ne" ? "स्रोत:" : "Source:"}</p>
              <p className="font-mono text-xs text-ink">{selected.source_reference}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
