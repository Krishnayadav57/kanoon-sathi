"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mic, MicOff, Send, Volume2, VolumeX, Loader2, Plus, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { useVoice } from "@/lib/useVoice";
import { api, getApiErrorMessage } from "@/lib/api";
import { Button, Alert } from "@/components/ui";
import SealMark from "@/components/SealMark";

type Message = { id: string; role: "user" | "assistant"; content: string; created_at: string };

export default function ChatPage() {
  const { user, loading } = useAuth();
  const { lang, t } = useLang();
  const router = useRouter();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [disclaimer, setDisclaimer] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const voice = useVoice({ lang });

  useEffect(() => {
    if (voice.transcript) setInput(voice.transcript);
  }, [voice.transcript]);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/chat");
  }, [loading, user, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    setInput("");

    const optimisticUser: Message = { id: `tmp-${Date.now()}`, role: "user", content: text, created_at: new Date().toISOString() };
    setMessages((m) => [...m, optimisticUser]);

    try {
      const res = await api.post("/chat/send", { session_id: sessionId, message: text, language: lang });
      setSessionId(res.data.session_id);
      setMessages((m) => [...m.filter((x) => x.id !== optimisticUser.id), res.data.user_message, res.data.assistant_message]);
      setRemaining(res.data.messages_remaining_today);
      setDisclaimer(res.data.disclaimer);
      if (voice.supported) voice.speak(res.data.assistant_message.content);
    } catch (e: any) {
      setError(getApiErrorMessage(e, lang === "ne" ? "म्यासेज पठाउन सकिएन। फेरि प्रयास गर्नुहोस्।" : "Could not send message. Please try again."));
      setMessages((m) => m.filter((x) => x.id !== optimisticUser.id));
    } finally {
      setSending(false);
    }
  };

  const startNewChat = () => {
    setSessionId(null);
    setMessages([]);
    setError(null);
  };

  if (loading || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-crimson-500" size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-4xl flex-col px-4 sm:px-6">
      <div className="flex items-center justify-between border-b border-slate-100 py-4">
        <div className="flex items-center gap-2">
          <MessageCircle className="text-crimson-500" size={20} />
          <h1 className="font-display text-lg font-semibold text-ink">{t("nav_chat")}</h1>
        </div>
        <div className="flex items-center gap-3">
          {remaining !== null && (
            <span className="text-xs text-slate-400">
              {remaining} {t("free_messages_left")}
            </span>
          )}
          <button onClick={startNewChat} className="flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-crimson-400 hover:text-crimson-500">
            <Plus size={14} /> {t("chat_new")}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <SealMark size={64} className="text-crimson-200" />
            <h2 className="lang-ne mt-4 font-display text-xl font-semibold text-ink">{t("chat_empty_title")}</h2>
            <p className="lang-ne mt-2 max-w-sm text-sm text-slate-500">{t("chat_empty_subtitle")}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`lang-ne max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    m.role === "user" ? "bg-crimson-500 text-paper" : "bg-white border border-slate-100 text-ink shadow-soft"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" && voice.supported && (
                    <button
                      onClick={() => (voice.isSpeaking ? voice.stopSpeaking() : voice.speak(m.content))}
                      className="ml-2 mt-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-crimson-500"
                      aria-label="Read aloud"
                    >
                      {voice.isSpeaking ? <VolumeX size={13} /> : <Volume2 size={13} />}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-100 bg-white px-4 py-3 shadow-soft">
                  <Loader2 size={14} className="animate-spin text-crimson-500" />
                  <span className="text-xs text-slate-400">{lang === "ne" ? "लेख्दैछु…" : "Thinking…"}</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && (
        <div className="pb-3">
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      <div className="border-t border-slate-100 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-soft">
          {voice.supported && (
            <button
              onClick={voice.isListening ? voice.stopListening : voice.startListening}
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors ${
                voice.isListening ? "bg-crimson-500 text-paper" : "bg-slate-50 text-slate-500 hover:bg-slate-100"
              }`}
              aria-label="Voice input"
              type="button"
            >
              {voice.isListening ? <MicOff size={17} /> : <Mic size={17} />}
            </button>
          )}
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder={t("chat_placeholder")}
            rows={1}
            className="lang-ne max-h-32 flex-1 resize-none border-none bg-transparent px-2 py-2 text-sm text-ink placeholder:text-slate-400 focus:outline-none"
          />
          <Button onClick={() => send()} disabled={!input.trim() || sending} size="md" className="shrink-0">
            <Send size={15} /> {t("chat_send")}
          </Button>
        </div>
        {remaining === 0 && (
          <p className="mt-2 text-center text-xs text-crimson-500">
            {t("upgrade_cta")} —{" "}
            <a href="/pricing" className="font-semibold underline">
              {t("nav_pricing")}
            </a>
          </p>
        )}
        {disclaimer && <p className="mt-2 text-center text-[11px] text-slate-400">{disclaimer}</p>}
      </div>
    </div>
  );
}
