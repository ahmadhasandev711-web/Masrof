"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  cancelUserSubscriptionAction,
  reactivateUserAction,
  suspendUserAction,
  updateUserPlanAction,
} from "@/features/admin/actions/user-subscriptions";
import { PLAN_IDS, type PlanId } from "@/features/subscriptions/plans";

type Props = {
  userId: string;
  currentPlan: PlanId;
  isSuspended: boolean;
};

export function UserSubscriptionControls({ userId, currentPlan, isSuspended }: Props) {
  const t = useTranslations("admin.users");
  const tPlans = useTranslations("plans");
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ error: string | null; success: boolean }>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) {
        window.alert(result.error);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {!isSuspended ? (
        <>
          {currentPlan === "free" ? (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmUpgrade"))) {
                  run(() => updateUserPlanAction(userId, "pro"));
                }
              }}
              className="rounded-lg border border-violet-200 bg-violet-50 px-2 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-60 transition"
            >
              {t("upgrade")}
            </button>
          ) : (
            <button
              type="button"
              disabled={isPending}
              onClick={() => {
                if (window.confirm(t("confirmCancelSubscription"))) {
                  run(() => cancelUserSubscriptionAction(userId));
                }
              }}
              className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-60 transition"
            >
              {t("cancelSubscription")}
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => {
              if (window.confirm(t("confirmSuspend"))) {
                run(() => suspendUserAction(userId));
              }
            }}
            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs text-red-700 hover:bg-red-100 disabled:opacity-60"
          >
            {t("suspend")}
          </button>
        </>
      ) : (
        <button
          type="button"
          disabled={isPending}
          onClick={() => run(() => reactivateUserAction(userId, "free"))}
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2 py-1.5 text-xs text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          {t("reactivate")}
        </button>
      )}
    </div>
  );
}
