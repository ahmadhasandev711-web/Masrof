import { useCallback, useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchDashboard, type DashboardSummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { authClient } from "@/lib/auth-client";

export default function HomeScreen() {
  const { workspaceId, currency, workspaces, setWorkspaceId, entitlements } = useWorkspace();
  const { data: session } = authClient.useSession();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const summary = await fetchDashboard(workspaceId);
    setData(summary);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setData(null));
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  const planLabel =
    entitlements?.plan === "pro" ? "برو" : entitlements?.plan === "plus" ? "بلس" : "مجاني";

  const netSavings = (data?.monthIncome ?? 0) - (data?.monthExpense ?? 0);

  return (
    <Screen title="الرئيسية">
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
        contentContainerStyle={{ gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Greeting & Plan */}
        <View style={shared.row}>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={shared.subtitle}>أهلاً بك</Text>
            <Text style={[shared.value, { fontSize: 18 }]}>
              {session?.user.name || session?.user.email?.split("@")[0] || "المستخدم"}
            </Text>
          </View>
          <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
            <Text style={[shared.badgeText, { color: colors.primary }]}>باقة {planLabel}</Text>
          </View>
        </View>

        {/* Workspaces Switcher */}
        {workspaces.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {workspaces.map((ws) => {
              const active = ws.id === workspaceId;
              return (
                <Pressable
                  key={ws.id}
                  onPress={() => setWorkspaceId(ws.id)}
                  style={[
                    shared.chip,
                    active && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                    {ws.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Total Balance Card */}
        <View style={shared.cardHighlighted}>
          <View style={shared.row}>
            <Text style={shared.label}>إجمالي الرصيد الحالي</Text>
            <View style={shared.iconCircle}>
              <AppIcon name="wallet" size={20} color={colors.primary} />
            </View>
          </View>
          <Text style={[shared.value, { fontSize: 30, color: colors.primary, fontWeight: "800" }]}>
            {formatMoney(data?.totalBalance, currency)}
          </Text>
          <View style={[shared.row, { marginTop: 4 }]}>
            <Text style={shared.label}>صافي وفر الشهر:</Text>
            <Text
              style={[
                shared.value,
                {
                  fontSize: 14,
                  color: netSavings >= 0 ? colors.income : colors.expense,
                },
              ]}
            >
              {netSavings >= 0 ? "+" : ""}
              {formatMoney(netSavings, currency)}
            </Text>
          </View>
        </View>

        {/* Month Income & Expense */}
        <View style={shared.row}>
          <View style={[shared.card, { flex: 1 }]}>
            <View style={shared.row}>
              <Text style={shared.label}>دخل الشهر</Text>
              <AppIcon name="trending-up" size={18} color={colors.income} />
            </View>
            <Text style={[shared.value, { color: colors.income, fontSize: 18, marginTop: 4 }]}>
              {formatMoney(data?.monthIncome, currency)}
            </Text>
          </View>

          <View style={[shared.card, { flex: 1 }]}>
            <View style={shared.row}>
              <Text style={shared.label}>مصروف الشهر</Text>
              <AppIcon name="trending-down" size={18} color={colors.expense} />
            </View>
            <Text style={[shared.value, { color: colors.expense, fontSize: 18, marginTop: 4 }]}>
              {formatMoney(data?.monthExpense, currency)}
            </Text>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700" }]}>إجراءات سريعة</Text>
          <View style={{ flexDirection: "row-reverse", gap: 10 }}>
            <Pressable
              style={[shared.card, { flex: 1, alignItems: "center", paddingVertical: 14 }]}
              onPress={() => router.push("/(app)/transaction-new")}
            >
              <View style={[shared.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <AppIcon name="add" size={22} color={colors.primary} />
              </View>
              <Text style={[shared.value, { fontSize: 12, marginTop: 6 }]}>عملية جديدة</Text>
            </Pressable>

            <Pressable
              style={[shared.card, { flex: 1, alignItems: "center", paddingVertical: 14 }]}
              onPress={() => router.push("/(app)/invoice-new")}
            >
              <View style={[shared.iconCircle, { backgroundColor: colors.infoSoft }]}>
                <AppIcon name="receipt" size={20} color={colors.info} />
              </View>
              <Text style={[shared.value, { fontSize: 12, marginTop: 6 }]}>فاتورة جديدة</Text>
            </Pressable>

            <Pressable
              style={[shared.card, { flex: 1, alignItems: "center", paddingVertical: 14 }]}
              onPress={() => router.push("/(app)/transfers")}
            >
              <View style={[shared.iconCircle, { backgroundColor: colors.warningSoft }]}>
                <AppIcon name="swap-horizontal" size={20} color={colors.warning} />
              </View>
              <Text style={[shared.value, { fontSize: 12, marginTop: 6 }]}>تحويل</Text>
            </Pressable>

            <Pressable
              style={[shared.card, { flex: 1, alignItems: "center", paddingVertical: 14 }]}
              onPress={() => router.push("/(app)/budgets")}
            >
              <View style={[shared.iconCircle, { backgroundColor: colors.incomeSoft }]}>
                <AppIcon name="pie-chart" size={20} color={colors.income} />
              </View>
              <Text style={[shared.value, { fontSize: 12, marginTop: 6 }]}>الميزانية</Text>
            </Pressable>
          </View>
        </View>

        {/* Smart Alerts Section */}
        {((data?.budgetWarnings ?? 0) > 0 ||
          (data?.dueRecurring ?? 0) > 0 ||
          (data?.receivableProjects ?? 0) > 0) && (
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { fontWeight: "700" }]}>تنبيهات هامة</Text>

            {(data?.budgetWarnings ?? 0) > 0 && (
              <Pressable
                style={[shared.card, shared.row, { borderColor: "#FCD34D" }]}
                onPress={() => router.push("/(app)/budgets")}
              >
                <View style={shared.rowStart}>
                  <AppIcon name="alert-circle" size={20} color={colors.warning} />
                  <Text style={[shared.value, { fontSize: 13, color: colors.warningText }]}>
                    تجاوز في الميزانيات: {data?.budgetWarnings} تصنيفات قاربت الحد
                  </Text>
                </View>
                <AppIcon name="chevron-back" size={16} color={colors.warning} />
              </Pressable>
            )}

            {(data?.dueRecurring ?? 0) > 0 && (
              <Pressable
                style={[shared.card, shared.row, { borderColor: "#BAE6FD" }]}
                onPress={() => router.push("/(app)/recurring")}
              >
                <View style={shared.rowStart}>
                  <AppIcon name="repeat" size={20} color={colors.info} />
                  <Text style={[shared.value, { fontSize: 13, color: colors.infoText }]}>
                    مصاريف متكررة مستحقة: {data?.dueRecurring} فواتير تستحق التسجيل
                  </Text>
                </View>
                <AppIcon name="chevron-back" size={16} color={colors.info} />
              </Pressable>
            )}

            {(data?.receivableProjects ?? 0) > 0 && (
              <Pressable
                style={[shared.card, shared.row, { borderColor: "#A7F3D0" }]}
                onPress={() => router.push("/(app)/projects")}
              >
                <View style={shared.rowStart}>
                  <AppIcon name="briefcase" size={20} color={colors.primary} />
                  <Text style={[shared.value, { fontSize: 13, color: colors.primary }]}>
                    مستحقات مشاريع غير محصلة: {data?.receivableProjects} مشروع
                  </Text>
                </View>
                <AppIcon name="chevron-back" size={16} color={colors.primary} />
              </Pressable>
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
