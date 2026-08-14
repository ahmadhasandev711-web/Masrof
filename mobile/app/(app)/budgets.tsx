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
import { createBudget, fetchBudgets } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function BudgetsScreen() {
  const { workspaceId, currency } = useWorkspace();
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
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchBudgets(workspaceId);
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
      setError("أدخل اسم الميزانية (حرفين على الأقل)");
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setError("أدخل حداً مالياً صحيحاً أكبر من صفر");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createBudget({ workspaceId, name: name.trim(), amount: val });
      setOpen(false);
      setName("");
      setAmount("");
      await load();
    } catch {
      setError("تعذر إنشاء الميزانية");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen
      title="الميزانيات الشهرية"
      showBack
      actionLabel="+ ميزانية"
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
            <AppIcon name="pie-chart-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              لا توجد ميزانيات محددة لهذا الشهر
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
              <View style={shared.row}>
                <View style={shared.rowStart}>
                  <View style={[shared.iconCircle, { backgroundColor: badgeBg }]}>
                    <AppIcon name="pie-chart" size={18} color={badgeText} />
                  </View>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                </View>
                <View style={[shared.badge, { backgroundColor: badgeBg }]}>
                  <Text style={[shared.badgeText, { color: badgeText }]}>
                    {item.percentage}% مستهلك
                  </Text>
                </View>
              </View>

              <View style={[shared.row, { marginVertical: 4 }]}>
                <Text style={shared.label}>
                  تم صرف: {formatMoney(item.spent, currency)}
                </Text>
                <Text style={shared.label}>
                  الحد: {formatMoney(item.amount, currency)}
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

              <View style={[shared.row, { marginTop: 4 }]}>
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
                    ? `تجاوزت الميزانية بـ ${formatMoney(Math.abs(item.remaining), currency)}`
                    : `المتبقي: ${formatMoney(item.remaining, currency)}`}
                </Text>
              </View>
            </View>
          );
        }}
      />

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
            <View style={shared.row}>
              <Text style={shared.title}>ميزانية شهرية جديدة</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>اسم الميزانية / التصنيف</Text>
            <TextInput
              style={shared.input}
              placeholder="مثال: الطعام والشراب، التسوق، المواصلات..."
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={shared.label}>الحد الأقصى للصرف الشهري ({currency})</Text>
            <TextInput
              style={[shared.input, { fontSize: 20, fontWeight: "700", color: colors.primary }]}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colors.faint}
              value={amount}
              onChangeText={setAmount}
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
                  <Text style={shared.buttonText}>حفظ الميزانية</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
