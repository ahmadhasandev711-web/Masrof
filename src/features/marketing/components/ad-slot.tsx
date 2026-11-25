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

  if (!isAdPlacementReady(placement)) {
    return null;
  }

  const clientId = getAdSenseClientId()!;
  const slotId = getAdSlotId(placement)!;

  return (
    <div className="my-8 overflow-hidden rounded-sm" data-ad-placement={placement} aria-label={label}>
      <AdSenseUnit clientId={clientId} slotId={slotId} />
    </div>
  );
}
