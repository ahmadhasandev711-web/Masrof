"use client";

import { useMemo, useState } from "react";
import { marked } from "marked";
import { useTranslations } from "next-intl";

marked.setOptions({ gfm: true, breaks: true });

export function MarkdownEditor({
  name,
  defaultValue = "",
}: {
  name: string;
  defaultValue?: string;
}) {
  const t = useTranslations("admin.posts");
  const [content, setContent] = useState(defaultValue);
  const [showPreview, setShowPreview] = useState(true);

  const previewHtml = useMemo(() => {
    try {
      return marked.parse(content || `*${t("editor.placeholder")}*`) as string;
    } catch {
      return `<p>${t("editor.previewError")}</p>`;
    }
  }, [content, t]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-neutral-700">{t("fields.content")}</span>
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className="text-xs font-medium text-violet-700 hover:underline"
        >
          {showPreview ? t("editor.hidePreview") : t("editor.showPreview")}
        </button>
      </div>

      <div className={`grid gap-4 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <textarea
          name={name}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          required
          className="min-h-[320px] rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm leading-relaxed text-neutral-900"
        />

        {showPreview && (
          <div
            className="prose prose-neutral min-h-[320px] max-w-none rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 prose-headings:text-neutral-900 prose-a:text-violet-700"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        )}
      </div>
    </div>
  );
}
