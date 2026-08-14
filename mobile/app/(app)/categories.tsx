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
import { createCategory, fetchCategories, type CategoryItem } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function CategoriesScreen() {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchCategories(workspaceId);
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
      setError("أدخل اسم التصنيف (حرفين على الأقل)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createCategory({ workspaceId, name: name.trim(), kind });
      setOpen(false);
      setName("");
      await load();
    } catch {
      setError("تعذر إنشاء التصنيف");
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === "all") return true;
    return item.kind === filter;
  });

  return (
    <Screen
      title="التصنيفات"
      showBack
      actionLabel="+ تصنيف"
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      {/* Filter Tabs */}
      <View style={{ flexDirection: "row-reverse", gap: 8, marginBottom: 8 }}>
        {[
          { key: "all", label: "الكل" },
          { key: "expense", label: "المصروفات" },
          { key: "income", label: "الإيرادات" },
        ].map((tab) => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key as typeof filter)}
              style={[
                shared.chip,
                { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="pricetag" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>لا توجد تصنيفات مضافة</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isIncome = item.kind === "income";
          return (
            <View style={[shared.card, shared.row]}>
              <View style={shared.rowStart}>
                <View
                  style={[
                    shared.iconCircle,
                    { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft },
                  ]}
                >
                  <AppIcon
                    name={isIncome ? "trending-up" : "trending-down"}
                    size={18}
                    color={isIncome ? colors.income : colors.expense}
                  />
                </View>
                <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
              </View>

              <View
                style={[
                  shared.badge,
                  { backgroundColor: isIncome ? colors.incomeSoft : colors.expenseSoft },
                ]}
              >
                <Text
                  style={[
                    shared.badgeText,
                    { color: isIncome ? colors.incomeText : colors.expenseText },
                  ]}
                >
                  {isIncome ? "دخل" : "مصروف"}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Add Category Modal */}
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
              <Text style={shared.title}>إضافة تصنيف جديد</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>اسم التصنيف</Text>
            <TextInput
              style={shared.input}
              value={name}
              onChangeText={setName}
              placeholder="مثال: مطاعم، مواصلات، استشارات..."
              placeholderTextColor={colors.faint}
            />

            <Text style={shared.label}>النوع</Text>
            <View style={shared.row}>
              <Pressable
                onPress={() => setKind("expense")}
                style={[
                  shared.buttonSecondary,
                  { flex: 1 },
                  kind === "expense" && {
                    backgroundColor: colors.expense,
                    borderColor: colors.expense,
                  },
                ]}
              >
                <Text
                  style={[
                    shared.buttonSecondaryText,
                    kind === "expense" && { color: "#FFFFFF" },
                  ]}
                >
                  مصروف
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setKind("income")}
                style={[
                  shared.buttonSecondary,
                  { flex: 1 },
                  kind === "income" && {
                    backgroundColor: colors.income,
                    borderColor: colors.income,
                  },
                ]}
              >
                <Text
                  style={[
                    shared.buttonSecondaryText,
                    kind === "income" && { color: "#FFFFFF" },
                  ]}
                >
                  دخل
                </Text>
              </Pressable>
            </View>

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
                  <Text style={shared.buttonText}>حفظ التصنيف</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
