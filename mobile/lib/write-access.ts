import { useI18n } from "@/lib/i18n";
import { useWorkspace } from "@/lib/workspace";
import type { IconName } from "@/components/icon";

export function useWriteAccess() {
  const { canWrite } = useWorkspace();
  const { isRTL } = useI18n();

  const readOnlyMessage = isRTL
    ? "صلاحيتك للعرض فقط في هذه المساحة."
    : "You have view-only access in this workspace.";

  function headerAction(
    label: string,
    icon: IconName,
    onPress: () => void,
  ): { actionLabel?: string; actionIcon?: IconName; onAction?: () => void } {
    if (!canWrite) {
      return {};
    }
    return { actionLabel: label, actionIcon: icon, onAction: onPress };
  }

  return { canWrite, readOnlyMessage, headerAction };
}
