import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { FlatList, Modal, Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { PlanGate } from "@/components/plan-gate";
import { ListSkeleton } from "@/components/skeleton";
import { createGoal, fetchGoals, updateGoalProgress } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { useWriteAccess } from "@/lib/write-access";
import { AmountField, Field, FormBanner, PrimaryButton } from "@/components/forms";

export default function GoalsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency, hasFeature } = useWorkspace();
  const { headerAction, canWrite } = useWriteAccess();
  const [items, setItems] = useState<
    {
      id: string;
      name: string;
      targetAmount: number;
      currentAmount: number;
      remaining: number;
      percentage: number;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [addOpen, setAddOpen] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      const data = await fetchGoals(workspaceId, skipCache);
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
      setError(isRTL ? "أدخل اسم الهدف (حرفين على الأقل)" : "Enter goal name (min 2 chars)");
      return;
    }
    const val = Number(target);
    if (!Number.isFinite(val) || val <= 0) {
      setError(isRTL ? "أدخل مبلغاً مستهدفاً صحيحاً أكبر من صفر" : "Enter a valid target amount");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createGoal({
        workspaceId,
        name: name.trim(),
        targetAmount: val,
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setTarget("");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر إنشاء الهدف" : "Failed to create goal"));
    } finally {
      setBusy(false);
    }
  }

  async function onAddProgress() {
    if (!workspaceId || !addOpen) return;
    const val = Number(addAmount);
    if (!Number.isFinite(val) || val <= 0) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid deposit amount");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await updateGoalProgress({
        workspaceId,
        goalId: addOpen,
        amount: val,
      });
      setAddOpen(null);
      setAddAmount("");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر تحديث التقدم" : "Failed to update progress"));
    } finally {
      setBusy(false);
    }
  }

  if (!hasFeature("savingsGoals")) {
    return (
      <Screen title={t.goals.title} showBack>
        <PlanGate
          title={isRTL ? "أهداف الادخار والتوفير" : "Savings Goals"}
          description={
            isRTL
              ? "إنشاء أهداف التوفير والادخار، تتبع نسبة الإنجاز والوصول لهدفك متاح لمشتركي باقة PRO."
              : "Create savings goals, track milestones, and achieve your targets on the PRO plan."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t.goals.title}
      showBack
      {...headerAction(t.goals.add, "add", () => {
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
            <AppIcon name="flag" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {t.goals.noGoals}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isDone = item.percentage >= 100;
          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View
                    style={[
                      shared.iconCircle,
                      { backgroundColor: isDone ? colors.incomeSoft : colors.primarySoft },
                    ]}
                  >
                    <AppIcon
                      name={isDone ? "checkmark" : "flag"}
                      size={18}
                      color={isDone ? colors.income : colors.primary}
                    />
                  </View>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                </View>

                <View
                  style={[
                    shared.badge,
                    { backgroundColor: isDone ? colors.incomeSoft : colors.primarySoft },
                  ]}
                >
                  <Text
                    style={[
                      shared.badgeText,
                      { color: isDone ? colors.incomeText : colors.primary },
                    ]}
                  >
                    {item.percentage}%
                  </Text>
                </View>
              </View>

              <View style={[shared.row, { marginVertical: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={shared.label}>
                  {t.goals.saved}: {formatMoney(item.currentAmount, currency)}
                </Text>
                <Text style={shared.label}>
                  {t.goals.target}: {formatMoney(item.targetAmount, currency)}
                </Text>
              </View>

              {/* Progress Bar */}
              <View style={shared.progressBarBg}>
                <View
                  style={[
                    shared.progressBarFill,
                    {
                      width: `${Math.min(100, item.percentage)}%`,
                      backgroundColor: isDone ? colors.income : colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={[shared.row, { marginTop: 6, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <Text style={[shared.label, { fontSize: 12 }]}>
                  {isDone
                    ? (isRTL ? "تم تحقيق الهدف بنجاح" : "Goal completed")
                    : `${t.goals.remaining}: ${formatMoney(item.remaining, currency)}`}
                </Text>

                {canWrite ? (
                  <Pressable
                    style={[
                      shared.buttonSecondary,
                      { paddingVertical: 6, paddingHorizontal: 12, flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                    onPress={() => {
                      setError(null);
                      setAddOpen(item.id);
                    }}
                  >
                    <AppIcon name="add" size={14} color={colors.primary} />
                    <Text style={[shared.buttonSecondaryText, { fontSize: 12 }]}>{t.goals.deposit}</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          );
        }}
      />
      )}

      {/* Create Goal Modal */}
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
              <Text style={[shared.value, { fontSize: 18 }]}>{t.goals.newTitle}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Field
              label={isRTL ? "اسم الهدف" : "Goal Name"}
              placeholder={t.goals.namePlaceholder}
              value={name}
              onChangeText={setName}
              isRTL={isRTL}
            />

            <AmountField
              label={t.goals.target}
              currency={currency}
              value={target}
              onChangeText={setTarget}
              isRTL={isRTL}
            />

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton label={t.common.save} onPress={onCreate} loading={busy} disabled={busy} isRTL={isRTL} />
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Progress Deposit Modal */}
      <Modal visible={!!addOpen} animationType="slide" transparent onRequestClose={() => setAddOpen(null)}>
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}
          onPress={() => setAddOpen(null)}
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
              <Text style={[shared.value, { fontSize: 18 }]}>{t.goals.depositTitle}</Text>
              <Pressable onPress={() => setAddOpen(null)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <AmountField
              label={t.goals.depositAmount}
              currency={currency}
              value={addAmount}
              onChangeText={setAddAmount}
              isRTL={isRTL}
            />

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton
              label={t.goals.confirmDeposit}
              onPress={onAddProgress}
              loading={busy}
              disabled={busy}
              isRTL={isRTL}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
