import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import sharp from "sharp";
import { getCurrentSession } from "@/features/auth/session";
import { verifyWorkspaceWriteAccess } from "@/features/workspaces/access";
import { storePublicObject } from "@/lib/storage";
import { checkMemoryRateLimit, clientKeyFromRequest } from "@/lib/rate-limit/memory";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const tErrors = await getTranslations("errors");
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  const rate = checkMemoryRateLimit(
    `upload-receipt:${clientKeyFromRequest(request, session.user.id)}`,
    20,
    60_000,
  );
  if (!rate.ok) {
    return NextResponse.json(
      { error: tErrors("rateLimited") },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSec) } },
    );
  }

  const formData = await request.formData();
  const workspaceId = formData.get("workspaceId");

  if (typeof workspaceId !== "string" || !workspaceId) {
    return NextResponse.json({ error: tErrors("workspaceIdRequired") }, { status: 400 });
  }

  try {
    await verifyWorkspaceWriteAccess(session.user.id, workspaceId);
  } catch {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
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

  const processed = await sharp(buffer)
    .rotate()
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const stored = await storePublicObject({
    folder: "receipts",
    filename,
    body: processed,
    contentType: "image/webp",
  });

  return NextResponse.json({ url: stored.url });
}
