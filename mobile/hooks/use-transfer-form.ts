import { useEffect, useRef, useState } from "react";
import { createTransfer, fetchAccounts, type AccountItem } from "@/lib/api";
import { parsePositiveAmount, todayISO } from "@/lib/format";
import { transferInputSchema } from "@/lib/validation";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

function createIdempotencyKey(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function useTransferForm({ onSuccess }: { onSuccess?: () => Promise<void> | void }) {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();

  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [fromAccountId, setFromAccountId] = useState<string | null>(null);
  const [toAccountId, setToAccountId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayISO());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(createIdempotencyKey());

  useEffect(() => {
    if (!workspaceId || !open) return;

    let cancelled = false;

    void fetchAccounts(workspaceId).then((data) => {
      if (cancelled) return;
      setAccounts(data.items);
      if (data.items.length > 0) {
        setFromAccountId(data.items[0].id);
        setToAccountId(data.items.length > 1 ? data.items[1].id : data.items[0].id);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, open]);

  function resetForm() {
    setAmount("");
    setDate(todayISO());
    setError(null);
  }

  async function onSubmit() {
    if (!workspaceId) return;

    if (!fromAccountId || !toAccountId) {
      setError(isRTL ? "يرجى اختيار حسابي التحويل" : "Please select source and destination accounts");
      return;
    }

    if (fromAccountId === toAccountId) {
      setError(isRTL ? "لا يمكن التحويل لنفس الحساب" : "Source and destination cannot be the same");
      return;
    }

    const numericAmount = parsePositiveAmount(amount);
    if (numericAmount == null) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }

    const payload = {
      workspaceId,
      fromAccountId,
      toAccountId,
      amount: numericAmount,
      transferDate: date,
      idempotencyKey: idempotencyRef.current,
    };

    const validation = transferInputSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setError(issue?.message ?? (isRTL ? "البيانات المدخلة غير صحيحة" : "Invalid input data"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createTransfer(validation.data);
      idempotencyRef.current = createIdempotencyKey();
      setOpen(false);
      resetForm();
      if (onSuccess) {
        await onSuccess();
      }
    } catch {
      setError(
        isRTL
          ? "تعذر تنفيذ التحويل. تأكد من صحة البيانات والاتصال."
          : "Failed to process transfer. Please check connection.",
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    t,
    isRTL,
    currency,
    open,
    setOpen,
    accounts,
    fromAccountId,
    setFromAccountId,
    toAccountId,
    setToAccountId,
    amount,
    setAmount,
    date,
    setDate,
    busy,
    error,
    onSubmit,
  };
}
