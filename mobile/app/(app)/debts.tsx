import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { PlanGate } from "@/components/plan-gate";
import {
  fetchAccounts,
  fetchDebtPayments,
  fetchDebts,
  recordDebtPayment,
  type AccountItem,
  type DebtItem,
  type DebtPaymentItem,
  type DebtSummary,
} from "@/lib/api";
import { formatDate, formatMoney, parsePositiveAmount, todayISO } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { newIdempotencyKey } from "@/lib/idempotency";
import { useWriteAccess } from "@/lib/write-access";
import { AmountField, DateField, FormBanner, PrimaryButton } from "@/components/forms";

type FilterTab = "all" | "active" | "paid";

export default function DebtsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency, hasFeature } = useWorkspace();
  const { canWrite, headerAction } = useWriteAccess();
  const [items, setItems] = useState<DebtItem[]>([]);
  const [summary, setSummary] = useState<DebtSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>("active");

  // Payment Modal State
  const [payingDebt, setPayingDebt] = useState<DebtItem | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [paymentBusy, setPaymentBusy] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const paymentIdempotencyRef = useRef(newIdempotencyKey());

  // History Modal State
  const [historyDebt, setHistoryDebt] = useState<DebtItem | null>(null);
  const [historyPayments, setHistoryPayments] = useState<DebtPaymentItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(
    async (skipCache = false) => {
      if (!workspaceId) return;
      try {
        setError(null);
        const statusParam = filter === "all" ? undefined : filter;
        const res = await fetchDebts(workspaceId, statusParam, skipCache);
        setItems(res.items);
        setSummary(res.summary);
      } catch (err) {
        const is404 =
          err instanceof Error && "status" in err && (err as { status: number }).status === 404;
        if (is404) {
          setError(
            isRTL
              ? "خدمة الديون بانتظار اكتمال النشر على السيرفر السحابي. يرجى إعادة المحاولة بعد دقائق."
              : "Debts service is awaiting cloud deployment. Please retry in a few moments.",
          );
        } else {
          setError(
            resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر تحميل الديون والالتزامات." : "Failed to load debts."),
          );
        }
        setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [workspaceId, filter, isRTL],
  );

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

  async function openPaymentModal(debt: DebtItem) {
    setPayingDebt(debt);
    // Suggest remaining amount
    const remainingMajor = (debt.remainingAmount / 100).toFixed(2);
    setPaymentAmount(remainingMajor.endsWith(".00") ? remainingMajor.slice(0, -3) : remainingMajor);
    setPaymentDate(todayISO());
    setPaymentReference("");
    setPaymentNotes("");
    setPaymentError(null);

    if (workspaceId) {
      try {
        const accRes = await fetchAccounts(workspaceId);
        setAccounts(accRes.items);
        setPaymentAccountId(accRes.items[0]?.id ?? null);
      } catch {
        setAccounts([]);
      }
    }
  }

  async function handleRecordPayment() {
    if (!workspaceId || !payingDebt || !paymentAccountId) return;
    const amountVal = parsePositiveAmount(paymentAmount);
    if (amountVal == null || amountVal <= 0) {
      setPaymentError(isRTL ? "أدخل مبلغ سداد صحيح" : "Enter a valid positive amount");
      return;
    }

    const remainingMajor = payingDebt.remainingAmount / 100;
    if (amountVal > remainingMajor) {
      setPaymentError(t.debts.overpaymentError);
      return;
    }

    setPaymentBusy(true);
    setPaymentError(null);

    try {
      await recordDebtPayment({
        workspaceId,
        debtId: payingDebt.id,
        accountId: paymentAccountId,
        amount: amountVal,
        paymentDate,
        reference: paymentReference.trim() || undefined,
        notes: paymentNotes.trim() || undefined,
        idempotencyKey: paymentIdempotencyRef.current,
      });

      paymentIdempotencyRef.current = newIdempotencyKey();
      setPayingDebt(null);
      await load(true);
    } catch (err) {
      setPaymentError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL ? "تعذر تسجيل الدفعة. تحقق من الاتصال والحساب." : "Failed to record payment.",
        ),
      );
    } finally {
      setPaymentBusy(false);
    }
  }

  async function openHistoryModal(debt: DebtItem) {
    if (!workspaceId) return;
    setHistoryDebt(debt);
    setHistoryLoading(true);
    try {
      const res = await fetchDebtPayments(workspaceId, debt.id, true);
      setHistoryPayments(res.items);
    } catch {
      setHistoryPayments([]);
    } finally {
      setHistoryLoading(false);
    }
  }

  if (!hasFeature("debts")) {
    return (
      <Screen title={t.debts.title} showBack>
        <PlanGate
          title={isRTL ? "موديول الديون والالتزامات" : "Debts & Liabilities"}
          description={
            isRTL
              ? "متابعة جميع التزاماتك المالية، تواريخ الاستحقاق، وسداد الأقساط بدقة متاح لمشتركي باقة PRO."
              : "Track all your financial liabilities, due dates, and installments accurately. Available on the PRO plan."
          }
        />
      </Screen>
    );
  }

  return (
    <Screen
      title={t.debts.title}
      showBack
      {...headerAction(t.debts.add, "add", () => router.push("/debt-new"))}
    >
      {/* Summary Card */}
      <View style={shared.cardHighlighted}>
        <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={shared.label}>{t.debts.totalLiabilities}</Text>
          <View style={[shared.iconCircle, { backgroundColor: colors.expenseSoft }]}>
            <AppIcon name="card" size={20} color={colors.expense} />
          </View>
        </View>
        <Text
          style={[
            shared.value,
            {
              fontSize: 26,
              color: colors.expense,
              fontWeight: "800",
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          {formatMoney(summary?.totalLiabilities ?? 0, currency)}
        </Text>
        <View
          style={[
            shared.row,
            {
              marginTop: 4,
              borderTopWidth: 1,
              borderTopColor: colors.borderLight,
              paddingTop: 8,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
            <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.totalPaid}</Text>
            <Text style={[shared.value, { fontSize: 14, color: colors.income }]}>
              {formatMoney(summary?.totalPaid ?? 0, currency)}
            </Text>
          </View>
          <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
            <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.remaining}</Text>
            <Text style={[shared.value, { fontSize: 14, color: colors.warning }]}>
              {formatMoney(summary?.remainingLiabilities ?? 0, currency)}
            </Text>
          </View>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 8, marginVertical: 4 }}>
        {(
          [
            { key: "active", label: t.debts.active },
            { key: "all", label: t.common.all },
            { key: "paid", label: t.debts.paid },
          ] as const
        ).map((tab) => {
          const active = filter === tab.key;
          return (
            <Pressable
              key={tab.key}
              onPress={() => setFilter(tab.key)}
              style={[
                shared.chip,
                { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 8 },
                active && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
            >
              <Text
                style={[
                  shared.chipText,
                  { textAlign: "center" },
                  active && { color: "#FFFFFF", fontWeight: "700" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Debts List */}
      {loading && items.length === 0 ? (
        <ListSkeleton count={4} />
      ) : error && items.length === 0 ? (
        <ErrorView
          message={error}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
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
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
            />
          }
          contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={[shared.center, { paddingVertical: 40 }]}>
              <AppIcon name="checkmark" size={48} color={colors.primary} />
              <Text style={[shared.empty, { marginTop: 12 }]}>{t.debts.noDebts}</Text>
            </View>
          }
          renderItem={({ item }) => {
            const isFullyPaid = item.status === "paid" || item.remainingAmount === 0;
            return (
              <View style={shared.card}>
                {/* Header: Title and Creditor */}
                <View
                  style={[
                    shared.row,
                    { alignItems: "flex-start", flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                    <View
                      style={[
                        shared.rowStart,
                        { marginTop: 4, flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <AppIcon name="business" size={14} color={colors.faint} />
                      <Text style={[shared.label, { fontSize: 12 }]}>{item.creditor}</Text>
                      {item.category ? (
                        <Text style={[shared.label, { fontSize: 12 }]}>· {item.category}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View
                    style={[
                      shared.badge,
                      {
                        backgroundColor: isFullyPaid ? colors.incomeSoft : colors.warningSoft,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        shared.badgeText,
                        { color: isFullyPaid ? colors.incomeText : colors.warningText },
                      ]}
                    >
                      {isFullyPaid ? t.debts.paid : t.debts.active}
                    </Text>
                  </View>
                </View>

                {/* Amounts Breakdown */}
                <View
                  style={[
                    shared.row,
                    {
                      marginTop: 10,
                      backgroundColor: colors.cardAlt,
                      borderRadius: 12,
                      padding: 10,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.amount}</Text>
                    <Text style={[shared.value, { fontSize: 14 }]}>
                      {formatMoney(item.totalAmount, currency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.totalPaid}</Text>
                    <Text style={[shared.value, { fontSize: 14, color: colors.income }]}>
                      {formatMoney(item.paidAmount, currency)}
                    </Text>
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-start" : "flex-end" }}>
                    <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.remaining}</Text>
                    <Text
                      style={[
                        shared.value,
                        {
                          fontSize: 14,
                          color: isFullyPaid ? colors.income : colors.expense,
                        },
                      ]}
                    >
                      {formatMoney(item.remainingAmount, currency)}
                    </Text>
                  </View>
                </View>

                {/* Progress Bar */}
                <View style={{ marginTop: 10 }}>
                  <View
                    style={[
                      shared.row,
                      { marginBottom: 4, flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <Text style={[shared.label, { fontSize: 11 }]}>{t.debts.progress}</Text>
                    <Text style={[shared.label, { fontSize: 11, fontWeight: "700" }]}>
                      {item.progressPercent}%
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, item.progressPercent)}%`,
                          backgroundColor: isFullyPaid ? colors.income : colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Due Date Info */}
                <View
                  style={[
                    shared.row,
                    { marginTop: 8, flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <View
                    style={[
                      shared.rowStart,
                      { flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                  >
                    <AppIcon name="document-text" size={14} color={colors.faint} />
                    <Text style={[shared.label, { fontSize: 12 }]}>
                      {item.dueDate
                        ? `${t.debts.dueDate}: ${formatDate(item.dueDate)}`
                        : t.debts.noDueDate}
                    </Text>
                  </View>
                </View>

                {/* Actions Footer */}
                <View
                  style={[
                    shared.row,
                    {
                      marginTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.borderLight,
                      paddingTop: 10,
                      flexDirection: isRTL ? "row-reverse" : "row",
                    },
                  ]}
                >
                  <Pressable
                    style={[
                      shared.rowStart,
                      { paddingVertical: 4, flexDirection: isRTL ? "row-reverse" : "row" },
                    ]}
                    onPress={() => openHistoryModal(item)}
                  >
                    <AppIcon name="list" size={16} color={colors.primary} />
                    <Text style={[shared.label, { color: colors.primary, fontWeight: "700" }]}>
                      {t.debts.paymentHistory}
                    </Text>
                  </Pressable>

                  {canWrite && !isFullyPaid ? (
                    <Pressable
                      style={[
                        shared.button,
                        { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36, borderRadius: 10 },
                      ]}
                      onPress={() => openPaymentModal(item)}
                    >
                      <AppIcon name="wallet" size={16} color="#FFFFFF" />
                      <Text style={[shared.buttonText, { fontSize: 13 }]}>
                        {t.debts.recordPayment}
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Record Payment Modal */}
      <Modal
        visible={payingDebt !== null}
        animationType="slide"
        transparent
        onRequestClose={() => setPayingDebt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row", marginBottom: 12 }]}>
              <Text style={shared.title}>{t.debts.paymentTitle}</Text>
              <Pressable onPress={() => setPayingDebt(null)} hitSlop={8}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            {payingDebt ? (
              <Text style={[shared.subtitle, { textAlign: isRTL ? "right" : "left", marginBottom: 12 }]}>
                {payingDebt.name} · {t.debts.remaining}: {formatMoney(payingDebt.remainingAmount, currency)}
              </Text>
            ) : null}

            {paymentError ? <FormBanner message={paymentError} isRTL={isRTL} /> : null}

            <AmountField
              label={t.debts.paymentAmount}
              currency={currency}
              value={paymentAmount}
              onChangeText={setPaymentAmount}
              isRTL={isRTL}
            />

            <DateField
              label={isRTL ? "تاريخ السداد" : "Payment date"}
              value={paymentDate}
              onChange={setPaymentDate}
              isRTL={isRTL}
            />

            {/* Account Selector */}
            <View style={{ gap: 6, marginBottom: 12 }}>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {t.debts.selectAccount}
              </Text>
              <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
                {accounts.map((acc) => {
                  const selected = acc.id === paymentAccountId;
                  return (
                    <Pressable
                      key={acc.id}
                      onPress={() => setPaymentAccountId(acc.id)}
                      style={[
                        shared.chip,
                        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[shared.chipText, selected && { color: "#FFFFFF", fontWeight: "700" }]}>
                        {acc.name} ({formatMoney(acc.balance, currency)})
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Reference */}
            <View style={{ gap: 6, marginBottom: 14 }}>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {t.debts.reference}
              </Text>
              <TextInput
                style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
                value={paymentReference}
                onChangeText={setPaymentReference}
                placeholder="TRX-12345"
                placeholderTextColor={colors.faint}
              />
            </View>

            <PrimaryButton
              label={t.debts.recordPayment}
              onPress={handleRecordPayment}
              loading={paymentBusy}
              disabled={paymentBusy}
            />
          </View>
        </View>
      </Modal>

      {/* Payment History Modal */}
      <Modal
        visible={historyDebt !== null}
        animationType="fade"
        transparent
        onRequestClose={() => setHistoryDebt(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: "75%" }]}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row", marginBottom: 12 }]}>
              <Text style={shared.title}>{t.debts.paymentHistory}</Text>
              <Pressable onPress={() => setHistoryDebt(null)} hitSlop={8}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            {historyDebt ? (
              <Text style={[shared.subtitle, { textAlign: isRTL ? "right" : "left", marginBottom: 12 }]}>
                {historyDebt.name} · {historyDebt.creditor}
              </Text>
            ) : null}

            {historyLoading ? (
              <ActivityIndicator color={colors.primary} size="large" style={{ paddingVertical: 20 }} />
            ) : historyPayments.length === 0 ? (
              <Text style={[shared.empty, { paddingVertical: 20 }]}>{t.common.noData}</Text>
            ) : (
              <FlatList
                data={historyPayments}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
                renderItem={({ item }) => (
                  <View
                    style={{
                      backgroundColor: colors.cardAlt,
                      padding: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                    }}
                  >
                    <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                      <Text style={[shared.value, { color: colors.income, fontSize: 15 }]}>
                        {formatMoney(item.amount, currency)}
                      </Text>
                      <Text style={[shared.label, { fontSize: 12 }]}>
                        {formatDate(item.paymentDate)}
                      </Text>
                    </View>
                    <View
                      style={[
                        shared.row,
                        { marginTop: 4, flexDirection: isRTL ? "row-reverse" : "row" },
                      ]}
                    >
                      <Text style={[shared.label, { fontSize: 11 }]}>
                        {item.accountName}
                      </Text>
                      {item.reference ? (
                        <Text style={[shared.label, { fontSize: 11 }]}>
                          #{item.reference}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderLight,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 6,
  },
});
