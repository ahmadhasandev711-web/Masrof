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
import { API_URL } from "@/lib/config";
import { useI18n } from "@/lib/i18n";
import { colors, shared } from "@/lib/styles";
import { AppIcon } from "@/components/icon";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useI18n();
  const { data: session, isPending } = authClient.useSession();
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
    return <Redirect href="/(app)" />;
  }

  async function onSubmit() {
    setError(null);
    setBusy(true);
    const { error: signInError } = await authClient.signIn.email({
      email: email.trim(),
      password,
    });
    setBusy(false);
    if (signInError) {
      setError(signInError.message ?? t.login.errorInvalid);
      return;
    }
    router.replace("/(app)");
  }

  return (
    <KeyboardAvoidingView
      style={[
        styles.screen,
        { paddingTop: Math.max(insets.top, 16) + 8, paddingBottom: Math.max(insets.bottom, 16) },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          {/* Logo / Brand Header */}
          <View style={{ alignItems: "center", gap: 6, marginBottom: 8 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: colors.primarySoft,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: colors.primaryBorder,
              }}
            >
              <AppIcon name="wallet" size={28} color={colors.primary} />
            </View>
            <Text style={styles.brand}>{isRTL ? "مصروفاتي" : "Masrofaty"}</Text>
            <Text style={styles.subtitle}>{t.login.subtitle}</Text>
          </View>

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.login.emailPlaceholder}
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

          <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
            {t.login.passwordPlaceholder}
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Pressable
            disabled={busy || !email.trim() || password.length < 6}
            onPress={onSubmit}
            style={({ pressed }) => [
              styles.button,
              (busy || !email.trim() || password.length < 6) && styles.buttonDisabled,
              pressed && styles.buttonPressed,
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>{t.login.submit}</Text>
            )}
          </Pressable>

          <Text style={styles.hint}>
            {t.login.registerWeb}: {API_URL.replace(/^https?:\/\//, "")}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: colors.muted,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    backgroundColor: "#FBF9F4",
    textAlign: "right",
  },
  error: {
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
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: colors.faint,
    textAlign: "center",
    marginTop: 6,
  },
});
