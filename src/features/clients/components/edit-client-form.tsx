"use client";

import { useActionState, useEffect } from "react";
import {
  updateClientAction,
  type UpdateClientState,
} from "@/features/clients/actions/update-client";
import { useTranslations } from "next-intl";

type EditableClient = {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
};

const initialState: UpdateClientState = { error: null, success: false };

export function EditClientForm({
  client,
  workspaceId,
  onCancel,
  onSuccess,
}: {
  client: EditableClient;
  workspaceId: string;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const tForm = useTranslations("forms.client");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateClientAction, initialState);

  useEffect(() => {
    if (state.success) {
      onSuccess();
    }
  }, [state.success, onSuccess]);

  return (
    <form
      action={formAction}
      className="flex w-full flex-col gap-4 rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"
    >
      <input type="hidden" name="clientId" value={client._id} />
      <input type="hidden" name="workspaceId" value={workspaceId} />

      <h3 className="font-semibold text-neutral-900">{tForm("editTitle")}</h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-sm font-medium text-neutral-700">{tForm("name")}</label>
          <input
            name="name"
            type="text"
            defaultValue={client.name}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tForm("email")}</label>
          <input
            name="email"
            type="email"
            defaultValue={client.email ?? ""}
            placeholder={tShared("optional")}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-neutral-700">{tForm("phone")}</label>
          <input
            name="phone"
            type="tel"
            defaultValue={client.phone ?? ""}
            placeholder={tShared("optional")}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tForm("editSubmit")}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isPending}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}