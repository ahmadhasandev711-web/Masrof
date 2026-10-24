import { useCallback, useEffect, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { FlatList, Modal, Platform, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { PlanGate } from "@/components/plan-gate";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
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
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { useWriteAccess } from "@/lib/write-access";
import { AmountField, DateField, Field, FormBanner, PrimaryButton } from "@/components/forms";

export default function RecurringScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency, hasFeature } = useWorkspace();
  const { headerAction, canWrite } = useWriteAccess();
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
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
  const idempotencyRef = useRef(newIdempotencyKey());

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const data = await fetchRecurring(workspaceId, skipCache);
      setItems(
        data.items.map((item) => ({
          id: String(item.id ?? item._id),
          amount: Number(item.amount),
          description: String(item.description || (isRTL ? "مصروف متكرر" : "Recurring")),
          nextDueDate: String(item.nextDueDate),
          accountName: item.accountName ? String(item.accountName) : undefined,
          categoryName: item.categoryName ? String(item.categoryName) : undefined,
        })),
      );
    } catch (err) {
      setLoadError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر تحميل المصروفات المتكررة. يرجى التحقق من الاتصال بالإنترنت."
            : "Failed to load recurring expenses. Please check your network connection.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
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

  useEffect(() => {
    if (!workspaceId || !open) return;
    void Promise.all([fetchAccounts(workspaceId), fetchCategories(workspaceId, "expense")]).then(
      ([acc, cats]) => {
        setAccounts(acc.items);
        setCategories(cats.items);
        if (acc.items.length > 0) setAccountId((prev) => prev ?? acc.items[0].id);
        if (cats.items.length > 0) setCategoryId((prev) => prev ?? cats.items[0].id);
      },
    );
  }, [workspaceId, open]);

  async function onCreate() {
    if (!workspaceId) return;
    if (!description.trim()) {
      setError(isRTL ? "يرجى إدخال وصف المصروف المتكرر" : "Enter recurring expense description");
      return;
    }
    const val = Number(amount);
    if (!Number.isFinite(val) || val <= 0) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount");
      return;
    }
    if (!accountId || !categoryId) {
      setError(isRTL ? "يرجى اختيار الحساب والتصنيف" : "Please select account and category");
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
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setDescription("");
      setAmount("");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر حفظ المصروف المتكرر" : "Failed to create recurring expense"));
    } finally {
      setBusy(false);
    }
  }

  async function onRecord(recurringId: string) {
    if (!workspaceId) return;
    setRecordingId(recurringId);
    setError(null);
    try {
      await recordRecurring({ workspaceId, recurringId });
      await load(true);
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL ? "تعذر تسجيل المصروف المتكرر" : "Failed to record recurring expense",
        ),
      );
    } finally {
      setRecordingId(null);
    }
  }

  if (!hasFeature("recurringExpenses")) {
    return (
      <Screen title={t.recurring.title} showBack>
        <PlanGate
          title={isRTL ? "المصاريف المتكررة والاشتراكات" : "Recurring Expenses"}
          description={
            isRTL
              ? "متابعة الاشتراكات الدورية، الفواتير الشهرية، وتسجيلها تلقائياً متاح لمشتركي باقة PRO."
              : "Track recurring subscriptions, monthly bills, and auto-logging on the PRO plan."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t.recurring.title}
      showBack
      {...headerAction(t.recurring.add, "add", () => {
        setError(null);
        setOpen(true);
      })}
    >
      {loading && items.length === 0 ? (
        <ListSkeleton count={4} />
      ) : loadError && items.length === 0 ? (
        <ErrorView
          message={loadError}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
      ) : (
        <>
        {error && !open ? <Text style={[shared.error, { marginBottom: 8 }]}>{error}</Text> : null}
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
              <AppIcon name="repeat" size={44} color={colors.faint} />
              <Text style={[shared.empty, { paddingVertical: 12 }]}>
                {t.recurring.noRecurring}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[shared.iconCircle, { backgroundColor: colors.infoSoft }]}>
                    <AppIcon name="repeat" size={18} color={colors.info} />
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.description}</Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>
                      {t.recurring.nextDue}: {formatDate(item.nextDueDate)}
                    </Text>
                  </View>
                </View>

                <Text style={[shared.value, { fontSize: 16, color: colors.expense, fontWeight: "800" }]}>
                  {formatMoney(item.amount, currency)}
                </Text>
              </View>

              {item.accountName || item.categoryName ? (
                <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 6, marginVertical: 2 }}>
                  {item.categoryName && (
                    <View style={[shared.badge, { backgroundColor: "#F3F4F6", flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }]}>
                      <AppIcon name="pricetag" size={11} color={colors.faint} />
                      <Text style={[shared.badgeText, { color: colors.muted }]}>
                        {item.categoryName}
                      </Text>
                    </View>
                  )}
                  {item.accountName && (
                    <View style={[shared.badge, { backgroundColor: "#F3F4F6", flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 4 }]}>
                      <AppIcon name="card-outline" size={11} color={colors.faint} />
                      <Text style={[shared.badgeText, { color: colors.muted }]}>
                        {item.accountName}
                      </Text>
                    </View>
                  )}
                </View>
              ) : null}

              {canWrite ? (
                <Pressable
                  style={[
                    shared.buttonSecondary,
                    { marginTop: 4, flexDirection: isRTL ? "row-reverse" : "row" },
                    recordingId === item.id && { opacity: 0.6 },
                  ]}
                  onPress={() => onRecord(item.id)}
                  disabled={recordingId === item.id}
                >
                  <AppIcon name="checkmark" size={15} color={colors.primary} />
                  <Text style={shared.buttonSecondaryText}>
                    {recordingId === item.id ? t.common.loading : t.recurring.recordNow}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        />
        </>
      )}

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
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[shared.value, { fontSize: 18 }]}>{t.recurring.newTitle}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Field
              label={isRTL ? "الوصف" : "Description"}
              placeholder={
                isRTL ? "مثال: اشتراك نتفليكس، إيجار المكتب" : "e.g. Netflix subscription, Office rent"
              }
              value={description}
              onChangeText={setDescription}
              isRTL={isRTL}
            />

            <AmountField
              label={t.common.amount}
              currency={currency}
              value={amount}
              onChangeText={setAmount}
              isRTL={isRTL}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.recurring.frequency}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8 }}>
              {[
                { value: "monthly", label: t.recurring.monthly },
                { value: "weekly", label: t.recurring.weekly },
                { value: "yearly", label: t.recurring.yearly },
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
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {f.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DateField
              label={t.recurring.nextDue}
              value={nextDueDate}
              onChange={setNextDueDate}
              isRTL={isRTL}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "الحساب المسحوب منه" : "Source Account"}
            </Text>
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
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      {account.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "التصنيف" : "Category"}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
            >
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
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      {category.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton label={t.common.save} onPress={onCreate} loading={busy} disabled={busy} isRTL={isRTL} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
