import "server-only";

import { createRequire } from "node:module";
import path from "node:path";
import { createWorker } from "tesseract.js";
import { parseReceiptText, type ParsedReceiptFields } from "@/features/receipts/parse-receipt-text";

export type ReceiptScanResult = ParsedReceiptFields & {
  rawText: string;
  confidence: number;
};

const OCR_TIMEOUT_MS = 45_000;

const require = createRequire(import.meta.url);

function resolveTesseractWorkerPath(): string {
  const tessRoot = path.dirname(require.resolve("tesseract.js/package.json"));
  return path.join(tessRoot, "src", "worker-script", "node", "index.js");
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`OCR timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

export async function scanReceiptImage(buffer: Buffer): Promise<ReceiptScanResult> {
  const worker = await createWorker("eng+ara", undefined, {
    workerPath: resolveTesseractWorkerPath(),
    workerBlobURL: false,
  });

  try {
    const { data } = await withTimeout(worker.recognize(buffer), OCR_TIMEOUT_MS);
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
