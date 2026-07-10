"use client";

import { useActionState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { archiveSavingsGoalAction } from "@/features/savings-goals/actions/archive-goal";
import {
  updateGoalProgressAction,
  type UpdateGoalProgressState,
} from "@/features/savings-goals/actions/update-goal-progress";
import { useTranslations } from "next-intl";

type SavingsGoalItem = {
  _id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  remaining: number;
  percentage: number;
  deadline: Date | string | null;
};

const progressInitialState: UpdateGoalProgressState = { error: null };

function progressBarColor(percentage: number) {
  if (percentage >= 100) return "bg-emerald-600";
  if (percentage >= 80) return "bg-emerald-500";
  return "bg-emerald-600";
}

function formatDeadline(deadline: Date | string | null) {
  if (!deadline) return null;
  return new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium" }).format(new Date(deadline));
}

function UpdateProgressForm({
  goalId,
  workspaceId,
}: {
  goalId: string;
  workspaceId: string;
}) {
  const tForm = useTranslations("forms.savingsGoal");
  const [state, formAction, isPending] = useActionState(updateGoalProgressAction, progressInitialState);

  return (
    <form action={formAction} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="goalId" value={goalId} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`progress-${goalId}`} className="text-xs text-neutral-500">
          {tForm("addAmount")}
        </label>
        <input
          id={`progress-${goalId}`}
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          className="w-28 rounded-lg border border-neutral-300 px-2 py-1.5 text-right text-sm focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? "..." : tForm("update")}
      </button>
      {state.error && (
        <p role="alert" className="w-full text-xs text-red-600">
          {state.error}
        </p>
      )}
    </form>
  );
}

function ArchiveGoalButton({ goalId, workspaceId }: { goalId: string; workspaceId: string }) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("deleteSavingsGoal"))) return;
        startTransition(() => archiveSavingsGoalAction(goalId, workspaceId));
      }}
      disabled={isPending}
      className="text-xs text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("delete")}
    </button>
  );
}

export function SavingsGoalList({
  goals,
  workspaceId,
  currency,
}: {
  goals: SavingsGoalItem[];
  workspaceId: string;
  currency: string;
}) {
  const tEmpty = useTranslations("empty");
  const tDashboard = useTranslations("dashboard.alerts");
  if (goals.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noGoals")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {goals.map((goal) => {
        const clampedPercentage = Math.min(100, Math.max(0, goal.percentage));
        const deadlineLabel = formatDeadline(goal.deadline);
        const isComplete = goal.percentage >= 100;

        return (
          <li
            key={goal._id}
            className={`rounded-xl border bg-white p-5 shadow-sm ${
              isComplete ? "border-emerald-200" : "border-neutral-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">
                  {isComplete ? "🎉 " : "🎯 "}
                  {goal.name}
                </p>
                {deadlineLabel && (
                  <p className="text-xs text-neutral-500">
                    {tDashboard("dueDate")} {deadlineLabel}
                  </p>
                )}
              </div>
              <ArchiveGoalButton goalId={goal._id} workspaceId={workspaceId} />
            </div>

            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div
                className={`h-full ${progressBarColor(goal.percentage)}`}
                style={{ width: `${clampedPercentage}%` }}
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-neutral-500">
                {formatMoney(goal.currentAmount, { currency })} / {formatMoney(goal.targetAmount, { currency })}
              </span>
              <span className="font-medium text-neutral-600">{goal.percentage}%</span>
            </div>

            {goal.remaining > 0 && (
              <p className="mt-1 text-xs text-neutral-400">
                {tDashboard("remaining")} {formatMoney(goal.remaining, { currency })}
              </p>
            )}

            <UpdateProgressForm goalId={goal._id} workspaceId={workspaceId} />
          </li>
        );
      })}
    </ul>
  );
}
