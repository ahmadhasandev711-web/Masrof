"use client";

import { useActionState, useRef, useEffect, useState } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import {
  createAccountAction,
  type CreateAccountState,
} from "@/features/accounts/actions/create-account";
import { MOBILE_WALLET_PRESETS } from "@/features/accounts/wallet-presets";
import { CURRENCY_LABELS } from "@/lib/currency";
import type { SupportedCurrency } from "@/lib/currency/constants";
import { useTranslations } from "next-intl";

const ACCOUNT_TYPE_VALUES = ["cash", "bank", "mobile_wallet", "credit_card", "savings", "other"] as const;

const initialState: CreateAccountState = { error: null };

export function CreateAccountForm({
  workspaceId,
  workspaceCurrency,
  canUseMultiCurrency,
  onSuccess,
  onCancel,
  hideHeader = false,
}: {
  workspaceId: string;
  workspaceCurrency: SupportedCurrency;
  canUseMultiCurrency: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  hideHeader?: boolean;
}) {
  const tForm = useTranslations("forms.account");
  const tCommon = useTranslations("common");
  const tAccountType = useTranslations("accountType");
  const [state, formAction, isPending] = useActionState(createAccountAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();
  const [accountType, setAccountType] = useState("cash");
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    if (isPending) {
      isSubmittedRef.current = true;
    } else if (isSubmittedRef.current && state.error === null) {
      isSubmittedRef.current = false;
      formRef.current?.reset();
      regenerateIdempotencyKey();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sync controlled select after native form reset
      setAccountType("cash");
      onSuccess?.();
    }
  }, [isPending, state.error, onSuccess]);

  function applyWalletPreset(name: string) {
    setAccountType("mobile_wallet");
    if (nameInputRef.current) {
      nameInputRef.current.value = name;
    }
  }

  return (
    <form
      ref={formRef}
      action={formAction}
      className={hideHeader ? "flex flex-col gap-4" : "flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"}
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <IdempotencyKeyInput value={idempotencyKey} />

      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-neutral-900">{tForm("title")}</h2>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
              aria-label={tCommon("cancel")}
            >
              ✕
            </button>
          )}
        </div>
      )}

      {accountType === "mobile_wallet" && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3">
          <p className="mb-2 text-xs font-medium text-emerald-800">{tForm("walletPresets")}</p>
          <div className="flex flex-wrap gap-2">
            {MOBILE_WALLET_PRESETS.map((preset) => (
              <button
                key={preset.key}
                type="button"
                onClick={() => applyWalletPreset(tForm(`wallets.${preset.key}`))}
                className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs text-neutral-700 transition hover:border-emerald-400 hover:bg-emerald-50"
              >
                {preset.icon} {tForm(`wallets.${preset.key}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-name" className="text-sm font-medium text-neutral-700">
            {tForm("name")}
          </label>
          <input
            ref={nameInputRef}
            id="account-name"
            name="name"
            type="text"
            placeholder={tForm("namePlaceholder")}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="account-type" className="text-sm font-medium text-neutral-700">
            {tForm("type")}
          </label>
          <select
            id="account-type"
            name="type"
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          >
            {ACCOUNT_TYPE_VALUES.map((value) => (
              <option key={value} value={value}>
                {tAccountType(value)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label
            htmlFor="account-opening-balance"
            className="text-sm font-medium text-neutral-700"
          >
            {tForm("balance")}
          </label>
          <input
            id="account-opening-balance"
            name="openingBalance"
            type="number"
            step="0.01"
            inputMode="decimal"
            dir="ltr"
            defaultValue={0}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-start font-mono font-bold focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        {canUseMultiCurrency ? (
          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="account-currency" className="text-sm font-medium text-neutral-700">
              {tForm("currency")}
            </label>
            <select
              id="account-currency"
              name="currency"
              defaultValue={workspaceCurrency}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              {(Object.keys(CURRENCY_LABELS) as SupportedCurrency[]).map((currency) => (
                <option key={currency} value={currency}>
                  {currency} — {CURRENCY_LABELS[currency]}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <input type="hidden" name="currency" value={workspaceCurrency} />
        )}
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-[#065F46] px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-[#054E3A] disabled:opacity-60"
        >
          {isPending ? tCommon("adding") : tForm("submit")}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            className="rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-100"
          >
            {tCommon("cancel")}
          </button>
        )}
      </div>
    </form>
  );
}
