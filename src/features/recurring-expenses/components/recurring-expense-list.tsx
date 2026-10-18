"use client";

import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { isOnOrBeforeToday } from "@/lib/dates";
import type { RecurringExpenseListItem } from "@/features/recurring-expenses/data";
import {
  recordRecurringExpenseAction,
  archiveRecurringExpenseAction,
} from "@/features/recurring-expenses/actions/manage-recurring";
import { recurringExpenseReminderMessage } from "@/features/whatsapp/messages";
import {
  WhatsAppReminderLink,
  WhatsAppSettingsLink,
} from "@/features/whatsapp/components/whatsapp-reminder-link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useTranslations, useLocale } from "next-intl";

function formatDate(isoDate: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : "en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function RecurringExpenseList({
  items,
  workspaceId,
  currency,
  workspaceName,
  userWhatsAppPhone,
  canUseWhatsApp,
}: {
  items: RecurringExpenseListItem[];
  workspaceId: string;
  currency: string;
  workspaceName: string;
  userWhatsAppPhone: string | null;
  canUseWhatsApp: boolean;
}) {
  const tRecurring = useTranslations("forms.recurring");
  const tDashboard = useTranslations("dashboard.budgets");
  const tWhatsapp = useTranslations("forms.whatsapp");
  const tWhatsappMessages = useTranslations("whatsapp");
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const locale = useLocale();

  const frequencyLabels = { monthly: tRecurring("monthly"), weekly: tRecurring("weekly") } as const;

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-6 text-center text-sm text-neutral-400">
        {tDashboard("recurringHint")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <RecurringRow
          key={item.id}
          item={item}
          workspaceId={workspaceId}
          currency={currency}
          locale={locale}
          workspaceName={workspaceName}
          userWhatsAppPhone={userWhatsAppPhone}
          canUseWhatsApp={canUseWhatsApp}
          frequencyLabels={frequencyLabels}
          tRecurring={tRecurring}
          tWhatsapp={tWhatsapp}
          tWhatsappMessages={tWhatsappMessages}
          tConfirm={tConfirm}
          tCommon={tCommon}
        />
      ))}
    </ul>
  );
}

function RecurringRow({
  item,
  workspaceId,
  currency,
  locale,
  workspaceName,
  userWhatsAppPhone,
  canUseWhatsApp,
  frequencyLabels,
  tRecurring,
  tWhatsapp,
  tWhatsappMessages,
  tConfirm,
  tCommon,
}: {
  item: RecurringExpenseListItem;
  workspaceId: string;
  currency: string;
  locale: string;
  workspaceName: string;
  userWhatsAppPhone: string | null;
  canUseWhatsApp: boolean;
  frequencyLabels: { monthly: string; weekly: string };
  tRecurring: ReturnType<typeof useTranslations>;
  tWhatsapp: ReturnType<typeof useTranslations>;
  tWhatsappMessages: ReturnType<typeof useTranslations>;
  tConfirm: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const [isPending, startTransition] = useTransition();
  const [recordConfirmOpen, setRecordConfirmOpen] = useState(false);
  const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
  const due = isOnOrBeforeToday(item.nextDueDate);

  const formatOptions = {
    currency,
    locale: locale === "ar" ? "ar-EG" : "en-US",
  };

  function handleRecordClick() {
    if (!due) {
      setRecordConfirmOpen(true);
      return;
    }
    startTransition(() => recordRecurringExpenseAction(item.id, workspaceId));
  }

  return (
    <li
      className={`rounded-xl border bg-white p-4 shadow-sm ${
        due ? "border-amber-300 bg-amber-50/40" : "border-neutral-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-medium text-neutral-900">
            {item.categoryIcon ?? "🔁"} {item.description || item.categoryName}
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            <span className="font-mono tabular-nums">{formatMoney(item.amount, formatOptions)}</span> · {frequencyLabels[item.frequency]} ·{" "}
            {item.accountName}
          </p>
          <p className={`mt-1 text-xs ${due ? "font-medium text-amber-700" : "text-neutral-400"}`}>
            {due ? tRecurring("dueNow") : tRecurring("nextDue")}
            <span className="font-mono tabular-nums">{formatDate(item.nextDueDate, locale)}</span>
          </p>
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            disabled={isPending}
            onClick={handleRecordClick}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium disabled:opacity-60 ${
              due
                ? "bg-emerald-700 text-white hover:bg-emerald-800"
                : "border border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
            }`}
          >
            {tRecurring("recordNow")}
          </button>
          {canUseWhatsApp ? (
            userWhatsAppPhone ? (
              <WhatsAppReminderLink
                phone={userWhatsAppPhone}
                label={tWhatsapp("label")}
                message={recurringExpenseReminderMessage(tWhatsappMessages, {
                  description: item.description || item.categoryName,
                  amountLabel: formatMoney(item.amount, formatOptions),
                  dueDateLabel: formatDate(item.nextDueDate, locale),
                  workspaceName,
                })}
              />
            ) : (
              <WhatsAppSettingsLink />
            )
          ) : null}
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStopConfirmOpen(true)}
            className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-60"
          >
            {tRecurring("stop")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={recordConfirmOpen}
        title={tRecurring("recordNow")}
        message={tRecurring("recordBeforeDueConfirm", {
          date: formatDate(item.nextDueDate, locale),
        })}
        confirmLabel={tRecurring("recordNow")}
        pendingLabel={tCommon("saving")}
        tone="primary"
        isPending={isPending}
        onConfirm={() => {
          startTransition(async () => {
            await recordRecurringExpenseAction(item.id, workspaceId);
            setRecordConfirmOpen(false);
          });
        }}
        onCancel={() => setRecordConfirmOpen(false)}
      />

      <ConfirmDialog
        open={stopConfirmOpen}
        title={tCommon("confirmation")}
        message={tConfirm("stopRecurring")}
        confirmLabel={tRecurring("stop")}
        pendingLabel={tRecurring("stopping")}
        tone="danger"
        isPending={isPending}
        onConfirm={() => {
          startTransition(async () => {
            await archiveRecurringExpenseAction(item.id, workspaceId);
            setStopConfirmOpen(false);
          });
        }}
        onCancel={() => setStopConfirmOpen(false)}
      />
    </li>
  );
}
