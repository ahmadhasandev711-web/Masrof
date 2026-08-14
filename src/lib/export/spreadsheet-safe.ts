/**
 * Spreadsheet formula injection guard.
 *
 * Exported rows contain user-controlled text (category names, descriptions,
 * client names). Excel, LibreOffice and Google Sheets evaluate any cell whose
 * text starts with `=`, `+`, `-`, `@` or a control character as a formula, so a
 * description like `=HYPERLINK("http://evil","click")` becomes executable
 * content in the file the user downloads. Prefixing the value with a single
 * quote keeps the original text visible while forcing it to stay literal.
 */
const RISKY_PREFIX = /^[=+\-@\t\r]/;

export function sanitizeSpreadsheetValue<T>(value: T): T | string {
  if (typeof value !== "string") return value;
  return RISKY_PREFIX.test(value) ? `'${value}` : value;
}

/** Escapes a value for a CSV cell, guarding against formula injection first. */
export function csvEscape(value: string | number): string {
  const sanitized = String(sanitizeSpreadsheetValue(value));

  if (/[",\n\r]/.test(sanitized)) {
    return `"${sanitized.replace(/"/g, '""')}"`;
  }

  return sanitized;
}

export function csvRow(values: (string | number)[]): string {
  return values.map(csvEscape).join(",");
}
