"use client";

import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  createPostAction,
  updatePostAction,
  type PostActionState,
} from "@/features/admin/actions/posts";
import { FeaturedImageUpload } from "@/features/admin/components/featured-image-upload";
import { MarkdownEditor } from "@/features/admin/components/markdown-editor";
import { getBlogCategories, formatTagsForInput } from "@/features/blog/categories";
import { slugifyArabicTitle } from "@/features/blog/utils";
import type { AppLocale } from "@/i18n/config";

type PostFormValues = {
  id?: string;
  locale?: AppLocale;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  isPublished: boolean;
  featuredImageUrl?: string;
  featuredImageAlt?: string;
  category?: string;
  tags?: string[];
};

const initialState: PostActionState = { error: null };

export function PostEditorForm({ post }: { post?: PostFormValues }) {
  const t = useTranslations("admin.posts");
  const isEdit = Boolean(post?.id);
  const boundUpdate = post?.id
    ? updatePostAction.bind(null, post.id)
    : createPostAction;

  const [state, formAction, isPending] = useActionState(boundUpdate, initialState);
  const [locale, setLocale] = useState<AppLocale>(post?.locale ?? "ar");
  const [title, setTitle] = useState(post?.title ?? "");
  const [slug, setSlug] = useState(post?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(Boolean(post?.slug));
  const categories = useMemo(() => getBlogCategories(locale), [locale]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">{t("fields.title")}</span>
          <input
            name="title"
            value={title}
            onChange={(e) => {
              const nextTitle = e.target.value;
              setTitle(nextTitle);
              if (!slugTouched) {
                setSlug(slugifyArabicTitle(nextTitle));
              }
            }}
            required
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700">{t("fields.locale")}</span>
          <select
            name="locale"
            value={locale}
            onChange={(e) => setLocale(e.target.value as AppLocale)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          >
            <option value="ar">{t("localeAr")}</option>
            <option value="en">{t("localeEn")}</option>
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700">{t("fields.slug")}</span>
          <input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            dir="ltr"
            required
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-left text-neutral-900"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-neutral-700">{t("fields.category")}</span>
          <select
            name="category"
            defaultValue={post?.category ?? ""}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          >
            <option value="">{t("noCategory")}</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium text-neutral-700">{t("fields.tags")}</span>
          <input
            name="tags"
            defaultValue={formatTagsForInput(post?.tags)}
            placeholder={t("fields.categoryPlaceholder")}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
          />
        </label>

        <label className="flex items-center gap-2 self-end pb-2 sm:col-span-2">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={post?.isPublished ?? false}
            className="h-4 w-4 rounded border-neutral-300"
          />
          <span className="text-sm font-medium text-neutral-700">{t("fields.publish")}</span>
        </label>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium text-neutral-700">{t("fields.excerpt")}</span>
        <textarea
          name="excerpt"
          defaultValue={post?.excerpt}
          rows={2}
          maxLength={300}
          required
          className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-neutral-900"
        />
      </label>

      <FeaturedImageUpload
        initialUrl={post?.featuredImageUrl}
        initialAlt={post?.featuredImageAlt}
        onUrlChange={() => {}}
      />

      <MarkdownEditor name="content" defaultValue={post?.content} />

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-violet-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-violet-800 disabled:opacity-60"
        >
          {isPending ? t("saving") : isEdit ? t("save") : t("create")}
        </button>
        <Link href="/admin/posts" className="text-sm text-neutral-500 hover:text-neutral-800">
          {t("backToList")}
        </Link>
        {isEdit && post?.slug && (
          <Link
            href={`/blog/${post.slug}`}
            target="_blank"
            className="text-sm text-violet-700 hover:underline"
          >
            {t("preview")}
          </Link>
        )}
      </div>
    </form>
  );
}
