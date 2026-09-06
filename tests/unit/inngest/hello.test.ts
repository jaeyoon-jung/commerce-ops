import { describe, expect, it } from "vitest";
import { buildGreeting } from "@/inngest/functions/hello";

describe("buildGreeting", () => {
  it("greets by name", () => {
    expect(buildGreeting("Jaeyoon")).toBe("Hello Jaeyoon, from commerce-ops.");
  });

  it("handles non-ASCII names, since operators and customers are Japanese", () => {
    expect(buildGreeting("田中")).toBe("Hello 田中, from commerce-ops.");
  });

  it("is a plain function callable without the Inngest runtime", () => {
    // This is the property that matters: every later job — ingestion, decision
    // follow-ups, device recovery — keeps its logic testable in isolation, with
    // createFunction as a thin registration wrapper.
    expect(typeof buildGreeting).toBe("function");
    expect(buildGreeting.length).toBe(1);
  });
});
