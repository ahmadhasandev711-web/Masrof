export type ParsedReceiptFields = {
  amount: number | null;
  transactionDate: string | null;
  description: string | null;
  merchant: string | null;
};

const TOTAL_PATTERNS = [
  /(?:total|amount due|grand total|المجموع|الإجمالي|اجمالي|الصافي|net)\s*[:\-]?\s*(?:egp|ج\.?\s*م|le)?\s*([\d,]+\.?\d*)/i,
  /(?:egp|ج\.?\s*م|le)\s*([\d,]+\.?\d*)\s*$/im,
  /\b([\d,]+\.\d{2})\s*(?:egp|ج\.?\s*م|le)\b/i,
];

const DATE_PATTERNS = [
  /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/,
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/,
  /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})\b/,
];

function parseAmount(raw: string): number | null {
  const normalized = raw.replace(/,/g, "");
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) return null;
  return value;
}

function pickLargestAmount(text: string): number | null {
  const candidates: number[] = [];
  for (const pattern of TOTAL_PATTERNS) {
    for (const match of text.matchAll(new RegExp(pattern.source, pattern.flags + "g"))) {
      const value = parseAmount(match[1] ?? "");
      if (value != null) candidates.push(value);
    }
  }
  const generic = text.matchAll(/\b([\d,]+\.\d{2})\b/g);
  for (const match of generic) {
    const value = parseAmount(match[1] ?? "");
    if (value != null && value >= 1) candidates.push(value);
  }
  if (candidates.length === 0) return null;
  return Math.max(...candidates);
}

function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;

    let year: number;
    let month: number;
    let day: number;

    if (match[1]!.length === 4) {
      year = Number(match[1]);
      month = Number(match[2]);
      day = Number(match[3]);
    } else {
      day = Number(match[1]);
      month = Number(match[2]);
      const yPart = match[3]!;
      year = yPart.length === 2 ? 2000 + Number(yPart) : Number(yPart);
    }

    if (month < 1 || month > 12 || day < 1 || day > 31 || year < 2000 || year > 2100) {
      continue;
    }

    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  return null;
}

function guessMerchant(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 3 && /[\p{L}]/u.test(line));

  for (const line of lines.slice(0, 6)) {
    if (/receipt|invoice|فاتورة|إيصال|tax|vat|qr/i.test(line)) continue;
    if (/^\d/.test(line)) continue;
    return line.slice(0, 80);
  }
  return null;
}

export function parseReceiptText(rawText: string): ParsedReceiptFields {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) {
    return { amount: null, transactionDate: null, description: null, merchant: null };
  }

  const merchant = guessMerchant(rawText);
  return {
    amount: pickLargestAmount(text),
    transactionDate: parseDate(text),
    description: merchant,
    merchant,
  };
}
