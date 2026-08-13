import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  // Serwist injects a webpack config; this tells Next.js 16 we intentionally
  // use Turbopack in dev (Serwist is disabled there anyway).
  turbopack: {},
  // Tesseract spawns worker threads via paths relative to its package root.
  // Bundling breaks those paths in production (worker-script/node/index.js missing).
  serverExternalPackages: ["tesseract.js", "tesseract.js-core", "@aws-sdk/client-s3"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost" },
    ],
  },
};

// IMPORTANT: Next.js 16 defaults to Turbopack, but @serwist/next's build-time
// plugin only works with webpack (see package.json's "build" script, which
// runs `next build --webpack`). `next dev` still uses Turbopack for fast
// local iteration — Serwist is disabled in development anyway (see below),
// so this split costs nothing day-to-day and only affects production builds.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

export default withSerwist(withNextIntl(nextConfig));
