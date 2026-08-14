import { describe, expect, it } from "vitest";
import { csvEscape, csvRow, sanitizeSpreadsheetValue } from "@/lib/export/spreadsheet-safe";

describe("sanitizeSpreadsheetValue", () => {
  it("neutralizes values a spreadsheet would evaluate as a formula", () => {
    expect(sanitizeSpreadsheetValue('=HYPERLINK("http://evil","click")')).toBe(
      '\'=HYPERLINK("http://evil","click")',
    );
    expect(sanitizeSpreadsheetValue("+1+1")).toBe("'+1+1");
    expect(sanitizeSpreadsheetValue("-2+3")).toBe("'-2+3");
    expect(sanitizeSpreadsheetValue("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(sanitizeSpreadsheetValue("\t=cmd")).toBe("'\t=cmd");
  });

  it("leaves ordinary text and numbers untouched", () => {
    expect(sanitizeSpreadsheetValue("مواصلات")).toBe("مواصلات");
    expect(sanitizeSpreadsheetValue("Client A - Retainer")).toBe("Client A - Retainer");
    expect(sanitizeSpreadsheetValue(-1250)).toBe(-1250);
    expect(sanitizeSpreadsheetValue(null)).toBe(null);
  });
});

describe("csvEscape", () => {
  it("quotes separators, quotes and newlines", () => {
    expect(csvEscape("a,b")).toBe('"a,b"');
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscape("line1\nline2")).toBe('"line1\nline2"');
    expect(csvEscape("plain")).toBe("plain");
  });

  it("quotes a sanitized formula so the guard survives the escaping", () => {
    expect(csvEscape('=1,2')).toBe('"\'=1,2"');
  });

  it("joins a row", () => {
    expect(csvRow(["مواصلات", 100.5, "=cmd"])).toBe("مواصلات,100.5,'=cmd");
  });
});
