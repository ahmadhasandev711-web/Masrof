import { useCallback, useState } from "react";
import {
  FlatList,
  Linking,
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
import { fetchInvoices, updateInvoiceStatus, API_URL } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

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

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  draft: { label: "مسودة", bg: "#F3F4F6", text: colors.muted },
  sent: { label: "مُرسلة", bg: colors.infoSoft, text: colors.infoText },
  paid: { label: "مدفوعة", bg: colors.incomeSoft, text: colors.incomeText },
  overdue: { label: "متأخرة", bg: colors.expenseSoft, text: colors.expenseText },
  cancelled: { label: "ملغاة", bg: "#FEE2E2", text: "#991B1B" },
};

export default function InvoicesScreen() {
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<InvoiceRow[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchInvoices(workspaceId);
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
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function markPaid(invoiceId: string) {
    if (!workspaceId) return;
    setUpdatingId(invoiceId);
    try {
      await updateInvoiceStatus({ workspaceId, invoiceId, status: "paid" });
      await load();
    } finally {
      setUpdatingId(null);
    }
  }

  async function shareInvoice(item: InvoiceRow) {
    const url = `${API_URL}/print/invoice/${item._id}?format=a4`;
    try {
      await Share.share({
        title: `فاتورة رقم ${item.invoiceNumber}`,
        message: `فاتورة رقم ${item.invoiceNumber} للعميل ${item.clientName} بمبلغ ${formatMoney(item.total, currency)}\nرابط الفاتورة: ${url}`,
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
      title="الفواتير"
      showBack
      actionLabel="+ فاتورة"
      actionIcon="add"
      onAction={() => router.push("/(app)/invoice-new")}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={shared.input}
          placeholder="بحث برقم الفاتورة أو اسم العميل..."
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 6 }}>
        {[
          { key: "all", label: "الكل" },
          { key: "unpaid", label: "مستحقة" },
          { key: "paid", label: "مدفوعة" },
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
              <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="receipt-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {search ? "لا توجد فواتير مطابقة للبحث" : "لا توجد فواتير منشأة بعد"}
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
              <View style={shared.row}>
                <View style={shared.rowStart}>
                  <View style={[shared.iconCircle, { backgroundColor: conf.bg }]}>
                    <AppIcon name="receipt" size={18} color={conf.text} />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.invoiceNumber}</Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>
                      👤 {item.clientName || "عميل عام"} · {formatDate(item.issueDate)}
                    </Text>
                  </View>
                </View>

                <View style={[shared.badge, { backgroundColor: conf.bg }]}>
                  <Text style={[shared.badgeText, { color: conf.text }]}>{conf.label}</Text>
                </View>
              </View>

              <View style={[shared.row, { marginVertical: 4 }]}>
                <Text style={shared.label}>الإجمالي:</Text>
                <Text style={[shared.value, { fontSize: 18, color: colors.primary, fontWeight: "800" }]}>
                  {formatMoney(item.total, currency)}
                </Text>
              </View>

              {/* Action Buttons for Invoices */}
              <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 6, borderTopWidth: 1, borderTopColor: colors.borderLight, paddingTop: 8 }}>
                {item.status !== "paid" ? (
                  <Pressable
                    style={[shared.buttonSecondary, { backgroundColor: colors.incomeSoft, borderColor: "#A7F3D0" }]}
                    onPress={() => markPaid(item._id)}
                    disabled={updatingId === item._id}
                  >
                    <AppIcon name="checkmark" size={15} color={colors.income} />
                    <Text style={[shared.buttonSecondaryText, { color: colors.incomeText }]}>
                      {updatingId === item._id ? "جارِ التحديث..." : "تعليم مدفوعة"}
                    </Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={shared.buttonSecondary}
                  onPress={() => shareInvoice(item)}
                >
                  <AppIcon name="share-social" size={15} color={colors.primary} />
                  <Text style={shared.buttonSecondaryText}>مشاركة</Text>
                </Pressable>

                <Pressable
                  style={shared.buttonSecondary}
                  onPress={() => Linking.openURL(`${API_URL}/print/invoice/${item._id}?format=a4`)}
                >
                  <AppIcon name="print" size={15} color={colors.primary} />
                  <Text style={shared.buttonSecondaryText}>A4</Text>
                </Pressable>

                <Pressable
                  style={shared.buttonSecondary}
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
    </Screen>
  );
}
