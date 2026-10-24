import { useState } from "react";
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
import { useI18n } from "@/lib/i18n";
import { normalizePhoneNumber } from "@/lib/phone";
import { registerInputSchema } from "@/lib/validation";
import { colors, fonts, shared } from "@/lib/styles";
import { AppIcon } from "@/components/icon";

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL, locale, toggleLocale } = useI18n();
  const { data: session, isPending } = authClient.useSession();

  const [name, setName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/onboarding" />;
  }

  async function onSubmit() {
    setError(null);

    const normalizedPhone = normalizePhoneNumber(phoneNumber);
    if (!normalizedPhone) {
      setError(t.register.errorPhone);
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phoneNumber: normalizedPhone,
      password,
    };

    const parsed = registerInputSchema.safeParse(payload);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      if (issue.path.includes("name")) setError(t.register.errorName);
      else if (issue.path.includes("phoneNumber")) setError(t.register.errorPhone);
      else if (issue.path.includes("email")) setError(t.register.errorEmail);
      else if (issue.path.includes("password")) setError(t.register.errorPassword);
      else setError(issue.message);
      return;
    }

    setBusy(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        phoneNumber: normalizedPhone,
      } as Parameters<typeof authClient.signUp.email>[0]);

      if (signUpError) {
        const rawMessage = (signUpError.message ?? "").toLowerCase();
        if (rawMessage.includes("phone")) {
          setError(t.register.errorPhoneTaken);
        } else if (rawMessage.includes("email") || rawMessage.includes("exist")) {
          setError(t.register.errorEmailTaken);
        } else {
          setError(signUpError.message || (isRTL ? "تعذر إنشاء الحساب" : "Registration failed"));
        }
        setBusy(false);
        return;
      }

      router.replace("/onboarding");
    } catch {
      setError(isRTL ? "حدث خطأ غير متوقع، يرجى المحاولة لاحقاً" : "An unexpected error occurred");
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        {
          paddingTop: Math.max(insets.top, 16) + 8,
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center", paddingVertical: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Language Switcher in Header */}
        <View
          style={[
            shared.row,
            {
              width: "100%",
              maxWidth: 420,
              alignSelf: "center",
              marginBottom: 12,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
        >
          <View />
          <Pressable
            style={[
              shared.rowStart,
              styles.langPill,
              { flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
            onPress={() => toggleLocale()}
          >
            <AppIcon name="globe" size={14} color={colors.primary} />
            <Text style={styles.langText}>
              {locale === "ar" ? "English" : "العربية"}
            </Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {/* Logo / Brand Header */}
          <View style={{ alignItems: "center", gap: 6, marginBottom: 12 }}>
            <View style={styles.logoCircle}>
              <AppIcon name="wallet" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>{isRTL ? "سندات" : "Sanadat"}</Text>
            <Text style={styles.subtitle}>{t.register.subtitle}</Text>
          </View>

          {/* Full Name */}
          <View style={{ gap: 4 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.register.namePlaceholder}
            </Text>
            <TextInput
              autoCapitalize="words"
              placeholder={isRTL ? "أحمد محمد" : "John Doe"}
              placeholderTextColor={colors.faint}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone Number */}
          <View style={{ gap: 4 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.register.phonePlaceholder}
            </Text>
            <TextInput
              keyboardType="phone-pad"
              placeholder="01012345678"
              placeholderTextColor={colors.faint}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
            />
          </View>

          {/* Email */}
          <View style={{ gap: 4 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.register.emailPlaceholder}
            </Text>
            <TextInput
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="name@example.com"
              placeholderTextColor={colors.faint}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View style={{ gap: 4 }}>
            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.register.passwordPlaceholder}
            </Text>
            <TextInput
              secureTextEntry
              autoComplete="password"
              placeholder="••••••••"
              placeholderTextColor={colors.faint}
              style={[styles.input, { textAlign: isRTL ? "right" : "left" }]}
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* Submit Button */}
          <Pressable
            disabled={busy || name.trim().length < 2 || !email.trim() || password.length < 8}
            style={({ pressed }) => [
              styles.button,
              (busy || name.trim().length < 2 || !email.trim() || password.length < 8) &&
                styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
            onPress={onSubmit}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t.register.submit}</Text>
            )}
          </Pressable>

          {/* Switch to Login Link */}
          <View
            style={[
              shared.rowStart,
              {
                justifyContent: "center",
                marginTop: 8,
                flexDirection: isRTL ? "row-reverse" : "row",
              },
            ]}
          >
            <Text style={[shared.label, { fontSize: 13 }]}>{t.register.hasAccount}</Text>
            <Pressable onPress={() => router.replace("/login")} hitSlop={8}>
              <Text style={styles.linkText}> {t.register.loginLink}</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  langPill: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
  },
  langText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    gap: 12,
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 26,
    fontWeight: "800",
    color: colors.primary,
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
  error: {
    fontFamily: fonts.medium,
    color: colors.danger,
    fontSize: 13,
    textAlign: "center",
    fontWeight: "500",
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
  linkText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.primary,
    fontWeight: "700",
  },
});
