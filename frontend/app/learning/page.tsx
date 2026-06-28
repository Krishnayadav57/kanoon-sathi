"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Award, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { Button, Card, Alert } from "@/components/ui";

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

  useEffect(() => {
    api.get("/learning/quizzes").then((res) => setQuizzes(res.data));
  }, []);

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
    try {
      const res = await api.post(`/learning/quizzes/${activeQuiz.id}/submit`, answers);
      setResult(res.data);
    } finally {
      setLoading(false);
    }
  };

  if (activeQuiz) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <button onClick={() => setActiveQuiz(null)} className="text-sm text-slate-500 hover:text-crimson-500">
          ← {lang === "ne" ? "फिर्ता" : "Back"}
        </button>
        <h1 className="lang-ne mt-3 font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? activeQuiz.title_ne : activeQuiz.title_en}
        </h1>

        {result ? (
          <Card className="mt-6 text-center">
            <Award className="mx-auto text-gold-400" size={36} />
            <p className="mt-3 text-2xl font-semibold text-ink">
              {result.score} / {result.total}
            </p>
            {result.badge_awarded && (
              <p className="mt-2 text-sm text-pine-500">
                🏆 {lang === "ne" ? "नयाँ ब्याज पाउनुभयो!" : "New badge unlocked!"}
              </p>
            )}
            <Button className="mt-5" onClick={() => setActiveQuiz(null)}>
              {lang === "ne" ? "अरू क्विज हेर्नुहोस्" : "Browse more quizzes"}
            </Button>
          </Card>
        ) : (
          <div className="mt-6 space-y-6">
            {activeQuiz.questions.map((q, qi) => (
              <Card key={qi}>
                <p className="lang-ne font-medium text-ink">{lang === "ne" ? q.question_ne : q.question_en}</p>
                <div className="mt-3 space-y-2">
                  {(lang === "ne" ? q.options_ne : q.options_en).map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                      className={`lang-ne block w-full rounded-xl border px-4 py-2.5 text-left text-sm transition-colors ${
                        answers[qi] === oi ? "border-crimson-400 bg-crimson-50 text-crimson-600" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </Card>
            ))}
            <Button onClick={submitQuiz} loading={loading} disabled={answers.includes(-1)} className="w-full">
              {lang === "ne" ? "बुझाउनुहोस्" : "Submit answers"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-2">
        <GraduationCap className="text-crimson-500" size={22} />
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "कानूनी सिकाइ" : "Legal Learning"}
        </h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {quizzes.map((q) => (
          <button key={q.id} onClick={() => startQuiz(q.id)} className="text-left">
            <Card className="flex items-center justify-between transition-all hover:-translate-y-0.5 hover:shadow-lifted">
              <div>
                <h3 className="lang-ne font-display text-base font-semibold text-ink">
                  {lang === "ne" ? q.title_ne : q.title_en}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {q.question_count} {lang === "ne" ? "प्रश्नहरू" : "questions"}
                </p>
              </div>
              <ChevronRight size={18} className="text-slate-300" />
            </Card>
          </button>
        ))}
        {quizzes.length === 0 && <p className="text-sm text-slate-400">{lang === "ne" ? "कुनै क्विज उपलब्ध छैन।" : "No quizzes available yet."}</p>}
      </div>
    </div>
  );
}
