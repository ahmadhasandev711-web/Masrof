"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  adminVerifyUserEmailAction,
  adminQuickExtendUserSubscriptionAction,
} from "@/features/admin/actions/user-admin-ops";
import { NavIcon } from "@/components/ui/app-icons";

type UnverifiedUser = {
  id: string;
  name: string;
  email: string;
  createdAt?: Date;
};

type ExpiringSubscription = {
  userId: string;
  userName: string;
  userEmail: string;
  plan: string;
  expiresAt: string;
  daysRemaining: number;
};

type Props = {
  unverifiedUsers: UnverifiedUser[];
  expiringSubscriptions: ExpiringSubscription[];
};

export function AdminActionQueue({ unverifiedUsers, expiringSubscriptions }: Props) {
  const t = useTranslations("admin.overview");
  const tUsers = useTranslations("admin.users");

  const [activeTab, setActiveTab] = useState<"unverified" | "expiring">("unverified");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const hasItems = unverifiedUsers.length > 0 || expiringSubscriptions.length > 0;

  function handleVerify(userId: string) {
    setPendingId(userId);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        const res = await adminVerifyUserEmailAction(userId);
        if (res.error) {
          window.alert(res.error);
        } else {
          setSuccessMsg("تم تفعيل البريد الإلكتروني بنجاح");
          setTimeout(() => setSuccessMsg(null), 3500);
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  function handleExtend(userId: string, type: "7d" | "1m") {
    setPendingId(`${userId}-${type}`);
    setSuccessMsg(null);
    startTransition(async () => {
      try {
        const payload = type === "7d" ? { extendDays: 7 } : { durationMonths: 1 };
        const res = await adminQuickExtendUserSubscriptionAction(userId, payload);
        if (res.error) {
          window.alert(res.error);
        } else {
          setSuccessMsg(`تم تمديد الاشتراك بنجاح (${type === "7d" ? "7 أيام" : "شهر"})`);
          setTimeout(() => setSuccessMsg(null), 3500);
        }
      } finally {
        setPendingId(null);
      }
    });
  }

  if (!hasItems) {
    return (
      <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-6 text-center shadow-xs">
        <span className="flex justify-center text-emerald-700">
          <NavIcon name="check" className="h-10 w-10" />
        </span>
        <h3 className="mt-2 text-base font-bold text-emerald-900">{t("noPendingActions")}</h3>
        <p className="mt-1 text-xs text-emerald-700">
          جميع الحسابات والاشتراكات في حالة ممتازة ولا توجد اشتراكات مهددة بالانتهاء العاجل.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-neutral-200/90 bg-white p-6 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{t("actionQueueTitle")}</span>
          </h2>
          <p className="mt-0.5 text-xs text-neutral-500">
            إجراءات تشغيلية سريعة بنقرة واحدة لدعم العملاء ومنع توقف الاشتراكات
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="inline-flex rounded-xl bg-neutral-100 p-1">
          <button
            type="button"
            onClick={() => setActiveTab("unverified")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              activeTab === "unverified"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {t("unverifiedQueue")} ({unverifiedUsers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("expiring")}
            className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
              activeTab === "expiring"
                ? "bg-white text-neutral-900 shadow-2xs"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            {t("expiringQueue")} ({expiringSubscriptions.length})
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800">
           {successMsg}
        </div>
      )}

      {/* Tab: Unverified Users */}
      {activeTab === "unverified" && (
        <div className="mt-4 divide-y divide-neutral-100">
          {unverifiedUsers.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-400">
              لا توجد حسابات غير مؤكدة حالياً.
            </p>
          ) : (
            unverifiedUsers.map((user) => (
              <div
                key={user.id}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 hover:bg-neutral-50/60 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold text-xs">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900">{user.name}</p>
                    <p className="text-xs font-mono text-neutral-500" dir="ltr">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pendingId === user.id}
                    onClick={() => handleVerify(user.id)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-2xs transition disabled:opacity-50"
                  >
                    <NavIcon name="check" className="h-3.5 w-3.5" />
                    <span>{pendingId === user.id ? "جارِ التفعيل..." : t("verifyNow")}</span>
                  </button>
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(user.email)}`}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                  >
                    تفاصيل الحساب
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: Expiring Subscriptions */}
      {activeTab === "expiring" && (
        <div className="mt-4 divide-y divide-neutral-100">
          {expiringSubscriptions.length === 0 ? (
            <p className="py-6 text-center text-xs text-neutral-400">
              لا توجد اشتراكات مهددة بالانتهاء خلال 14 يوماً.
            </p>
          ) : (
            expiringSubscriptions.map((sub) => (
              <div
                key={sub.userId}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 hover:bg-neutral-50/60 rounded-xl px-2 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 font-bold text-xs">
                    {sub.userName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-neutral-900">{sub.userName}</p>
                      <span className="rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
                        {tUsers("daysLeft", { days: sub.daysRemaining })}
                      </span>
                    </div>
                    <p className="text-xs font-mono text-neutral-500" dir="ltr">
                      {sub.userEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={pendingId === `${sub.userId}-7d`}
                    onClick={() => handleExtend(sub.userId, "7d")}
                    className="rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 shadow-2xs transition disabled:opacity-50"
                    title={tUsers("extend7Days")}
                  >
                    {pendingId === `${sub.userId}-7d` ? "..." : tUsers("extend7Days")}
                  </button>
                  <button
                    type="button"
                    disabled={pendingId === `${sub.userId}-1m`}
                    onClick={() => handleExtend(sub.userId, "1m")}
                    className="rounded-lg bg-violet-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-800 shadow-2xs transition disabled:opacity-50"
                    title={tUsers("extend1Month")}
                  >
                    {pendingId === `${sub.userId}-1m` ? "..." : tUsers("extend1Month")}
                  </button>
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(sub.userEmail)}`}
                    className="rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 transition"
                  >
                    تفاصيل
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
