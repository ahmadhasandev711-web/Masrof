"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import {
  createProjectAction,
  type CreateProjectState,
} from "@/features/projects/actions/create-project";
import { PROJECT_STATUSES } from "@/features/projects/constants";
import type { ClientOption } from "@/features/clients/types";
import { ClientCombobox } from "@/features/clients/components/client-combobox";
import { useTranslations } from "next-intl";

const initialState: CreateProjectState = { error: null };

export function CreateProjectForm({
  workspaceId,
  clients,
}: {
  workspaceId: string;
  clients: ClientOption[];
}) {
  const tForm = useTranslations("forms.project");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  useEffect(() => {
    if (!isPending && state.error === null) {
      formRef.current?.reset();
      setSelectedClientId("");
    }
  }, [isPending, state.error]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="project-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
          </label>
          <input
            id="project-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-client" className="text-sm font-medium text-neutral-700">
            {tForm("client")} ({tShared("optional")})
          </label>
          <ClientCombobox
            id="project-client"
            name="clientId"
            clients={clients}
            value={selectedClientId}
            onChange={setSelectedClientId}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-status" className="text-sm font-medium text-neutral-700">
            {tForm("status")}
          </label>
          <select
            id="project-status"
            name="status"
            defaultValue="active"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {PROJECT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status === "on_hold" ? tStatus("paused") : tStatus(status)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-expected-amount" className="text-sm font-medium text-neutral-700">
            {tForm("expectedAmount")}
          </label>
          <input
            id="project-expected-amount"
            name="expectedAmount"
            type="number"
            step="0.01"
            min="0"
            placeholder={tShared("optional")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="project-due-date" className="text-sm font-medium text-neutral-700">
            {tForm("dueDate")}
          </label>
          <input
            id="project-due-date"
            name="dueDate"
            type="date"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-emerald-700 px-4 py-2 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("adding") : tForm("submit")}
      </button>
    </form>
  );
}
