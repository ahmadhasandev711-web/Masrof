import { ApiError } from "@/lib/api";

export function resolveApiErrorMessage(
  error: unknown,
  isRTL: boolean,
  fallback?: string,
): string {
  if (error instanceof ApiError) {
    const messages: Record<string, { ar: string; en: string }> = {
      planLimitReached: {
        ar: "وصلت لحد خطتك الحالية. راجع «خطتي» أو ترقّ للباقة المناسبة.",
        en: "You reached your plan limit. Check My Plan or upgrade.",
      },
      writeDenied: {
        ar: "صلاحيتك في هذه المساحة للعرض فقط. لا يمكنك التعديل.",
        en: "You have view-only access in this workspace.",
      },
      unauthorized: {
        ar: "لا يمكنك الوصول إلى هذه المساحة.",
        en: "You cannot access this workspace.",
      },
      ownerRequired: {
        ar: "هذا الإجراء يتطلب صلاحية مالك المساحة.",
        en: "This action requires workspace owner access.",
      },
      invalidData: {
        ar: "تحقق من الحقول المطلوبة وأعد المحاولة.",
        en: "Check the required fields and try again.",
      },
      useRecordPayment: {
        ar: "سجّل دفعة من زر «تسجيل دفعة» بدلاً من تغيير الحالة.",
        en: "Use Record payment instead of changing status to paid.",
      },
      invoiceOverpayment: {
        ar: "المبلغ أكبر من المتبقي على الفاتورة.",
        en: "Amount exceeds the invoice remaining balance.",
      },
      invoiceCancelledCannotPay: {
        ar: "لا يمكن تسجيل دفعة على فاتورة ملغاة.",
        en: "Cannot record payment on a cancelled invoice.",
      },
      accountCurrencyMismatch: {
        ar: "عملة الحساب لا تطابق عملة الفاتورة.",
        en: "Account currency does not match the invoice.",
      },
      "server-error": {
        ar: "تعذر الاتصال بالخادم. حاول لاحقاً.",
        en: "Could not reach the server. Try again later.",
      },
      unexpected: {
        ar: "حدث خطأ غير متوقع. حاول مرة أخرى.",
        en: "An unexpected error occurred. Please try again.",
      },
    };

    const entry = messages[error.code];
    if (entry) {
      return isRTL ? entry.ar : entry.en;
    }
  }

  if (fallback) return fallback;
  return isRTL
    ? "تعذر إتمام الطلب. تحقق من الاتصال وحاول مرة أخرى."
    : "Could not complete the request. Check your connection and try again.";
}
