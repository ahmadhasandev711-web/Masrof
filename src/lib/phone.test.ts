import { describe, it, expect } from "vitest";
import { normalizePhoneNumber, isValidPhoneNumber, toAsciiDigits } from "./phone";

describe("phone normalization & validation", () => {
  it("converts Arabic Eastern numerals to ASCII", () => {
    expect(toAsciiDigits("٠١٠١٢٣٤٥٦٧٨")).toBe("01012345678");
  });

  it("normalizes Egyptian mobile formats to +201...", () => {
    expect(normalizePhoneNumber("01012345678")).toBe("+201012345678");
    expect(normalizePhoneNumber("01198765432")).toBe("+201198765432");
    expect(normalizePhoneNumber("01233344455")).toBe("+201233344455");
    expect(normalizePhoneNumber("01555566677")).toBe("+201555566677");
    // With Arabic digits
    expect(normalizePhoneNumber("٠١٠١٢٣٤٥٦٧٨")).toBe("+201012345678");
    // With spaces and hyphens
    expect(normalizePhoneNumber("010 1234 5678")).toBe("+201012345678");
    expect(normalizePhoneNumber("010-1234-5678")).toBe("+201012345678");
  });

  it("handles numbers already formatted with +20 or 20", () => {
    expect(normalizePhoneNumber("+201012345678")).toBe("+201012345678");
    expect(normalizePhoneNumber("201012345678")).toBe("+201012345678");
  });

  it("handles valid international numbers with plus", () => {
    expect(normalizePhoneNumber("+966512345678")).toBe("+966512345678");
    expect(normalizePhoneNumber("+14155552671")).toBe("+14155552671");
  });

  it("rejects invalid inputs", () => {
    expect(normalizePhoneNumber("")).toBeNull();
    expect(normalizePhoneNumber("abc")).toBeNull();
    expect(normalizePhoneNumber("1234")).toBeNull();
    expect(isValidPhoneNumber("not-a-number")).toBe(false);
    expect(isValidPhoneNumber("01012345678")).toBe(true);
  });
});
