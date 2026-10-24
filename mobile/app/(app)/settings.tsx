import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchBranding, saveBranding, uploadBrandingLogo } from "@/lib/api";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { useWriteAccess } from "@/lib/write-access";
import { Field, FormBanner, PrimaryButton } from "@/components/forms";
import { CardSkeleton } from "@/components/skeleton";

export default function SettingsScreen() {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { workspaceId, workspace, isOwner } = useWorkspace();
  const { canWrite } = useWriteAccess();
  const [loading, setLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState("");
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [taxId, setTaxId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const data = await fetchBranding(workspaceId, true);
      setLogoUrl(data.logoUrl ?? "");
      setBusinessName(data.businessName ?? "");
      setBusinessPhone(data.businessPhone ?? "");
      setBusinessAddress(data.businessAddress ?? "");
      setTaxId(data.taxId ?? "");
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load();
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
        logoUrl: logoUrl.trim(),
      });
      setMessage(t.settings.saveSuccess);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, t.common.error));
    } finally {
      setSaving(false);
    }
  }

  async function onPickLogo() {
    if (!workspaceId || !isOwner) return;
    setError(null);
    setMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError(
        isRTL
          ? "يلزم السماح بالوصول للصور لاختيار الشعار."
          : "Photo library access is required to pick a logo.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setUploadingLogo(true);
    try {
      const { url } = await uploadBrandingLogo(workspaceId, {
        uri: asset.uri,
        mimeType: asset.mimeType,
        fileName: asset.fileName,
      });
      setLogoUrl(url);
      await saveBranding({
        workspaceId,
        businessName: businessName.trim(),
        businessPhone: businessPhone.trim(),
        businessAddress: businessAddress.trim(),
        taxId: taxId.trim(),
        logoUrl: url,
      });
      setMessage(isRTL ? "تم رفع الشعار وحفظه." : "Logo uploaded and saved.");
    } catch (err) {
      setError(
        resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر رفع الشعار." : "Failed to upload logo."),
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  return (
    <Screen title={t.settings.title} showBack>
      {loading ? (
        <View style={{ gap: 12 }}>
          <CardSkeleton />
          <CardSkeleton />
        </View>
      ) : (
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

          {!canWrite ? (
            <FormBanner
              tone="info"
              message={
                isRTL
                  ? "صلاحيتك للعرض فقط. تعديل بيانات الفواتير من الويب أو اطلب صلاحية كتابة."
                  : "You have view-only access. Edit invoice branding on the web or ask for write access."
              }
              isRTL={isRTL}
            />
          ) : null}

          <View style={{ gap: 10, marginBottom: 8 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "شعار الفواتير" : "Invoice logo"}
            </Text>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center" }]}>
              {logoUrl ? (
                <Image
                  source={{ uri: logoUrl }}
                  style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.cardAlt }}
                  contentFit="contain"
                />
              ) : (
                <View
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    backgroundColor: colors.cardAlt,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppIcon name="business" size={28} color={colors.faint} />
                </View>
              )}
              {isOwner ? (
                <PrimaryButton
                  label={uploadingLogo ? t.common.loading : isRTL ? "اختيار شعار" : "Choose logo"}
                  onPress={onPickLogo}
                  loading={uploadingLogo}
                  disabled={uploadingLogo}
                  isRTL={isRTL}
                />
              ) : (
                <Text style={[shared.label, { flex: 1, textAlign: isRTL ? "right" : "left" }]}>
                  {isRTL ? "رفع الشعار للمالك فقط." : "Only the workspace owner can upload a logo."}
                </Text>
              )}
            </View>
          </View>

          <Field
            label={t.settings.businessName}
            placeholder={isRTL ? "مثال: استوديو الإبداع..." : "e.g. Acme Corp..."}
            value={businessName}
            onChangeText={setBusinessName}
            editable={canWrite}
            isRTL={isRTL}
          />

          <Field
            label={t.settings.businessPhone}
            placeholder="01000000000"
            value={businessPhone}
            onChangeText={setBusinessPhone}
            keyboardType="phone-pad"
            editable={canWrite}
            isRTL={isRTL}
          />

          <Field
            label={t.settings.businessAddress}
            placeholder={isRTL ? "مثال: القاهرة، المعادي" : "e.g. Cairo, Egypt"}
            value={businessAddress}
            onChangeText={setBusinessAddress}
            editable={canWrite}
            isRTL={isRTL}
          />

          <Field
            label={t.settings.taxId}
            placeholder="123-456-789"
            value={taxId}
            onChangeText={setTaxId}
            editable={canWrite}
            isRTL={isRTL}
          />

          {error ? <FormBanner message={error} isRTL={isRTL} /> : null}
          {message ? <FormBanner tone="info" message={message} isRTL={isRTL} /> : null}

          {canWrite && isOwner ? (
            <PrimaryButton label={t.common.save} onPress={onSave} loading={saving} disabled={saving} isRTL={isRTL} />
          ) : null}
        </View>

        <Text style={[shared.label, { textAlign: "center", fontSize: 12 }]}>
          {isRTL
            ? "النسخ الاحتياطي الكامل للبيانات متاح عبر لوحة الويب."
            : "Full data backup is available on the web dashboard."}
        </Text>
      </ScrollView>
      )}
    </Screen>
  );
}
