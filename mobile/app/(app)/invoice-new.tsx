import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { AmountField, DateField, Field, FormBanner, PrimaryButton } from "@/components/forms";
import { colors, shared } from "@/lib/styles";
import { useInvoiceForm } from "@/hooks/use-invoice-form";
import { useWriteAccess } from "@/lib/write-access";

export default function NewInvoiceScreen() {
  const { canWrite, readOnlyMessage } = useWriteAccess();
  const {
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
  } = useInvoiceForm();

  return (
    <Screen title={t.invoices.newTitle} showBack>
      <ScrollView contentContainerStyle={{ gap: 14, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 8 }}>
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <Text style={shared.label}>{t.invoices.clientName}</Text>
            {clients.length === 0 ? (
              <Pressable onPress={() => router.push("/clients")}>
                <Text style={[shared.label, { color: colors.primary, fontWeight: "700" }]}>{t.clients.add}</Text>
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
                      { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
                      active && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <AppIcon name="people-outline" size={13} color={active ? "#FFFFFF" : colors.primary} />
                    <Text style={[shared.chipText, active && { color: "#FFFFFF", fontWeight: "700" }]}>
                      {client.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        <Field
          label={t.invoices.itemDesc}
          value={description}
          onChangeText={setDescription}
          isRTL={isRTL}
          placeholder={isRTL ? "مثال: تصميم هوية بصرية..." : "e.g. Logo design..."}
        />

        <AmountField
          label={t.common.total}
          currency={currency}
          value={amount}
          onChangeText={setAmount}
          isRTL={isRTL}
          accentColor={colors.primary}
        />

        <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }]}>
          <View style={{ flex: 1 }}>
            <DateField label={t.invoices.issueDate} value={issueDate} onChange={setIssueDate} isRTL={isRTL} />
          </View>
          <View style={{ flex: 1 }}>
            <DateField
              label={t.invoices.dueDate}
              value={dueDate}
              onChange={setDueDate}
              isRTL={isRTL}
              optional
              emptyLabel={isRTL ? "بدون استحقاق" : "No due date"}
            />
          </View>
        </View>

        <Field
          label={t.invoices.notes}
          value={notes}
          onChangeText={setNotes}
          isRTL={isRTL}
          multiline
          style={{ minHeight: 70, textAlignVertical: "top" }}
          placeholder={isRTL ? "شروط الدفع..." : "Payment terms..."}
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
