import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCurrentSession } from "@/features/auth/session";
import { verifyWorkspaceAccess } from "@/features/workspaces/access";
import { assertWorkspacePlanFeature } from "@/features/subscriptions/data";
import { suggestCategoryForTransaction } from "@/features/transactions/suggest-category";

export async function POST(request: Request) {
  const tErrors = await getTranslations("errors");
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  const body = (await request.json()) as {
    workspaceId?: string;
    type?: "income" | "expense";
    description?: string;
    notes?: string;
  };

  if (!body.workspaceId || !body.type) {
    return NextResponse.json({ error: tErrors("invalidData") }, { status: 400 });
  }

  try {
    await verifyWorkspaceAccess(session.user.id, body.workspaceId);
  } catch {
    return NextResponse.json({ error: tErrors("unauthorized") }, { status: 401 });
  }

  const featureError = await assertWorkspacePlanFeature(session.user.id, body.workspaceId!, "aiCategory");
  if (featureError) {
    return NextResponse.json({ error: featureError }, { status: 403 });
  }

  const suggestion = await suggestCategoryForTransaction({
    workspaceId: body.workspaceId,
    type: body.type,
    description: body.description,
    notes: body.notes,
  });

  return NextResponse.json({ suggestion });
}
