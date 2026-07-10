"use client";

import { useActionState, useRef, useEffect } from "react";
import {
  createClientAction,
  type CreateClientState,
} from "@/features/clients/actions/create-client";
import { useTranslations } from "next-intl";

const initialState: CreateClientState = { error: null };

export function CreateClientForm({ workspaceId }: { workspaceId: string }) {
  const tForm = useTranslations("forms.client");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isPending && state.error === null) {
      formRef.current?.reset();
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
          <label htmlFor="client-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
          </label>
          <input
            id="client-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="client-email" className="text-sm font-medium text-neutral-700">
            {tForm("email")}
          </label>
          <input
            id="client-email"
            name="email"
            type="email"
            placeholder={tShared("optional")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="client-phone" className="text-sm font-medium text-neutral-700">
            {tForm("phone")}
          </label>
          <input
            id="client-phone"
            name="phone"
            type="tel"
            placeholder={tShared("optional")}
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
