import { useCallback, useState } from "react";
import { FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchTransactions, type TransactionItem } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

type FilterType = "all" | "expense" | "income";

export default function TransactionsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<TransactionItem[]>([]);
  const [filter, setFilter] = useState<FilterType>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchTransactions(workspaceId, 1, skipCache);
    setItems(data.items);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setItems([]));
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

  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const desc = (item.description || "").toLowerCase();
      const cat = (item.categoryName || "").toLowerCase();
      const acc = (item.accountName || "").toLowerCase();
      return desc.includes(q) || cat.includes(q) || acc.includes(q);
    }
    return true;
  });

  return (
    <Screen
      title={t.transactions.title}
      actionLabel={t.transactions.add}
      actionIcon="add"
      onAction={() => router.push("/(app)/transaction-new")}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.transactions.searchPlaceholder}
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 6 }}>
        {(
          [
            { key: "all", label: t.common.all },
            { key: "expense", label: t.transactions.expenseOnly },
            { key: "income", label: t.transactions.incomeOnly },
          ] as const
        ).map((tab) => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[
                shared.chip,
                { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  shared.chipText,
                  { textAlign: "center" },
                  active && { color: "#FFFFFF", fontWeight: "700" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Transactions List */}
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="document-text" size={40} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {search ? (isRTL ? "لا توجد نتائج مطابقة للبحث" : "No matching transactions found") : t.transactions.noTransactions}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isIncome = item.type === "income";
          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View
                    style={[
                      shared.iconCircle,
                      {
                        backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft,
                      },
                    ]}
                  >
                    <AppIcon
                      name={isIncome ? "trending-up" : "trending-down"}
                      size={18}
                      color={isIncome ? colors.income : colors.expense}
                    />
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.value, { fontSize: 15 }]}>
                      {item.description || item.categoryName || (isIncome ? t.common.income : t.common.expense)}
                    </Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>
                      {formatDate(item.transactionDate)}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
                  <Text
                    style={[
                      shared.value,
                      {
                        fontSize: 16,
                        color: isIncome ? colors.income : colors.expense,
                        fontWeight: "800",
                      },
                    ]}
                  >
                    {isIncome ? "+" : "−"}
                    {formatMoney(item.amount, currency)}
                  </Text>
                </View>
              </View>

              {/* Tags for Category and Account */}
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, marginTop: 4 }}>
                {item.categoryName ? (
                  <View
                    style={[
                      shared.badge,
                      { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
                    ]}
                  >
                    <Text style={[shared.badgeText, { color: colors.muted }]}>
                      🏷️ {item.categoryName}
                    </Text>
                  </View>
                ) : null}
                {item.accountName ? (
                  <View
                    style={[
                      shared.badge,
                      { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#E5E7EB" },
                    ]}
                  >
                    <Text style={[shared.badgeText, { color: colors.muted }]}>
                      💳 {item.accountName}
                    </Text>
                  </View>
                ) : null}
                {item.clientName ? (
                  <View
                    style={[
                      shared.badge,
                      { backgroundColor: colors.infoSoft, borderWidth: 1, borderColor: "#BFDBFE" },
                    ]}
                  >
                    <Text style={[shared.badgeText, { color: colors.infoText }]}>
                      👤 {item.clientName}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          );
        }}
      />
    </Screen>
  );
}
