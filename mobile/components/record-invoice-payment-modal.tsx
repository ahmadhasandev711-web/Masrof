import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { fetchAccounts, recordInvoicePayment, type AccountItem } from "@/lib/api";
import { newIdempotencyKey } from "@/lib/idempotency";
import { parsePositiveAmount, todayISO } from "@/lib/format";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { AmountField, DateField, FormBanner, PrimaryButton } from "@/components/forms";
import { colors, fonts, shared } from "@/lib/styles";

type InvoiceForPayment = {
  _id: string;
  invoiceNumber: string;
  remainingAmount?: number;
  total: number;
  paidAmount?: number;
};

type Props = {
  visible: boolean;
  workspaceId: string | null;
  currency: string;
  invoice: InvoiceForPayment | null;
  isRTL: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function RecordInvoicePaymentModal({
  visible,
  workspaceId,
  currency,
  invoice,
  isRTL,
  onClose,
  onSuccess,
}: Props) {
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const remainingMinor =
    invoice?.remainingAmount ??
    Math.max(0, (invoice?.total ?? 0) - (invoice?.paidAmount ?? 0));

  useEffect(() => {
    if (!visible || !workspaceId) return;
    setError(null);
    setPaymentDate(todayISO());
    idempotencyRef.current = newIdempotencyKey();
    void fetchAccounts(workspaceId).then((res) => {
      setAccounts(res.items);
      setAccountId(res.items[0]?.id ?? null);
    });
    if (remainingMinor > 0) {
      setAmount(String(remainingMinor / 100));
    } else {
      setAmount("");
    }
  }, [visible, workspaceId, remainingMinor]);

  async function onSubmit() {
    if (!workspaceId || !invoice) return;
    const numericAmount = parsePositiveAmount(amount);
    if (numericAmount == null) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
      return;
    }
    if (!accountId) {
      setError(isRTL ? "اختر الحساب" : "Select an account");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await recordInvoicePayment({
        workspaceId,
        invoiceId: invoice._id,
        accountId,
        amount: numericAmount,
        paymentDate,
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      onSuccess();
      onClose();
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL));
    } finally {
      setBusy(false);
    }
  }

  const title = isRTL ? "تسجيل دفعة" : "Record payment";

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View
          style={{
            maxHeight: "88%",
            backgroundColor: colors.bg,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            gap: 12,
          }}
        >
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", justifyContent: "space-between", alignItems: "center" }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: colors.text }}>{title}</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <Text style={{ fontFamily: fonts.medium, color: colors.muted }}>{isRTL ? "إغلاق" : "Close"}</Text>
            </Pressable>
          </View>

          {invoice ? (
            <Text style={{ fontFamily: fonts.medium, color: colors.muted, textAlign: isRTL ? "right" : "left" }}>
              {invoice.invoiceNumber}
            </Text>
          ) : null}

          <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            <AmountField
              label={isRTL ? "المبلغ" : "Amount"}
              currency={currency}
              value={amount}
              onChangeText={setAmount}
              isRTL={isRTL}
            />

            <DateField
              label={isRTL ? "تاريخ الدفعة" : "Payment date"}
              value={paymentDate}
              onChange={setPaymentDate}
              isRTL={isRTL}
            />

            <View style={{ gap: 8 }}>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                {isRTL ? "حساب الإيداع" : "Deposit account"}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}>
                {accounts.map((account) => {
                  const active = accountId === account.id;
                  return (
                    <Pressable
                      key={account.id}
                      onPress={() => setAccountId(account.id)}
                      style={[
                        shared.chip,
                        active && { backgroundColor: colors.primary, borderColor: colors.primary },
                      ]}
                    >
                      <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>{account.name}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton
              label={isRTL ? "تسجيل الدفعة" : "Save payment"}
              loading={busy}
              isRTL={isRTL}
              onPress={() => void onSubmit()}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
