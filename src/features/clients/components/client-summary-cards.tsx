"use client";

import { useTranslations } from "next-intl";

export function ClientSummaryCards({
  totalClients,
  clientsWithProjects,
  totalProjects,
}: {
  totalClients: number;
  clientsWithProjects: number;
  totalProjects: number;
}) {
  const t = useTranslations("pages.clients");

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
      {/* 1. Total Clients */}
      <div className="flex flex-col justify-between rounded-2xl border border-indigo-200/80 bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-indigo-900">{t("totalClients")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 text-xs text-indigo-700">
            👥
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-indigo-950 sm:text-xl">
          {totalClients} <span className="text-xs font-normal text-indigo-700">{t("clientsUnit")}</span>
        </p>
      </div>

      {/* 2. Clients with Projects */}
      <div className="flex flex-col justify-between rounded-2xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-emerald-900">{t("clientsWithProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-xs text-emerald-700">
            💼
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-emerald-950 sm:text-xl">
          {clientsWithProjects} <span className="text-xs font-normal text-emerald-700">{t("activeClientsUnit")}</span>
        </p>
      </div>

      {/* 3. Total Projects Linked */}
      <div className="col-span-2 sm:col-span-1 flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-gradient-to-br from-neutral-50/70 to-neutral-100/40 p-3.5 sm:p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold text-neutral-800">{t("totalProjects")}</p>
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-neutral-500/10 text-xs text-neutral-700">
            📁
          </span>
        </div>
        <p className="mt-2 truncate text-base font-bold text-neutral-900 sm:text-xl">
          {totalProjects} <span className="text-xs font-normal text-neutral-600">{t("projectsUnit")}</span>
        </p>
      </div>
    </div>
  );
}
