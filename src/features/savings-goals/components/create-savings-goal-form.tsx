"use client";

import { useActionState, useRef, useEffect } from "react";
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
      className={showTitle ? "flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm" : "flex flex-col gap-4"}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      {showTitle && <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="goal-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
          </label>
          <input
            id="goal-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-target" className="text-sm font-medium text-neutral-700">
            {tForm("targetAmount")}
          </label>
          <input
            id="goal-target"
            name="targetAmount"
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="goal-deadline" className="text-sm font-medium text-neutral-700">
            {tForm("deadline")} ({tShared("optional")})
          </label>
          <input
            id="goal-deadline"
            name="deadline"
            type="date"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
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
          className="rounded-xl bg-[#065F46] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#054E3A] disabled:opacity-60"
        >
          {isPending ? tCommon("adding") : tForm("submit")}
        </button>
      </div>
    </form>
  );
}
