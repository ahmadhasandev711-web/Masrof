import "server-only";

import { createWorker } from "tesseract.js";
import { parseReceiptText, type ParsedReceiptFields } from "@/features/receipts/parse-receipt-text";

export type ReceiptScanResult = ParsedReceiptFields & {
  rawText: string;
  confidence: number;
};

export async function scanReceiptImage(buffer: Buffer): Promise<ReceiptScanResult> {
  const worker = await createWorker("eng+ara");
  try {
    const { data } = await worker.recognize(buffer);
    const parsed = parseReceiptText(data.text);
    return {
      ...parsed,
      rawText: data.text,
      confidence: data.confidence,
    };
  } finally {
    await worker.terminate();
  }
}
