import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import {
  createTransaction,
  fetchAccounts,
  fetchCategories,
  type AccountItem,
  type CategoryItem,
} from "@/lib/api";
import { todayISO } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function NewTransactionScreen() {
  const { workspaceId, currency } = useWorkspace();
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    void Promise.all([
      fetchAccounts(workspaceId),
      fetchCategories(workspaceId, type),
    ]).then(([acc, cats]) => {
      setAccounts(acc.items);
      setCategories(cats.items);
      if (acc.items.length > 0 && !accountId) {
        setAccountId(acc.items[0].id);
      }
      if (cats.items.length > 0) {
        setCategoryId(cats.items[0].id);
      }
    });
  }, [workspaceId, type]);

  async function onSubmit() {
    if (!workspaceId) return;
    if (!accountId) {
      setError("يرجى اختيار الحساب");
      return;
    }
    if (!categoryId) {
      setError("يرجى اختيار التصنيف");
      return;
    }
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("أدخل مبلغاً صحيحاً أكبر من صفر");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createTransaction({
        workspaceId,
        accountId,
        categoryId,
        type,
        amount: value,
        transactionDate: date,
        description: description.trim() || undefined,
      });
      router.back();
    } catch {
      setError("تعذر حفظ العملية. تأكد من صحة البيانات والاتصال.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="عملية جديدة" showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector (Expense vs Income) */}
        <View style={shared.row}>
          <Pressable
            onPress={() => setType("expense")}
            style={[
              shared.buttonSecondary,
              { flex: 1, paddingVertical: 12 },
              type === "expense" && {
                backgroundColor: colors.expense,
                borderColor: colors.expense,
              },
            ]}
          >
            <AppIcon
              name="trending-down"
              size={18}
              color={type === "expense" ? "#FFFFFF" : colors.expense}
            />
            <Text
              style={[
                shared.buttonSecondaryText,
                { color: type === "expense" ? "#FFFFFF" : colors.expense },
              ]}
            >
              مصروف
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setType("income")}
            style={[
              shared.buttonSecondary,
              { flex: 1, paddingVertical: 12 },
              type === "income" && {
                backgroundColor: colors.income,
                borderColor: colors.income,
              },
            ]}
          >
            <AppIcon
              name="trending-up"
              size={18}
              color={type === "income" ? "#FFFFFF" : colors.income}
            />
            <Text
              style={[
                shared.buttonSecondaryText,
                { color: type === "income" ? "#FFFFFF" : colors.income },
              ]}
            >
              دخل
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>المبلغ ({currency})</Text>
          <TextInput
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            style={[
              shared.input,
              {
                fontSize: 22,
                fontWeight: "700",
                color: type === "expense" ? colors.expense : colors.income,
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={colors.faint}
            autoFocus
          />
        </View>

        {/* Description Input */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>الوصف أو البيان (اختياري)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={shared.input}
            placeholder="مثال: مشتريات سوبرماركت، فاتورة إنترنت..."
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Date Input */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>التاريخ (YYYY-MM-DD)</Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            style={shared.input}
            placeholder="2026-08-14"
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Account Selector */}
        <View style={{ gap: 8 }}>
          <Text style={shared.label}>الحساب المسحوب منه / المودع فيه</Text>
          {accounts.length === 0 ? (
            <Text style={[shared.label, { color: colors.warning }]}>لا توجد حسابات متاحة</Text>
          ) : (
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
          )}
        </View>

        {/* Category Selector */}
        <View style={{ gap: 8 }}>
          <Text style={shared.label}>التصنيف</Text>
          {categories.length === 0 ? (
            <Text style={[shared.label, { color: colors.warning }]}>لا توجد تصنيفات متاحة</Text>
          ) : (
            <View style={{ flexDirection: "row-reverse", flexWrap: "wrap", gap: 8 }}>
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
            </View>
          )}
        </View>

        {error ? <Text style={shared.error}>{error}</Text> : null}

        {/* Submit Button */}
        <Pressable
          style={[shared.button, busy && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="checkmark" size={20} color="#FFFFFF" />
              <Text style={shared.buttonText}>حفظ العملية</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
