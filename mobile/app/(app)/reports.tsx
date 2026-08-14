import { useCallback, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchReports } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

type PresetKey = "thisMonth" | "lastMonth" | "thisYear";

export default function ReportsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const [preset, setPreset] = useState<PresetKey>("thisMonth");
  const [summary, setSummary] = useState<{
    income: number | null;
    expense: number | null;
    net: number | null;
  } | null>(null);
  const [expenseRows, setExpenseRows] = useState<{ name: string; total: number | null }[]>([]);
  const [incomeRows, setIncomeRows] = useState<{ name: string; total: number | null }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchReports(workspaceId, preset, skipCache);
    setSummary(data.summary);
    setExpenseRows(data.expenseBreakdown?.rows ?? []);
    setIncomeRows(data.incomeBreakdown?.rows ?? []);
  }, [workspaceId, preset]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {
        setSummary(null);
        setExpenseRows([]);
        setIncomeRows([]);
      });
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

  const expenseTotal = expenseRows.reduce((sum, row) => sum + (row.total ?? 0), 0);
  const incomeTotal = incomeRows.reduce((sum, row) => sum + (row.total ?? 0), 0);

  return (
    <Screen title={t.reports.title} showBack>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 14, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preset Selector */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
          {[
            { key: "thisMonth", label: t.reports.thisMonth },
            { key: "lastMonth", label: t.reports.lastMonth },
            { key: "thisYear", label: t.reports.thisYear },
          ].map((p) => {
            const active = preset === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => setPreset(p.key as PresetKey)}
                style={[
                  shared.chip,
                  { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    shared.chipText,
                    active && { color: "#FFFFFF", fontWeight: "700" },
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Financial Summary Cards */}
        <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={[shared.card, { flex: 1 }]}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={shared.label}>{t.common.income}</Text>
              <AppIcon name="trending-up" size={18} color={colors.income} />
            </View>
            <Text
              style={[
                shared.value,
                {
                  color: colors.income,
                  fontSize: 18,
                  marginTop: 4,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {formatMoney(summary?.income, currency)}
            </Text>
          </View>

          <View style={[shared.card, { flex: 1 }]}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={shared.label}>{t.common.expense}</Text>
              <AppIcon name="trending-down" size={18} color={colors.expense} />
            </View>
            <Text
              style={[
                shared.value,
                {
                  color: colors.expense,
                  fontSize: 18,
                  marginTop: 4,
                  textAlign: isRTL ? "right" : "left",
                },
              ]}
            >
              {formatMoney(summary?.expense, currency)}
            </Text>
          </View>
        </View>

        {/* Net Savings Card */}
        <View style={shared.cardHighlighted}>
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={shared.label}>{t.dashboard.netSavings}</Text>
            <AppIcon name="wallet" size={20} color={colors.primary} />
          </View>
          <Text
            style={[
              shared.value,
              {
                fontSize: 24,
                color: (summary?.net ?? 0) >= 0 ? colors.income : colors.expense,
                fontWeight: "800",
                textAlign: isRTL ? "right" : "left",
              },
            ]}
          >
            {(summary?.net ?? 0) >= 0 ? "+" : ""}
            {formatMoney(summary?.net, currency)}
          </Text>
        </View>

        {/* Expense Breakdown */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
            {t.reports.expenseBreakdown}
          </Text>
          {expenseRows.length === 0 ? (
            <View style={[shared.card, { alignItems: "center", paddingVertical: 14 }]}>
              <Text style={shared.label}>{t.reports.noReports}</Text>
            </View>
          ) : (
            expenseRows.map((row) => {
              const pct =
                expenseTotal > 0 && row.total != null
                  ? Math.round((row.total / expenseTotal) * 100)
                  : 0;
              return (
                <View key={row.name} style={shared.card}>
                  <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Text style={[shared.value, { fontSize: 15 }]}>{row.name}</Text>
                    <Text style={[shared.value, { fontSize: 15, color: colors.expense }]}>
                      {formatMoney(row.total, currency)} ({pct}%)
                    </Text>
                  </View>
                  <View style={shared.progressBarBg}>
                    <View
                      style={[
                        shared.progressBarFill,
                        { width: `${pct}%`, backgroundColor: colors.expense },
                      ]}
                    />
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Income Breakdown */}
        {incomeRows.length > 0 && (
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
              {t.reports.incomeBreakdown}
            </Text>
            {incomeRows.map((row) => {
              const pct =
                incomeTotal > 0 && row.total != null
                  ? Math.round((row.total / incomeTotal) * 100)
                  : 0;
              return (
                <View key={row.name} style={shared.card}>
                  <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Text style={[shared.value, { fontSize: 15 }]}>{row.name}</Text>
                    <Text style={[shared.value, { fontSize: 15, color: colors.income }]}>
                      {formatMoney(row.total, currency)} ({pct}%)
                    </Text>
                  </View>
                  <View style={shared.progressBarBg}>
                    <View
                      style={[
                        shared.progressBarFill,
                        { width: `${pct}%`, backgroundColor: colors.income },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
