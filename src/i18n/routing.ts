import { defineRouting } from "next-intl/routing";

/**
 * Operator UI locales. Japanese is the default; Korean is the alternate.
 * Customer-facing content (SMS/LINE/email templates, AI drafts) stays
 * Japanese — the locale switch is operator UI only. See tech-stack.md.
 */
export const locales = ["ja", "ko"] as const;
export const defaultLocale = "ja" satisfies Locale;

export type Locale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale,
});
