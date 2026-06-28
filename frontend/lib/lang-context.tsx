"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import Cookies from "js-cookie";
import { translations, Lang, TranslationKey } from "./translations";

type LangContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
};

const LangContext = createContext<LangContextValue | undefined>(undefined);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ne");

  useEffect(() => {
    const saved = Cookies.get("km_lang") as Lang | undefined;
    if (saved === "en" || saved === "ne") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    Cookies.set("km_lang", l, { expires: 365 });
  };

  const t = (key: TranslationKey) => translations[lang][key] ?? translations.en[key];

  return <LangContext.Provider value={{ lang, setLang, t }}>{children}</LangContext.Provider>;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used within LangProvider");
  return ctx;
}
