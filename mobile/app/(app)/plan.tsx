import { useCallback, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchPlan, API_URL } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function PlanScreen() {
  const { workspaceId } = useWorkspace();
  const [plan, setPlan] = useState<{
    planName: string;
    plan: string;
    features: string[];
    status: string;
    expiresAt: string | null;
  } | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchPlan(workspaceId);
    setPlan(data);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setPlan(null));
    }, [load]),
  );

  const planLabel =
    plan?.plan === "pro" ? "برو" : plan?.plan === "plus" ? "بلس" : "مجاني";

  return (
    <Screen title="الاشتراك والباقة" showBack>
      {!plan ? (
        <View style={shared.center}>
          <Text style={shared.empty}>تعذر تحميل تفاصيل الباقة</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Card */}
          <View style={shared.cardHighlighted}>
            <View style={shared.row}>
              <View style={shared.rowStart}>
                <View style={[shared.iconCircle, { backgroundColor: colors.warningSoft }]}>
                  <AppIcon name="star" size={20} color={colors.warning} />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[shared.value, { fontSize: 18 }]}>{plan.planName}</Text>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    الحالة: {plan.status === "active" ? "نشطة ومفعلة" : plan.status}
                  </Text>
                </View>
              </View>
              <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[shared.badgeText, { color: colors.primary }]}>{planLabel}</Text>
              </View>
            </View>

            {plan.expiresAt ? (
              <Text style={[shared.label, { marginTop: 4 }]}>
                تنتهي في: {new Date(plan.expiresAt).toLocaleDateString("ar-EG")}
              </Text>
            ) : null}
          </View>

          {/* Features List */}
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { fontWeight: "700" }]}>المزايا المضمنة في باقتك</Text>
            {(plan.features ?? []).map((feature) => (
              <View key={feature} style={[shared.card, shared.row]}>
                <Text style={[shared.value, { fontSize: 14, flex: 1 }]}>{feature}</Text>
                <View style={[shared.iconCircle, { width: 28, height: 28, borderRadius: 14 }]}>
                  <AppIcon name="checkmark" size={16} color={colors.primary} />
                </View>
              </View>
            ))}
          </View>

          {/* Upgrade on Web CTA */}
          <Pressable
            style={shared.button}
            onPress={() => Linking.openURL(`${API_URL}/dashboard/plan`)}
          >
            <AppIcon name="star" size={18} color="#FFFFFF" />
            <Text style={shared.buttonText}>ترقية الباقة أو إدارة الاشتراك عبر الويب</Text>
          </Pressable>
        </ScrollView>
      )}
    </Screen>
  );
}
