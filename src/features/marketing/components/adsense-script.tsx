import Script from "next/script";
import { getAdSenseClientId } from "@/lib/adsense/config";

/**
 * Loads the AdSense library once on public marketing pages.
 * Omit from dashboard/admin — Google policy + UX.
 */
export function AdSenseScript() {
  const clientId = getAdSenseClientId();
  if (!clientId) return null;

  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
