import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import sharp from "sharp";
import { getCurrentSession } from "@/features/auth/session";
import { requireWorkspaceOwner } from "@/features/workspaces/access";
import { storePublicObject } from "@/lib/storage";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const tErrors = await getTranslations("errors");
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  const rate = await checkRateLimit(
    `branding-upload:${clientKeyFromRequest(request, session.user.id)}`,
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
    await requireWorkspaceOwner(session.user.id, workspaceId);
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
  const filename = `${workspaceId}-${Date.now()}-${randomBytes(4).toString("hex")}.webp`;

  const processed = await sharp(buffer)
    .rotate()
    .resize({ width: 600, height: 600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();

  const stored = await storePublicObject({
    folder: "branding",
    filename,
    body: processed,
    contentType: "image/webp",
  });

  return NextResponse.json({ url: stored.url });
}
