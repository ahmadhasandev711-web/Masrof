import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
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
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const requestSeq = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const reload = useCallback(
    async (skipCache = false) => {
      if (!workspaceId) return;
      const seq = ++requestSeq.current;
      try {
        const data = await fetchTransactions(workspaceId, 1, skipCache, {
          search: debouncedSearch,
          type: filter === "all" ? undefined : filter,
        });
        if (seq !== requestSeq.current) return;
        setItems(data.items);
        setPage(1);
        setTotalPages(data.totalPages);
      } catch {
        if (seq !== requestSeq.current) return;
        setItems([]);
        setTotalPages(1);
      }
    },
    [workspaceId, debouncedSearch, filter],
  );

  useFocusEffect(
    useCallback(() => {
      void reload();
    }, [reload]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await reload(true);
    } finally {
      setRefreshing(false);
    }
  }

  const loadMore = useCallback(async () => {
    if (!workspaceId || loadingMore || refreshing) return;
    if (page >= totalPages) return;
    const seq = requestSeq.current;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const data = await fetchTransactions(workspaceId, nextPage, false, {
        search: debouncedSearch,
        type: filter === "all" ? undefined : filter,
      });
      if (seq !== requestSeq.current) return;
      setItems((prev) => [...prev, ...data.items]);
      setPage(nextPage);
      setTotalPages(data.totalPages);
    } finally {
      setLoadingMore(false);
    }
  }, [workspaceId, page, totalPages, loadingMore, refreshing, debouncedSearch, filter]);

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
          value={searchInput}
          onChangeText={setSearchInput}
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
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator style={{ paddingVertical: 16 }} color={colors.primary} />
          ) : null
        }
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="document-text" size={40} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {searchInput.trim() ? (isRTL ? "لا توجد نتائج مطابقة للبحث" : "No matching transactions found") : t.transactions.noTransactions}
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
