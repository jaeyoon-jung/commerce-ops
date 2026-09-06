import type { ReactNode } from "react";

/**
 * next-intl owns the real <html> element in `[locale]/layout.tsx`, where the
 * lang attribute and the message provider are known. This root layout exists
 * only because Next requires one at the app root.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
