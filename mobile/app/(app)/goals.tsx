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
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { createGoal, fetchGoals, updateGoalProgress } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function GoalsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [addOpen, setAddOpen] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchGoals(workspaceId, skipCache);
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
      await createGoal({ workspaceId, name: name.trim(), targetAmount: val });
      setOpen(false);
      setName("");
      setTarget("");
      await load(true);
    } catch {
      setError(isRTL ? "تعذر إنشاء الهدف" : "Failed to create goal");
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
    } catch {
      setError(isRTL ? "تعذر تحديث التقدم" : "Failed to update progress");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title={t.goals.title}
      showBack
      actionLabel={t.goals.add}
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
                    ? (isRTL ? "🎉 تم تحقيق الهدف بنجاح!" : "🎉 Goal completed!")
                    : `${t.goals.remaining}: ${formatMoney(item.remaining, currency)}`}
                </Text>

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
              </View>
            </View>
          );
        }}
      />

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

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "اسم الهدف" : "Goal Name"}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={t.goals.namePlaceholder}
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.goals.target} ({currency})
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={t.goals.targetPlaceholder}
              placeholderTextColor={colors.faint}
              value={target}
              onChangeText={setTarget}
              keyboardType="numeric"
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
                <Text style={shared.buttonText}>{t.common.save}</Text>
              )}
            </Pressable>
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

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.goals.depositAmount} ({currency})
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
              value={addAmount}
              onChangeText={setAddAmount}
              keyboardType="numeric"
              autoFocus
            />

            {error ? <Text style={shared.error}>{error}</Text> : null}

            <Pressable
              style={[shared.button, busy && { opacity: 0.7 }]}
              onPress={onAddProgress}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={shared.buttonText}>{t.goals.confirmDeposit}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
