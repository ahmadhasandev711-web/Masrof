import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AdBanner } from "@/components/ad-banner";
import { AppIcon, type IconName } from "@/components/icon";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { colors, shared } from "@/lib/styles";

export function Screen({
  title,
  children,
  actionLabel,
  actionIcon,
  onAction,
  showBack,
  onBack,
}: {
  title?: string;
  children: ReactNode;
  actionLabel?: string;
  actionIcon?: IconName;
  onAction?: () => void;
  showBack?: boolean;
  onBack?: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { isRTL, t } = useI18n();
  const { showAds, loading, error, workspace } = useWorkspace();

  if (loading) {
    return (
      <View style={[shared.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!workspace) {
    return (
      <View style={[shared.center, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <Text style={shared.subtitle}>{t.common.noData}</Text>
      </View>
    );
  }

  const topPadding = Math.max(insets.top, 16) + 6;

  return (
    <View style={shared.screen}>
      <View style={[shared.pad, { flex: 1, paddingTop: topPadding, paddingBottom: 8 }]}>
        {(title || actionLabel || showBack) && (
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              {showBack ? (
                <Pressable
                  onPress={onBack ?? (() => router.back())}
                  hitSlop={8}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <AppIcon
                    name={isRTL ? "chevron-forward" : "chevron-back"}
                    size={20}
                    color={colors.text}
                  />
                </Pressable>
              ) : null}
              {title ? <Text style={shared.title}>{title}</Text> : null}
            </View>

            {actionLabel && onAction ? (
              <Pressable
                onPress={onAction}
                style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
              >
                {actionIcon ? <AppIcon name={actionIcon} size={16} color={colors.primary} /> : null}
                <Text style={shared.buttonSecondaryText}>{actionLabel}</Text>
              </Pressable>
            ) : <View />}
          </View>
        )}
        {error ? <Text style={shared.error}>{error}</Text> : null}
        {children}
      </View>
      <AdBanner showAds={showAds} />
    </View>
  );
}
