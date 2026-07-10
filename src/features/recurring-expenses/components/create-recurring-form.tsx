"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  createRecurringExpenseAction,
  type CreateRecurringState,
} from "@/features/recurring-expenses/actions/create-recurring";
import { useTranslations } from "next-intl";

type AccountOption = { id: string; name: string };
type CategoryOption = { id: string; name: string; icon?: string | null };

const initialState: CreateRecurringState = { error: null };

const WEEKDAYS = [
  { value: 0, key: "sunday" },
  { value: 1, key: "monday" },
  { value: 2, key: "tuesday" },
  { value: 3, key: "wednesday" },
  { value: 4, key: "thursday" },
  { value: 5, key: "friday" },
  { value: 6, key: "saturday" },
] as const;

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateRecurringExpenseForm({
  workspaceId,
  accounts,
  expenseCategories,
}: {
  workspaceId: string;
  accounts: AccountOption[];
  expenseCategories: CategoryOption[];
}) {
  const tRecurring = useTranslations("forms.recurring");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createRecurringExpenseAction, initialState);
  const [frequency, setFrequency] = useState<"monthly" | "weekly">("monthly");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state.error === null) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync frequency toggle after native form reset
      setFrequency("monthly");
    }
  }, [isPending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div>
        <h2 className="font-semibold text-neutral-900">{tRecurring("title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{tRecurring("hint")}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("description")}</label>
          <input
            name="description"
            type="text"
            placeholder={tRecurring("descriptionPlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("amount")}</label>
          <input
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("frequency")}</label>
          <select
            name="frequency"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as "monthly" | "weekly")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
          >
            <option value="monthly">{tRecurring("monthly")}</option>
            <option value="weekly">{tRecurring("weekly")}</option>
          </select>
        </div>

        {frequency === "monthly" ? (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">{tRecurring("dayOfMonth")}</label>
            <select
              name="dayOfMonth"
              defaultValue={1}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={day}>
                  {tRecurring("dayOfMonthOption", { day })}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-neutral-700">{tRecurring("dayOfWeek")}</label>
            <select
              name="dayOfWeek"
              defaultValue={0}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            >
              {WEEKDAYS.map((day) => (
                <option key={day.value} value={day.value}>
                  {tRecurring(`weekdays.${day.key}`)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("firstDue")}</label>
          <input
            name="nextDueDate"
            type="date"
            defaultValue={todayIsoDate()}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("account")}</label>
          <select name="accountId" className="rounded-lg border border-neutral-300 px-3 py-2 text-right" required>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tRecurring("category")}</label>
          <select name="categoryId" className="rounded-lg border border-neutral-300 px-3 py-2 text-right" required>
            {expenseCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon ?? ""} {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || accounts.length === 0 || expenseCategories.length === 0}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("saving") : tRecurring("submit")}
      </button>
    </form>
  );
}
