import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { FlatList, Modal, Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { PlanGate } from "@/components/plan-gate";
import { ListSkeleton } from "@/components/skeleton";
import { createBudget, fetchBudgets } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { useWriteAccess } from "@/lib/write-access";
import { AmountField, Field, FormBanner, PrimaryButton } from "@/components/forms";

export default function BudgetsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency, hasFeature } = useWorkspace();
  const { headerAction } = useWriteAccess();
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      amount: number;
      spent: number;
      remaining: number;
      percentage: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      const data = await fetchBudgets(workspaceId, skipCache);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load(true).catch(() => setItems([]));
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

  async function onCreate() {
    if (!workspaceId || name.trim().length < 2) {
      setError(isRTL ? "أدخل اسم الميزانية (حرفين على الأقل)" : "Enter budget name (min 2 chars)");
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setError(isRTL ? "أدخل حداً مالياً صحيحاً أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createBudget({
        workspaceId,
        name: name.trim(),
        amount: val,
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setAmount("");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر إنشاء الميزانية" : "Failed to create budget"));
    } finally {
      setBusy(false);
    }
  }

  if (!hasFeature("budgets")) {
    return (
      <Screen title={t.budgets.title} showBack>
        <PlanGate
          title={isRTL ? "الميزانيات الشهرية" : "Monthly Budgets"}
          description={
            isRTL
              ? "وضع حدود صرف شهرية وتنبيهات ذكية عند الاقتراب من سقف الميزانية متاح لمشتركي باقة PRO."
              : "Set monthly spending limits and receive smart alerts when approaching budget thresholds on PRO."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t.budgets.title}
      showBack
      {...headerAction(t.budgets.add, "add", () => {
        setError(null);
        setOpen(true);
      })}
    >
      {loading && items.length === 0 ? (
        <ListSkeleton count={4} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="pie-chart-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {t.budgets.noBudgets}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOver = item.percentage >= 100;
          const isNear = item.percentage >= 80 && !isOver;
          const barColor = isOver ? colors.expense : isNear ? colors.warning : colors.primary;
          const badgeBg = isOver
            ? colors.expenseSoft
            : isNear
            ? colors.warningSoft
            : colors.primarySoft;
          const badgeText = isOver
            ? colors.expenseText
            : isNear
            ? colors.warningText
            : colors.primary;

          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[shared.iconCircle, { backgroundColor: badgeBg }]}>
                    <AppIcon name="pie-chart" size={18} color={badgeText} />
                  </View>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                </View>
                <View style={[shared.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[shared.badgeText, { color: badgeText }]}>
                    {item.percentage}% {isRTL ? "مستهلك" : "spent"}
                  </Text>
                </View>
              </View>

              <View style={[shared.row, { marginVertical: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={shared.label}>
                  {t.budgets.spent}: {formatMoney(item.spent, currency)}
                </Text>
                <Text style={shared.label}>
                  {t.budgets.limit}: {formatMoney(item.amount, currency)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={shared.progressBarBg}>
                <View
                  style={[
                    shared.progressBarFill,
                    {
                      width: `${Math.min(100, item.percentage)}%`,
                      backgroundColor: barColor,
                    },
                  ]}
                />
              </View>

              <View style={[shared.row, { marginTop: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text
                  style={[
                    shared.label,
                    {
                      fontSize: 12,
                      color: isOver ? colors.expenseText : colors.faint,
                      fontWeight: isOver ? "700" : "500",
                    },
                  ]}
                >
                  {isOver
                    ? `${t.budgets.overBudget} (+${formatMoney(Math.abs(item.remaining), currency)})`
                    : `${t.budgets.remaining}: ${formatMoney(item.remaining, currency)}`}
                </Text>
              </View>
            </View>
          );
        }}
      />
      )}

      {/* Add Budget Modal */}
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
              <Text style={[shared.value, { fontSize: 18 }]}>{t.budgets.newTitle}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Field
              label={isRTL ? "اسم الميزانية" : "Budget Name"}
              placeholder={t.budgets.namePlaceholder}
              value={name}
              onChangeText={setName}
              isRTL={isRTL}
            />

            <AmountField
              label={t.budgets.limit}
              currency={currency}
              value={amount}
              onChangeText={setAmount}
              isRTL={isRTL}
            />

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton label={t.common.save} onPress={onCreate} loading={busy} disabled={busy} isRTL={isRTL} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
