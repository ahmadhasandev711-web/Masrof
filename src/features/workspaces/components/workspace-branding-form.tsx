"use client";

import { useActionState, useState } from "react";
import {
  updateWorkspaceBrandingAction,
  type UpdateBrandingState,
} from "@/features/workspaces/actions/update-branding";
import { useTranslations } from "next-intl";

const initialState: UpdateBrandingState = { error: null };

export function WorkspaceBrandingForm({
  workspaceId,
  initial,
}: {
  workspaceId: string;
  initial: {
    businessName: string;
    logoUrl: string;
    taxId: string;
    businessPhone: string;
    businessAddress: string;
  };
}) {
  const t = useTranslations("forms.workspaceBranding");
  const tErrors = useTranslations("errors");
  const tCommon = useTranslations("common");
  const [state, formAction, isPending] = useActionState(updateWorkspaceBrandingAction, initialState);
  const [logoUrl, setLogoUrl] = useState(initial.logoUrl);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleLogoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const body = new FormData();
      body.append("workspaceId", workspaceId);
      body.append("file", file);
      const res = await fetch("/api/uploads/branding", { method: "POST", body });
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(tErrors("uploadFailed"));
      }
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? tErrors("uploadFailed"));
      }
      setLogoUrl(data.url);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : tErrors("uploadFailed"));
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm"
    >
      <input type="hidden" name="workspaceId" value={workspaceId} />
      <input type="hidden" name="logoUrl" value={logoUrl} />

      <div>
        <h2 className="font-semibold text-neutral-900">{t("title")}</h2>
        <p className="mt-1 text-sm text-neutral-500">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessName" className="text-sm font-medium text-neutral-700">
          {t("businessName")}
        </label>
        <input
          id="businessName"
          name="businessName"
          defaultValue={initial.businessName}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder={t("businessNamePlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="logo" className="text-sm font-medium text-neutral-700">
          {t("logo")}
        </label>
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mb-2 h-16 w-16 rounded-lg border object-contain" />
        ) : null}
        <input
          id="logo"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleLogoChange}
          disabled={uploading || isPending}
          className="text-sm"
        />
        {uploading && <p className="text-xs text-neutral-500">{t("uploading")}</p>}
        {uploadError && <p className="text-xs text-red-600">{uploadError}</p>}
        <p className="text-xs text-neutral-400">{t("logoHint")}</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="taxId" className="text-sm font-medium text-neutral-700">
          {t("taxId")}
        </label>
        <input
          id="taxId"
          name="taxId"
          defaultValue={initial.taxId}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          placeholder={t("taxIdPlaceholder")}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessPhone" className="text-sm font-medium text-neutral-700">
          {t("businessPhone")}
        </label>
        <input
          id="businessPhone"
          name="businessPhone"
          defaultValue={initial.businessPhone}
          className="rounded-lg border border-neutral-300 px-3 py-2"
          dir="ltr"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="businessAddress" className="text-sm font-medium text-neutral-700">
          {t("businessAddress")}
        </label>
        <textarea
          id="businessAddress"
          name="businessAddress"
          defaultValue={initial.businessAddress}
          rows={2}
          className="rounded-lg border border-neutral-300 px-3 py-2"
        />
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="text-sm text-emerald-700">{t("saved")}</p>}

      <button
        type="submit"
        disabled={isPending || uploading}
        className="rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
      >
        {isPending ? tCommon("saving") : t("submit")}
      </button>
    </form>
  );
}
