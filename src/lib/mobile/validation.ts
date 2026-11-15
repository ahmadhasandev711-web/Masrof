import type { ZodError } from "zod";

/**
 * Mobile routes build schemas with an identity translator, so a failed rule's
 * message IS its `validation.*` key (e.g. "accountNameMin2"). The app turns that
 * key into the same sentence the web shows. Issues without a custom message
 * (zod's own English text) collapse to the generic "invalidData".
 */
export function validationErrorCode(error: ZodError): string {
  const message = error.issues[0]?.message;
  return message && /^[a-zA-Z][a-zA-Z0-9]*$/.test(message) ? message : "invalidData";
}
