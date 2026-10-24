import { useEffect, useRef, useState } from "react";
import { router } from "expo-router";
import {
  createTransaction,
  fetchAccounts,
  fetchCategories,
  type AccountItem,
  type CategoryItem,
} from "@/lib/api";
import { parsePositiveAmount, todayISO } from "@/lib/format";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { newIdempotencyKey } from "@/lib/idempotency";
import { transactionInputSchema } from "@/lib/validation";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export function useTransactionForm() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();

  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayISO());
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    void Promise.all([
      fetchAccounts(workspaceId),
      fetchCategories(workspaceId, type),
    ]).then(([acc, cats]) => {
      if (cancelled) return;
      setAccounts(acc.items);
      setCategories(cats.items);
      setAccountId((prev) => prev ?? (acc.items.length > 0 ? acc.items[0].id : null));
      setCategoryId(cats.items.length > 0 ? cats.items[0].id : null);
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId, type]);

  async function onSubmit() {
    if (!workspaceId) return;

    const numericAmount = parsePositiveAmount(amount);
    if (numericAmount == null) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }

    if (!accountId) {
      setError(isRTL ? "يرجى اختيار الحساب" : "Please select an account");
      return;
    }

    if (!categoryId) {
      setError(isRTL ? "يرجى اختيار التصنيف" : "Please select a category");
      return;
    }

    const payload = {
      workspaceId,
      accountId,
      categoryId,
      type,
      amount: numericAmount,
      transactionDate: date,
      description: description.trim() || undefined,
      idempotencyKey: idempotencyRef.current,
    };

    const validation = transactionInputSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setError(issue?.message ?? (isRTL ? "البيانات المدخلة غير صحيحة" : "Invalid input data"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createTransaction(validation.data);
      idempotencyRef.current = newIdempotencyKey();
      router.back();
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر حفظ العملية. تأكد من صحة البيانات والاتصال."
            : "Failed to create transaction. Please check your connection.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return {
    t,
    isRTL,
    currency,
    type,
    setType,
    amount,
    setAmount,
    description,
    setDescription,
    date,
    setDate,
    accounts,
    categories,
    accountId,
    setAccountId,
    categoryId,
    setCategoryId,
    busy,
    error,
    onSubmit,
  };
}
