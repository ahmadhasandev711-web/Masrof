"use client";

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
      className="text-sm text-neutral-400 transition hover:text-red-600 disabled:opacity-60"
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
            className="flex items-start justify-between gap-4 rounded-xl border border-neutral-200 bg-white px-5 py-4 shadow-sm"
          >
            <div className="min-w-0 flex-1">
              <p className="font-medium text-neutral-900">{project.name}</p>
              <p className="text-sm text-neutral-500">
                {project.clientName ?? tShared("none")} · {statusLabel}
              </p>
              <p className="mt-1 text-sm text-neutral-600">
                Paid / Expected:{" "}
                <span className="font-medium text-neutral-900">
                  {formatMoney(project.paidTotal, { currency })} / {expectedLabel}
                </span>
              </p>
              <p className="mt-0.5 text-xs text-neutral-400">
                {tDashboardAlerts("dueDate")} {formatDueDate(project.dueDate)}
              </p>
              {remaining > 0 && (
                <p className="mt-1 text-xs font-medium text-amber-700">
                  {tDashboardAlerts("remaining")}: {formatMoney(remaining, { currency })}
                </p>
              )}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
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
