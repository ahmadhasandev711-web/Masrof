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
          <label htmlFor="whatsapp-phone" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
            {tForm("phone")}
          </label>
          <input
            id="whatsapp-phone"
            name="whatsappPhone"
            type="tel"
            dir="ltr"
            defaultValue={currentPhone ?? ""}
            placeholder={tForm("phonePlaceholder")}
            className="rounded-lg border border-neutral-300 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] px-3 py-2 text-left"
          />
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-emerald-700 dark:bg-[#10B981] px-4 py-2 text-sm font-medium text-white dark:text-[#04231A] hover:bg-emerald-800 dark:hover:bg-[#34D399] disabled:opacity-60"
        >
          {isPending ? tCommon("saving") : tForm("submit")}
        </button>
      </div>
      <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">
        {tForm("hint")}
      </p>
      {state.error && <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700 dark:text-[#34D399]">{tForm("saved")}</p>}
    </form>
  );
}
