"use client";

import { useActionState } from "react";
import {
  updatePlanConfigAction,
  type UpdatePlanConfigState,
} from "@/features/admin/actions/plan-config";
import { PLAN_FLAG_KEYS } from "@/features/subscriptions/default-plans";
import type { PlanConfigDocument } from "@/features/subscriptions/default-plans";
import { useTranslations } from "next-intl";

const initialState: UpdatePlanConfigState = { error: null, success: false };

function featuresToText(features: string[]) {
  return features.join("\n");
}

export function PlanConfigForm({ config }: { config: PlanConfigDocument }) {
  const t = useTranslations("admin.plans");
  const tFlags = useTranslations("admin.plans.flags");
  const [state, formAction, isPending] = useActionState(updatePlanConfigAction, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <input type="hidden" name="planId" value={config.planId} />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            {config.nameAr} / {config.nameEn}
          </h2>
          <p className="text-xs text-neutral-500">{t("planId")}: {config.planId}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" name="highlighted" defaultChecked={config.highlighted} />
            {t("highlighted")}
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" name="available" defaultChecked={config.available} />
            {t("available")}
          </label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label={t("priceYearly")} name="priceYearly" type="number" defaultValue={config.priceYearly} />
        <Field label={t("maxWorkspaces")} name="maxWorkspaces" type="number" defaultValue={config.maxWorkspaces} hint={t("maxWorkspacesHint")} />
        <Field label={t("maxMembers")} name="maxMembers" type="number" defaultValue={config.maxMembers} hint={t("maxMembersHint")} />
        <Field label={t("sortOrder")} name="sortOrder" type="number" defaultValue={config.sortOrder} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextField label={t("nameAr")} name="nameAr" defaultValue={config.nameAr} />
        <TextField label={t("nameEn")} name="nameEn" defaultValue={config.nameEn} />
        <TextField label={t("priceDisplayAr")} name="priceDisplayAr" defaultValue={config.priceDisplayAr} />
        <TextField label={t("priceDisplayEn")} name="priceDisplayEn" defaultValue={config.priceDisplayEn} />
        <TextField label={t("periodDisplayAr")} name="periodDisplayAr" defaultValue={config.periodDisplayAr} />
        <TextField label={t("periodDisplayEn")} name="periodDisplayEn" defaultValue={config.periodDisplayEn} />
        <TextField label={t("ctaAr")} name="ctaAr" defaultValue={config.ctaAr} />
        <TextField label={t("ctaEn")} name="ctaEn" defaultValue={config.ctaEn} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <TextArea label={t("descriptionAr")} name="descriptionAr" defaultValue={config.descriptionAr} rows={3} />
        <TextArea label={t("descriptionEn")} name="descriptionEn" defaultValue={config.descriptionEn} rows={3} />
        <TextArea label={t("featuresAr")} name="featuresAr" defaultValue={featuresToText(config.featuresAr)} rows={8} hint={t("featuresHint")} />
        <TextArea label={t("featuresEn")} name="featuresEn" defaultValue={featuresToText(config.featuresEn)} rows={8} hint={t("featuresHint")} />
      </div>

      <fieldset className="rounded-xl border border-neutral-200 p-4">
        <legend className="px-2 text-sm font-semibold text-neutral-800">{t("featureFlags")}</legend>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLAN_FLAG_KEYS.map((key) => (
            <label key={key} className="flex items-start gap-2 rounded-lg border border-neutral-100 p-2 text-sm">
              <input
                type="checkbox"
                name={`flag_${key}`}
                defaultChecked={config.flags[key]}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium text-neutral-800">{tFlags(key)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{t("saved")}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
      >
        {isPending ? t("saving") : t("save")}
      </button>
    </form>
  );
}

function Field({
  label,
  name,
  type,
  defaultValue,
  hint,
}: {
  label: string;
  name: string;
  type: string;
  defaultValue: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}

function TextField({
  label,
  name,
  defaultValue,
}: {
  label: string;
  name: string;
  defaultValue: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        defaultValue={defaultValue}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  defaultValue,
  rows,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  rows: number;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={name} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        rows={rows}
        defaultValue={defaultValue}
        className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
      />
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
