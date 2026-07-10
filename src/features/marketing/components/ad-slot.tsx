import { getTranslations } from "next-intl/server";
import {
  getAdSenseClientId,
  getAdSlotId,
  isAdPlacementReady,
  type AdPlacement,
} from "@/lib/adsense/config";
import { AdSenseUnit } from "@/features/marketing/components/adsense-unit";
import { getCurrentSession } from "@/features/auth/session";
import { userHasPlanFeature } from "@/features/subscriptions/data";

type AdSlotProps = {
  placement?: AdPlacement;
  label?: string;
};

export async function AdSlot({ placement = "inline", label }: AdSlotProps) {
  const session = await getCurrentSession();
  if (session?.user) {
    const hideAds = await userHasPlanFeature(session.user.id, "noAds");
    if (hideAds) {
      return null;
    }
  }

  const t = await getTranslations("marketing.adSlot");
  const resolvedLabel = label ?? t("default");

  if (!isAdPlacementReady(placement)) {
    return (
      <div
        className="my-8 flex min-h-24 items-center justify-center rounded-sm border border-dashed border-[#E4DFD3] bg-[#FBF9F4] px-4 text-center text-xs text-[#1C1B1A]/30"
        aria-hidden={process.env.NODE_ENV === "production"}
      >
        {resolvedLabel}
      </div>
    );
  }

  const clientId = getAdSenseClientId()!;
  const slotId = getAdSlotId(placement)!;

  return (
    <div className="my-8 overflow-hidden rounded-sm" data-ad-placement={placement}>
      <AdSenseUnit clientId={clientId} slotId={slotId} />
    </div>
  );
}
