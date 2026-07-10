import { mkdir } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import sharp from "sharp";
import { getCurrentSession } from "@/features/auth/session";
import { verifyWorkspaceAccess, verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { scanReceiptImage } from "@/features/receipts/extract-receipt-text";
import { suggestCategoryForTransaction } from "@/features/transactions/suggest-category";

export const runtime = "nodejs";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const tErrors = await getTranslations("errors");
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  const formData = await request.formData();
  const workspaceId = formData.get("workspaceId");
  const scanRequested = formData.get("scan") === "1";

  if (typeof workspaceId !== "string" || !workspaceId) {
    return NextResponse.json({ error: tErrors("workspaceIdRequired") }, { status: 400 });
  }

  try {
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  } catch {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  if (scanRequested) {
    const featureError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "ocrReceipts");
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: tErrors("noFile") }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: tErrors("unsupportedFileType") }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: tErrors("fileTooLarge") }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${randomBytes(6).toString("hex")}.webp`;
  const uploadDir = path.join(process.cwd(), "public", "uploads", "receipts");
  const outputPath = path.join(uploadDir, filename);

  await mkdir(uploadDir, { recursive: true });

  const processed = await sharp(buffer)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  await sharp(processed).toFile(outputPath);

  const response: Record<string, unknown> = {
    url: `/uploads/receipts/${filename}`,
  };

  if (scanRequested) {
    try {
      const scan = await scanReceiptImage(processed);
      response.scan = {
        amount: scan.amount,
        transactionDate: scan.transactionDate,
        description: scan.description,
        merchant: scan.merchant,
        confidence: scan.confidence,
      };

      const aiError = await assertWorkspacePlanFeature(session.user.id, workspaceId, "aiCategory");
      if (!aiError && (scan.description || scan.merchant)) {
        const suggestion = await suggestCategoryForTransaction({
          workspaceId,
          type: "expense",
          description: scan.description ?? undefined,
          merchant: scan.merchant ?? undefined,
        });
        if (suggestion) {
          response.categorySuggestion = suggestion;
        }
      }
    } catch (error) {
      console.error("[receipt] OCR scan failed:", error);
      response.scanError = true;
    }
  }

  return NextResponse.json(response);
}
