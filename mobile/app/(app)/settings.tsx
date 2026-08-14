import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchBranding, saveBranding } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function SettingsScreen() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { workspaceId, workspace } = useWorkspace();
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchBranding(workspaceId);
    setBusinessName(data.businessName ?? "");
    setBusinessPhone(data.businessPhone ?? "");
    setBusinessAddress(data.businessAddress ?? "");
    setTaxId(data.taxId ?? "");
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => undefined);
    }, [load]),
  );

  async function onSave() {
    if (!workspaceId) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      await saveBranding({
        workspaceId,
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        businessAddress: businessAddress.trim(),
        taxId: taxId.trim(),
      });
      setMessage(t.settings.saveSuccess);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.common.error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title={t.settings.title} showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Selection Card */}
        <View style={shared.card}>
          <Text style={[shared.value, { fontSize: 16, marginBottom: 8, textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.languageSection}
          </Text>
          <View style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 10 }}>
            <Pressable
              style={[
                shared.chip,
                { flex: 1, alignItems: "center", paddingVertical: 10 },
                locale === "ar" && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setLocale("ar")}
            >
              <Text
                style={[
                  shared.chipText,
                  { fontWeight: "700" },
                  locale === "ar" && { color: "#FFFFFF" },
                ]}
              >
                العربية (RTL)
              </Text>
            </Pressable>
            <Pressable
              style={[
                shared.chip,
                { flex: 1, alignItems: "center", paddingVertical: 10 },
                locale === "en" && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setLocale("en")}
            >
              <Text
                style={[
                  shared.chipText,
                  { fontWeight: "700" },
                  locale === "en" && { color: "#FFFFFF" },
                ]}
              >
                English (LTR)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Workspace Info Card */}
        <View style={shared.card}>
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={shared.iconCircle}>
                <AppIcon name="business" size={18} color={colors.primary} />
              </View>
              <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[shared.value, { fontSize: 16 }]}>{workspace?.name}</Text>
                <Text style={[shared.label, { fontSize: 12 }]}>
                  {t.common.activeWorkspace}: {workspace?.currency}
                </Text>
              </View>
            </View>
            <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[shared.badgeText, { color: colors.primary }]}>
                {workspace?.type === "personal" ? (isRTL ? "شخصي" : "Personal") : (isRTL ? "أعمال" : "Business")}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Branding Form */}
        <View style={shared.card}>
          <Text style={[shared.value, { fontSize: 16, marginBottom: 4, textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.title}
          </Text>

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.businessName}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "مثال: استوديو الإبداع..." : "e.g. Acme Corp..."}
            placeholderTextColor={colors.faint}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.businessPhone}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder="01000000000"
            placeholderTextColor={colors.faint}
            value={businessPhone}
            onChangeText={setBusinessPhone}
            keyboardType="phone-pad"
          />

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.businessAddress}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder={isRTL ? "مثال: القاهرة، المعادي" : "e.g. Cairo, Egypt"}
            placeholderTextColor={colors.faint}
            value={businessAddress}
            onChangeText={setBusinessAddress}
          />

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.settings.taxId}
          </Text>
          <TextInput
            style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
            placeholder="123-456-789"
            placeholderTextColor={colors.faint}
            value={taxId}
            onChangeText={setTaxId}
          />

          {error ? <Text style={shared.error}>{error}</Text> : null}
          {message ? (
            <View style={[shared.card, { backgroundColor: colors.incomeSoft, borderColor: "#A7F3D0", paddingVertical: 10 }]}>
              <Text style={{ color: colors.incomeText, textAlign: "center", fontWeight: "700" }}>
                {message}
              </Text>
            </View>
          ) : null}

          <Pressable
            style={[shared.button, saving && { opacity: 0.7 }, { marginTop: 6, flexDirection: isRTL ? "row-reverse" : "row" }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <AppIcon name="checkmark" size={18} color="#FFFFFF" />
                <Text style={shared.buttonText}>{t.common.save}</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[shared.label, { textAlign: "center", fontSize: 12 }]}>
          {isRTL ? "رفع الشعار والنسخ الاحتياطي الكامل متاحان عبر لوحة الويب." : "Logo upload and database backup are available on the web portal."}
        </Text>
      </ScrollView>
    </Screen>
  );
}
