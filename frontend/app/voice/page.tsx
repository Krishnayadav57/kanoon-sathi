"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { Mic, MicOff, PhoneOff, Loader2, Crown, Volume2, VolumeX, ChevronDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLang } from "@/lib/lang-context";
import { api } from "@/lib/api";
import { VoiceClient } from "@/lib/voiceClient";
import { Button, Alert } from "@/components/ui";
import Link from "next/link";

type CallState = "idle" | "connecting" | "active" | "ended";

export default function VoicePage() {
  const { user, loading } = useAuth();
  const { lang, setLang } = useLang();
  const router = useRouter();

  const [callState, setCallState] = useState<CallState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitMsg, setLimitMsg] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{ role: "user" | "model"; text: string }[]>([]);
  const [showTranscript, setShowTranscript] = useState(false);
  const [micSupported, setMicSupported] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const clientRef = useRef<VoiceClient | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/voice");
  }, [loading, user, router]);

  useEffect(() => {
    if (typeof window !== "undefined" &&
      (!navigator.mediaDevices?.getUserMedia || !(window as any).AudioContext)) {
      setMicSupported(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    const token = Cookies.get("km_access_token");
    if (!token) return;
    api.get("/voice/usage-today", { params: { token } })
      .then(r => { setIsPremium(r.data.is_premium); setRemainingSeconds(r.data.remaining_seconds); })
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  useEffect(() => () => {
    clientRef.current?.disconnect();
    if (timerRef.current) clearInterval(timerRef.current);
    if (durationRef.current) clearInterval(durationRef.current);
  }, []);

  const backendWsBase = (() => {
    const base = process.env.NEXT_PUBLIC_API_URL || "";
    if (!base) return null;
    return base.replace(/^http/, "ws") + "/api/v1";
  })();

  const startCall = async () => {
    setError(null); setLimitMsg(null); setTranscript([]); setCallDuration(0);
    if (!micSupported) { setError(lang === "ne" ? "माइक्रोफोन समर्थित छैन।" : "Microphone not supported."); return; }
    if (!backendWsBase) { setError("NEXT_PUBLIC_API_URL is not configured."); return; }
    if (!isPremium && remainingSeconds !== null && remainingSeconds <= 0) {
      setLimitMsg(lang === "ne" ? "आजको नि:शुल्क समय सकियो। प्रिमियममा अपग्रेड गर्नुहोस्।" : "Today's free voice time is used up. Upgrade to Premium.");
      return;
    }
    const token = Cookies.get("km_access_token");
    if (!token) return router.push("/login?next=/voice");

    setCallState("connecting");
    const client = new VoiceClient({
      onReady: (remaining) => {
        setCallState("active");
        if (remaining !== null) setRemainingSeconds(remaining);
        // Count up duration
        durationRef.current = setInterval(() => setCallDuration(d => d + 1), 1000);
        // Count down remaining for free users
        if (!isPremium) {
          timerRef.current = setInterval(() => setRemainingSeconds(s => s !== null ? Math.max(0, s - 1) : s), 1000);
        }
      },
      onLimitReached: (msg) => { setLimitMsg(msg); setCallState("ended"); _stopTimers(); },
      onError: (msg) => { setError(msg); setCallState(s => s === "connecting" || s === "active" ? "ended" : s); _stopTimers(); },
      onClose: () => { setCallState(s => s === "active" ? "ended" : s); setIsSpeaking(false); _stopTimers(); },
      onTranscript: (role, text) => setTranscript(t => [...t, { role, text }]),
      onSpeakingChange: setIsSpeaking,
    });
    clientRef.current = client;
    try {
      await client.connect(`${backendWsBase}/ws/voice`, token, lang as "ne" | "en");
    } catch (e: any) {
      setError(e?.message || "Could not start voice session.");
      setCallState("ended");
      _stopTimers();
    }
  };

  const endCall = () => {
    clientRef.current?.disconnect();
    setCallState("ended");
    setIsSpeaking(false);
    _stopTimers();
  };

  const _stopTimers = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (durationRef.current) { clearInterval(durationRef.current); durationRef.current = null; }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (loading || !user) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="animate-spin text-crimson-500" size={28} />
    </div>
  );

  const callActive = callState === "active";
  const canCall = callState === "idle" || callState === "ended";

  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center bg-paper px-4 pt-10 pb-16">
      {/* Language toggle */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-slate-200 bg-white p-1 shadow-soft animate-fade-up">
        {(["ne", "en"] as const).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all ${lang === l ? "bg-ink text-paper shadow-soft" : "text-slate-500 hover:text-ink"}`}
          >
            {l === "ne" ? "नेपाली" : "English"}
          </button>
        ))}
      </div>

      {/* Header */}
      <div className="text-center mb-8 animate-fade-up [animation-delay:60ms]">
        <h1 className="font-display text-2xl font-semibold text-ink">
          {lang === "ne" ? "भ्वाइस सहायक" : "Voice Assistant"}
        </h1>
        <p className="lang-ne mt-1 text-sm text-slate-500">
          {lang === "ne"
            ? "बोलेर कानूनी प्रश्न सोध्नुहोस् — कानून मित्रले सिधै जवाफ दिनेछ"
            : "Ask your legal question — Kanoon Mitra answers in real time"}
        </p>
      </div>

      {/* Timer badge */}
      {!isPremium && remainingSeconds !== null && (
        <div className={`mb-6 flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold animate-fade-up [animation-delay:100ms] ${
          remainingSeconds <= 60 ? "bg-crimson-50 text-crimson-500 border border-crimson-100" : "bg-slate-100 text-slate-600"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${remainingSeconds <= 60 ? "bg-crimson-400 animate-pulse" : "bg-slate-400"}`} />
          {lang === "ne" ? "आजको बाँकी:" : "Remaining today:"} {formatTime(remainingSeconds)}
        </div>
      )}
      {isPremium && (
        <div className="mb-6 flex items-center gap-2 rounded-full bg-brass-50 border border-brass-100 px-4 py-2 text-xs font-bold text-brass-500 animate-fade-up [animation-delay:100ms]">
          <Crown size={12} /> {lang === "ne" ? "असीमित (प्रिमियम)" : "Unlimited (Premium)"}
        </div>
      )}

      {/* Central orb */}
      <div className="relative flex items-center justify-center my-6 animate-fade-up [animation-delay:140ms]">
        {/* Outer ring pulses when AI speaks */}
        <div className={`absolute h-56 w-56 rounded-full transition-all duration-700 ${
          callActive && isSpeaking
            ? "scale-110 bg-crimson-100 opacity-60"
            : callActive
            ? "scale-100 bg-slate-100 opacity-40"
            : "scale-90 bg-slate-50 opacity-30"
        }`} />
        {/* Middle ring */}
        <div className={`absolute h-44 w-44 rounded-full border transition-all duration-500 ${
          callActive ? "border-crimson-200 bg-crimson-50/30" : "border-slate-200 bg-slate-50/30"
        }`} />
        {/* Core button */}
        <button
          onClick={canCall ? startCall : endCall}
          disabled={callState === "connecting"}
          className={`relative flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-full shadow-lifted transition-all duration-300 active:scale-95 ${
            callState === "connecting"
              ? "bg-slate-100 cursor-not-allowed"
              : callActive
              ? "bg-crimson-500 hover:bg-crimson-600 text-paper"
              : "bg-ink hover:bg-crimson-600 text-paper"
          }`}
        >
          {callState === "connecting" ? (
            <Loader2 size={32} className="animate-spin text-slate-400" />
          ) : callActive ? (
            <>
              <PhoneOff size={28} />
              <span className="text-[10px] font-bold">{formatTime(callDuration)}</span>
            </>
          ) : (
            <>
              <Mic size={32} />
              <span className="text-[10px] font-bold">{lang === "ne" ? "थिच्नुहोस्" : "Tap to call"}</span>
            </>
          )}
        </button>
      </div>

      {/* Status label */}
      <p className="mt-2 h-5 text-sm text-slate-500 animate-fade-in text-center">
        {callState === "connecting" && (lang === "ne" ? "जोड्दैछ…" : "Connecting…")}
        {callActive && isSpeaking && (lang === "ne" ? "🔊 बोलिरहेको छ…" : "🔊 Speaking…")}
        {callActive && !isSpeaking && (lang === "ne" ? "🎙️ सुनिरहेको छ…" : "🎙️ Listening…")}
        {callState === "ended" && (lang === "ne" ? "कुराकानी समाप्त" : "Call ended")}
      </p>

      {/* Call again button after ended */}
      {callState === "ended" && (
        <Button onClick={startCall} className="mt-6 animate-fade-up" disabled={!isPremium && remainingSeconds === 0}>
          <Mic size={15} /> {lang === "ne" ? "फेरि सुरु गर्नुहोस्" : "Call again"}
        </Button>
      )}

      {/* Error / limit messages */}
      {(error || limitMsg) && (
        <div className="mt-6 w-full max-w-sm animate-fade-in">
          {error && <Alert variant="error">{error}</Alert>}
          {limitMsg && (
            <Alert variant="warning">
              {limitMsg}{" "}
              <Link href="/pricing" className="font-bold underline">
                {lang === "ne" ? "अपग्रेड" : "Upgrade"}
              </Link>
            </Alert>
          )}
        </div>
      )}

      {!micSupported && (
        <div className="mt-4 w-full max-w-sm animate-fade-in">
          <Alert variant="warning">
            {lang === "ne"
              ? "तपाईंको ब्राउजरले माइक्रोफोन समर्थन गर्दैन। Chrome वा Edge प्रयोग गर्नुहोस्।"
              : "Your browser doesn't support mic access. Use Chrome or Edge."}
          </Alert>
        </div>
      )}

      {/* Transcript accordion */}
      {transcript.length > 0 && (
        <div className="mt-8 w-full max-w-sm animate-fade-up">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-soft hover:border-ink transition-all"
          >
            <span>{lang === "ne" ? `ट्रान्सक्रिप्ट (${transcript.length})` : `Transcript (${transcript.length})`}</span>
            <ChevronDown size={16} className={`transition-transform duration-300 ${showTranscript ? "rotate-180" : ""}`} />
          </button>
          {showTranscript && (
            <div ref={transcriptRef} className="mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-4 shadow-soft scrollbar-thin space-y-2">
              {transcript.map((t, i) => (
                <p key={i} className={`lang-ne text-sm ${t.role === "user" ? "text-ink" : "text-slate-500"}`}>
                  <span className="font-semibold">
                    {t.role === "user"
                      ? (lang === "ne" ? "तपाईं: " : "You: ")
                      : "Kanoon Mitra: "}
                  </span>
                  {t.text}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upgrade prompt for free users at limit */}
      {!isPremium && remainingSeconds === 0 && callState !== "active" && (
        <div className="mt-8 w-full max-w-sm animate-fade-up">
          <div className="rounded-3xl border border-brass-100 bg-brass-50 p-6 text-center">
            <Crown size={24} className="mx-auto text-brass-400 mb-3" />
            <p className="font-display text-base font-semibold text-ink mb-1">
              {lang === "ne" ? "आजको नि:शुल्क समय सकियो" : "Today's free time is up"}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {lang === "ne" ? "भोलि फेरि ५ मिनेट पाउनुहुनेछ, वा अहिले प्रिमियममा अपग्रेड गर्नुहोस्।" : "Come back tomorrow for 5 more free minutes, or upgrade now."}
            </p>
            <Link href="/pricing">
              <Button className="w-full">
                <Crown size={14} /> {lang === "ne" ? "प्रिमियममा अपग्रेड" : "Upgrade to Premium"}
              </Button>
            </Link>
          </div>
        </div>
      )}

      <p className="mt-10 max-w-xs text-center text-xs text-slate-400">
        {lang === "ne"
          ? "⚠️ यो सामान्य कानूनी जानकारी हो, आधिकारिक सल्लाह होइन।"
          : "⚠️ General legal information only, not official legal advice."}
      </p>
    </div>
  );
}
