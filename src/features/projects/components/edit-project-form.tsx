"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";
import { ClientCombobox } from "@/features/clients/components/client-combobox";
import type { ClientOption } from "@/features/clients/types";
import {
  updateProjectAction,
  type UpdateProjectState,
} from "@/features/projects/actions/update-project";
import type { ProjectListItem } from "@/features/projects/types";
import { fromMinorUnits } from "@/lib/money";

const initialState: UpdateProjectState = { error: null, success: false };

function toDateInput(value: string | null) {
  if (!value) return "";
  return value.slice(0, 10);
}

/** Edit a project's name, client, amount, due date and description. Status stays on the list. */
export function EditProjectForm({
  project,
  workspaceId,
  clients,
  onCancel,
  onSuccess,
}: {
  project: ProjectListItem;
  workspaceId: string;
  clients: ClientOption[];
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const tForm = useTranslations("forms.project");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateProjectAction, initialState);
  const [clientId, setClientId] = useState(project.clientId ?? "");

  useEffect(() => {
    if (state.success) onSuccess();
  }, [state.success, onSuccess]);

  const field = `${MOBILE_FIELD} bg-white dark:bg-[#1E2824] text-start focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:focus:ring-[#34D399]/20`;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="projectId" value={project._id} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("name")}</label>
          <input name="name" type="text" defaultValue={project.name} required className={field} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("client")} ({tShared("optional")})
          </label>
          <ClientCombobox
            id={`project-client-${project._id}`}
            name="clientId"
            clients={clients}
            value={clientId}
            onChange={setClientId}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("expectedAmount")}</label>
          <input
            name="expectedAmount"
            type="number"
            step="0.01"
            min="0"
            defaultValue={
              project.expectedAmount != null ? String(fromMinorUnits(project.expectedAmount)) : ""
            }
            placeholder={tShared("optional")}
            className={field}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("dueDate")}</label>
          <input name="dueDate" type="date" defaultValue={toDateInput(project.dueDate)} className={field} />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("description")}</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={project.description}
            className={field}
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 dark:bg-[#10B981] px-4 py-2 text-sm font-medium text-white dark:text-[#04231A] transition hover:bg-emerald-800 dark:hover:bg-[#34D399] disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tCommon("saveChanges")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-neutral-300 dark:border-[#26302C] bg-white dark:bg-[#1E2824] px-4 py-2 text-sm text-neutral-600 dark:text-[#9AA39F] transition hover:bg-neutral-50 dark:hover:bg-[#26302C] disabled:opacity-60"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
