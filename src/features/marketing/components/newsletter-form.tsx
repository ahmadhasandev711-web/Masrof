"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  subscribeNewsletterAction,
  type SubscribeState,
} from "@/features/marketing/actions/subscribe";

const initialState: SubscribeState = { error: null, success: false };

export function NewsletterForm({
  variant = "footer",
  title,
  subtitle,
}: {
  variant?: "footer" | "inline";
  title?: string;
  subtitle?: string;
}) {
  const t = useTranslations("marketing.newsletter");
  const [state, formAction, isPending] = useActionState(subscribeNewsletterAction, initialState);
  const resolvedTitle = title ?? t("title");
  const resolvedSubtitle = subtitle ?? t("subtitle");

  if (variant === "inline") {
    return (
      <form action={formAction} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          name="email"
          required
          placeholder={t("placeholder")}
          className="min-w-0 flex-1 rounded-lg border border-[#E4DFD3] bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#065F46] px-5 py-3 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
        >
          {isPending ? "..." : t("subscribe")}
        </button>
        {state.success && <p className="text-sm text-emerald-700 sm:col-span-2">{t("success")}</p>}
        {state.error && <p className="text-sm text-red-600 sm:col-span-2">{state.error}</p>}
      </form>
    );
  }

  return (
    <div className="rounded-2xl border border-[#E4DFD3] bg-white/80 p-6">
      <h3 className="font-[family-name:var(--font-marketing-display)] text-lg font-semibold text-[#1C1B1A]">
        {resolvedTitle}
      </h3>
      <p className="mt-1 text-sm text-[#1C1B1A]/60">{resolvedSubtitle}</p>
      <form action={formAction} className="mt-4 flex flex-col gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t("placeholder")}
          className="rounded-lg border border-[#E4DFD3] bg-white px-3 py-2 text-neutral-900 placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#065F46] px-4 py-2 text-sm font-medium text-white hover:bg-[#054d3a] disabled:opacity-60"
        >
          {isPending ? t("subscribing") : t("subscribeFree")}
        </button>
        {state.success && <p className="text-sm text-emerald-700">{t("successFull")}</p>}
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </form>
    </div>
  );
}
