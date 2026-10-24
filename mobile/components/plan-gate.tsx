import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { AppIcon, type IconName } from "@/components/icon";
import { colors, fonts, shared } from "@/lib/styles";
import { useI18n } from "@/lib/i18n";

type PlanGateProps = {
  title?: string;
  description?: string;
  perks?: { icon: IconName; title: string; desc: string }[];
};

export function PlanGate({ title, description, perks }: PlanGateProps) {
  const { isRTL } = useI18n();

  const defaultPerks: { icon: IconName; title: string; desc: string }[] = perks ?? [
    {
      icon: "card",
      title: isRTL ? "إدارة متقدمة وغير محدودة" : "Advanced & Unlimited Tracking",
      desc: isRTL
        ? "تتبع دقيق وشامل لجميع العمليات بدون أي حدود"
        : "Complete, unrestricted tracking for all records",
    },
    {
      icon: "trending-up",
      title: isRTL ? "مزامنة وتقارير فورية" : "Instant Analytics & Sync",
      desc: isRTL
        ? "تحليلات عميقة تساعدك على اتخاذ القرارات المالية"
        : "Deep insights to guide your financial decisions",
    },
    {
      icon: "star",
      title: isRTL ? "تجربة بدون إعلانات" : "Ad-Free Experience",
      desc: isRTL
        ? "استخدام فائق السرعة وبدون أي إعلانات"
        : "Ultra-fast, distraction-free performance",
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Pro Badge */}
        <View style={styles.badgeWrapper}>
          <View style={styles.badge}>
            <AppIcon name="star" size={14} color="#D97706" />
            <Text style={styles.badgeText}>PRO</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={[styles.title, { textAlign: "center" }]}>
          {title ??
            (isRTL
              ? "هذه الميزة متاحة لمشتركي باقة PRO"
              : "This feature is available on PRO")}
        </Text>

        {/* Description */}
        <Text style={[styles.description, { textAlign: "center" }]}>
          {description ??
            (isRTL
              ? "قم بترقية حسابك للوصول الكامل إلى جميع الميزات المتقدمة وتجربة استخدام خالية من الإعلانات."
              : "Upgrade your account to unlock full access to advanced features and enjoy an ad-free experience.")}
        </Text>

        {/* Perks Grid */}
        <View style={styles.perksList}>
          {defaultPerks.map((perk, i) => (
            <View
              key={i}
              style={[
                styles.perkCard,
                { flexDirection: isRTL ? "row-reverse" : "row" },
              ]}
            >
              <View style={[shared.iconCircle, { backgroundColor: colors.primarySoft }]}>
                <AppIcon name={perk.icon} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1, alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={styles.perkTitle}>{perk.title}</Text>
                <Text style={styles.perkDesc}>{perk.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Upgrade CTA Button */}
        <Pressable
          style={styles.ctaButton}
          onPress={() => router.push("/plan")}
        >
          <AppIcon name="star" size={18} color="#FFFFFF" />
          <Text style={styles.ctaButtonText}>
            {isRTL ? "ترقية الحساب الآن" : "Upgrade to PRO Now"}
          </Text>
        </Pressable>

        <Text style={styles.footnote}>
          {isRTL
            ? "اشتراك سنوي اقتصادي بـ 250 جنيه فقط يفتح جميع ميزات النظام"
            : "Only 250 EGP/year unlocks all system features"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primaryBorder,
    padding: 20,
    alignItems: "center",
    gap: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  badgeWrapper: {
    marginBottom: 4,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FCD34D",
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    fontWeight: "800",
    color: "#92400E",
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  description: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  perksList: {
    width: "100%",
    gap: 10,
    marginVertical: 6,
  },
  perkCard: {
    backgroundColor: "#FAF8F5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 12,
    alignItems: "center",
    gap: 12,
  },
  perkTitle: {
    fontFamily: fonts.bold,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  perkDesc: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.faint,
    marginTop: 2,
  },
  ctaButton: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    marginTop: 6,
    minHeight: 48,
  },
  ctaButtonText: {
    fontFamily: fonts.bold,
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  footnote: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.faint,
    textAlign: "center",
  },
});
