import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { AdBanner } from "@/components/ad-banner";
import { authClient } from "@/lib/auth-client";
import { fetchEntitlements, type MobileEntitlements } from "@/lib/api";

const PLAN_LABEL: Record<MobileEntitlements["plan"], string> = {
  free: "مجاني",
  pro: "برو",
  plus: "بلس",
};

export default function HomeScreen() {
  const { data: session, isPending } = authClient.useSession();
  const [entitlements, setEntitlements] = useState<MobileEntitlements | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    fetchEntitlements()
      .then((data) => {
        if (!cancelled) setEntitlements(data);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const code = error instanceof Error ? error.message : "";
        if (code === "missing-entitlements-route") {
          setLoadError("مسار الباقة غير منشور على السيرفر بعد.");
        } else if (code === "unauthorized") {
          setLoadError("انتهت الجلسة. سجّل الدخول مرة أخرى.");
        } else {
          setLoadError("تعذر تحميل الباقة. تأكد أن السيرفر شغال.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [session]);

  if (isPending) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#065F46" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  const showAds = entitlements?.showAds ?? true;

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.brand}>مصروفاتي</Text>
        <Text style={styles.hello}>أهلاً، {session.user.name || session.user.email}</Text>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>باقتك الحالية</Text>
          <Text style={styles.plan}>
            {entitlements ? PLAN_LABEL[entitlements.plan] : "…"}
          </Text>
          <Text style={styles.cardHint}>
            {showAds
              ? "الباقة المجانية تشمل إعلانات. ترقّى لبرو لإخفائها."
              : "برو — بدون إعلانات."}
          </Text>
          {loadError ? <Text style={styles.error}>{loadError}</Text> : null}
        </View>

        <Pressable
          onPress={() => authClient.signOut()}
          style={({ pressed }) => [styles.signOut, pressed && { opacity: 0.8 }]}
        >
          <Text style={styles.signOutText}>تسجيل الخروج</Text>
        </Pressable>
      </View>

      <AdBanner showAds={showAds} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F3F0E8",
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F0E8",
  },
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    gap: 16,
  },
  brand: {
    fontSize: 28,
    fontWeight: "700",
    color: "#065F46",
    textAlign: "center",
  },
  hello: {
    fontSize: 16,
    color: "#5C574C",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E4DFD3",
    gap: 6,
  },
  cardLabel: {
    fontSize: 13,
    color: "#8A8578",
    textAlign: "right",
  },
  plan: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1C1B1A",
    textAlign: "right",
  },
  cardHint: {
    fontSize: 14,
    color: "#5C574C",
    textAlign: "right",
    lineHeight: 22,
  },
  error: {
    color: "#9A3412",
    fontSize: 13,
    textAlign: "right",
  },
  signOut: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  signOutText: {
    color: "#065F46",
    fontWeight: "600",
    fontSize: 15,
  },
});
