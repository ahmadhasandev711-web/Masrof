import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { listAllWorkspaces } from "@/features/admin/data";

function BuildingIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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

function UsersIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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

function InvoiceIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
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

export default async function AdminWorkspacesPage() {
  const [t, tPlans, format] = await Promise.all([
    getTranslations("admin.workspaces"),
    getTranslations("plans"),
    getFormatter(),
  ]);

  const workspaces = await listAllWorkspaces();

  const getTypeLabel = (type: string) => {
    if (type === "business") return t("typeBusiness");
    if (type === "freelance") return t("typeFreelance");
    return t("typePersonal");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-[#ECEAE4]">{t("title")}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-[#9AA39F]">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400">
            <BuildingIcon className="h-3.5 w-3.5" />
            {workspaces.length} {t("title")}
          </span>
        </div>
      </div>

      {/* Mobile Workspace Cards List */}
      <div className="block md:hidden space-y-3">
        {workspaces.length === 0 ? (
          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center text-xs text-neutral-400 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#66706B]">
            {t("empty")}
          </div>
        ) : (
          workspaces.map((ws) => (
            <div
              key={ws.id}
              className="rounded-2xl border border-neutral-200/90 bg-white p-4 shadow-xs flex flex-col gap-3 dark:border-[#26302C] dark:bg-[#161E1B]"
            >
              <div className="flex items-start justify-between gap-2">
                <Link
                  href={`/admin/workspaces/${ws.id}`}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 font-bold text-sm dark:bg-[#10B981]/20 dark:text-[#34D399]">
                    {ws.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-neutral-900 truncate dark:text-[#ECEAE4]">{ws.name}</p>
                    <p className="text-[11px] text-neutral-500 truncate dark:text-[#9AA39F]" dir="ltr">
                      {ws.ownerEmail}
                    </p>
                  </div>
                </Link>

                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    ws.plan === "pro"
                      ? "bg-violet-50 text-violet-800 border border-violet-200/70 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/40"
                      : "bg-neutral-100 text-neutral-600 dark:bg-[#1E2824] dark:text-[#9AA39F]"
                  }`}
                >
                  {tPlans(ws.plan)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-xl bg-neutral-50/80 p-2 text-center text-xs dark:bg-[#1E2824]">
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium dark:text-[#66706B]">{t("type")}</p>
                  <p className="font-semibold text-neutral-700 mt-0.5 dark:text-[#ECEAE4]">{getTypeLabel(ws.type)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium dark:text-[#66706B]">{t("membersCount")}</p>
                  <p className="font-semibold text-neutral-700 mt-0.5 dark:text-[#ECEAE4]">{ws.membersCount}</p>
                </div>
                <div>
                  <p className="text-[10px] text-neutral-400 font-medium dark:text-[#66706B]">{t("invoicesCount")}</p>
                  <p className="font-semibold text-neutral-700 mt-0.5 dark:text-[#ECEAE4]">{ws.invoicesCount}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-[#26302C]">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400 dark:text-[#66706B]">{ws.currency}</span>
                  {ws.isArchived ? (
                    <span className="rounded-full bg-neutral-100 px-2 py-0.2 text-[10px] font-medium text-neutral-500 dark:bg-[#1E2824] dark:text-[#9AA39F]">
                      {t("archived")}
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-50 px-2 py-0.2 text-[10px] font-medium text-emerald-700 dark:bg-[#10B981]/20 dark:text-[#34D399]">
                      {t("active")}
                    </span>
                  )}
                </div>

                <Link
                  href={`/admin/workspaces/${ws.id}`}
                  className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-neutral-800 transition dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
                >
                  {t("viewDetails")} 
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Workspaces Table */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs dark:border-[#26302C] dark:bg-[#161E1B]">
        <table className="w-full min-w-[980px] text-right text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-neutral-500 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#9AA39F]">
            <tr>
              <th className="px-4 py-3 font-medium">{t("name")}</th>
              <th className="px-4 py-3 font-medium">{t("type")}</th>
              <th className="px-4 py-3 font-medium">{t("plan")}</th>
              <th className="px-4 py-3 font-medium">{t("owner")}</th>
              <th className="px-4 py-3 font-medium">{t("membersCount")}</th>
              <th className="px-4 py-3 font-medium">{t("invoicesCount")}</th>
              <th className="px-4 py-3 font-medium">{t("currency")}</th>
              <th className="px-4 py-3 font-medium">{t("status")}</th>
              <th className="px-4 py-3 font-medium">{t("actions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-[#26302C]">
            {workspaces.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-neutral-400 dark:text-[#66706B]">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              workspaces.map((ws) => (
                <tr key={ws.id} className="hover:bg-neutral-50 transition-colors dark:hover:bg-[#1E2824]">
                  <td className="px-4 py-3 font-medium text-neutral-900 dark:text-[#ECEAE4]">
                    <Link
                      href={`/admin/workspaces/${ws.id}`}
                      className="group flex items-center gap-2 hover:opacity-80 transition"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 font-bold text-xs group-hover:bg-emerald-100 transition dark:bg-[#10B981]/20 dark:text-[#34D399] dark:group-hover:bg-[#10B981]/30">
                        {ws.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-semibold text-neutral-900 underline-offset-2 group-hover:underline dark:text-[#ECEAE4]">
                        {ws.name}
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-[#1E2824] dark:text-[#ECEAE4]">
                      {getTypeLabel(ws.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        ws.plan === "pro"
                          ? "bg-violet-50 text-violet-800 border border-violet-200/70 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800/40"
                          : "bg-neutral-100 text-neutral-600 dark:bg-[#1E2824] dark:text-[#9AA39F]"
                      }`}
                    >
                      {tPlans(ws.plan)}
                    </span>
                    {ws.planExpiresAt && (
                      <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-[#66706B]">
                        {format.dateTime(new Date(ws.planExpiresAt), {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="font-medium text-neutral-900 dark:text-[#ECEAE4]">{ws.ownerName}</span>
                      <span className="text-xs text-neutral-400 dark:text-[#9AA39F]" dir="ltr">
                        {ws.ownerEmail}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-neutral-700 font-medium dark:text-[#ECEAE4]">
                      <UsersIcon className="h-3.5 w-3.5 text-neutral-400 dark:text-[#66706B]" />
                      {ws.membersCount}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-1 text-neutral-700 font-medium dark:text-[#ECEAE4]">
                      <InvoiceIcon className="h-3.5 w-3.5 text-neutral-400 dark:text-[#66706B]" />
                      {ws.invoicesCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-neutral-600 font-mono text-xs dark:text-[#9AA39F]">
                    {ws.currency}
                  </td>
                  <td className="px-4 py-3">
                    {ws.isArchived ? (
                      <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 dark:bg-[#1E2824] dark:text-[#9AA39F]">
                        {t("archived")}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-[#10B981]/20 dark:text-[#34D399]">
                        {t("active")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/workspaces/${ws.id}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-neutral-300 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 shadow-2xs transition dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
                    >
                      {t("viewDetails")}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
