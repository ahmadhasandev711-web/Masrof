import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { authClient } from "@/lib/auth-client";
import { createWorkspace } from "@/lib/api";
import { newIdempotencyKey } from "@/lib/idempotency";
import { createWorkspaceInputSchema } from "@/lib/validation";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { colors, fonts, shared } from "@/lib/styles";
import { AppIcon, type IconName } from "@/components/icon";
import { resolveApiErrorMessage } from "@/lib/api-errors";

type WorkspaceTypeOption = "personal" | "freelance" | "business";

const CURRENCIES = [
  { code: "EGP", labelAr: "جنيه مصري", labelEn: "EGP" },
  { code: "SAR", labelAr: "ريال سعودي", labelEn: "SAR" },
  { code: "AED", labelAr: "درهم إماراتي", labelEn: "AED" },
  { code: "KWD", labelAr: "دينار كويتي", labelEn: "KWD" },
  { code: "USD", labelAr: "دولار أمريكي", labelEn: "USD" },
  { code: "EUR", labelAr: "يورو", labelEn: "EUR" },
  { code: "GBP", labelAr: "جنيه إسترليني", labelEn: "GBP" },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { data: session, isPending } = authClient.useSession();
  const { workspaces, refresh } = useWorkspace();

  const [name, setName] = useState("");
  const [type, setType] = useState<WorkspaceTypeOption>("personal");
  const [currency, setCurrency] = useState("EGP");
  const [initialAccountName, setInitialAccountName] = useState(
    isRTL ? "الخزينة النقدية" : "Cash Wallet",
  );
  const [initialBalance, setInitialBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  // If user already has an active workspace, go straight to app
  if (workspaces.length > 0) {
    return <Redirect href="/" />;
  }

  const WORKSPACE_TYPES: {
    key: WorkspaceTypeOption;
    title: string;
    desc: string;
    icon: IconName;
  }[] = [
    {
      key: "personal",
      title: t.onboarding.personal,
      desc: t.onboarding.personalDesc,
      icon: "home",
    },
    {
      key: "freelance",
      title: t.onboarding.freelance,
      desc: t.onboarding.freelanceDesc,
      icon: "briefcase",
    },
    {
      key: "business",
      title: t.onboarding.business,
      desc: t.onboarding.businessDesc,
      icon: "business",
    },
  ];

  async function onSubmit() {
    setError(null);

    const payload = {
      name: name.trim(),
      type,
      currency,
      initialAccountName: initialAccountName.trim() || undefined,
      initialAccountType: "cash",
      initialAccountBalance: Number(initialBalance) || 0,
      idempotencyKey: idempotencyRef.current,
    };

    const parsed = createWorkspaceInputSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? (isRTL ? "بيانات غير صحيحة" : "Invalid data"));
      return;
    }

    setBusy(true);

    try {
      await createWorkspace(parsed.data);
      idempotencyRef.current = newIdempotencyKey();
      await refresh();
      router.replace("/");
    } catch (err) {
      setError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر إنشاء مساحة العمل. تحقق من الاتصال وحاول مرة أخرى"
            : "Could not create workspace. Check your connection and try again",
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 16) + 12,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={{ alignItems: "center", gap: 6, marginBottom: 12 }}>
            <View style={styles.badge}>
              <AppIcon name="star" size={14} color={colors.primary} />
              <Text style={styles.badgeText}>
                {isRTL ? "إعداد الحساب لأول مرة" : "Initial Setup"}
              </Text>
            </View>
            <Text style={styles.title}>{t.onboarding.title}</Text>
            <Text style={styles.subtitle}>{t.onboarding.subtitle}</Text>
          </View>

          {/* Workspace Name */}
          <View style={{ gap: 6 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.onboarding.workspaceName}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={name}
              onChangeText={setName}
              placeholder={t.onboarding.workspaceNamePlaceholder}
              placeholderTextColor={colors.faint}
            />
            <Text style={[shared.label, { fontSize: 12, textAlign: isRTL ? "right" : "left" }]}>
              {isRTL
                ? "الاسم لمساحتك فقط — لا يحتاج أن يكون فريداً عالمياً. بعد الإنشاء ستبدأ بإضافة حسابك الأول."
                : "This name is for your workspace only — it does not need to be globally unique. Next you will set up your first account."}
            </Text>
          </View>

          {/* Workspace Type Selector */}
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.onboarding.workspaceType}
            </Text>
            {WORKSPACE_TYPES.map((wsType) => {
              const active = type === wsType.key;
              return (
                <Pressable
                  key={wsType.key}
                  onPress={() => setType(wsType.key)}
                  style={[
                    styles.typeCard,
                    active && styles.typeCardActive,
                    { flexDirection: isRTL ? "row-reverse" : "row" },
                  ]}
                >
                  <View
                    style={[
                      shared.iconCircle,
                      active
                        ? { backgroundColor: colors.primary, borderColor: colors.primary }
                        : { backgroundColor: colors.cardAlt },
                    ]}
                  >
                    <AppIcon
                      name={wsType.icon}
                      size={20}
                      color={active ? "#FFFFFF" : colors.muted}
                    />
                  </View>
                  <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text
                      style={[
                        styles.typeTitle,
                        active && { color: colors.primary, fontWeight: "800" },
                      ]}
                    >
                      {wsType.title}
                    </Text>
                    <Text style={styles.typeDesc}>{wsType.desc}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Primary Currency */}
          <View style={{ gap: 8 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.onboarding.currency}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 8,
                flexDirection: isRTL ? "row-reverse" : "row",
              }}
            >
              {CURRENCIES.map((curr) => {
                const active = currency === curr.code;
                return (
                  <Pressable
                    key={curr.code}
                    onPress={() => setCurrency(curr.code)}
                    style={[
                      shared.chip,
                      active && {
                        backgroundColor: colors.primary,
                        borderColor: colors.primary,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        shared.chipText,
                        active && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {isRTL ? `${curr.labelAr} (${curr.code})` : `${curr.code}`}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Initial Wallet Account */}
          <View style={{ gap: 6 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.onboarding.initialAccount}
            </Text>
            <TextInput
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={initialAccountName}
              onChangeText={setInitialAccountName}
              placeholder={t.onboarding.initialAccountPlaceholder}
              placeholderTextColor={colors.faint}
            />
          </View>

          {/* Initial Opening Balance */}
          <View style={{ gap: 6 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.onboarding.initialBalance} ({currency})
            </Text>
            <TextInput
              keyboardType="decimal-pad"
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={initialBalance}
              onChangeText={setInitialBalance}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit CTA */}
          <Pressable
            disabled={busy || name.trim().length < 2}
            style={({ pressed }) => [
              styles.button,
              (busy || name.trim().length < 2) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={onSubmit}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t.onboarding.startNow}</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 14,
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    textAlign: "center",
  },
  input: {
    fontFamily: fonts.regular,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#FBF9F4",
    minHeight: 48,
  },
  typeCard: {
    backgroundColor: "#FAF8F5",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  typeCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
  },
  typeTitle: {
    fontFamily: fonts.bold,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  typeDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  error: {
    fontFamily: fonts.medium,
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
    minHeight: 48,
    justifyContent: "center",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    fontFamily: fonts.bold,
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});
