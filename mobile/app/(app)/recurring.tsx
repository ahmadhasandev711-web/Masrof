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
import {
  createRecurring,
  fetchAccounts,
  fetchCategories,
  fetchRecurring,
  recordRecurring,
  type AccountItem,
  type CategoryItem,
} from "@/lib/api";
import { formatDate, formatMoney, todayISO } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function RecurringScreen() {
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<
    {
      id: string;
      amount: number;
      description: string;
      nextDueDate: string;
      accountName?: string;
      categoryName?: string;
    }[]
  >([]);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [nextDueDate, setNextDueDate] = useState(todayISO());
  const [frequency, setFrequency] = useState<string>("monthly");
  const [busy, setBusy] = useState(false);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchRecurring(workspaceId);
    setItems(
      data.items.map((item) => ({
        id: String(item.id ?? item._id),
        amount: Number(item.amount),
        description: String(item.description || "مصروف متكرر"),
        nextDueDate: String(item.nextDueDate),
        accountName: item.accountName ? String(item.accountName) : undefined,
        categoryName: item.categoryName ? String(item.categoryName) : undefined,
      })),
    );
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

  useEffect(() => {
    if (!workspaceId || !open) return;
    void Promise.all([fetchAccounts(workspaceId), fetchCategories(workspaceId, "expense")]).then(
      ([acc, cats]) => {
        setAccounts(acc.items);
        setCategories(cats.items);
        if (acc.items.length > 0 && !accountId) setAccountId(acc.items[0].id);
        if (cats.items.length > 0 && !categoryId) setCategoryId(cats.items[0].id);
      },
    );
  }, [workspaceId, open]);

  async function onCreate() {
    if (!workspaceId) return;
    if (!description.trim()) {
      setError("يرجى إدخال وصف المصروف المتكرر");
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setError("أدخل مبلغاً صحيحاً أكبر من صفر");
      return;
    }
    if (!accountId || !categoryId) {
      setError("يرجى اختيار الحساب والتصنيف");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createRecurring({
        workspaceId,
        accountId,
        categoryId,
        amount: val,
        description: description.trim(),
        frequency,
        dayOfMonth: new Date(nextDueDate).getDate() || 1,
        nextDueDate,
      });
      setOpen(false);
      setDescription("");
      setAmount("");
      await load();
    } catch {
      setError("تعذر حفظ المصروف المتكرر");
    } finally {
      setBusy(false);
    }
  }

  async function onRecord(recurringId: string) {
    if (!workspaceId) return;
    setRecordingId(recurringId);
    try {
      await recordRecurring({ workspaceId, recurringId });
      await load();
    } finally {
      setRecordingId(null);
    }
  }

  return (
    <Screen
      title="المصاريف والاشتراكات المتكررة"
      showBack
      actionLabel="+ إضافة"
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="repeat" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              لا توجد مصاريف متكررة أو اشتراكات مجدولة
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={shared.card}>
            <View style={shared.row}>
              <View style={shared.rowStart}>
                <View style={[shared.iconCircle, { backgroundColor: colors.infoSoft }]}>
                  <AppIcon name="repeat" size={18} color={colors.info} />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.description}</Text>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    تاريخ الاستحقاق: {formatDate(item.nextDueDate)}
                  </Text>
                </View>
              </View>

              <Text style={[shared.value, { fontSize: 16, color: colors.expense, fontWeight: "800" }]}>
                {formatMoney(item.amount, currency)}
              </Text>
            </View>

            {item.accountName || item.categoryName ? (
              <View style={{ flexDirection: "row-reverse", gap: 6, marginVertical: 2 }}>
                {item.categoryName && (
                  <View style={[shared.badge, { backgroundColor: "#F3F4F6" }]}>
                    <Text style={[shared.badgeText, { color: colors.muted }]}>
                      🏷️ {item.categoryName}
                    </Text>
                  </View>
                )}
                {item.accountName && (
                  <View style={[shared.badge, { backgroundColor: "#F3F4F6" }]}>
                    <Text style={[shared.badgeText, { color: colors.muted }]}>
                      💳 {item.accountName}
                    </Text>
                  </View>
                )}
              </View>
            ) : null}

            <Pressable
              style={[
                shared.buttonSecondary,
                { marginTop: 4 },
                recordingId === item.id && { opacity: 0.6 },
              ]}
              onPress={() => onRecord(item.id)}
              disabled={recordingId === item.id}
            >
              <AppIcon name="checkmark" size={15} color={colors.primary} />
              <Text style={shared.buttonSecondaryText}>
                {recordingId === item.id ? "جارِ التسجيل..." : "تسجيل هذا المصروف الآن"}
              </Text>
            </Pressable>
          </View>
        )}
      />

      {/* Create Recurring Modal */}
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
              <Text style={shared.title}>مصروف متكرر جديد</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>الوصف / اسم الاشتراك</Text>
            <TextInput
              style={shared.input}
              placeholder="مثال: اشتراك نتفليكس، إيجار المكتب، فاتورة الكهرباء..."
              placeholderTextColor={colors.faint}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={shared.label}>المبلغ ({currency})</Text>
            <TextInput
              style={[shared.input, { fontSize: 20, fontWeight: "700", color: colors.expense }]}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
              keyboardType="decimal-pad"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={shared.label}>التكرار</Text>
            <View style={{ flexDirection: "row-reverse", gap: 8 }}>
              {[
                { value: "monthly", label: "شهرياً" },
                { value: "weekly", label: "أسبوعياً" },
                { value: "yearly", label: "سنوياً" },
              ].map((f) => {
                const active = frequency === f.value;
                return (
                  <Pressable
                    key={f.value}
                    onPress={() => setFrequency(f.value)}
                    style={[
                      shared.chip,
                      { flex: 1, alignItems: "center" },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={shared.label}>تاريخ أول استحقاق (YYYY-MM-DD)</Text>
            <TextInput
              style={shared.input}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />

            <Text style={shared.label}>الحساب المسحوب منه</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {accounts.map((account) => {
                const active = accountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setAccountId(account.id)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      💳 {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={shared.label}>التصنيف</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {categories.map((category) => {
                const active = categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      🏷️ {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

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
                  <Text style={shared.buttonText}>حفظ الاشتراك</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
