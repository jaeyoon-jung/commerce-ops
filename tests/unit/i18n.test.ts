import { describe, expect, it } from "vitest";
import ja from "../../messages/ja.json";
import ko from "../../messages/ko.json";
import { defaultLocale, locales, routing } from "@/i18n/routing";

/** Flatten to dotted paths so a nested key added to one file but not the other is caught. */
function keyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return [prefix];
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key),
  );
}

describe("locale configuration", () => {
  it("supports exactly ja and ko", () => {
    expect([...locales]).toEqual(["ja", "ko"]);
    expect([...routing.locales]).toEqual(["ja", "ko"]);
  });

  it("defaults to Japanese", () => {
    expect(defaultLocale).toBe("ja");
    expect(routing.defaultLocale).toBe("ja");
  });
});

describe("message catalogues", () => {
  const jaKeys = keyPaths(ja).sort();
  const koKeys = keyPaths(ko).sort();

  it("are non-empty", () => {
    expect(jaKeys.length).toBeGreaterThan(0);
  });

  it("have identical key sets", () => {
    // Drift here is the failure mode i18n retrofits are made of: a string added
    // to ja and forgotten in ko renders as a raw key to Korean operators.
    expect(koKeys).toEqual(jaKeys);
  });

  it("has a message file for every configured locale", () => {
    expect(Object.keys({ ja, ko }).sort()).toEqual([...locales].sort());
  });

  it("has no blank message values", () => {
    const blanks = Object.entries({ ja, ko }).flatMap(([locale, messages]) =>
      keyPaths(messages)
        .filter((path) => {
          const value = path
            .split(".")
            .reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], messages);
          return typeof value !== "string" || value.trim() === "";
        })
        .map((path) => `${locale}.${path}`),
    );
    expect(blanks).toEqual([]);
  });
});
