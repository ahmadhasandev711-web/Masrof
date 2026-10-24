import { NextResponse } from "next/server";
import { recordDebtPaymentSchema } from "@/features/debts/schemas";
import {
  getDebtPayments,
  recordDebtPayment,
  DebtNotFoundError,
  DebtAccountNotFoundError,
  DebtOverpaymentError,
} from "@/features/debts/data";
import { assertPlanFeature } from "@/features/subscriptions/data";
import {
  mobileErrorResponse,
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";

export async function GET(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const workspaceId = url.searchParams.get("workspaceId");
  const debtId = url.searchParams.get("debtId");

  if (!debtId) {
    return NextResponse.json({ error: "debtIdRequired" }, { status: 400 });
  }

  const access = await requireMobileWorkspace(session.user.id, workspaceId, "read");
  if (access instanceof NextResponse) return access;

  try {
    const items = await getDebtPayments(access.workspaceId, debtId);
    return NextResponse.json({ items });
  } catch (error) {
    return mobileErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const session = await requireMobileSession(request);
  if (session instanceof NextResponse) return session;

  try {
    const body = await request.json();
    const parsed = recordDebtPaymentSchema(() => "invalid").safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "invalidData" },
        { status: 400 },
      );
    }

    const access = await requireMobileWorkspace(session.user.id, parsed.data.workspaceId, "write");
    if (access instanceof NextResponse) return access;

    const featureError = await assertPlanFeature(session.user.id, "debts");
    if (featureError) {
      return NextResponse.json({ error: featureError }, { status: 403 });
    }

    const result = await recordDebtPayment(
      {
        workspaceId: parsed.data.workspaceId,
        debtId: parsed.data.debtId,
        accountId: parsed.data.accountId,
        amount: parsed.data.amount,
        paymentDate: parsed.data.paymentDate,
        reference: parsed.data.reference,
        notes: parsed.data.notes,
        idempotencyKey: parsed.data.idempotencyKey,
      },
      session.user.id,
    );

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof DebtNotFoundError) {
      return NextResponse.json({ error: "debtNotFound" }, { status: 404 });
    }
    if (error instanceof DebtAccountNotFoundError) {
      return NextResponse.json({ error: "accountNotFound" }, { status: 404 });
    }
    if (error instanceof DebtOverpaymentError) {
      return NextResponse.json(
        { error: "overpayment", remainingAmount: error.remainingAmount },
        { status: 400 },
      );
    }
    return mobileErrorResponse(error);
  }
}
