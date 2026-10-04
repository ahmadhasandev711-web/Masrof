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
import { useTranslations } from "next-intl";

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
      className="text-xs text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
    >
      {tCommon("archive")}
    </button>
  );
}

function formatDueDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
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
  const tEmpty = useTranslations("empty");
  const tStatus = useTranslations("status");
  const tDashboardAlerts = useTranslations("dashboard.alerts");
  const tWhatsapp = useTranslations("forms.whatsapp");
  const tWhatsappMessages = useTranslations("whatsapp");
  const tShared = useTranslations("forms.shared");
  const tProjects = useTranslations("pages.projects");

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-400">
        {tEmpty("noProjects")}
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {projects.map((project) => {
        const id = project._id;
        const expectedLabel =
          project.expectedAmount != null
            ? formatMoney(project.expectedAmount, { currency })
            : tShared("none");
        const statusLabel = project.status === "on_hold" ? tStatus("paused") : tStatus(project.status);
        const remaining = projectRemainingAmount(project);
        const showClientReminder = isReceivableReminderDue(project);

        return (
          <li
            key={id}
            className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/projects/${id}`}
                  className="font-semibold text-neutral-900 hover:text-emerald-700 hover:underline"
                >
                  {project.name}
                </Link>
                <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-600">
                  {statusLabel}
                </span>
                {project.profitMargin != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium border ${
                      project.netProfit >= 0
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                        : "bg-red-50 text-red-800 border-red-200"
                    }`}
                  >
                    {project.profitMargin}% {tProjects("margin")}
                  </span>
                )}
                {project.isOverBudget && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 border border-red-200">
                    {tProjects("overBudgetWarning")}
                  </span>
                )}
              </div>

              <p className="mt-1 text-xs text-neutral-500">
                {project.clientName ?? tShared("none")} · {tDashboardAlerts("dueDate")}{" "}
                {formatDueDate(project.dueDate)}
              </p>

              <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-neutral-50 p-2.5 text-xs sm:grid-cols-4">
                <div>
                  <span className="text-neutral-400 block">{tProjects("expected")}</span>
                  <span className="font-semibold text-neutral-800">{expectedLabel}</span>
                </div>
                <div>
                  <span className="text-neutral-400 block">{tProjects("collected")}</span>
                  <span className="font-semibold text-emerald-700">
                    {formatMoney(project.incomeTotal, { currency })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">{tProjects("costs")}</span>
                  <span className="font-semibold text-rose-700">
                    {formatMoney(project.expenseTotal, { currency })}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">{tProjects("netProfit")}</span>
                  <span
                    className={`font-bold ${
                      project.netProfit >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {formatMoney(project.netProfit, { currency })}
                  </span>
                </div>
              </div>

              {remaining > 0 && (
                <p className="mt-2 text-xs font-medium text-amber-700">
                  {tDashboardAlerts("remaining")}: {formatMoney(remaining, { currency })}
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-neutral-100 pt-2 sm:border-0 sm:pt-0 sm:flex-col sm:items-end sm:justify-start gap-2">
              <Link
                href={`/dashboard/projects/${id}`}
                className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-50 hover:text-emerald-700"
              >
                {tProjects("viewDetails")}
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
          </li>
        );
      })}
    </ul>
  );
}
