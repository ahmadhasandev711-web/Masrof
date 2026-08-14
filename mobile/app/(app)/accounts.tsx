import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon, type IconName } from "@/components/icon";
import { createAccount, fetchAccounts, type AccountItem } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

const ACCOUNT_TYPES: { value: string; label: string; icon: IconName }[] = [
  { value: "cash", label: "كاش / نقدي", icon: "wallet" },
  { value: "bank", label: "حساب بنكي", icon: "card" },
  { value: "mobile_wallet", label: "محفظة إلكترونية", icon: "wallet" },
  { value: "savings", label: "حساب توفير", icon: "star" },
  { value: "other", label: "أخرى", icon: "list" },
];

export default function AccountsScreen() {
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<AccountItem[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchAccounts(workspaceId);
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

  async function onCreate() {
    if (!workspaceId || name.trim().length < 2) {
      setError("يرجى إدخال اسم الحساب (حرفين على الأقل)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAccount({
        workspaceId,
        name: name.trim(),
        type,
        openingBalance: Number(balance) || 0,
      });
      setOpen(false);
      setName("");
      setBalance("0");
      await load();
    } catch {
      setError("تعذر إنشاء الحساب");
    } finally {
      setBusy(false);
    }
  }

  const totalBalance = items.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <Screen
      title="الحسابات والمحافظ"
      showBack
      actionLabel="+ حساب"
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      {/* Total Accounts Balance Header */}
      <View style={[shared.cardHighlighted, { marginBottom: 6 }]}>
        <View style={shared.row}>
          <Text style={shared.label}>إجمالي الأرصدة</Text>
          <Pressable
            style={[shared.buttonSecondary, { paddingVertical: 6, paddingHorizontal: 10 }]}
            onPress={() => router.push("/(app)/transfers")}
          >
            <AppIcon name="swap-horizontal" size={14} color={colors.primary} />
            <Text style={[shared.buttonSecondaryText, { fontSize: 12 }]}>تحويل بين الحسابات</Text>
          </Pressable>
        </View>
        <Text style={[shared.value, { fontSize: 24, color: colors.primary, fontWeight: "800" }]}>
          {formatMoney(totalBalance, currency)}
        </Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="wallet-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>لا توجد حسابات مسجلة بعد</Text>
          </View>
        }
        renderItem={({ item }) => {
          const typeObj = ACCOUNT_TYPES.find((t) => t.value === item.type) ?? {
            label: item.type,
            icon: "wallet" as IconName,
          };
          return (
            <View style={shared.card}>
              <View style={shared.row}>
                <View style={shared.rowStart}>
                  <View style={shared.iconCircle}>
                    <AppIcon name={typeObj.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>{typeObj.label}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    shared.value,
                    {
                      fontSize: 18,
                      color: item.balance >= 0 ? colors.income : colors.expense,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {formatMoney(item.balance, item.currency || currency)}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Add Account Modal */}
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
            <View style={shared.row}>
              <Text style={shared.title}>إضافة حساب جديد</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>اسم الحساب</Text>
            <TextInput
              style={shared.input}
              placeholder="مثال: البنك الأهلي، محفظة كاش، الخزينة..."
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={shared.label}>نوع الحساب</Text>
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
              {ACCOUNT_TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={shared.label}>الرصيد الافتتاحي</Text>
            <TextInput
              style={shared.input}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
              keyboardType="decimal-pad"
              value={balance}
              onChangeText={setBalance}
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
                <>
                  <AppIcon name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={shared.buttonText}>حفظ الحساب</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
