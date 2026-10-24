import { useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { createDebt } from "@/lib/api";
import { parsePositiveAmount } from "@/lib/format";
import { debtInputSchema } from "@/lib/validation";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function NewDebtScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();

  const [name, setName] = useState("");
  const [creditor, setCreditor] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  async function onSubmit() {
    if (!workspaceId) return;

    const numAmount = parsePositiveAmount(amount);
    if (numAmount == null || numAmount <= 0) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }

    const payload = {
      workspaceId,
      name: name.trim(),
      creditor: creditor.trim(),
      amount: numAmount,
      dueDate: dueDate.trim() || undefined,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
      idempotencyKey: idempotencyRef.current,
    };

    const parsed = debtInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setError(issue?.message ?? (isRTL ? "البيانات المدخلة غير صحيحة" : "Invalid input data"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createDebt(parsed.data);
      idempotencyRef.current = newIdempotencyKey();
      router.back();
    } catch {
      setError(
        isRTL
          ? "تعذر حفظ الدين أو الالتزام. تحقق من البيانات والاتصال."
          : "Failed to create debt. Please check your connection.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t.debts.newTitle} showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Name Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.namePlaceholder}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            value={name}
            onChangeText={setName}
            placeholder={t.debts.namePlaceholder}
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Creditor Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.creditorPlaceholder}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            value={creditor}
            onChangeText={setCreditor}
            placeholder={t.debts.creditorPlaceholder}
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Amount Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.amount} ({currency})
          </Text>
          <TextInput
            style={[shared.input, { fontSize: 20, fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            placeholder="0.00"
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Due Date Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.dueDate} (YYYY-MM-DD - {isRTL ? "اختياري" : "optional"})
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="2026-12-31"
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Category Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.category}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            value={category}
            onChangeText={setCategory}
            placeholder={isRTL ? "مثال: بنكي / تمويل / موردين" : "e.g. Bank / Supplier"}
            placeholderTextColor={colors.faint}
          />
        </View>

        {/* Notes Input */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.debts.notes}
          </Text>
          <TextInput
            style={[
              shared.input,
              { height: 80, textAlignVertical: "top", textAlign: isRTL ? "right" : "left" },
            ]}
            multiline
            numberOfLines={3}
            value={notes}
            onChangeText={setNotes}
            placeholder={isRTL ? "أي ملاحظات إضافية أو شروط سداد" : "Additional repayment notes"}
            placeholderTextColor={colors.faint}
          />
        </View>

        {error ? <Text style={shared.error}>{error}</Text> : null}

        {/* Submit Button */}
        <Pressable
          style={[shared.button, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <AppIcon name="checkmark" size={18} color="#FFFFFF" />
              <Text style={shared.buttonText}>{t.debts.add}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
