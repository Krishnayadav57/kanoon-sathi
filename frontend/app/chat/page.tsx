"use client";
// PHASE 3: restyled to brand.* tokens. send(), loadSession(), voice hook wiring,
// and all state/effects are unchanged from the original chat page.

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Plus, MessageCircle, Crown, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { useVoice } from "@/lib/useVoice";
import { api, getApiErrorMessage } from "@/lib/api";
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
        <Loader2 className="animate-spin text-brand-navy" size={28} />
      </div>
    );
  }

  const isPremium = user.subscription_plan === "premium";

  return (
    <div className="flex h-[calc(100vh-0px)] overflow-hidden bg-brand-bg lg:h-screen">
      {/* Sub-sidebar: chat history */}
      <div className={`fixed inset-y-0 left-0 z-30 w-72 border-r border-brand-border bg-white transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? "translate-x-0 shadow-brand" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="border-b border-brand-border p-4">
            <button
              onClick={startNew}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-navy py-2.5 text-sm font-semibold text-white transition-all hover:bg-brand-navy-600"
            >
              <Plus size={16} /> {t("chat_new")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
            {sessions.length === 0 ? (
              <p className="px-2 py-4 text-center text-xs text-brand-text-secondary">{lang === "ne" ? "कुनै कुराकानी छैन" : "No conversations yet"}</p>
            ) : sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:bg-brand-bg ${sessionId === s.id ? "bg-brand-gold-100 text-brand-navy" : "text-brand-text-secondary"}`}
              >
                <MessageCircle size={15} className="shrink-0 opacity-60" />
                <span className="truncate text-xs font-medium">{s.title || (lang === "ne" ? "कुराकानी" : "Conversation")}</span>
              </button>
            ))}
          </div>
          {!isPremium && (
            <div className="border-t border-brand-border p-4">
              <Link href="/pricing" className="flex items-center gap-2 rounded-xl bg-brand-gold-100 px-4 py-3 transition-all hover:bg-brand-gold-100/70">
                <Crown size={15} className="text-brand-gold" />
                <div>
                  <p className="text-xs font-semibold text-brand-text">{lang === "ne" ? "प्रिमियममा अपग्रेड" : "Upgrade to Premium"}</p>
                  <p className="text-[10px] text-brand-text-secondary">{lang === "ne" ? "असीमित च्याट" : "Unlimited chat"}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-brand-border bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-lg border border-brand-border p-2 hover:bg-brand-bg">
              <MessageCircle size={16} />
            </button>
            <div>
              <h1 className="font-display text-sm font-semibold text-brand-text">{t("nav_chat")}</h1>
              {remaining !== null && (
                <p className="text-[10px] text-brand-text-secondary">{remaining} {t("free_messages_left")}</p>
              )}
            </div>
          </div>
          {isPremium && (
            <span className="flex items-center gap-1 rounded-full bg-brand-gold-100 px-2.5 py-1 text-[10px] font-bold text-brand-gold">
              <Crown size={11} /> Premium
            </span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-navy shadow-brand">
                <MessageCircle size={26} className="text-white" />
              </div>
              <h2 className="lang-ne font-display text-xl font-semibold text-brand-text">{t("chat_empty_title")}</h2>
              <p className="lang-ne mt-2 max-w-sm text-sm text-brand-text-secondary">{t("chat_empty_subtitle")}</p>
              <div className="mt-6 flex max-w-sm flex-wrap justify-center gap-2">
                {[
                  lang === "ne" ? "मेरो श्रमिक अधिकार के हो?" : "What are my worker rights?",
                  lang === "ne" ? "घरबहाल सम्झौता कसरी गर्ने?" : "How do rental agreements work?",
                  lang === "ne" ? "साइबर ठगी भयो के गर्ने?" : "I was scammed online, what now?",
                ].map((q) => (
                  <button key={q} onClick={() => { setInput(q); textareaRef.current?.focus(); }}
                    className="rounded-xl border border-brand-border bg-white px-3 py-2 text-xs text-brand-text-secondary hover:border-brand-navy hover:text-brand-navy transition-all">
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
                    <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy shadow-brand">
                      <MessageCircle size={13} className="text-white" />
                    </div>
                  )}
                  <div className={`lang-ne max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user"
                      ? "rounded-tr-sm bg-brand-navy text-white"
                      : "rounded-tl-sm border border-brand-border bg-white text-brand-text shadow-brand"
                  }`}>
                    {m.content}
                    {m.role === "assistant" && voice.supported && (
                      <button onClick={() => voice.isSpeaking ? voice.stopSpeaking() : voice.speak(m.content)}
                        className="mt-2 flex items-center gap-1 text-[10px] text-brand-text-secondary hover:text-brand-navy transition-colors">
                        {voice.isSpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                        {lang === "ne" ? "सुन्नुहोस्" : "Listen"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-start animate-fade-in">
                  <div className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-navy">
                    <MessageCircle size={13} className="text-white" />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm border border-brand-border bg-white px-4 py-3 shadow-brand">
                    <span className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <span key={i} className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-brand-text-secondary" style={{ animationDelay: `${i * 150}ms` }} />
                      ))}
                    </span>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error && (
          <div className="mx-auto w-full max-w-2xl px-4 pb-2">
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-brand-danger">{error}</div>
          </div>
        )}

        <div className="border-t border-brand-border bg-white px-4 py-4">
          <div className="mx-auto max-w-2xl">
            <div className="flex items-end gap-2 rounded-2xl border border-brand-border bg-brand-bg p-2.5 transition-all focus-within:border-brand-navy focus-within:bg-white">
              {voice.supported && (
                <button
                  onClick={voice.isListening ? voice.stopListening : voice.startListening}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all ${
                    voice.isListening ? "bg-brand-danger text-white shadow-brand" : "text-brand-text-secondary hover:bg-brand-border hover:text-brand-navy"
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
                className="lang-ne max-h-36 flex-1 resize-none border-none bg-transparent px-1 py-1.5 text-sm text-brand-text placeholder:text-brand-text-secondary focus:outline-none"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || sending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-navy text-white shadow-brand transition-all hover:bg-brand-navy-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              </button>
            </div>
            {remaining === 0 && !isPremium && (
              <div className="mt-2 flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-2.5">
                <p className="text-xs text-brand-danger">{t("upgrade_cta")}</p>
                <Link href="/pricing" className="flex items-center gap-1 text-xs font-semibold text-brand-danger hover:underline">
                  {t("nav_pricing")} <ChevronRight size={12} />
                </Link>
              </div>
            )}
            {disclaimer && <p className="mt-2 text-center text-[11px] text-brand-text-secondary">{disclaimer}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
