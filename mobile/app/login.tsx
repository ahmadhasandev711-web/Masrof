import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Redirect, router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { API_URL } from "@/lib/config";

export default function LoginScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#065F46" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/" />;
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
      setError(signInError.message ?? "تعذر تسجيل الدخول. تأكد من البريد وكلمة المرور.");
      return;
    }
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.brand}>مصروفاتي</Text>
        <Text style={styles.subtitle}>سجّل بنفس حساب الويب</Text>

        <TextInput
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="البريد الإلكتروني"
          placeholderTextColor="#8A8578"
          style={styles.input}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          secureTextEntry
          autoComplete="password"
          placeholder="كلمة المرور"
          placeholderTextColor="#8A8578"
          style={styles.input}
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={busy || !email.trim() || password.length < 8}
          onPress={onSubmit}
          style={({ pressed }) => [
            styles.button,
            (busy || !email.trim() || password.length < 8) && styles.buttonDisabled,
            pressed && styles.buttonPressed,
          ]}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>دخول</Text>
          )}
        </Pressable>

        <Text style={styles.hint}>
          حساب جديد من الموقع: {API_URL.replace(/^https?:\/\//, "")}
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F0E8",
    justifyContent: "center",
    padding: 24,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0E8",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    borderWidth: 1,
    borderColor: "#E4DFD3",
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#065F46",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#5C574C",
    textAlign: "center",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E4DFD3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1C1B1A",
    backgroundColor: "#FBF9F4",
    textAlign: "right",
  },
  error: {
    color: "#9A3412",
    fontSize: 13,
    textAlign: "center",
  },
  button: {
    backgroundColor: "#065F46",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  hint: {
    fontSize: 12,
    color: "#8A8578",
    textAlign: "center",
    marginTop: 4,
  },
});
