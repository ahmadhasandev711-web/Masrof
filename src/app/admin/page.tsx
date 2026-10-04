import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getAdminStats } from "@/features/admin/data";
import { AdminActionQueue } from "@/features/admin/components/admin-action-queue";
import { formatMoney } from "@/lib/money";

function BuildingIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
  );
}

function UsersIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function CrownIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3l3.057 6.114L15 4l2.943 5.114L21 3v12a2 2 0 01-2 2H5a2 2 0 01-2-2V3z"
      />
    </svg>
  );
}

function InvoiceIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function ExternalIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

export default async function AdminOverviewPage() {
  const t = await getTranslations("admin.overview");
  const stats = await getAdminStats();

  const primaryCards = [
    {
      label: t("workspaces"),
      value: stats.workspacesTotal,
      hint: t("workspacesHint"),
      Icon: BuildingIcon,
      color: "text-blue-600 bg-blue-50 border-blue-100",
      href: "/admin/workspaces",
    },
    {
      label: t("users"),
      value: stats.usersTotal,
      hint: t("usersHint"),
      Icon: UsersIcon,
      color: "text-emerald-600 bg-emerald-50 border-emerald-100",
      href: "/admin/users",
    },
    {
      label: t("proUsers"),
      value: stats.proUsersTotal,
      hint: t("proUsersHint"),
      Icon: CrownIcon,
      color: "text-violet-600 bg-violet-50 border-violet-100",
      href: "/admin/plans",
    },
    {
      label: t("invoices"),
      value: stats.invoicesTotal,
      hint: t("invoicesHint"),
      Icon: InvoiceIcon,
      color: "text-amber-600 bg-amber-50 border-amber-100",
      href: "/admin/workspaces",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">{t("title")}</h1>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      {/* SaaS Business Financial Metrics Strip */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-white to-violet-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-violet-900 uppercase tracking-wider">{t("mrr")}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white text-xs">
              💰
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 text-xl sm:text-2xl font-black text-neutral-900">
            {stats.mrrEgp.toLocaleString()} <span className="text-xs sm:text-sm font-semibold text-neutral-500">ج.م/شهر</span>
          </p>
          <p className="mt-1 text-[11px] text-violet-700/80">{t("mrrHint")}</p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/80 via-white to-emerald-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">{t("gtv")}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-600 text-white text-xs">
              📈
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 text-xl sm:text-2xl font-black text-neutral-900">
            {formatMoney(stats.gtvMinor, { currency: "EGP" })}
          </p>
          <p className="mt-1 text-[11px] text-emerald-700/80">{t("gtvHint")}</p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">{t("conversionRate")}</span>
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-600 text-white text-xs">
              🎯
            </span>
          </div>
          <p className="mt-2.5 sm:mt-3 text-xl sm:text-2xl font-black text-neutral-900">{stats.conversionRate}%</p>
          <p className="mt-1 text-[11px] text-amber-700/80">نسبة تحويل المستخدمين إلى مشتركي برو</p>
        </div>
      </div>

      {/* Core Counts Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {primaryCards.map((card) => {
          const Icon = card.Icon;
          return (
            <Link
              key={card.label}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-neutral-200 bg-white p-3.5 sm:p-5 shadow-xs transition hover:border-neutral-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-medium text-neutral-500">{card.label}</span>
                <div className={`flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl border ${card.color}`}>
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
              </div>
              <p className="mt-2 sm:mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900">
                {card.value}
              </p>
              <div className="mt-1.5 sm:mt-2 flex items-center justify-between text-[11px] sm:text-xs text-neutral-400">
                <span className="truncate">{card.hint}</span>
                <ExternalIcon className="opacity-0 transition-opacity group-hover:opacity-100 text-neutral-600 shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      {/* Operational Command: Founder Action Required Queue */}
      <AdminActionQueue
        unverifiedUsers={stats.actionQueue.unverifiedUsers}
        expiringSubscriptions={stats.actionQueue.expiringSubscriptions}
      />

      {/* Quick Navigation Cards */}
      <div className="rounded-2xl border border-neutral-200 bg-white p-4 sm:p-6 shadow-xs">
        <h2 className="text-sm sm:text-base font-semibold text-neutral-900">{t("quickActions")}</h2>
        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
          <Link
            href="/admin/workspaces"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-white shadow-xs hover:bg-neutral-800 transition"
          >
            <BuildingIcon className="h-4 w-4" />
            {t("allWorkspaces")}
          </Link>
          <Link
            href="/admin/users"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <UsersIcon className="h-4 w-4" />
            {t("allUsers")}
          </Link>
          <Link
            href="/admin/plans"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-medium text-neutral-700 shadow-xs hover:bg-neutral-50 transition"
          >
            <CrownIcon className="h-4 w-4" />
            {t("allPlans")}
          </Link>
        </div>
      </div>
    </div>
  );
}
