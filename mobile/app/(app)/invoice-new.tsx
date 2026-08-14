import { useEffect, useState } from "react";
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
import { createInvoice, fetchClients } from "@/lib/api";
import { todayISO } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

export default function NewInvoiceScreen() {
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

  useEffect(() => {
    if (!workspaceId) return;
    void fetchClients(workspaceId).then((data) => {
      setClients(data.items);
      if (data.items.length > 0 && !clientId) {
        setClientId(data.items[0]._id);
      }
    });
  }, [workspaceId]);

  async function onSubmit() {
    if (!workspaceId) return;
    if (!clientId) {
      setError("يرجى اختيار العميل أو إضافة عميل أولاً");
      return;
    }
    const value = Number(amount);
    if (!description.trim()) {
      setError("يرجى إدخال وصف البند أو الخدمة");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError("أدخل مبلغاً صحيحاً أكبر من صفر");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createInvoice({
        workspaceId,
        clientId,
        issueDate,
        dueDate: dueDate.trim() || undefined,
        notes: notes.trim() || undefined,
        items: [{ description: description.trim(), amount: value, quantity: 1, unitPrice: value }],
      });
      router.back();
    } catch {
      setError("تعذر إنشاء الفاتورة. تأكد من صحة البيانات والاتصال.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title="فاتورة جديدة" showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Selection */}
        <View style={{ gap: 8 }}>
          <View style={shared.row}>
            <Text style={shared.label}>العميل</Text>
            {clients.length === 0 ? (
              <Pressable onPress={() => router.push("/(app)/clients")}>
                <Text style={[shared.label, { color: colors.primary, fontWeight: "700" }]}>
                  + إضافة عميل
                </Text>
              </Pressable>
            ) : null}
          </View>

          {clients.length === 0 ? (
            <View style={[shared.card, { alignItems: "center", paddingVertical: 12 }]}>
              <Text style={shared.label}>لا يوجد عملاء مضافين. أضف عميلاً أولاً.</Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {clients.map((client) => {
                const active = clientId === client._id;
                return (
                  <Pressable
                    key={client._id}
                    onPress={() => setClientId(client._id)}
                    style={[
                      shared.chip,
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                      👤 {client.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Item Description */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>وصف الخدمة أو المنتج</Text>
          <TextInput
            style={shared.input}
            placeholder="مثال: تصميم هوية بصرية، استشارة برمجية..."
            placeholderTextColor={colors.faint}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Amount */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>المبلغ الإجمالي ({currency})</Text>
          <TextInput
            style={[shared.input, { fontSize: 20, fontWeight: "700", color: colors.primary }]}
            keyboardType="decimal-pad"
            placeholder="0.00"
            placeholderTextColor={colors.faint}
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Dates (Issue Date & Due Date) */}
        <View style={shared.row}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={shared.label}>تاريخ الإصدار</Text>
            <TextInput
              style={shared.input}
              placeholder="YYYY-MM-DD"
              value={issueDate}
              onChangeText={setIssueDate}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={shared.label}>تاريخ الاستحقاق (اختياري)</Text>
            <TextInput
              style={shared.input}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.faint}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={{ gap: 6 }}>
          <Text style={shared.label}>ملاحظات أو شروط الدفع (اختياري)</Text>
          <TextInput
            style={[shared.input, { minHeight: 70, textAlignVertical: "top" }]}
            placeholder="مثال: الدفع خلال 7 أيام على الحساب البنكي..."
            placeholderTextColor={colors.faint}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {error ? <Text style={shared.error}>{error}</Text> : null}

        {/* Submit Button */}
        <Pressable
          style={[shared.button, busy && { opacity: 0.7 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="receipt" size={20} color="#FFFFFF" />
              <Text style={shared.buttonText}>إنشاء وحفظ الفاتورة</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
