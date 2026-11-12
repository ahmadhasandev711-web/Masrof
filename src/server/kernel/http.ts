import { NextResponse } from "next/server";
import { isAppError } from "@/server/kernel/errors";
import {
  isWorkspaceAuthorizationError,
  WorkspaceAccessDeniedError,
  WorkspaceOwnerRequiredError,
  WorkspaceSuspendedError,
  WorkspaceWriteDeniedError,
} from "@/features/workspaces/access";
import type { Result } from "@/server/kernel/result";

/** Map a domain Result to a JSON HTTP response for /api/mobile. */
export function resultToResponse<T>(
  result: Result<T>,
  options?: { successStatus?: number; map?: (value: T) => unknown },
): NextResponse {
  if (!result.ok) {
    const { error } = result;
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  const body = options?.map ? options.map(result.value) : result.value;
  return NextResponse.json(body, { status: options?.successStatus ?? 200 });
}

export function thrownToMobileResponse(error: unknown): NextResponse {
  if (error instanceof WorkspaceAccessDeniedError) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  if (error instanceof WorkspaceWriteDeniedError) {
    return NextResponse.json({ error: "writeDenied" }, { status: 403 });
  }
  if (error instanceof WorkspaceOwnerRequiredError) {
    return NextResponse.json({ error: "ownerRequired" }, { status: 403 });
  }
  if (
    error instanceof WorkspaceSuspendedError ||
    (error instanceof Error && error.name === "SubscriptionSuspendedError")
  ) {
    return NextResponse.json({ error: "accountSuspended" }, { status: 403 });
  }
  if (isAppError(error)) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.status },
    );
  }
  if (error instanceof Error && "code" in error && typeof (error as { code: unknown }).code === "string") {
    return NextResponse.json({ error: (error as { code: string }).code }, { status: 400 });
  }
  if (isWorkspaceAuthorizationError(error)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 403 });
  }
  console.error("[mobile-api]", error);
  return NextResponse.json({ error: "unexpected" }, { status: 500 });
}
