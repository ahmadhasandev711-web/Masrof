"use client";

import Link from "next/link";
import { useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { archiveProjectAction } from "@/features/projects/actions/archive-project";
import {
  isReceivableReminderDue,
  projectRemainingAmount,
} from "@/features/projects/utils";
import type { ProjectListItem } from "@/features/projects/types";
import { projectReceivableReminderMessage } from "@/features/whatsapp/messages";
import { WhatsAppReminderLink } from "@/features/whatsapp/components/whatsapp-reminder-link";
import { useLocale, useTranslations } from "next-intl";
import { NavIcon } from "@/components/ui/app-icons";

function ArchiveProjectButton({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const tConfirm = useTranslations("confirm");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        if (!confirm(tConfirm("archiveProject"))) return;
        startTransition(() => archiveProjectAction(projectId, workspaceId));
      }}
      disabled={isPending}
      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
    >
      {tCommon("archive")}
    </button>
  );
}

function formatDueDate(value: string | null, locale: string = "ar") {
  if (!value) return "—";
  const targetLocale = locale.startsWith("en") ? "en-US" : "ar-EG-u-nu-latn";
  return new Intl.DateTimeFormat(targetLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function ProjectList({
  projects,
  workspaceId,
  currency,
  workspaceName,
  canUseWhatsApp,
}: {
  projects: ProjectListItem[];
  workspaceId: string;
  currency: string;
  workspaceName: string;
  canUseWhatsApp: boolean;
}) {
  const locale = useLocale();
  const tEmpty = useTranslations("empty");
  const tStatus = useTranslations("status");
  const tDashboardAlerts = useTranslations("dashboard.alerts");
  const tWhatsapp = useTranslations("forms.whatsapp");
  const tWhatsappMessages = useTranslations("whatsapp");
  const tShared = useTranslations("forms.shared");
  const tProjects = useTranslations("pages.projects");

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center text-neutral-400">
        <span className="mb-2 flex justify-center text-neutral-400">
          <NavIcon name="projects" className="h-10 w-10" />
        </span>
        <p className="font-semibold text-neutral-700">{tEmpty("noProjects")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {projects.map((project) => {
        const id = project._id;
        const expectedLabel =
          project.expectedAmount != null
            ? formatMoney(project.expectedAmount, { currency, locale })
            : tShared("none");
        const statusLabel = project.status === "on_hold" ? tStatus("paused") : tStatus(project.status);
        const remaining = projectRemainingAmount(project);
        const showClientReminder = isReceivableReminderDue(project);

        return (
          <div
            key={id}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 bg-white p-4 sm:p-5 shadow-xs transition hover:border-[#065F46]/40 hover:shadow-sm"
          >
            {/* Top Row: Title, Client, Status & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Link
                  href={`/dashboard/projects/${id}`}
                  prefetch={true}
                  className="font-bold text-neutral-900 text-base sm:text-lg hover:text-[#065F46] transition truncate"
                >
                  {project.name}
                </Link>

                {project.clientName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
                    <span className="text-neutral-400">👤</span>
                    <span>{project.clientName}</span>
                  </span>
                )}

                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                    project.status === "active"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                      : project.status === "completed"
                      ? "bg-blue-50 text-blue-800 border border-blue-200/80"
                      : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                  }`}
                >
                  {statusLabel}
                </span>

                {project.profitMargin != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                      project.netProfit >= 0
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-rose-50 text-rose-800 border-rose-200"
                    }`}
                  >
                    {project.profitMargin}% {tProjects("margin")}
                  </span>
                )}

                {project.isOverBudget && (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-700 border border-rose-200">
                    {tProjects("overBudgetWarning")}
                  </span>
                )}
              </div>

              {/* Action Buttons Top Right on Desktop */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <Link
                  href={`/dashboard/invoices?projectId=${id}`}
                  className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 px-3 py-1.5 text-xs font-semibold transition active:scale-95"
                >
                  <span>{tProjects("createInvoice")}</span>
                </Link>

                <Link
                  href={`/dashboard/projects/${id}`}
                  prefetch={true}
                  className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95"
                >
                  <span>{tProjects("details")}</span>
                  <span>←</span>
                </Link>

                {canUseWhatsApp && showClientReminder && (
                  <WhatsAppReminderLink
                    phone={project.clientPhone}
                    label={tWhatsapp("remindClient")}
                    missingPhoneHint={tWhatsapp("missingPhoneHint")}
                    message={projectReceivableReminderMessage(tWhatsappMessages, {
                      clientName: project.clientName ?? tDashboardAlerts("ourClient"),
                      projectName: project.name,
                      remainingLabel: formatMoney(remaining, { currency }),
                      dueDateLabel: formatDueDate(project.dueDate),
                      workspaceName,
                    })}
                  />
                )}

                <ArchiveProjectButton projectId={id} workspaceId={workspaceId} />
              </div>
            </div>

            {/* Subtitle / Due Date */}
            <p className="mt-1 text-xs text-neutral-400">
              {tDashboardAlerts("dueDate")}: {formatDueDate(project.dueDate, locale)}
            </p>

            {/* Financial Metrics Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl bg-[#FBF9F4] p-3 border border-neutral-100">
              <div>
                <span className="text-[11px] font-medium text-neutral-400 block">{tProjects("expected")}</span>
                <span className="text-xs sm:text-sm font-bold text-neutral-800 font-mono mt-0.5 block">
                  {expectedLabel}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-800/80 block">{tProjects("collected")}</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 font-mono mt-0.5 block">
                  {formatMoney(project.incomeTotal, { currency, locale })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-rose-800/80 block">{tProjects("costs")}</span>
                <span className="text-xs sm:text-sm font-bold text-rose-700 font-mono mt-0.5 block">
                  {formatMoney(project.expenseTotal, { currency, locale })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-neutral-400 block">{tProjects("netProfit")}</span>
                <span
                  className={`text-xs sm:text-sm font-black font-mono mt-0.5 block ${
                    project.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {formatMoney(project.netProfit, { currency, locale })}
                </span>
              </div>
            </div>

            {/* Collection Progress Bar */}
            {(() => {
              const baseAmount =
                project.expectedAmount != null && project.expectedAmount > 0
                  ? project.expectedAmount
                  : project.invoicedTotal > 0
                  ? project.invoicedTotal
                  : 0;
              if (baseAmount <= 0) return null;
              const percent = Math.min(100, Math.round((project.incomeTotal / baseAmount) * 100));

              return (
                <div className="mt-3 flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600">
                    <span>{tProjects("collectionProgress")}</span>
                    <span className="font-mono tabular-nums text-emerald-800">
                      {percent}% ({formatMoney(project.incomeTotal, { currency, locale })} / {formatMoney(baseAmount, { currency, locale })})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 100 ? "bg-emerald-600" : percent >= 50 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Remaining Alert Tag */}
            {remaining > 0 && (
              <div className="mt-2.5 flex items-center justify-between text-xs rounded-lg bg-amber-50/80 px-3 py-1.5 text-amber-900 border border-amber-200/60">
                <span className="font-semibold">
                   {tDashboardAlerts("remaining")}: {formatMoney(remaining, { currency, locale })}
                </span>
                <span className="text-[11px] text-amber-700">
                  ({tProjects("expectedUponCollection")}: {formatMoney(project.invoicedTotal - project.expenseTotal, { currency, locale })})
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
