import { Pressable, ScrollView, Text, View } from "react-native";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { AmountField, DateField, Field, FormBanner, PrimaryButton } from "@/components/forms";
import { colors, shared } from "@/lib/styles";
import { useTransactionForm } from "@/hooks/use-transaction-form";
import { useWorkspace } from "@/lib/workspace";

export default function NewTransactionScreen() {
  const { canWrite } = useWorkspace();
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
        <AmountField
          label={t.common.amount}
          currency={currency}
          value={amount}
          onChangeText={setAmount}
          isRTL={isRTL}
          accentColor={type === "expense" ? colors.expense : colors.income}
        />

        <Field
          label={isRTL ? "الوصف أو البيان (اختياري)" : "Description (optional)"}
          value={description}
          onChangeText={setDescription}
          isRTL={isRTL}
          placeholder={isRTL ? "مثال: مشتريات سوبرماركت..." : "e.g. Groceries, Internet bill..."}
        />

        <DateField
          label={t.common.date}
          value={date}
          onChange={setDate}
          isRTL={isRTL}
        />

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

        {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

        {canWrite ? (
          <PrimaryButton label={t.common.save} loading={busy} isRTL={isRTL} onPress={onSubmit} disabled={busy} />
        ) : (
          <FormBanner
            tone="info"
            isRTL={isRTL}
            message={isRTL ? "صلاحيتك للعرض فقط في هذه المساحة." : "You have view-only access in this workspace."}
          />
        )}
      </ScrollView>
    </Screen>
  );
}
