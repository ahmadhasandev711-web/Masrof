import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getMobileEntitlements } from "@/features/subscriptions/mobile-entitlements";

export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const entitlements = await getMobileEntitlements(session.user.id);
  return NextResponse.json({
    user: {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    },
    ...entitlements,
  });
}
