import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { createCategory, fetchCategories, type CategoryItem } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function CategoriesScreen() {
  const { t, isRTL, locale } = useI18n();
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "expense" | "income">("all");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [kind, setKind] = useState<"expense" | "income">("expense");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      const data = await fetchCategories(workspaceId, undefined, skipCache, locale);
      setItems(data.items);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, locale]);

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
      setError(isRTL ? "أدخل اسم التصنيف (حرفين على الأقل)" : "Enter category name (min 2 chars)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const trimmedEn = nameEn.trim();
      await createCategory({
        workspaceId,
        name: name.trim(),
        ...(trimmedEn.length >= 2 ? { nameEn: trimmedEn } : {}),
        kind,
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setNameEn("");
      await load(true);
    } catch {
      setError(isRTL ? "تعذر إنشاء التصنيف" : "Failed to create category");
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
      title={isRTL ? "التصنيفات" : "Categories"}
      showBack
      actionLabel={isRTL ? "+ تصنيف" : "+ Category"}
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      {/* Filter Tabs */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginBottom: 8 }}>
        {[
          { key: "all", label: t.common.all },
          { key: "expense", label: t.transactions.expenseOnly },
          { key: "income", label: t.transactions.incomeOnly },
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
              <Text
                style={[
                  shared.chipText,
                  active && { color: "#FFFFFF", fontWeight: "700" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading && items.length === 0 ? (
        <ListSkeleton count={6} />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="pricetag" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {isRTL ? "لا توجد تصنيفات مضافة" : "No categories found"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isIncome = item.kind === "income";
          return (
            <View style={[shared.card, shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
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
                <Text style={[shared.value, { fontSize: 16 }]}>
                  {item.displayName || item.name}
                </Text>
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
                  {isIncome ? t.common.income : t.common.expense}
                </Text>
              </View>
            </View>
          );
        }}
      />
      )}

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
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[shared.value, { fontSize: 18 }]}>
                {isRTL ? "إضافة تصنيف جديد" : "New Category"}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "الاسم (عربي)" : "Name (Arabic)"}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              value={name}
              onChangeText={setName}
              placeholder={isRTL ? "مثال: مصروف مكتب" : "e.g. Office supplies"}
              placeholderTextColor={colors.faint}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "الاسم (إنجليزي، اختياري)" : "Name (English, optional)"}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              value={nameEn}
              onChangeText={setNameEn}
              placeholder={isRTL ? "e.g. Office supplies" : "e.g. Office supplies"}
              placeholderTextColor={colors.faint}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "النوع" : "Type"}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
              <Pressable
                onPress={() => setKind("expense")}
                style={[
                  shared.buttonSecondary,
                  { flex: 1, flexDirection: isRTL ? "row-reverse" : "row" },
                  kind === "expense" && {
                    backgroundColor: colors.expense,
                    borderColor: colors.expense,
                  },
                ]}
              >
                <Text
                  style={[
                    shared.buttonSecondaryText,
                    kind === "expense" && { color: "#FFFFFF", fontWeight: "700" },
                  ]}
                >
                  {t.common.expense}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setKind("income")}
                style={[
                  shared.buttonSecondary,
                  { flex: 1, flexDirection: isRTL ? "row-reverse" : "row" },
                  kind === "income" && {
                    backgroundColor: colors.income,
                    borderColor: colors.income,
                  },
                ]}
              >
                <Text
                  style={[
                    shared.buttonSecondaryText,
                    kind === "income" && { color: "#FFFFFF", fontWeight: "700" },
                  ]}
                >
                  {t.common.income}
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
                <Text style={shared.buttonText}>{t.common.save}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
