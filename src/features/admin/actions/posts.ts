"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireAdmin } from "@/lib/admin";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";
import { postFormSchema } from "@/features/admin/schemas";

export type PostActionState = { error: string | null };

function parsePostForm(formData: FormData) {
  const tagsRaw = String(formData.get("tags") ?? "");
  return postFormSchema.safeParse({
    locale: formData.get("locale"),
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    isPublished: formData.get("isPublished") === "on",
    featuredImageUrl: String(formData.get("featuredImageUrl") ?? "").trim(),
    featuredImageAlt: String(formData.get("featuredImageAlt") ?? "").trim(),
    category: String(formData.get("category") ?? "").trim(),
    tags: tagsRaw,
  });
}

function tagsFromParsed(tagsInput: string | undefined) {
  if (!tagsInput?.trim()) return [];
  return tagsInput
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 10);
}

function featuredImageFromInput(
  url: string | undefined,
  alt: string | undefined,
) {
  if (!url) return null;
  return { url, alt: alt || null };
}

export async function createPostAction(
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  await requireAdmin();
  const [tErrors, tPosts] = await Promise.all([
    getTranslations("admin.errors"),
    getTranslations("admin.posts.errors"),
  ]);

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { error: tErrors("invalidData") };
  }

  await connectToDatabase();

  const existing = await PostModel.findOne({
    locale: parsed.data.locale,
    slug: parsed.data.slug,
  }).lean();
  if (existing) {
    return { error: tPosts("slugTaken") };
  }

  const now = new Date();
  const { featuredImageUrl, featuredImageAlt, isPublished, tags, category, ...rest } = parsed.data;

  const post = await PostModel.create({
    ...rest,
    category: category || null,
    tags: tagsFromParsed(tags),
    isPublished,
    featuredImage: featuredImageFromInput(featuredImageUrl, featuredImageAlt),
    publishedAt: isPublished ? now : null,
  });

  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  redirect(`/admin/posts/${post._id.toString()}/edit?created=1`);
}

export async function updatePostAction(
  postId: string,
  _prev: PostActionState,
  formData: FormData,
): Promise<PostActionState> {
  await requireAdmin();
  const [tErrors, tPosts] = await Promise.all([
    getTranslations("admin.errors"),
    getTranslations("admin.posts.errors"),
  ]);

  const parsed = parsePostForm(formData);
  if (!parsed.success) {
    return { error: tErrors("invalidData") };
  }

  await connectToDatabase();

  const post = await PostModel.findById(postId);
  if (!post) {
    return { error: tPosts("notFound") };
  }

  const slugTaken = await PostModel.findOne({
    locale: parsed.data.locale,
    slug: parsed.data.slug,
    _id: { $ne: postId },
  }).lean();

  if (slugTaken) {
    return { error: tPosts("slugConflict") };
  }

  const wasPublished = post.isPublished;
  post.title = parsed.data.title;
  post.locale = parsed.data.locale;
  post.slug = parsed.data.slug;
  post.excerpt = parsed.data.excerpt;
  post.content = parsed.data.content;
  post.isPublished = parsed.data.isPublished;
  post.featuredImage = featuredImageFromInput(
    parsed.data.featuredImageUrl,
    parsed.data.featuredImageAlt,
  );
  post.category = parsed.data.category || null;
  post.tags = tagsFromParsed(parsed.data.tags);

  if (parsed.data.isPublished && !wasPublished) {
    post.publishedAt = new Date();
  }
  if (!parsed.data.isPublished) {
    post.publishedAt = null;
  }

  await post.save();

  revalidatePath("/blog");
  revalidatePath(`/blog/${post.slug}`);
  revalidatePath("/admin/posts");
  revalidatePath(`/admin/posts/${postId}/edit`);

  return { error: null };
}

export async function deletePostAction(postId: string) {
  await requireAdmin();
  await connectToDatabase();
  await PostModel.findByIdAndDelete(postId);
  revalidatePath("/blog");
  revalidatePath("/admin/posts");
  redirect("/admin/posts");
}
