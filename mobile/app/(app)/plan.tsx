import { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchPlan, API_URL } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function PlanScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId } = useWorkspace();
  const [plan, setPlan] = useState<{
    planName: string;
    plan: string;
    features: string[];
    status: string;
    expiresAt: string | null;
  } | null>(null);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchPlan(workspaceId, skipCache);
    setPlan(data);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setPlan(null));
    }, [load]),
  );

  const planLabel =
    plan?.plan === "pro"
      ? t.plan.pro
      : plan?.plan === "plus"
        ? t.plan.plus
        : t.plan.free;

  return (
    <Screen title={t.plan.title} showBack>
      {!plan ? (
        <View style={shared.center}>
          <Text style={shared.empty}>
            {isRTL ? "تعذر تحميل تفاصيل الباقة" : "Failed to load plan details"}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Card */}
          <View style={shared.cardHighlighted}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.iconCircle, { backgroundColor: colors.warningSoft }]}>
                  <AppIcon name="star" size={20} color={colors.warning} />
                </View>
                <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                  <Text style={[shared.value, { fontSize: 18 }]}>{plan.planName}</Text>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    {isRTL ? "الحالة: " : "Status: "}
                    {plan.status === "active" ? (isRTL ? "نشطة ومفعلة" : "Active") : plan.status}
                  </Text>
                </View>
              </View>
              <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[shared.badgeText, { color: colors.primary }]}>{planLabel}</Text>
              </View>
            </View>

            {plan.expiresAt ? (
              <Text style={[shared.label, { marginTop: 4, textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "تنتهي في: " : "Expires on: "}
                {new Date(plan.expiresAt).toLocaleDateString(isRTL ? "ar-EG" : "en-US")}
              </Text>
            ) : null}
          </View>

          {/* Features List */}
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
              {t.plan.features}
            </Text>
            {(plan.features ?? []).map((feature) => (
              <View
                key={feature}
                style={[
                  shared.card,
                  shared.row,
                  { flexDirection: isRTL ? "row-reverse" : "row" },
                ]}
              >
                <Text
                  style={[
                    shared.value,
                    { fontSize: 14, flex: 1, textAlign: isRTL ? "right" : "left" },
                  ]}
                >
                  {feature}
                </Text>
                <View style={[shared.iconCircle, { width: 28, height: 28, borderRadius: 14 }]}>
                  <AppIcon name="checkmark" size={16} color={colors.primary} />
                </View>
              </View>
            ))}
          </View>

          {/* Upgrade on Web CTA */}
          <Pressable
            style={[shared.button, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => Linking.openURL(`${API_URL}/dashboard/plan`)}
          >
            <AppIcon name="star" size={18} color="#FFFFFF" />
            <Text style={shared.buttonText}>{t.plan.upgrade}</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
