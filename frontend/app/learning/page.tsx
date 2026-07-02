"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Award, ChevronRight, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Button, Card } from "@/components/ui";

type QuizSummary = { id: string; category_slug: string; title_en: string; title_ne: string; question_count: number };
type Question = { question_en: string; question_ne: string; options_en: string[]; options_ne: string[] };
type QuizDetail = { id: string; title_en: string; title_ne: string; questions: Question[] };

export default function LearningPage() {
  const { user } = useAuth();
  const { lang } = useLang();
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<QuizDetail | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; total: number; badge_awarded: string | null } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { api.get("/learning/quizzes").then(r => setQuizzes(r.data)); }, []);

  const startQuiz = async (id: string) => {
    setResult(null);
    const res = await api.get(`/learning/quizzes/${id}`);
    setActiveQuiz(res.data);
    setAnswers(new Array(res.data.questions.length).fill(-1));
  };

  const submitQuiz = async () => {
    if (!activeQuiz) return;
    if (!user) return router.push("/login?next=/learning");
    setLoading(true);
    try { const res = await api.post(`/learning/quizzes/${activeQuiz.id}/submit`, answers); setResult(res.data); }
    finally { setLoading(false); }
  };

  if (activeQuiz) {
    const allAnswered = !answers.includes(-1);
    const pct = result ? Math.round((result.score / result.total) * 100) : 0;

    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={() => { setActiveQuiz(null); setResult(null); }} className="mb-5 flex items-center gap-1.5 text-sm text-slate-500 hover:text-ink transition-colors">
          ← {lang === "ne" ? "फिर्ता" : "Back"}
        </button>
        <h1 className="lang-ne font-display text-2xl font-semibold text-ink mb-8 animate-fade-up">
          {lang === "ne" ? activeQuiz.title_ne : activeQuiz.title_en}
        </h1>

        {result ? (
          <div className="animate-fade-up rounded-3xl border border-slate-100 bg-white p-8 shadow-soft text-center">
            <div className="relative mx-auto h-24 w-24">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#E8E8E6" strokeWidth="8" />
                <circle cx="50" cy="50" r="40" fill="none" stroke={pct >= 70 ? "#1F6F54" : "#A8232F"} strokeWidth="8"
                  strokeDasharray={`${pct * 2.513} 251.3`} strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-display text-xl font-bold text-ink">{pct}%</span>
              </div>
            </div>
            <p className="mt-4 font-display text-2xl font-semibold text-ink">{result.score}/{result.total}</p>
            {result.badge_awarded && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-full bg-brass-50 px-4 py-2 text-sm font-semibold text-brass-500">
                <Trophy size={16} /> {lang === "ne" ? "नयाँ ब्याज!" : "New badge unlocked!"}
              </div>
            )}
            <Button onClick={() => { setActiveQuiz(null); setResult(null); }} className="mt-6">
              {lang === "ne" ? "अरू क्विज" : "More quizzes"}
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {activeQuiz.questions.map((q, qi) => (
              <Card key={qi} className="animate-fade-up" style={{ animationDelay: `${qi * 80}ms` } as any}>
                <p className="lang-ne font-semibold text-ink mb-4">
                  <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink text-xs font-bold text-paper">{qi + 1}</span>
                  {lang === "ne" ? q.question_ne : q.question_en}
                </p>
                <div className="space-y-2">
                  {(lang === "ne" ? q.options_ne : q.options_en).map((opt, oi) => (
                    <button key={oi} onClick={() => setAnswers(a => a.map((v, i) => i === qi ? oi : v))}
                      className={`lang-ne block w-full rounded-xl border px-4 py-3 text-left text-sm transition-all duration-200 ${
                        answers[qi] === oi ? "border-ink bg-ink text-paper font-medium" : "border-slate-200 text-slate-600 hover:border-slate-400 hover:bg-slate-50"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
            <Button onClick={submitQuiz} loading={loading} disabled={!allAnswered} className="w-full" size="lg">
              {lang === "ne" ? "बुझाउनुहोस्" : "Submit answers"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="animate-fade-up mb-8">
        <span className="text-xs font-bold uppercase tracking-wider text-crimson-500">{lang === "ne" ? "सिकाइ" : "Learning"}</span>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink">
          {lang === "ne" ? "कानूनी सिकाइ" : "Legal Learning"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {lang === "ne" ? "क्विज खेलेर आफ्नो कानूनी ज्ञान जाँच्नुहोस् र ब्याज जित्नुहोस्।" : "Test your legal knowledge with quizzes and earn badges."}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map((q, i) => (
          <button key={q.id} onClick={() => startQuiz(q.id)} className="reveal text-left">
            <Card interactive className="group animate-fade-up" style={{ animationDelay: `${i * 70}ms` } as any}>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-crimson-500">{q.category_slug}</span>
                  <h3 className="lang-ne mt-1 font-display text-base font-semibold text-ink">
                    {lang === "ne" ? q.title_ne : q.title_en}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {q.question_count} {lang === "ne" ? "प्रश्न" : "questions"}
                  </p>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-ink transition-all group-hover:bg-ink group-hover:text-paper">
                  <ChevronRight size={18} />
                </span>
              </div>
            </Card>
          </button>
        ))}
        {quizzes.length === 0 && (
          <div className="col-span-2 py-16 text-center">
            <GraduationCap size={32} className="mx-auto text-slate-300" />
            <p className="mt-3 text-sm text-slate-400">{lang === "ne" ? "अहिलेका लागि कुनै क्विज छैन।" : "No quizzes available yet."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
