export type AdPlacement = "inline" | "articleEnd" | "sidebar";

/** Client-safe — only NEXT_PUBLIC_* vars. */
export function getAdSenseClientId(): string | null {
  const id = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim();
  return id && id.startsWith("ca-pub-") ? id : null;
}

export function isAdSenseConfigured(): boolean {
  return getAdSenseClientId() != null;
}

export function getAdSlotId(placement: AdPlacement): string | null {
  const byPlacement: Record<AdPlacement, string | undefined> = {
    inline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_INLINE,
    articleEnd: process.env.NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_END,
    sidebar: process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR,
  };

  const slot = byPlacement[placement]?.trim() || process.env.NEXT_PUBLIC_ADSENSE_SLOT_DEFAULT?.trim();
  return slot || null;
}

export function isAdPlacementReady(placement: AdPlacement): boolean {
  return isAdSenseConfigured() && getAdSlotId(placement) != null;
}

/** `ca-pub-xxx` → `pub-xxx` for ads.txt */
export function getAdSensePublisherIdForAdsTxt(): string | null {
  const clientId = getAdSenseClientId();
  if (!clientId) return null;
  return clientId.replace(/^ca-pub-/, "pub-");
}
