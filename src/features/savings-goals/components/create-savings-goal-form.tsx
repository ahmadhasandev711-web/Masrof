"use client";

import { useActionState, useRef, useEffect } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import {
  createSavingsGoalAction,
  type CreateSavingsGoalState,
} from "@/features/savings-goals/actions/create-goal";
import { useTranslations } from "next-intl";

const initialState: CreateSavingsGoalState = { error: null };

export function CreateSavingsGoalForm({
  workspaceId,
  onSuccess,
  onCancel,
  showTitle = true,
}: {
  workspaceId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  showTitle?: boolean;
}) {
  const tForm = useTranslations("forms.savingsGoal");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createSavingsGoalAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmitted = useRef(false);

  useEffect(() => {
    if (hasSubmitted.current && !isPending && state.error === null) {
      formRef.current?.reset();
      hasSubmitted.current = false;
      onSuccess?.();
    }
  }, [isPending, state.error, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className={showTitle ? "flex flex-col gap-4 rounded-2xl border border-neutral-200 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-6 shadow-sm" : "flex flex-col gap-4"}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />

      {showTitle && <h2 className="font-semibold text-neutral-900 dark:text-[#ECEAE4]">{tForm("title")}</h2>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="goal-name" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("name")}
          </label>
          <input
            id="goal-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-[#34D399]/20"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-target" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("targetAmount")}
          </label>
          <input
            id="goal-target"
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-[#34D399]/20"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-deadline" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("deadline")} ({tShared("optional")})
          </label>
          <input
            id="goal-deadline"
            name="deadline"
            type="date"
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-[#34D399]/20"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-4 py-2 text-sm font-medium text-neutral-600 dark:text-[#9AA39F] transition hover:bg-neutral-50 dark:hover:bg-[#26302C] disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending}
          onClick={() => {
            hasSubmitted.current = true;
          }}
          className="rounded-xl bg-[#065F46] dark:bg-[#10B981] px-4 py-2 text-sm font-medium text-white dark:text-[#04231A] transition hover:bg-[#054E3A] dark:hover:bg-[#34D399] disabled:opacity-60"
        >
          {isPending ? tCommon("adding") : tForm("submit")}
        </button>
      </div>
    </form>
  );
}
