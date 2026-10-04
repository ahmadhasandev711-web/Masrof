"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  updateAdminWorkspacePlanAction,
  toggleAdminWorkspaceSuspendAction,
} from "@/features/admin/actions/workspace-plan";
import { PLAN_IDS, type PlanId } from "@/features/subscriptions/plans";

type Props = {
  workspaceId: string;
  currentPlan: PlanId;
  isSuspended: boolean;
};

export function WorkspacePlanControls({ workspaceId, currentPlan, isSuspended }: Props) {
  const t = useTranslations("admin.workspaces");
  const tPlans = useTranslations("plans");
  const [isPending, startTransition] = useTransition();
  const [customDate, setCustomDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);

  function run(action: () => Promise<{ error: string | null; success: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top Row: Plan selector & Quick Extension Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-neutral-500">{t("plan")}:</label>
          <span
            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ${
              currentPlan === "pro"
                ? "bg-violet-100 text-violet-800 border border-violet-200"
                : "bg-neutral-100 text-neutral-700 border border-neutral-200"
            }`}
          >
            {tPlans(currentPlan)}
          </span>
        </div>

        {currentPlan === "free" && !isSuspended && (
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(t("confirmUpgradeToPro"))) {
                run(() =>
                  updateAdminWorkspacePlanAction(workspaceId, "pro", {
                    durationMonths: 1,
                    extendFromCurrent: false,
                  }),
                );
              }
            }}
            className="rounded-lg border border-violet-300 bg-violet-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-700 disabled:opacity-60 transition shadow-xs"
          >
            {t("upgradeToPro")}
          </button>
        )}

        {currentPlan !== "free" && !isSuspended && (
          <>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmExtendGrace"))) {
                  run(() =>
                    updateAdminWorkspacePlanAction(workspaceId, currentPlan, {
                      extendDays: 7,
                      extendFromCurrent: true,
                    }),
                  );
                }
              }}
              className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition"
              title={t("extendGraceHint")}
            >
              {t("extendGrace")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmExtendMonth"))) {
                  run(() =>
                    updateAdminWorkspacePlanAction(workspaceId, currentPlan, {
                      durationMonths: 1,
                      extendFromCurrent: true,
                    }),
                  );
                }
              }}
              className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 transition"
            >
              {t("extendMonth")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmExtendYear"))) {
                  run(() =>
                    updateAdminWorkspacePlanAction(workspaceId, currentPlan, {
                      durationMonths: 12,
                      extendFromCurrent: true,
                    }),
                  );
                }
              }}
              className="rounded-lg border border-violet-200 bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 transition"
            >
              {t("extendYear")}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={() => setShowDatePicker((prev) => !prev)}
              className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition"
            >
              {showDatePicker ? t("closeCustomDate") : t("customDate")}
            </button>
          </>
        )}
      </div>

      {/* Custom Date Picker Accordion */}
      {showDatePicker && currentPlan !== "free" && !isSuspended && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
          <label className="text-xs font-medium text-neutral-600">{t("selectExpiryDate")}:</label>
          <input
            type="date"
            value={customDate}
            onChange={(e) => setCustomDate(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs text-neutral-800 focus:outline-hidden focus:border-violet-500"
          />
          <button
            type="button"
            disabled={!customDate || isPending}
            onClick={() => {
              if (window.confirm(t("confirmSetCustomDate", { date: customDate }))) {
                run(() =>
                  updateAdminWorkspacePlanAction(workspaceId, currentPlan, {
                    customDateString: customDate,
                  }),
                );
              }
            }}
            className="rounded-lg bg-neutral-900 px-3 py-1 text-xs font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition"
          >
            {t("applyDate")}
          </button>
        </div>
      )}

      {/* Bottom Actions: Downgrade & Suspend/Reactivate */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100">
        {!isSuspended ? (
          <>
            {currentPlan !== "free" && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => {
                  if (window.confirm(t("confirmDowngrade"))) {
                    run(() =>
                      updateAdminWorkspacePlanAction(workspaceId, "free", {
                        durationMonths: 0,
                        extendFromCurrent: false,
                      }),
                    );
                  }
                }}
                className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition"
              >
                {t("downgradeFree")}
              </button>
            )}
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmSuspendWorkspace"))) {
                  run(() => toggleAdminWorkspaceSuspendAction(workspaceId, true));
                }
              }}
              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-60 transition"
            >
              {t("suspendWorkspace")}
            </button>
          </>
        ) : (
          <button
            type="button"
            disabled={isPending}
            onClick={() => run(() => toggleAdminWorkspaceSuspendAction(workspaceId, false))}
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60 transition"
          >
            {t("reactivateWorkspace")}
          </button>
        )}
      </div>
    </div>
  );
}
