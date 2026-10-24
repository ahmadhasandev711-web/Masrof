"use client";

import { useActionState, useRef, useEffect } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import {
  createClientAction,
  type CreateClientState,
} from "@/features/clients/actions/create-client";
import { useTranslations } from "next-intl";

const initialState: CreateClientState = { error: null };

export function CreateClientForm({
  workspaceId,
  onCancel,
  onSuccess,
}: {
  workspaceId: string;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const tForm = useTranslations("forms.client");
  const tShared = useTranslations("forms.shared");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();
  const formRef = useRef<HTMLFormElement>(null);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      hasSubmittedRef.current = true;
    } else if (hasSubmittedRef.current && state.error === null) {
      formRef.current?.reset();
      hasSubmittedRef.current = false;
      regenerateIdempotencyKey();
      onSuccess?.();
    }
  }, [isPending, state.error, onSuccess]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />

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

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-5 py-2 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("adding") : tForm("submit")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-lg border border-neutral-300 px-4 py-2 font-medium text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-60"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
