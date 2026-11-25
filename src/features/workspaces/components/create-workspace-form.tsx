"use client";

import { useActionState, useEffect, useState } from "react";
import { useIdempotencyKey } from "@/hooks/use-idempotency-key";
import { IdempotencyKeyInput } from "@/components/idempotency-key-input";
import { useRouter } from "next/navigation";
import {
  createWorkspaceAction,
  type CreateWorkspaceState,
} from "@/features/workspaces/actions/create-workspace";
import { getSuggestedCategoriesForType } from "@/features/categories/seed-data";
import { resolveCategoryLabel } from "@/features/categories/labels";
import { CategoryIcon } from "@/components/ui/app-icons";
import type { WorkspaceType } from "@/features/workspaces/constants";
import type { AppLocale } from "@/i18n/config";
import { useLocale, useTranslations } from "next-intl";

const WORKSPACE_TYPE_OPTIONS: WorkspaceType[] = ["personal", "freelance", "business"];

const initialState: CreateWorkspaceState = { error: null, redirectTo: null };

export function CreateWorkspaceForm({ mode = "onboarding" }: { mode?: "onboarding" | "new" }) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const tForm = useTranslations("forms.workspace");
  const tWorkspaceType = useTranslations("workspaceType");
  const tAccountType = useTranslations("accountType");
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
  const { idempotencyKey, regenerateIdempotencyKey } = useIdempotencyKey();
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>("personal");

  useEffect(() => {
    if (!state.redirectTo) return;
    window.location.href = state.redirectTo;
  }, [state.redirectTo]);

  const suggestedCategories = getSuggestedCategoriesForType(workspaceType);
  const suggestedIncome = suggestedCategories.filter((c) => c.kind === "income");
  const suggestedExpense = suggestedCategories.filter((c) => c.kind === "expense");

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <IdempotencyKeyInput value={idempotencyKey} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
          {tForm("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder={tForm("namePlaceholder")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:placeholder:text-[#66706B] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
          required
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("type")}</legend>
        {WORKSPACE_TYPE_OPTIONS.map((option, index) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50 dark:border-[#26302C] dark:bg-[#161E1B] dark:has-[:checked]:border-[#34D399] dark:has-[:checked]:bg-[#10B981]/15"
          >
            <input
              type="radio"
              name="type"
              value={option}
              defaultChecked={index === 0}
              onChange={() => setWorkspaceType(option)}
              className="mt-1 accent-[#065F46] dark:accent-[#34D399]"
            />
            <span>
              <span className="block font-medium text-neutral-800 dark:text-[#ECEAE4]">{tWorkspaceType(option)}</span>
              <span className="block text-sm text-neutral-500 dark:text-[#9AA39F]">{tWorkspaceType(`${option}Hint`)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4 dark:border-[#34D399]/25 dark:bg-[#10B981]/10">
        <p className="text-sm font-medium text-emerald-900 dark:text-[#34D399]">{tForm("suggestedCategories")}</p>
        <p className="mt-1 text-xs text-emerald-800/70 dark:text-[#9AA39F]">
          {tForm("suggestedCategoriesHint")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedIncome.map((category) => (
            <span
              key={category.slug}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-emerald-800 shadow-sm dark:bg-[#1E2824] dark:text-[#34D399]"
            >
              <CategoryIcon slug={category.slug} kind="income" className="h-3.5 w-3.5" />
              {resolveCategoryLabel(category, locale)}
            </span>
          ))}
          {suggestedExpense.map((category) => (
            <span
              key={category.slug}
              className="inline-flex items-center gap-1.5 rounded-full bg-white px-2.5 py-1 text-xs text-neutral-700 shadow-sm dark:bg-[#1E2824] dark:text-[#ECEAE4]"
            >
              <CategoryIcon slug={category.slug} kind="expense" className="h-3.5 w-3.5" />
              {resolveCategoryLabel(category, locale)}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency" className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">
          {tForm("currency")}
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue="EGP"
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
        >
          <option value="EGP">{tForm("currencyEGP")}</option>
          <option value="USD">{tForm("currencyUSD")}</option>
          <option value="SAR">{tForm("currencySAR")}</option>
          <option value="AED">{tForm("currencyAED")}</option>
          <option value="EUR">{tForm("currencyEUR")}</option>
        </select>
      </div>

      <div className="border-t border-neutral-100 pt-4 dark:border-[#26302C]">
        <p className="mb-3 text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{tForm("firstAccount")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialAccountName" className="text-sm text-neutral-600 dark:text-[#9AA39F]">
              {tForm("accountName")}
            </label>
            <input
              id="initialAccountName"
              name="initialAccountName"
              type="text"
              placeholder={tForm("accountNamePlaceholder")}
              defaultValue={tForm("accountNameDefault")}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:placeholder:text-[#66706B] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialAccountType" className="text-sm text-neutral-600 dark:text-[#9AA39F]">
              {tForm("accountType")}
            </label>
            <select
              id="initialAccountType"
              name="initialAccountType"
              defaultValue="cash"
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
            >
              <option value="cash">{tAccountType("cash")}</option>
              <option value="bank">{tAccountType("bank")}</option>
              <option value="mobile_wallet">{tAccountType("mobile_wallet")}</option>
              <option value="savings">{tAccountType("savings")}</option>
              <option value="other">{tAccountType("other")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="initialAccountBalance" className="text-sm text-neutral-600 dark:text-[#9AA39F]">
              {tForm("openingBalance")}
            </label>
            <input
              id="initialAccountBalance"
              name="initialAccountBalance"
              type="number"
              step="0.01"
              defaultValue={0}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-right text-neutral-900 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100 dark:border-[#26302C] dark:bg-[#1E2824] dark:text-[#ECEAE4] dark:focus:border-[#34D399] dark:focus:ring-[#34D399]/20"
            />
          </div>
        </div>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60 dark:bg-[#10B981] dark:text-[#04231A] dark:hover:bg-[#34D399]"
      >
        {isPending
          ? tForm("creating")
          : mode === "new"
            ? tForm("submitNew")
            : tForm("submitOnboarding")}
      </button>
    </form>
  );
}
