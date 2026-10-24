import { useCallback, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { CardSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { fetchPlan, API_URL } from "@/lib/api";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function PlanScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, entitlements } = useWorkspace();
  const [plan, setPlan] = useState<{
    planName: string;
    plan: string;
    features: string[];
    status: string;
    expiresAt: string | null;
    showAds: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const data = await fetchPlan(workspaceId, skipCache);
      setPlan(data);
    } catch (err) {
      setLoadError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر تحميل تفاصيل الباقة."
            : "Failed to load plan details.",
        ),
      );
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }

  const planLabel =
    plan?.plan === "pro"
      ? t.plan.pro
      : plan?.plan === "plus"
        ? t.plan.plus
        : t.plan.free;

  const limits = entitlements?.limits;

  return (
    <Screen title={t.plan.title} showBack>
      {loading && !plan ? (
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : loadError && !plan ? (
        <ErrorView
          message={loadError}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
      ) : plan ? (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
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

            {plan.showAds ? (
              <Text style={[shared.label, { marginTop: 6, textAlign: isRTL ? "right" : "left" }]}>
                {isRTL
                  ? "تظهر إعلانات في التطبيق وفق باقتك الحالية."
                  : "Ads may appear in the app on your current plan."}
              </Text>
            ) : (
              <Text style={[shared.label, { marginTop: 6, textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "لا إعلانات على باقتك الحالية." : "No ads on your current plan."}
              </Text>
            )}
          </View>

          {limits && plan.plan !== "pro" ? (
            <View style={shared.card}>
              <Text style={[shared.value, { fontSize: 15, marginBottom: 8, textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "حدود الباقة الحالية" : "Current plan limits"}
              </Text>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "فواتير شهرياً: " : "Invoices / month: "}
                {limits.maxInvoicesPerMonth}
              </Text>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "عملاء: " : "Clients: "}
                {limits.maxClients}
              </Text>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "مشاريع نشطة: " : "Active projects: "}
                {limits.maxActiveProjects}
              </Text>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "مساحات عمل: " : "Workspaces: "}
                {limits.maxWorkspaces}
              </Text>
            </View>
          ) : null}

          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
              {t.plan.features}
            </Text>
            {(plan.features ?? []).map((feature) => (
              <View
                key={feature}
                style={[shared.card, shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
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

          <Pressable
            style={[shared.button, { flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={() => Linking.openURL(`${API_URL}/dashboard/plan`)}
          >
            <AppIcon name="star" size={18} color="#FFFFFF" />
            <Text style={shared.buttonText}>{t.plan.upgrade}</Text>
          </Pressable>
        </ScrollView>
      ) : null}
    </Screen>
  );
}
