import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  Share,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { fetchInvoices, API_URL } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

type InvoiceRow = {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  total: number;
  displayStatus: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
};

export default function InvoicesScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    draft: { label: t.invoices.statusDraft, bg: "#F3F4F6", text: colors.muted },
    sent: { label: t.invoices.statusSent, bg: colors.infoSoft, text: colors.infoText },
    paid: { label: t.invoices.statusPaid, bg: colors.incomeSoft, text: colors.incomeText },
    overdue: { label: t.invoices.statusOverdue, bg: colors.expenseSoft, text: colors.expenseText },
    cancelled: { label: t.invoices.statusCancelled, bg: "#FEE2E2", text: "#991B1B" },
  };

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setError(null);
      const data = await fetchInvoices(workspaceId, 1, skipCache);
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      setError(
        isRTL
          ? "تعذر تحميل الفواتير. يرجى التحقق من الاتصال بالإنترنت."
          : "Failed to load invoices. Please check your network connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  const loadMore = useCallback(async () => {
    if (!workspaceId || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchInvoices(workspaceId, next, false);
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item._id));
        return [...prev, ...data.items.filter((item) => !existing.has(item._id))];
      });
      setPage(data.page);
      setTotalPages(data.totalPages);
    } catch {
      /* ignore */
    } finally {
      setLoadingMore(false);
    }
  }, [workspaceId, loadingMore, page, totalPages]);

  useFocusEffect(
    useCallback(() => {
      void load();
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

  async function shareInvoice(item: InvoiceRow) {
    const url = `${API_URL}/print/invoice/${item._id}?format=a4`;
    try {
      await Share.share({
        title: `${t.invoices.title} #${item.invoiceNumber}`,
        message: `${t.invoices.title} #${item.invoiceNumber} - ${item.clientName}: ${formatMoney(item.total, currency)}\n${url}`,
        url,
      });
    } catch {
      /* ignore */
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === "unpaid" && item.status === "paid") return false;
    if (filter === "paid" && item.status !== "paid") return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const num = (item.invoiceNumber || "").toLowerCase();
      const client = (item.clientName || "").toLowerCase();
      return num.includes(q) || client.includes(q);
    }
    return true;
  });

  return (
    <Screen
      title={t.invoices.title}
      showBack
      actionLabel={t.invoices.add}
      actionIcon="add"
      onAction={() => router.push("/invoice-new")}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.invoices.searchPlaceholder}
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 6 }}>
        {[
          { key: "all", label: t.common.all },
          { key: "unpaid", label: t.invoices.unpaid },
          { key: "paid", label: t.invoices.paid },
        ].map((tab) => {
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
                  active && { color: "#FFFFFF", fontWeight: "700" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && items.length === 0 ? (
        <ListSkeleton count={4} />
      ) : error && items.length === 0 ? (
        <ErrorView
          message={error}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item._id}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          onEndReached={() => void loadMore()}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator color={colors.primary} />
              </View>
            ) : undefined
          }
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={shared.center}>
              <AppIcon name="receipt-outline" size={44} color={colors.faint} />
              <Text style={[shared.empty, { paddingVertical: 12 }]}>
                {search ? (isRTL ? "لا توجد نتائج مطابقة للبحث" : "No matching invoices found") : t.invoices.noInvoices}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const conf = STATUS_CONFIG[item.displayStatus] ?? {
              label: item.displayStatus,
              bg: "#F3F4F6",
              text: colors.text,
            };
            return (
              <View style={shared.card}>
                <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <View style={[shared.iconCircle, { backgroundColor: conf.bg }]}>
                      <AppIcon name="receipt" size={18} color={conf.text} />
                    </View>
                    <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                      <Text style={[shared.value, { fontSize: 16 }]}>{item.invoiceNumber}</Text>
                      <View style={[shared.rowStart, { gap: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                        <AppIcon name="people-outline" size={12} color={colors.faint} />
                        <Text style={[shared.label, { fontSize: 12 }]}>
                          {item.clientName || (isRTL ? "عميل عام" : "General Client")} · {formatDate(item.issueDate)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[shared.badge, { backgroundColor: conf.bg }]}>
                    <Text style={[shared.badgeText, { color: conf.text }]}>{conf.label}</Text>
                  </View>
                </View>

                <View style={[shared.row, { marginVertical: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <Text style={shared.label}>{t.common.total}:</Text>
                  <Text style={[shared.value, { fontSize: 18, color: colors.primary, fontWeight: "800" }]}>
                    {formatMoney(item.total, currency)}
                  </Text>
                </View>

                {/* Action Buttons for Invoices */}
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 8 }}>
                  <Pressable
                    style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    onPress={() => shareInvoice(item)}
                  >
                    <AppIcon name="share-social" size={15} color={colors.primary} />
                    <Text style={shared.buttonSecondaryText}>{t.invoices.shareText}</Text>
                  </Pressable>

                  <Pressable
                    style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    onPress={() => Linking.openURL(`${API_URL}/print/invoice/${item._id}?format=a4`)}
                  >
                    <AppIcon name="print" size={15} color={colors.primary} />
                    <Text style={shared.buttonSecondaryText}>A4</Text>
                  </Pressable>

                  <Pressable
                    style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    onPress={() => Linking.openURL(`${API_URL}/print/invoice/${item._id}?format=pos`)}
                  >
                    <AppIcon name="print" size={15} color={colors.primary} />
                    <Text style={shared.buttonSecondaryText}>POS</Text>
                  </Pressable>
                </View>
              </View>
            );
          }}
        />
      )}
    </Screen>
  );
}
