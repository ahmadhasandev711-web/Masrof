/**
 * Phone number normalization and validation utilities for Sanadat.
 * Supports Egyptian mobile formats, Arab regional formats, and international E.164-compatible numbers.
 */

// Convert Eastern Arabic numerals (٠١٢٣٤٥٦٧٨٩) to standard ASCII digits
export function toAsciiDigits(str: string): string {
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

/**
 * Normalizes phone numbers to standard format:
 * - Egyptian numbers: 010..., 011..., 012..., 015... -> +2010..., +2011..., +2012..., +2015...
 * - International numbers: +... -> +...
 * - Strips whitespace, dashes, and parentheses
 */
export function normalizePhoneNumber(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  const ascii = toAsciiDigits(raw.trim());
  const cleaned = ascii.replace(/[\s\-\(\)\.]/g, "");

  // International format starting with '+'
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (digits.length < 8 || digits.length > 15) return null;
    return `+${digits}`;
  }

  // Pure digits without '+'
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) return null;

  // Egypt: 010/011/012/015 followed by 8 digits (total 11 digits)
  if (/^01[0125]\d{8}$/.test(digits)) {
    return `+20${digits.slice(1)}`;
  }

  // Egypt without leading 0: 10/11/12/15 followed by 8 digits (total 10 digits)
  if (/^1[0125]\d{8}$/.test(digits)) {
    return `+20${digits}`;
  }

  // Egypt with country code prefix 201... (total 12 digits)
  if (/^201[0125]\d{8}$/.test(digits)) {
    return `+${digits}`;
  }

  // Other numbers with 8 to 15 digits
  if (digits.length >= 8 && digits.length <= 15) {
    return `+${digits}`;
  }

  return null;
}

export function isValidPhoneNumber(raw: string): boolean {
  return normalizePhoneNumber(raw) !== null;
}
