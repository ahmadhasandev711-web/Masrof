"use client";

import Link from "next/link";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { useTranslations } from "next-intl";

export function WhatsAppReminderLink({
  phone,
  message,
  label,
  className,
  missingPhoneHint,
}: {
  phone: string | null | undefined;
  message: string;
  label?: string;
  className?: string;
  missingPhoneHint?: string;
}) {
  const tWhatsapp = useTranslations("forms.whatsapp");
  const resolvedLabel = label ?? tWhatsapp("label");
  const resolvedMissingHint = missingPhoneHint ?? tWhatsapp("settingsHint");
  const url = phone ? buildWhatsAppUrl(phone, message) : null;

  if (!url) {
    return (
      <span
        title={resolvedMissingHint}
        className={`cursor-not-allowed text-xs text-neutral-300 ${className ?? ""}`}
      >
        {resolvedLabel}
      </span>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={
        className ??
        "inline-flex items-center gap-1 rounded-lg border border-[#25D366]/40 bg-[#25D366]/10 px-2.5 py-1 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20"
      }
    >
      <span aria-hidden></span>
      {resolvedLabel}
    </a>
  );
}

export function WhatsAppSettingsLink() {
  const tWhatsapp = useTranslations("forms.whatsapp");
  return (
    <Link href="/dashboard/plan#whatsapp" className="text-xs font-medium text-emerald-700 hover:underline">
      {tWhatsapp("settingsHint")}
    </Link>
  );
}
