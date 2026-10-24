import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

function imageRemotePatterns(): { protocol: "https" | "http"; hostname: string }[] {
  const patterns: { protocol: "https" | "http"; hostname: string }[] = [
    { protocol: "https", hostname: "sanadat.site" },
    { protocol: "https", hostname: "www.sanadat.site" },
    { protocol: "http", hostname: "localhost" },
  ];

  const s3Base = process.env.S3_PUBLIC_BASE_URL;
  if (s3Base) {
    try {
      const { protocol, hostname } = new URL(s3Base);
      if (hostname && (protocol === "https:" || protocol === "http:")) {
        patterns.push({
          protocol: protocol === "https:" ? "https" : "http",
          hostname,
        });
      }
    } catch {
      /* ignore invalid S3_PUBLIC_BASE_URL at build time */
    }
  }

  return patterns;
}

function contentSecurityPolicy(): string {
  const isProd = process.env.NODE_ENV === "production";
  const connect = isProd
    ? "'self' https://sanadat.site https://www.sanadat.site"
    : "'self' http://localhost:* http://127.0.0.1:* ws://localhost:* ws://127.0.0.1:*";
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    "script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://sanadat.site https://www.sanadat.site https:",
    "font-src 'self'",
    `connect-src ${connect}`,
    "frame-src https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  ].join("; ");
}

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy", value: contentSecurityPolicy() },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" }]
    : []),
];

// Hostinger (and similar) builders often report many CPUs but cap pthreads (~64).
// Next defaults to one worker per CPU → "Resource temporarily unavailable" during
// "Collecting page data". Cap workers via NEXT_BUILD_CPUS (default 2).
const buildWorkerCpus = Math.max(
  1,
  Math.min(4, Number.parseInt(process.env.NEXT_BUILD_CPUS ?? "2", 10) || 2),
);

const nextConfig: NextConfig = {
  experimental: {
    cpus: buildWorkerCpus,
    memoryBasedWorkersCount: false,
    workerThreads: false,
    staticGenerationRetryCount: 2,
    staticGenerationMaxConcurrency: 2,
    staticGenerationMinPagesPerWorker: 25,
  },
  // Serwist injects a webpack config; this tells Next.js 16 we intentionally
  // use Turbopack in dev (Serwist is disabled there anyway).
  turbopack: {},
  // Tesseract spawns worker threads via paths relative to its package root.
  // Bundling breaks those paths in production (worker-script/node/index.js missing).
  serverExternalPackages: ["tesseract.js", "tesseract.js-core", "@aws-sdk/client-s3"],
  images: {
    remotePatterns: imageRemotePatterns(),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
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
