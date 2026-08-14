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
import { useI18n } from "@/lib/i18n";

export default function NewInvoiceScreen() {
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
      setError(isRTL ? "يرجى اختيار العميل أو إضافة عميل أولاً" : "Please select or add a client first");
      return;
    }
    const value = Number(amount);
    if (!description.trim()) {
      setError(isRTL ? "يرجى إدخال وصف البند أو الخدمة" : "Please enter item or service description");
      return;
    }
    if (!Number.isFinite(value) || value <= 0) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً أكبر من صفر" : "Enter a valid amount");
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
      setError(isRTL ? "تعذر إنشاء الفاتورة. تأكد من صحة البيانات والاتصال." : "Failed to create invoice.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={t.invoices.newTitle} showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Client Selection */}
        <View style={{ gap: 8 }}>
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={shared.label}>{t.invoices.clientName}</Text>
            {clients.length === 0 ? (
              <Pressable onPress={() => router.push("/(app)/clients")}>
                <Text style={[shared.label, { color: colors.primary, fontWeight: "700" }]}>
                  {t.clients.add}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {clients.length === 0 ? (
            <View style={[shared.card, { alignItems: "center", paddingVertical: 12 }]}>
              <Text style={shared.label}>{t.clients.noClients}</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
            >
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
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
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
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.invoices.itemDesc}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "مثال: تصميم هوية بصرية، استشارة برمجية..." : "e.g. Logo Design, Software Consultation..."}
            placeholderTextColor={colors.faint}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Amount */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.common.total} ({currency})
          </Text>
          <TextInput
            style={[
              shared.input,
              {
                fontSize: 20,
                fontWeight: "700",
                color: colors.primary,
                textAlign: isRTL ? "right" : "left",
              },
            ]}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor={colors.faint}
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        {/* Dates (Issue Date & Due Date) */}
        <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.invoices.issueDate}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder="YYYY-MM-DD"
              value={issueDate}
              onChangeText={setIssueDate}
            />
          </View>
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.invoices.dueDate}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.faint}
              value={dueDate}
              onChangeText={setDueDate}
            />
          </View>
        </View>

        {/* Notes */}
        <View style={{ gap: 6 }}>
          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.invoices.notes}
          </Text>
          <TextInput
            style={[shared.input, { minHeight: 70, textAlignVertical: "top", textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "مثال: الدفع خلال 7 أيام على الحساب البنكي..." : "e.g. Payment due within 7 days..."}
            placeholderTextColor={colors.faint}
            multiline
            value={notes}
            onChangeText={setNotes}
          />
        </View>

        {error ? <Text style={shared.error}>{error}</Text> : null}

        {/* Submit Button */}
        <Pressable
          style={[shared.button, busy && { opacity: 0.7 }, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <AppIcon name="receipt" size={20} color="#FFFFFF" />
              <Text style={shared.buttonText}>{t.common.save}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </Screen>
  );
}
