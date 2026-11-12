/**
 * Stable application errors shared by domain services, web actions, and mobile routes.
 * Controllers translate `code` for humans; services never return localized copy as the sole signal.
 */
export class AppError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message?: string,
    status = 400,
    details?: Record<string, unknown>,
  ) {
    super(message ?? code);
    this.name = "AppError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(code = "notFound", message?: string) {
    super(code, message ?? code, 404);
    this.name = "NotFoundError";
  }
}

export class InvalidReferenceError extends AppError {
  constructor(code = "invalidReference", message?: string) {
    super(code, message ?? code, 400);
    this.name = "InvalidReferenceError";
  }
}

export class PlanFeatureError extends AppError {
  constructor(message: string) {
    super("planFeatureRequired", message, 403);
    this.name = "PlanFeatureError";
  }
}

export class PlanLimitError extends AppError {
  constructor(message: string) {
    super("planLimitReached", message, 403);
    this.name = "PlanLimitError";
  }
}

export class ValidationAppError extends AppError {
  constructor(message: string) {
    super("invalidData", message, 400);
    this.name = "ValidationAppError";
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
