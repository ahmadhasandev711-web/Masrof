import { useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AmountField, DateField, Field, FormBanner, PrimaryButton } from "@/components/forms";
import { createDebt } from "@/lib/api";
import { parsePositiveAmount } from "@/lib/format";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { debtInputSchema } from "@/lib/validation";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { useWriteAccess } from "@/lib/write-access";

export default function NewDebtScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const { canWrite, readOnlyMessage } = useWriteAccess();

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
    if (!workspaceId || !canWrite) return;

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
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر حفظ الدين أو الالتزام. تحقق من البيانات والاتصال."
            : "Failed to create debt. Please check your connection.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t.debts.newTitle} showBack>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Field
          label={t.debts.namePlaceholder}
          value={name}
          onChangeText={setName}
          isRTL={isRTL}
          placeholder={t.debts.namePlaceholder}
        />

        <Field
          label={t.debts.creditorPlaceholder}
          value={creditor}
          onChangeText={setCreditor}
          isRTL={isRTL}
          placeholder={t.debts.creditorPlaceholder}
        />

        <AmountField
          label={t.debts.amount}
          currency={currency}
          value={amount}
          onChangeText={setAmount}
          isRTL={isRTL}
        />

        <DateField
          label={t.debts.dueDate}
          value={dueDate}
          onChange={setDueDate}
          isRTL={isRTL}
          optional
          emptyLabel={isRTL ? "بدون تاريخ استحقاق" : "No due date"}
        />

        <Field
          label={t.debts.category}
          value={category}
          onChangeText={setCategory}
          isRTL={isRTL}
          placeholder={isRTL ? "مثال: بنكي / موردين" : "e.g. Bank / Supplier"}
        />

        <Field
          label={t.debts.notes}
          value={notes}
          onChangeText={setNotes}
          isRTL={isRTL}
          multiline
          style={{ minHeight: 70, textAlignVertical: "top" }}
        />

        {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

        {canWrite ? (
          <PrimaryButton label={t.common.save} loading={busy} isRTL={isRTL} onPress={onSubmit} disabled={busy} />
        ) : (
          <FormBanner tone="info" message={readOnlyMessage} isRTL={isRTL} />
        )}
      </ScrollView>
    </Screen>
  );
}
