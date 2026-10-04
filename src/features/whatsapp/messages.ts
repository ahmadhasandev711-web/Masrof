type WhatsAppTranslator = (
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
