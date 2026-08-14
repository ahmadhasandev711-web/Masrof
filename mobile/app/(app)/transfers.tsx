import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { createTransfer, fetchAccounts, fetchTransfers, type AccountItem } from "@/lib/api";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function TransfersScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
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
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [open, setOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchTransfers(workspaceId, skipCache);
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

  useEffect(() => {
    if (!workspaceId || !open) return;
    void fetchAccounts(workspaceId).then((data) => {
      setAccounts(data.items);
      if (data.items.length > 0) {
        setFromAccountId(data.items[0].id);
        setToAccountId(data.items.length > 1 ? data.items[1].id : data.items[0].id);
      }
    });
  }, [workspaceId, open]);

  async function onCreate() {
    if (!workspaceId) return;
    if (!fromAccountId || !toAccountId) {
      setError(isRTL ? "يرجى اختيار حسابي التحويل" : "Please select source and destination accounts");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError(isRTL ? "لا يمكن التحويل لنفس الحساب" : "Source and destination cannot be the same");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createTransfer({
        workspaceId,
        fromAccountId,
        toAccountId,
        amount: value,
        transferDate: date,
      });
      setOpen(false);
      setAmount("");
      await load(true);
    } catch {
      setError(isRTL ? "تعذر تنفيذ التحويل. تأكد من توفر الرصيد الكافي." : "Failed to transfer. Ensure sufficient balance.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t.transfers.title}
      showBack
      actionLabel={t.transfers.add}
      actionIcon="swap-horizontal"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
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
                  <Text style={[shared.value, { fontSize: 15 }]}>
                    {item.fromAccountName} ➔ {item.toAccountName}
                  </Text>
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

      {/* Add Transfer Modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}
          onPress={() => setOpen(false)}
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
              <Pressable onPress={() => setOpen(false)}>
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
              {accounts.map((account) => {
                const active = fromAccountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setFromAccountId(account.id)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      💳 {account.name}
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
              {accounts.map((account) => {
                const active = toAccountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setToAccountId(account.id)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      💳 {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.common.amount} ({currency})
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "تاريخ التحويل" : "Transfer Date"} (YYYY-MM-DD)
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />

            {error ? <Text style={shared.error}>{error}</Text> : null}

            <Pressable
              style={[shared.button, busy && { opacity: 0.7 }]}
              onPress={onCreate}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={shared.buttonText}>{t.transfers.confirmTransfer}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
