"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Browser-side navigation used instead of `redirect()` in Server Components
 * on hosts (e.g. Hostinger) where Next.js cannot complete an internal fetch
 * for the redirect destination during RSC rendering.
 */
export function ClientRedirect({
  href,
  replace = true,
}: {
  href: string;
  replace?: boolean;
}) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(href);
    } else {
      router.push(href);
    }
  }, [href, replace, router]);

  return null;
}
