import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { AdBanner } from "@/components/ad-banner";
import { AppIcon, type IconName } from "@/components/icon";
import { useWorkspace } from "@/lib/workspace";
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
  const { showAds, loading, error, workspace } = useWorkspace();

  if (loading) {
    return (
      <View style={shared.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!workspace) {
    return (
      <View style={shared.center}>
        <Text style={shared.subtitle}>لا توجد مساحة عمل نشطة. أنشئ مساحة من الموقع أولاً.</Text>
      </View>
    );
  }

  return (
    <View style={shared.screen}>
      <View style={[shared.pad, { flex: 1, paddingBottom: 8 }]}>
        {(title || actionLabel || showBack) && (
          <View style={shared.row}>
            <View style={shared.rowStart}>
              {showBack ? (
                <Pressable
                  onPress={onBack ?? (() => router.back())}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: colors.card,
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <AppIcon name="chevron-forward" size={20} color={colors.text} />
                </Pressable>
              ) : null}
              {title ? <Text style={shared.title}>{title}</Text> : null}
            </View>

            {actionLabel && onAction ? (
              <Pressable onPress={onAction} style={shared.buttonSecondary}>
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
