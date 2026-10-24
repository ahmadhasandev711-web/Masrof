import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { colors, shared } from "@/lib/styles";
import { useTransactionForm } from "@/hooks/use-transaction-form";

export default function NewTransactionScreen() {
  const {
    t,
    isRTL,
    currency,
    type,
    setType,
    amount,
    setAmount,
    description,
    setDescription,
    date,
    setDate,
    accounts,
    categories,
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    busy,
    error,
    onSubmit,
  } = useTransactionForm();

  return (
    <Screen title={t.dashboard.newTransaction} showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Type Selector (Expense vs Income) */}
        <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
          <Pressable
            onPress={() => setType("expense")}
            style={[
              shared.buttonSecondary,
              { flex: 1, paddingVertical: 12, flexDirection: isRTL ? "row-reverse" : "row" },
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
              {t.common.expense}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setType("income")}
            style={[
              shared.buttonSecondary,
              { flex: 1, paddingVertical: 12, flexDirection: isRTL ? "row-reverse" : "row" },
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
              {t.common.income}
            </Text>
          </Pressable>
        </View>

        {/* Amount Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.common.amount} ({currency})
          </Text>
          <TextInput
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            style={[
              shared.input,
              {
                fontSize: 22,
                fontWeight: "700",
                color: type === "expense" ? colors.expense : colors.income,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            placeholder="0.00"
            placeholderTextColor={colors.faint}
            autoFocus
          />
        </View>

        {/* Description Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {isRTL ? "الوصف أو البيان (اختياري)" : "Description (optional)"}
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "مثال: مشتريات سوبرماركت، فاتورة إنترنت..." : "e.g. Groceries, Internet bill..."}
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Date Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.common.date} (YYYY-MM-DD)
          </Text>
          <TextInput
            value={date}
            onChangeText={setDate}
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder="2026-08-14"
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Account Selector */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {isRTL ? "الحساب المسحوب منه / المودع فيه" : "Account"}
          </Text>
          {accounts.length === 0 ? (
            <Text style={[shared.label, { color: colors.warning }]}>{t.accounts.noAccounts}</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
            >
              {accounts.map((account) => {
                const active = accountId === account.id;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setAccountId(account.id)}
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
          )}
        </View>

        {/* Category Selector */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {isRTL ? "التصنيف" : "Category"}
          </Text>
          {categories.length === 0 ? (
            <Text style={[shared.label, { color: colors.warning }]}>
              {isRTL ? "لا توجد تصنيفات متاحة" : "No categories available"}
            </Text>
          ) : (
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
              {categories.map((category) => {
                const active = categoryId === category.id;
                return (
                  <Pressable
                    key={category.id}
                    onPress={() => setCategoryId(category.id)}
                    style={[
                      shared.chip,
                      { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <AppIcon
                      name="pricetag"
                      size={13}
                      color={active ? "#FFFFFF" : colors.primary}
                    />
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {category.name}
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
          style={[shared.button, busy && { opacity: 0.7 }, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="checkmark" size={20} color="#FFFFFF" />
              <Text style={shared.buttonText}>{t.common.save}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
