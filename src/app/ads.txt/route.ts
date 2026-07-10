import { getAdSensePublisherIdForAdsTxt } from "@/lib/adsense/config";

/** Required by Google AdSense — serves publisher declaration at /ads.txt */
export function GET() {
  const pubId = getAdSensePublisherIdForAdsTxt();
  if (!pubId) {
    return new Response("Not configured", { status: 404 });
  }

  const body = `google.com, ${pubId}, DIRECT, f08c47fec0942fa0\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
