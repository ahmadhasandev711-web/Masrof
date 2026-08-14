import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { checkRateLimit, clientKeyFromRequest } from "@/lib/rate-limit";

const handler = toNextJsHandler(auth);

export const GET = handler.GET;

export async function POST(request: Request) {
  const key = `auth:${clientKeyFromRequest(request)}`;
  const limit = await checkRateLimit(key, 40, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }
  return handler.POST(request);
}
