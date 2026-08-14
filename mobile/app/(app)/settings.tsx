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

export default function SettingsScreen() {
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
      setMessage("تم حفظ وتحديث بيانات الفاتورة بنجاح");
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر حفظ البيانات");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen title="إعدادات مساحة العمل" showBack>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Workspace Info Card */}
        <View style={shared.card}>
          <View style={shared.row}>
            <View style={shared.rowStart}>
              <View style={shared.iconCircle}>
                <AppIcon name="business" size={18} color={colors.primary} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[shared.value, { fontSize: 16 }]}>{workspace?.name}</Text>
                <Text style={[shared.label, { fontSize: 12 }]}>العملة: {workspace?.currency}</Text>
              </View>
            </View>
            <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[shared.badgeText, { color: colors.primary }]}>
                {workspace?.type === "personal" ? "شخصي" : "أعمال"}
              </Text>
            </View>
          </View>
        </View>

        {/* Invoice Branding Form */}
        <View style={shared.card}>
          <Text style={[shared.value, { fontSize: 16, marginBottom: 4 }]}>
            بيانات وهوية الفاتورة
          </Text>

          <Text style={shared.label}>اسم النشاط التجاري (يظهر أعلى الفاتورة)</Text>
          <TextInput
            style={shared.input}
            placeholder="مثال: استوديو الإبداع للتصميم..."
            placeholderTextColor={colors.faint}
            value={businessName}
            onChangeText={setBusinessName}
          />

          <Text style={shared.label}>رقم الهاتف للتواصل</Text>
          <TextInput
            style={shared.input}
            placeholder="01000000000"
            placeholderTextColor={colors.faint}
            value={businessPhone}
            onChangeText={setBusinessPhone}
            keyboardType="phone-pad"
          />

          <Text style={shared.label}>العنوان ومقر العمل</Text>
          <TextInput
            style={shared.input}
            placeholder="مثال: القاهرة، المعادي، شارع 9"
            placeholderTextColor={colors.faint}
            value={businessAddress}
            onChangeText={setBusinessAddress}
          />

          <Text style={shared.label}>الرقم الضريبي (اختياري)</Text>
          <TextInput
            style={shared.input}
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
            style={[shared.button, saving && { opacity: 0.7 }, { marginTop: 6 }]}
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <AppIcon name="checkmark" size={18} color="#FFFFFF" />
                <Text style={shared.buttonText}>حفظ الإعدادات</Text>
              </>
            )}
          </Pressable>
        </View>

        <Text style={[shared.label, { textAlign: "center", fontSize: 12 }]}>
          رفع الشعار المخصص والنسخ الاحتياطي الكامل متاحان عبر لوحة الويب.
        </Text>
      </ScrollView>
    </Screen>
  );
}
