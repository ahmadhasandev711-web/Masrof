"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  resetHomepageContentAction,
  updateHomepageContentAction,
  type HomepageContentActionState,
} from "@/features/admin/actions/site-content";
import type { HomepageContent } from "@/features/marketing/content/defaults";

const initialState: HomepageContentActionState = { error: null, success: false };

function Field({
  label,
  name,
  defaultValue,
  multiline = false,
  hint,
}: {
  label: string;
  name: string;
  defaultValue: string;
  multiline?: boolean;
  hint?: string;
}) {
  const className =
    "w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900";

  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-neutral-700">{label}</span>
      {hint && <span className="text-xs text-neutral-400">{hint}</span>}
      {multiline ? (
        <textarea name={name} defaultValue={defaultValue} rows={3} className={className} />
      ) : (
        <input name={name} defaultValue={defaultValue} className={className} />
      )}
    </label>
  );
}

export function HomepageContentForm({ content }: { content: HomepageContent }) {
  const t = useTranslations("admin.site");
  const tFields = useTranslations("admin.site.fields");
  const [state, formAction, isPending] = useActionState(updateHomepageContentAction, initialState);

  return (
    <div className="flex flex-col gap-6">
      <form action={formAction} className="flex flex-col gap-8">
        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-neutral-900">{t("heroSection")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tFields("heroBadge")} name="heroBadge" defaultValue={content.heroBadge} />
            <Field
              label={tFields("heroTitle")}
              name="heroTitle"
              defaultValue={content.heroTitle}
              multiline
              hint={tFields("heroTitleHint")}
            />
            <Field
              label={tFields("heroSubtitle")}
              name="heroSubtitle"
              defaultValue={content.heroSubtitle}
              multiline
            />
            <Field label={tFields("heroCtaPrimary")} name="heroCtaPrimary" defaultValue={content.heroCtaPrimary} />
            <Field
              label={tFields("heroCtaSecondary")}
              name="heroCtaSecondary"
              defaultValue={content.heroCtaSecondary}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-neutral-900">{t("stepsSection")}</h2>
          <Field
            label={tFields("stepsTitle")}
            name="stepsTitle"
            defaultValue={content.stepsTitle}
          />
          <div className="mt-4 grid gap-4 lg:grid-cols-3">
            {content.steps.map((step, index) => (
              <div key={step.number} className="rounded-xl border border-neutral-200 p-4">
                <p className="mb-3 text-sm font-medium text-violet-700">{t("stepLabel", { index: index + 1 })}</p>
                <div className="flex flex-col gap-3">
                  <Field
                    label={tFields("stepNumber")}
                    name={`step${index}Number`}
                    defaultValue={step.number}
                  />
                  <Field label={tFields("stepTitle")} name={`step${index}Title`} defaultValue={step.title} />
                  <Field label={tFields("stepBody")} name={`step${index}Body`} defaultValue={step.body} multiline />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="font-medium text-neutral-900">{t("contentSection")}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label={tFields("blogTitle")} name="blogTitle" defaultValue={content.blogTitle} />
            <Field
              label={tFields("blogSubtitle")}
              name="blogSubtitle"
              defaultValue={content.blogSubtitle}
            />
            <Field
              label={tFields("newsletterTitle")}
              name="newsletterTitle"
              defaultValue={content.newsletterTitle}
            />
            <Field
              label={tFields("newsletterSubtitle")}
              name="newsletterSubtitle"
              defaultValue={content.newsletterSubtitle}
              multiline
            />
            <Field
              label={tFields("finalCtaTitle")}
              name="finalCtaTitle"
              defaultValue={content.finalCtaTitle}
            />
            <Field
              label={tFields("finalCtaSubtitle")}
              name="finalCtaSubtitle"
              defaultValue={content.finalCtaSubtitle}
              multiline
            />
            <Field
              label={tFields("finalCtaButton")}
              name="finalCtaButton"
              defaultValue={content.finalCtaButton}
            />
            <Field
              label={tFields("footerNewsletterTitle")}
              name="footerNewsletterTitle"
              defaultValue={content.footerNewsletterTitle}
            />
            <Field
              label={tFields("footerNewsletterSubtitle")}
              name="footerNewsletterSubtitle"
              defaultValue={content.footerNewsletterSubtitle}
              multiline
            />
          </div>
        </section>

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.success && <p className="text-sm text-emerald-700">{t("saved")}</p>}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {isPending ? t("saving") : t("save")}
          </button>
          <Link
            href="/"
            target="_blank"
            className="rounded-lg border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-50"
          >
            {t("previewSite")}
          </Link>
        </div>
      </form>

      <form
        action={async () => {
          await resetHomepageContentAction();
        }}
      >
        <button
          type="submit"
          className="text-sm text-neutral-500 hover:text-red-600"
        >
          {t("restore")}
        </button>
      </form>
    </div>
  );
}
