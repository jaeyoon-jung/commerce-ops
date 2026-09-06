import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

// Next 16 renamed the `middleware` file convention to `proxy`. next-intl still
// exports its handler as createMiddleware; only the file name changed.
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, API routes (webhooks and health must stay unprefixed),
  // and anything with a file extension.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
