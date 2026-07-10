"use client";

import { useActionState } from "react";
import {
  updateWhatsAppPhoneAction,
  type UpdateWhatsAppPhoneState,
} from "@/features/whatsapp/actions/update-whatsapp-phone";
import { useTranslations } from "next-intl";

const initialState: UpdateWhatsAppPhoneState = { error: null, success: false };

export function UserWhatsAppSettingsForm({ currentPhone }: { currentPhone: string | null }) {
  const tForm = useTranslations("forms.whatsapp");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateWhatsAppPhoneAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5">
          <label htmlFor="whatsapp-phone" className="text-sm font-medium text-neutral-700">
            {tForm("phone")}
          </label>
          <input
            id="whatsapp-phone"
            name="whatsappPhone"
            type="tel"
            dir="ltr"
            defaultValue={currentPhone ?? ""}
            placeholder={tForm("phonePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-left"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tForm("submit")}
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {tForm("hint")}
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{tForm("saved")}</p>}
    </form>
  );
}
