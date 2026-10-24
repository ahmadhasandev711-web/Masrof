import { describe, expect, it } from "vitest";
import { resolveLocaleFromHeader, getDirection, isAppLocale } from "./config";

describe("i18n config & header locale detection", () => {
  it("defaults to 'ar' when header is missing or empty", () => {
    expect(resolveLocaleFromHeader(undefined)).toBe("ar");
    expect(resolveLocaleFromHeader(null)).toBe("ar");
    expect(resolveLocaleFromHeader("")).toBe("ar");
  });

  it("detects English when primary language is English", () => {
    expect(resolveLocaleFromHeader("en-US,en;q=0.9")).toBe("en");
    expect(resolveLocaleFromHeader("en-GB,en;q=0.8")).toBe("en");
    expect(resolveLocaleFromHeader("en")).toBe("en");
  });

  it("detects Arabic when primary language is Arabic", () => {
    expect(resolveLocaleFromHeader("ar-EG,ar;q=0.9,en;q=0.8")).toBe("ar");
    expect(resolveLocaleFromHeader("ar-SA,ar;q=0.9")).toBe("ar");
    expect(resolveLocaleFromHeader("ar")).toBe("ar");
  });

  it("prioritizes the first occurring supported language in multi-language headers", () => {
    expect(resolveLocaleFromHeader("fr-FR,en;q=0.8,ar;q=0.5")).toBe("en");
    expect(resolveLocaleFromHeader("fr-FR,ar;q=0.8,en;q=0.5")).toBe("ar");
  });

  it("correctly identifies RTL / LTR direction", () => {
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });

  it("validates supported app locales", () => {
    expect(isAppLocale("ar")).toBe(true);
    expect(isAppLocale("en")).toBe(true);
    expect(isAppLocale("fr")).toBe(false);
  });
});
