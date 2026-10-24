import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { AmountField, DateField, FormBanner, PrimaryButton } from "@/components/forms";
import { useWriteAccess } from "@/lib/write-access";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { fetchTransfers } from "@/lib/api";
import { formatDate, formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { useTransferForm } from "@/hooks/use-transfer-form";

export default function TransfersScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const { headerAction } = useWriteAccess();
  const [items, setItems] = useState<
    {
      _id: string;
      amount: number;
      fromAccountName: string;
      toAccountName: string;
      transferDate: string;
      description: string;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      const data = await fetchTransfers(workspaceId, 1, skipCache);
      setItems(data.items);
      setPage(data.page);
      setTotalPages(data.totalPages);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  const form = useTransferForm({
    onSuccess: () => load(true),
  });

  const loadMore = useCallback(async () => {
    if (!workspaceId || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const data = await fetchTransfers(workspaceId, next, false);
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

  return (
    <Screen
      title={t.transfers.title}
      showBack
      {...headerAction(t.transfers.add, "swap-horizontal", () => form.setOpen(true))}
    >
      {loading && items.length === 0 ? (
        <ListSkeleton count={5} />
      ) : (
        <FlatList
          data={items}
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
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="swap-horizontal" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {t.transfers.noTransfers}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={shared.card}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.iconCircle, { backgroundColor: colors.warningSoft }]}>
                  <AppIcon name="swap-horizontal" size={18} color={colors.warning} />
                </View>
                <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                  <View style={[shared.rowStart, { gap: 6, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <Text style={[shared.value, { fontSize: 15 }]}>{item.fromAccountName}</Text>
                    <AppIcon name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={colors.faint} />
                    <Text style={[shared.value, { fontSize: 15 }]}>{item.toAccountName}</Text>
                  </View>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    {formatDate(item.transferDate)}
                  </Text>
                </View>
              </View>

              <Text style={[shared.value, { fontSize: 16, color: colors.warningText, fontWeight: "800" }]}>
                {formatMoney(item.amount, currency)}
              </Text>
            </View>
          </View>
        )}
      />
      )}

      {/* Add Transfer Modal */}
      <Modal visible={form.open} animationType="slide" transparent onRequestClose={() => form.setOpen(false)}>
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}
          onPress={() => form.setOpen(false)}
        >
          <Pressable
            style={[
              shared.card,
              {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingBottom: 36,
                gap: 12,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[shared.value, { fontSize: 18 }]}>{t.transfers.newTitle}</Text>
              <Pressable onPress={() => form.setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.transfers.fromAccount}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              {form.accounts.map((account) => {
                const active = form.fromAccountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => form.setFromAccountId(account.id)}
                    style={[
                      shared.chip,
                      { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <AppIcon
                      name="card-outline"
                      size={13}
                      color={active ? "#FFFFFF" : colors.primary}
                    />
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.transfers.toAccount}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              {form.accounts.map((account) => {
                const active = form.toAccountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => form.setToAccountId(account.id)}
                    style={[
                      shared.chip,
                      { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <AppIcon
                      name="card-outline"
                      size={13}
                      color={active ? "#FFFFFF" : colors.primary}
                    />
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <AmountField
              label={t.common.amount}
              currency={currency}
              value={form.amount}
              onChangeText={form.setAmount}
              isRTL={isRTL}
            />

            <DateField
              label={isRTL ? "تاريخ التحويل" : "Transfer date"}
              value={form.date}
              onChange={form.setDate}
              isRTL={isRTL}
            />

            {form.error ? <FormBanner message={form.error} isRTL={isRTL} /> : null}

            <PrimaryButton
              label={t.transfers.confirmTransfer}
              loading={form.busy}
              isRTL={isRTL}
              onPress={form.onSubmit}
              disabled={form.busy}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
