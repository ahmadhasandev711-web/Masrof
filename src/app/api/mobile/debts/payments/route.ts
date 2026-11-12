import { NextResponse } from "next/server";
import { recordDebtPaymentSchema } from "@/features/debts/schemas";
import { debtsService } from "@/features/debts/debts.service";
import { DebtOverpaymentError } from "@/features/debts/debts.errors";
import {
  requireMobileSession,
  requireMobileWorkspace,
} from "@/lib/mobile/session";
import { resultToResponse, thrownToMobileResponse } from "@/server/kernel";

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
    const items = await debtsService.listPayments(access.workspaceId, debtId);
    return NextResponse.json({ items });
  } catch (error) {
    return thrownToMobileResponse(error);
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

    const result = await debtsService.recordPayment(session.user.id, parsed.data);
    if (!result.ok) {
      if (result.error instanceof DebtOverpaymentError) {
        return NextResponse.json(
          { error: "overpayment", remainingAmount: result.error.remainingAmount },
          { status: 400 },
        );
      }
      return resultToResponse(result);
    }

    return NextResponse.json(result.value, { status: 201 });
  } catch (error) {
    return thrownToMobileResponse(error);
  }
}
