"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

export function FeaturedImageUpload({
  initialUrl,
  initialAlt,
  onUrlChange,
}: {
  initialUrl?: string;
  initialAlt?: string;
  onUrlChange: (url: string) => void;
}) {
  const t = useTranslations("admin.posts");
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState(initialUrl ?? "");
  const [alt, setAlt] = useState(initialAlt ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = (await response.json()) as { url?: string; error?: string };

      if (!response.ok || !data.url) {
        setError(data.error ?? t("upload.failed"));
        return;
      }

      setPreviewUrl(data.url);
      onUrlChange(data.url);
    } catch {
      setError(t("upload.failed"));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-4 dark:border-[#26302C] dark:bg-[#1E2824]">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-neutral-700 dark:text-[#ECEAE4]">{t("fields.featuredImage")}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50 disabled:opacity-60 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#ECEAE4] dark:hover:bg-[#26302C]"
        >
          {isUploading ? t("upload.uploading") : previewUrl ? t("upload.change") : t("upload.upload")}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {previewUrl ? (
        <div className="relative aspect-[16/9] overflow-hidden rounded-lg border border-neutral-200 dark:border-[#26302C]">
          <Image
            src={previewUrl}
            alt={alt || t("upload.defaultAlt")}
            fill
            sizes="(max-width: 640px) 100vw, 640px"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[16/9] items-center justify-center rounded-lg border border-neutral-200 bg-white text-sm text-neutral-400 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#66706B]">
          {t("noImageOptional")}
        </div>
      )}

      <input type="hidden" name="featuredImageUrl" value={previewUrl} />

      <label className="flex flex-col gap-1.5 text-sm">
        <span className="font-medium text-neutral-700 dark:text-[#ECEAE4]">{t("fields.featuredImageAlt")}</span>
        <input
          name="featuredImageAlt"
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder={t("upload.altPlaceholder")}
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900 dark:border-[#26302C] dark:bg-[#161E1B] dark:text-[#ECEAE4] dark:placeholder:text-[#66706B]"
        />
      </label>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
