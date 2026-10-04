"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createWorkspaceAction,
  type CreateWorkspaceState,
} from "@/features/workspaces/actions/create-workspace";
import { getSuggestedCategoriesForType } from "@/features/categories/seed-data";
import { SEED_CATEGORY_MESSAGE_KEYS } from "@/features/categories/seed-i18n";
import type { WorkspaceType } from "@/models/workspace";
import { useTranslations } from "next-intl";

const WORKSPACE_TYPE_OPTIONS: WorkspaceType[] = ["personal", "freelance", "business"];

const initialState: CreateWorkspaceState = { error: null, redirectTo: null };

export function CreateWorkspaceForm({ mode = "onboarding" }: { mode?: "onboarding" | "new" }) {
  const router = useRouter();
  const tForm = useTranslations("forms.workspace");
  const tWorkspaceType = useTranslations("workspaceType");
  const tSeed = useTranslations("forms.categories.seed");
  const tAccountType = useTranslations("accountType");
  const [state, formAction, isPending] = useActionState(createWorkspaceAction, initialState);
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
      <div className="flex flex-col gap-1.5">
        <label htmlFor="name" className="text-sm font-medium text-neutral-700">
          {tForm("name")}
        </label>
        <input
          id="name"
          name="name"
          type="text"
          placeholder={tForm("namePlaceholder")}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
          required
        />
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-neutral-700">{tForm("type")}</legend>
        {WORKSPACE_TYPE_OPTIONS.map((option, index) => (
          <label
            key={option}
            className="flex cursor-pointer items-start gap-3 rounded-lg border border-neutral-200 p-3 has-[:checked]:border-emerald-600 has-[:checked]:bg-emerald-50"
          >
            <input
              type="radio"
              name="type"
              value={option}
              defaultChecked={index === 0}
              onChange={() => setWorkspaceType(option)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-neutral-800">{tWorkspaceType(option)}</span>
              <span className="block text-sm text-neutral-500">{tWorkspaceType(`${option}Hint`)}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
        <p className="text-sm font-medium text-emerald-900">{tForm("suggestedCategories")}</p>
        <p className="mt-1 text-xs text-emerald-800/70">
          {tForm("suggestedCategoriesHint")}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestedIncome.map((category) => (
            <span
              key={category.slug}
              className="rounded-full bg-white px-2.5 py-1 text-xs text-emerald-800 shadow-sm"
            >
              {category.icon}{" "}
              {tSeed(
                SEED_CATEGORY_MESSAGE_KEYS[category.slug] as Parameters<typeof tSeed>[0],
              )}
            </span>
          ))}
          {suggestedExpense.map((category) => (
            <span
              key={category.slug}
              className="rounded-full bg-white px-2.5 py-1 text-xs text-neutral-700 shadow-sm"
            >
              {category.icon}{" "}
              {tSeed(
                SEED_CATEGORY_MESSAGE_KEYS[category.slug] as Parameters<typeof tSeed>[0],
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="currency" className="text-sm font-medium text-neutral-700">
          {tForm("currency")}
        </label>
        <select
          id="currency"
          name="currency"
          defaultValue="EGP"
          className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
        >
          <option value="EGP">{tForm("currencyEGP")}</option>
          <option value="USD">{tForm("currencyUSD")}</option>
          <option value="SAR">{tForm("currencySAR")}</option>
          <option value="AED">{tForm("currencyAED")}</option>
          <option value="EUR">{tForm("currencyEUR")}</option>
        </select>
      </div>

      <div className="border-t border-neutral-100 pt-4">
        <p className="mb-3 text-sm font-medium text-neutral-700">{tForm("firstAccount")}</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialAccountName" className="text-sm text-neutral-600">
              {tForm("accountName")}
            </label>
            <input
              id="initialAccountName"
              name="initialAccountName"
              type="text"
              placeholder={tForm("accountNamePlaceholder")}
              defaultValue={tForm("accountNameDefault")}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="initialAccountType" className="text-sm text-neutral-600">
              {tForm("accountType")}
            </label>
            <select
              id="initialAccountType"
              name="initialAccountType"
              defaultValue="cash"
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            >
              <option value="cash">{tAccountType("cash")}</option>
              <option value="bank">{tAccountType("bank")}</option>
              <option value="mobile_wallet">{tAccountType("mobile_wallet")}</option>
              <option value="savings">{tAccountType("savings")}</option>
              <option value="other">{tAccountType("other")}</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label htmlFor="initialAccountBalance" className="text-sm text-neutral-600">
              {tForm("openingBalance")}
            </label>
            <input
              id="initialAccountBalance"
              name="initialAccountBalance"
              type="number"
              step="0.01"
              defaultValue={0}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-right focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </div>
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
        className="mt-2 rounded-lg bg-emerald-700 px-4 py-2.5 font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
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
