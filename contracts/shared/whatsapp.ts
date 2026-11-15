/** WhatsApp links and message texts — same wording on web and mobile. */

/** Normalize phone to digits for wa.me (Egypt: 01... → 201...). */
export function normalizeWhatsAppPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;

  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  if (digits.length === 10) return `20${digits}`;
  return digits;
}

export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppSelfReminderUrl(userPhone: string, message: string): string | null {
  return buildWhatsAppUrl(userPhone, message);
}

export type WhatsAppTranslator = (
  key: string,
  values?: Record<string, string | number>,
) => string;

export function recurringExpenseReminderMessage(
  t: WhatsAppTranslator,
  input: {
    description: string;
    amountLabel: string;
    dueDateLabel: string;
    workspaceName: string;
  },
) {
  return [
    t("recurringReminder.title"),
    "",
    t("recurringReminder.workspace", { name: input.workspaceName }),
    t("recurringReminder.expense", { description: input.description }),
    t("recurringReminder.amount", { amount: input.amountLabel }),
    t("recurringReminder.dueDate", { date: input.dueDateLabel }),
  ].join("\n");
}

export function projectReceivableReminderMessage(
  t: WhatsAppTranslator,
  input: {
    clientName: string;
    projectName: string;
    remainingLabel: string;
    dueDateLabel: string;
    workspaceName: string;
  },
) {
  return [
    t("receivableReminder.greeting", { name: input.clientName }),
    "",
    t("receivableReminder.body", {
      project: input.projectName,
      workspace: input.workspaceName,
    }),
    t("receivableReminder.remaining", { amount: input.remainingLabel }),
    t("receivableReminder.dueDate", { date: input.dueDateLabel }),
    "",
    t("receivableReminder.thanks"),
  ].join("\n");
}

export function invoiceShareWhatsAppMessage(
  t: WhatsAppTranslator,
  input: {
    clientName: string;
    invoiceNumber: string;
    remainingLabel: string;
    dueDateLabel?: string | null;
    workspaceName: string;
    shareUrl: string;
  },
) {
  const lines = [
    t("invoiceShare.greeting", { name: input.clientName }),
    "",
    t("invoiceShare.body", {
      invoice: input.invoiceNumber,
      workspace: input.workspaceName,
    }),
    t("invoiceShare.amount", { amount: input.remainingLabel }),
  ];

  if (input.dueDateLabel) {
    lines.push(t("invoiceShare.dueDate", { date: input.dueDateLabel }));
  }

  lines.push("", t("invoiceShare.viewLink", { url: input.shareUrl }));
  lines.push("", t("invoiceShare.thanks"));

  return lines.join("\n");
}
