import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sanadat.site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // The app itself is private, per-user data — nothing there should
      // ever be indexed, and there's no SEO value in it anyway.
      disallow: ["/dashboard", "/onboarding", "/api", "/admin", "/i/", "/print/", "/invite/"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
