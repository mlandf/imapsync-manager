"use client";

import { useContext } from "react";

import { I18nContext, type I18nContextValue } from "@/lib/i18n/context";

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n muss innerhalb von I18nProvider verwendet werden");
  return ctx;
}
