import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest";
import { helloFunction } from "@/inngest/functions/hello";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [helloFunction],
});
