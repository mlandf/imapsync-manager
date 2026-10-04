"use client";

import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { de, type Dictionary, type TranslationKey } from "./de";
import { en } from "./en";

export type Locale = "de" | "en";

const DICTIONARIES: Record<Locale, Dictionary> = { de, en };
const STORAGE_KEY = "locale";

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

export const I18nContext = createContext<I18nContextValue | null>(null);

export function translate(
  dict: Dictionary,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  let text = dict[key];
  for (const [name, value] of Object.entries(vars ?? {})) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("de");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") setLocaleState(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    window.localStorage.setItem(STORAGE_KEY, next);
    setLocaleState(next);
  }, []);

  const t = useCallback<Translate>(
    (key, vars) => translate(DICTIONARIES[locale], key, vars),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
