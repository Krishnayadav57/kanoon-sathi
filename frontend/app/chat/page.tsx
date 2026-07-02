"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Plus, MessageCircle, Crown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { useVoice } from "@/lib/useVoice";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Alert } from "@/components/ui";
import Link from "next/link";

type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };
type Session = { id: string; title: string; legal_category?: string; updated_at: string };

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const voice = useVoice({ lang });

  useEffect(() => { if (voice.transcript) setInput(voice.transcript); }, [voice.transcript]);
  useEffect(() => { if (!loading && !user) router.push("/login?next=/chat"); }, [loading, user, router]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  useEffect(() => {
    if (user) {
      api.get("/chat/sessions").then((res) => setSessions(res.data)).catch(() => {});
    }
  }, [user, sessionId]);

  const autoResize = () => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "auto";
    textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
  };

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    const optimistic: Message = { id: `tmp-${Date.now()}`, role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);

    try {
      const res = await api.post("/chat/send", { session_id: sessionId, message: text, language: lang });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m.filter((x) => x.id !== optimistic.id), res.data.user_message, res.data.assistant_message]);
      setRemaining(res.data.messages_remaining_today);
      setDisclaimer(res.data.disclaimer);
      if (voice.supported) voice.speak(res.data.assistant_message.content);
    } catch (e: any) {
      setError(getApiErrorMessage(e, lang === "ne" ? "म्यासेज पठाउन सकिएन।" : "Could not send message."));
      setMessages((m) => m.filter((x) => x.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const startNew = () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    setDisclaimer(null);
    setSidebarOpen(false);
  };

  const loadSession = async (id: string) => {
    try {
      const res = await api.get(`/chat/sessions/${id}`);
      setSessionId(id);
      setMessages(res.data.messages || []);
      setSidebarOpen(false);
    } catch {}
  };

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-crimson-500" size={28} />
      </div>
    );
  }

  const isPremium = user.subscription_plan === "premium";

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-paper">
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 top-16 z-30 w-72 border-r border-slate-100 bg-white transition-transform duration-300 ease-smooth lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-lifted" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="p-4 border-b border-slate-100">
            <button
              onClick={startNew}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-paper transition-all duration-200 hover:bg-crimson-600"
            >
              <Plus size={16} /> {t("chat_new")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-slate-400">{lang === "ne" ? "कुनै कुराकानी छैन" : "No conversations yet"}</p>
            ) : sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-slate-50 ${sessionId === s.id ? "bg-crimson-50 text-crimson-600" : "text-slate-600"}`}
              >
                <MessageCircle size={15} className="shrink-0 opacity-60" />
                <span className="truncate text-xs font-medium">{s.title || (lang === "ne" ? "कुराकानी" : "Conversation")}</span>
              </button>
            ))}
          </div>
          {!isPremium && (
            <div className="border-t border-slate-100 p-4">
              <Link href="/pricing" className="flex items-center gap-2 rounded-xl bg-brass-50 px-4 py-3 transition-all hover:bg-brass-100">
                <Crown size={15} className="text-brass-500" />
                <div>
                  <p className="text-xs font-semibold text-ink">{lang === "ne" ? "प्रिमियममा अपग्रेड" : "Upgrade to Premium"}</p>
                  <p className="text-[10px] text-slate-500">{lang === "ne" ? "असीमित च्याट" : "Unlimited chat"}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 top-16 z-20 bg-ink/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat topbar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg border border-slate-200 p-2 lg:hidden hover:bg-slate-50">
              <MessageCircle size={16} />
            </button>
            <div>
              <h1 className="font-display text-sm font-semibold text-ink">{t("nav_chat")}</h1>
              {remaining !== null && (
                <p className="text-[10px] text-slate-400">{remaining} {t("free_messages_left")}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && (
              <span className="flex items-center gap-1 rounded-full bg-brass-50 px-2.5 py-1 text-[10px] font-bold text-brass-500">
                <Crown size={11} /> Premium
              </span>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-ink flex items-center justify-center shadow-lifted mb-5">
                <MessageCircle size={26} className="text-paper" />
              </div>
              <h2 className="lang-ne font-display text-xl font-semibold text-ink">{t("chat_empty_title")}</h2>
              <p className="lang-ne mt-2 max-w-sm text-sm text-slate-500">{t("chat_empty_subtitle")}</p>
              <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-sm">
                {[
                  lang === "ne" ? "मेरो श्रमिक अधिकार के हो?" : "What are my worker rights?",
                  lang === "ne" ? "घरबहाल सम्झौता कसरी गर्ने?" : "How do rental agreements work?",
                  lang === "ne" ? "साइबर ठगी भयो के गर्ने?" : "I was scammed online, what now?",
                ].map((q) => (
                  <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600 hover:border-ink hover:text-ink transition-all">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-2xl space-y-5">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}>
                  {m.role === "assistant" && (
                    <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink shadow-soft mt-1">
                      <MessageCircle size={13} className="text-paper" />
                    </div>
                  )}
                  <div className={`lang-ne max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-ink text-paper"
                      : "rounded-tl-sm border border-slate-100 bg-white text-ink shadow-soft"
                  }`}>
                    {m.content}
                    {m.role === "assistant" && voice.supported && (
                      <button onClick={() => voice.isSpeaking ? voice.stopSpeaking() : voice.speak(m.content)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 hover:text-crimson-500 transition-colors">
                        {voice.isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        {lang === "ne" ? "सुन्नुहोस्" : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="mr-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink mt-1">
                    <MessageCircle size={13} className="text-paper" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-slate-100 bg-white px-4 py-3 shadow-soft">
                    <span className="flex gap-1">
                      {[0,1,2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-pulse-soft" style={{animationDelay:`${i*150}ms`}} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-2">
            <div className="rounded-xl bg-crimson-50 border border-crimson-100 px-4 py-2.5 text-sm text-crimson-600">{error}</div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-100 bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 transition-all duration-200 focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-soft">
              {voice.supported && (
                <button
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all duration-200 ${
                    voice.isListening ? "bg-crimson-500 text-paper shadow-soft" : "text-slate-400 hover:bg-slate-200 hover:text-ink"
                  }`}
                  type="button" aria-label="Voice input"
                >
                  {voice.isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              )}
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => { setInput(e.target.value); autoResize(); }}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
                placeholder={t("chat_placeholder")}
                rows={1}
                className="lang-ne max-h-36 flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-ink text-paper shadow-soft transition-all duration-200 hover:bg-crimson-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            {remaining === 0 && !isPremium && (
              <div className="mt-2 flex items-center justify-between rounded-xl bg-crimson-50 border border-crimson-100 px-4 py-2.5">
                <p className="text-xs text-crimson-600">{t("upgrade_cta")}</p>
                <Link href="/pricing" className="text-xs font-semibold text-crimson-600 hover:underline flex items-center gap-1">
                  {t("nav_pricing")} <ChevronRight size={12} />
                </Link>
              </div>
            )}
            {disclaimer && <p className="mt-2 text-center text-[11px] text-slate-400">{disclaimer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
