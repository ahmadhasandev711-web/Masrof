import { useEffect, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { router } from "expo-router";
import { createInvoice, fetchClients } from "@/lib/api";
import { parsePositiveAmount, todayISO } from "@/lib/format";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { invoiceInputSchema } from "@/lib/validation";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export function useInvoiceForm() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();

  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [clientId, setClientId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [issueDate, setIssueDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  useEffect(() => {
    if (!workspaceId) return;

    let cancelled = false;

    void fetchClients(workspaceId).then((data) => {
      if (cancelled) return;
      setClients(data.items);
      setClientId((prev) => prev ?? (data.items.length > 0 ? data.items[0]._id : null));
    });

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  async function onSubmit() {
    if (!workspaceId) return;

    if (!clientId) {
      setError(isRTL ? "يرجى اختيار العميل أو إضافة عميل أولاً" : "Please select or add a client first");
      return;
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      setError(isRTL ? "يرجى إدخال وصف البند أو الخدمة" : "Please enter item or service description");
      return;
    }

    const numericAmount = parsePositiveAmount(amount);
    if (numericAmount == null) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount greater than zero");
      return;
    }

    const payload = {
      workspaceId,
      clientId,
      issueDate,
      dueDate: dueDate.trim() || undefined,
      notes: notes.trim() || undefined,
      items: [
        {
          description: trimmedDesc,
          amount: numericAmount,
          quantity: 1,
          unitPrice: numericAmount,
        },
      ],
      idempotencyKey: idempotencyRef.current,
    };

    const validation = invoiceInputSchema.safeParse(payload);
    if (!validation.success) {
      const issue = validation.error.issues[0];
      setError(issue?.message ?? (isRTL ? "البيانات المدخلة غير صحيحة" : "Invalid input data"));
      return;
    }

    setBusy(true);
    setError(null);

    try {
      await createInvoice(validation.data);
      idempotencyRef.current = newIdempotencyKey();
      router.back();
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر إنشاء الفاتورة. تأكد من صحة البيانات والاتصال."
            : "Failed to create invoice. Please check your connection.",
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
    clients,
    clientId,
    setClientId,
    description,
    setDescription,
    amount,
    setAmount,
    issueDate,
    setIssueDate,
    dueDate,
    setDueDate,
    notes,
    setNotes,
    busy,
    error,
    onSubmit,
  };
}
