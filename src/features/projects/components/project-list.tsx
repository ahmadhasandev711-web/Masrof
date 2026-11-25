"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/money";
import { archiveProjectAction } from "@/features/projects/actions/archive-project";
import { updateProjectStatusAction } from "@/features/projects/actions/update-project-status";
import { PROJECT_STATUSES, type ProjectStatus } from "@/features/projects/constants";
import {
  isReceivableReminderDue,
  projectRemainingAmount,
} from "@/features/projects/utils";
import type { ProjectListItem } from "@/features/projects/types";
import type { ClientOption } from "@/features/clients/types";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";
import { Modal } from "@/components/ui/modal";
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
        startTransition(async () => {
          const res = await archiveProjectAction(projectId, workspaceId);
          if (res.error) window.alert(res.error);
        });
      }}
      disabled={isPending}
      className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-400 dark:text-[#9AA39F] transition hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-600 dark:hover:text-rose-400 disabled:opacity-60"
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

const STATUS_STYLE: Record<ProjectStatus, string> = {
  active: "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] border border-emerald-200/80 dark:border-[#34D399]/30",
  completed: "bg-blue-50 dark:bg-blue-500/15 text-blue-800 dark:text-blue-300 border border-blue-200/80 dark:border-blue-500/30",
  on_hold: "bg-neutral-100 dark:bg-[#1E2824] text-neutral-600 dark:text-[#9AA39F] border border-neutral-200 dark:border-[#26302C]",
};

/** Status badge that doubles as a picker for members who can write. */
function ProjectStatusControl({
  projectId,
  workspaceId,
  status,
  canWrite,
}: {
  projectId: string;
  workspaceId: string;
  status: ProjectStatus;
  canWrite: boolean;
}) {
  const tStatus = useTranslations("status");
  const [isPending, startTransition] = useTransition();
  const label = (s: ProjectStatus) => (s === "on_hold" ? tStatus("paused") : tStatus(s));

  if (!canWrite) {
    return (
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${STATUS_STYLE[status]}`}>
        {label(status)}
      </span>
    );
  }

  return (
    <select
      value={status}
      disabled={isPending}
      aria-label={label(status)}
      onChange={(e) => {
        const next = e.target.value as ProjectStatus;
        startTransition(async () => {
          const res = await updateProjectStatusAction({ workspaceId, projectId, status: next });
          if (res.error) window.alert(res.error);
        });
      }}
      className={`cursor-pointer rounded-full px-2.5 py-0.5 text-xs font-bold disabled:opacity-60 ${STATUS_STYLE[status]}`}
    >
      {PROJECT_STATUSES.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}

export function ProjectList({
  projects,
  workspaceId,
  clients,
  currency,
  workspaceName,
  canUseWhatsApp,
  canWrite = true,
}: {
  projects: ProjectListItem[];
  workspaceId: string;
  clients: ClientOption[];
  currency: string;
  workspaceName: string;
  canUseWhatsApp: boolean;
  canWrite?: boolean;
}) {
  const locale = useLocale();
  const tEmpty = useTranslations("empty");
  const tDashboardAlerts = useTranslations("dashboard.alerts");
  const tWhatsapp = useTranslations("forms.whatsapp");
  const tWhatsappMessages = useTranslations("whatsapp");
  const tShared = useTranslations("forms.shared");
  const tProjects = useTranslations("pages.projects");
  const tCommon = useTranslations("common");
  const tForm = useTranslations("forms.project");
  const [editingId, setEditingId] = useState<string | null>(null);

  if (projects.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-12 text-center text-neutral-400 dark:text-[#9AA39F]">
        <span className="mb-2 flex justify-center text-neutral-400 dark:text-[#66706B]">
          <NavIcon name="projects" className="h-10 w-10" />
        </span>
        <p className="font-semibold text-neutral-700 dark:text-[#ECEAE4]">{tEmpty("noProjects")}</p>
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
        const remaining = projectRemainingAmount(project);
        const showClientReminder = isReceivableReminderDue(project);

        return (
          <div
            key={id}
            className="group relative overflow-hidden rounded-2xl border border-neutral-200/90 dark:border-[#26302C] bg-white dark:bg-[#161E1B] p-4 sm:p-5 shadow-xs transition hover:border-[#065F46]/40 dark:hover:border-[#34D399]/40 hover:shadow-sm"
          >
            {/* Top Row: Title, Client, Status & Action */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <Link
                  href={`/dashboard/projects/${id}`}
                  className="font-bold text-neutral-900 dark:text-[#ECEAE4] text-base sm:text-lg hover:text-[#065F46] dark:hover:text-[#34D399] transition truncate"
                >
                  {project.name}
                </Link>

                {project.clientName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 dark:bg-[#1E2824] px-2.5 py-0.5 text-xs font-semibold text-neutral-700 dark:text-[#ECEAE4]">
                    <span className="text-neutral-400 dark:text-[#66706B]">👤</span>
                    <span>{project.clientName}</span>
                  </span>
                )}

                <ProjectStatusControl
                  projectId={id}
                  workspaceId={workspaceId}
                  status={project.status}
                  canWrite={canWrite}
                />

                {project.profitMargin != null && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-bold border ${
                      project.netProfit >= 0
                        ? "bg-emerald-50 dark:bg-[#0F2E24] text-emerald-800 dark:text-[#34D399] border-emerald-200 dark:border-[#34D399]/30"
                        : "bg-rose-50 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30"
                    }`}
                  >
                    {project.profitMargin}% {tProjects("margin")}
                  </span>
                )}

                {project.isOverBudget && (
                  <span className="rounded-full bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30">
                    {tProjects("overBudgetWarning")}
                  </span>
                )}
              </div>

              {/* Action Buttons Top Right on Desktop */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {canWrite && (
                  <Link
                    href={`/dashboard/invoices?projectId=${id}`}
                    className="inline-flex items-center gap-1 rounded-xl border border-neutral-200 dark:border-[#26302C] bg-neutral-50 dark:bg-[#1E2824] hover:bg-neutral-100 dark:hover:bg-[#26302C] text-neutral-800 dark:text-[#ECEAE4] px-3 py-1.5 text-xs font-semibold transition active:scale-95"
                  >
                    <span>{tProjects("createInvoice")}</span>
                  </Link>
                )}

                <Link
                  href={`/dashboard/projects/${id}`}
                  className="inline-flex items-center gap-1 rounded-xl bg-neutral-900 dark:bg-[#ECEAE4] hover:bg-neutral-800 dark:hover:bg-white text-white dark:text-[#0E1412] px-3.5 py-1.5 text-xs font-semibold shadow-2xs transition active:scale-95"
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

                {canWrite && (
                  <button
                    type="button"
                    onClick={() => setEditingId(id)}
                    className="rounded-lg px-2.5 py-1 text-xs font-semibold text-neutral-500 dark:text-[#9AA39F] transition hover:bg-emerald-50 dark:hover:bg-[#0F2E24] hover:text-emerald-700 dark:hover:text-[#34D399]"
                  >
                    {tCommon("edit")}
                  </button>
                )}
                {canWrite && <ArchiveProjectButton projectId={id} workspaceId={workspaceId} />}
              </div>
            </div>

            {/* Subtitle / Due Date */}
            <p className="mt-1 text-xs text-neutral-400 dark:text-[#9AA39F]">
              {tDashboardAlerts("dueDate")}: {formatDueDate(project.dueDate, locale)}
            </p>

            {/* Financial Metrics Grid */}
            <div className="mt-3.5 grid grid-cols-2 gap-2 sm:grid-cols-4 rounded-xl bg-[#FBF9F4] dark:bg-[#1E2824] p-3 border border-neutral-100 dark:border-[#26302C]">
              <div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-[#9AA39F] block">{tProjects("expected")}</span>
                <span className="text-xs sm:text-sm font-bold text-neutral-800 dark:text-[#ECEAE4] font-mono mt-0.5 block">
                  {expectedLabel}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-emerald-800/80 dark:text-[#34D399] block">{tProjects("collected")}</span>
                <span className="text-xs sm:text-sm font-bold text-emerald-700 dark:text-[#34D399] font-mono mt-0.5 block">
                  {formatMoney(project.incomeTotal, { currency, locale })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-rose-800/80 dark:text-rose-400 block">{tProjects("costs")}</span>
                <span className="text-xs sm:text-sm font-bold text-rose-700 dark:text-rose-400 font-mono mt-0.5 block">
                  {formatMoney(project.expenseTotal, { currency, locale })}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-medium text-neutral-400 dark:text-[#9AA39F] block">{tProjects("netProfit")}</span>
                <span
                  className={`text-xs sm:text-sm font-black font-mono mt-0.5 block ${
                    project.netProfit >= 0 ? "text-emerald-700 dark:text-[#34D399]" : "text-rose-700 dark:text-rose-400"
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
                  <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-600 dark:text-[#9AA39F]">
                    <span>{tProjects("collectionProgress")}</span>
                    <span className="font-mono tabular-nums text-emerald-800 dark:text-[#34D399]">
                      {percent}% ({formatMoney(project.incomeTotal, { currency, locale })} / {formatMoney(baseAmount, { currency, locale })})
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-[#1E2824]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        percent >= 100 ? "bg-emerald-600 dark:bg-[#10B981]" : percent >= 50 ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })()}

            {/* Remaining Alert Tag */}
            {remaining > 0 && (
              <div className="mt-2.5 flex items-center justify-between text-xs rounded-lg bg-amber-50/80 dark:bg-amber-500/15 px-3 py-1.5 text-amber-900 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/25">
                <span className="font-semibold">
                   {tDashboardAlerts("remaining")}: {formatMoney(remaining, { currency, locale })}
                </span>
                <span className="text-[11px] text-amber-700 dark:text-amber-400">
                  ({tProjects("expectedUponCollection")}: {formatMoney(project.invoicedTotal - project.expenseTotal, { currency, locale })})
                </span>
              </div>
            )}
          </div>
        );
      })}

      {(() => {
        const projectBeingEdited = projects.find((project) => project._id === editingId);
        return (
          <Modal
            isOpen={projectBeingEdited !== undefined}
            onClose={() => setEditingId(null)}
            title={tForm("editTitle")}
            maxWidthClassName="max-w-xl"
          >
            {projectBeingEdited && (
              <EditProjectForm
                project={projectBeingEdited}
                workspaceId={workspaceId}
                clients={clients}
                onCancel={() => setEditingId(null)}
                onSuccess={() => setEditingId(null)}
              />
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
