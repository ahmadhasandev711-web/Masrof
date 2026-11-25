"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/modal";
import { MOBILE_FIELD } from "@/components/ui/mobile-field";
import {
  updateAccountAction,
  type UpdateAccountState,
} from "@/features/accounts/actions/update-account";

const initialState: UpdateAccountState = { error: null, success: false };

/** Rename an account or fix a mistyped opening balance (balance moves by the difference). */
export function EditAccountButton({
  accountId,
  workspaceId,
  name,
  openingBalance,
}: {
  accountId: string;
  workspaceId: string;
  name: string;
  /** Major units (e.g. 500.75). */
  openingBalance: number;
}) {
  const tForm = useTranslations("forms.account");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-neutral-500 transition hover:text-emerald-700 dark:text-[#9AA39F] dark:hover:text-[#34D399]"
      >
        {tCommon("edit")}
      </button>
      <Modal isOpen={open} onClose={() => setOpen(false)} title={tForm("editTitle")} maxWidthClassName="max-w-md">
        {open && (
          <EditAccountForm
            accountId={accountId}
            workspaceId={workspaceId}
            name={name}
            openingBalance={openingBalance}
            onDone={() => setOpen(false)}
          />
        )}
      </Modal>
    </>
  );
}

function EditAccountForm({
  accountId,
  workspaceId,
  name,
  openingBalance,
  onDone,
}: {
  accountId: string;
  workspaceId: string;
  name: string;
  openingBalance: number;
  onDone: () => void;
}) {
  const tForm = useTranslations("forms.account");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateAccountAction, initialState);

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  const field = `${MOBILE_FIELD} bg-white text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:bg-[#161E1B] dark:focus:border-[#34D399] dark:focus:ring-[#0F2E24]`;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("name")}</label>
        <input name="name" defaultValue={name} required className={field} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("openingBalance")}</label>
        <input
          name="openingBalance"
          type="number"
          step="0.01"
          inputMode="decimal"
          defaultValue={openingBalance}
          className={`${field} font-mono`}
        />
        <p className="text-xs text-neutral-500 dark:text-[#9AA39F]">{tForm("openingBalanceHint")}</p>
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
          className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
        >
          {isPending ? tCommon("saving") : tCommon("saveChanges")}
        </button>
        <button
          type="button"
          onClick={onDone}
          disabled={isPending}
          className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-600 transition hover:bg-neutral-50 disabled:opacity-60 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
        >
          {tCommon("cancel")}
        </button>
      </div>
    </form>
  );
}
