"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectToDatabase } from "@/lib/db/mongoose";
import { PostModel } from "@/models/post";
import { isAppLocale, LOCALE_COOKIE, type AppLocale } from "./config";

export async function setLocaleAction(locale: AppLocale, pathname?: string) {
  if (!isAppLocale(locale)) return;

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  const blogMatch = pathname?.match(/^\/blog\/([^/?#]+)\/?$/);
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1]);
    await connectToDatabase();
    const exists = await PostModel.exists({ slug, locale, isPublished: true });
    if (!exists) {
      redirect("/blog");
    }
  }

  revalidatePath("/", "layout");
}
