import { Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon, type IconName } from "@/components/icon";
import { colors, shared } from "@/lib/styles";
import { authClient } from "@/lib/auth-client";
import { useWorkspace } from "@/lib/workspace";

type MenuItem = {
  href: `/(app)/${string}`;
  label: string;
  desc: string;
  icon: IconName;
  color?: string;
  bg?: string;
};

const FINANCIAL_SECTION: MenuItem[] = [
  {
    href: "/(app)/accounts",
    label: "الحسابات والمحافظ",
    desc: "أرصدة البنوك والكاش والمحافظ",
    icon: "wallet",
    color: colors.primary,
    bg: colors.primarySoft,
  },
  {
    href: "/(app)/invoices",
    label: "الفواتير والمستحقات",
    desc: "إصدار ومتابعة وطباعة الفواتير",
    icon: "receipt",
    color: colors.info,
    bg: colors.infoSoft,
  },
  {
    href: "/(app)/transfers",
    label: "التحويلات المالية",
    desc: "نقل الأموال بين الحسابات",
    icon: "swap-horizontal",
    color: colors.warning,
    bg: colors.warningSoft,
  },
  {
    href: "/(app)/recurring",
    label: "المصاريف المتكررة",
    desc: "الاشتراكات والالتزامات المجدولة",
    icon: "repeat",
    color: colors.income,
    bg: colors.incomeSoft,
  },
  {
    href: "/(app)/categories",
    label: "التصنيفات",
    desc: "إدارة بنود الدخل والمصروف",
    icon: "pricetag",
    color: colors.primary,
    bg: colors.primarySoft,
  },
];

const PLANNING_SECTION: MenuItem[] = [
  {
    href: "/(app)/budgets",
    label: "الميزانيات الشهرية",
    desc: "تحديد حدود الصرف والتنبيهات",
    icon: "pie-chart",
    color: colors.income,
    bg: colors.incomeSoft,
  },
  {
    href: "/(app)/goals",
    label: "أهداف الادخار",
    desc: "تتبع خطط التوفير والإيداع",
    icon: "flag",
    color: colors.primary,
    bg: colors.primarySoft,
  },
  {
    href: "/(app)/reports",
    label: "التقارير والإحصائيات",
    desc: "تحليل الدخل والمصروفات",
    icon: "bar-chart",
    color: colors.info,
    bg: colors.infoSoft,
  },
];

const SETTINGS_SECTION: MenuItem[] = [
  {
    href: "/(app)/settings",
    label: "إعدادات مساحة العمل",
    desc: "بيانات الفاتورة والهوية البصرية",
    icon: "business",
    color: colors.muted,
    bg: "#F3F4F6",
  },
  {
    href: "/(app)/plan",
    label: "الاشتراك والباقة",
    desc: "تفاصيل الخطة والمزايا المتاحة",
    icon: "star",
    color: colors.warning,
    bg: colors.warningSoft,
  },
  {
    href: "/(app)/team",
    label: "فريق العمل والدعوات",
    desc: "إدارة الأعضاء والصلاحيات",
    icon: "people",
    color: colors.primary,
    bg: colors.primarySoft,
  },
];

export default function MoreScreen() {
  const { data: session } = authClient.useSession();
  const { workspace, entitlements } = useWorkspace();

  const planLabel =
    entitlements?.plan === "pro" ? "برو" : entitlements?.plan === "plus" ? "بلس" : "مجاني";

  return (
    <Screen title="المزيد">
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={shared.card}>
          <View style={shared.row}>
            <View style={shared.rowStart}>
              <View style={shared.iconCircle}>
                <AppIcon name="people" size={20} color={colors.primary} />
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[shared.value, { fontSize: 16 }]}>
                  {session?.user.name || session?.user.email}
                </Text>
                <Text style={[shared.label, { fontSize: 12 }]}>
                  {workspace?.name} · باقة {planLabel}
                </Text>
              </View>
            </View>
            <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[shared.badgeText, { color: colors.primary }]}>{planLabel}</Text>
            </View>
          </View>
        </View>

        {/* Financial Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700" }]}>المالية والمعاملات</Text>
          {FINANCIAL_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </View>

        {/* Planning Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700" }]}>التخطيط والتحليل</Text>
          {PLANNING_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </View>

        {/* Settings Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700" }]}>الإعدادات والاشتراك</Text>
          {SETTINGS_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} />
          ))}
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={[shared.card, shared.row, { borderColor: "#FECACA", marginTop: 4 }]}
          onPress={() => authClient.signOut()}
        >
          <View style={shared.rowStart}>
            <View style={[shared.iconCircle, { backgroundColor: colors.expenseSoft }]}>
              <AppIcon name="log-out" size={18} color={colors.expense} />
            </View>
            <Text style={[shared.value, { color: colors.expenseText, fontSize: 15 }]}>
              تسجيل الخروج
            </Text>
          </View>
          <AppIcon name="chevron-back" size={16} color={colors.expense} />
        </Pressable>

        <Text style={[shared.label, { textAlign: "center", fontSize: 11, marginTop: 4 }]}>
          مصروفاتي v1.0.0 · متصل بالسيرفر
        </Text>
      </ScrollView>
    </Screen>
  );
}

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <Pressable
      style={[shared.card, shared.row]}
      onPress={() => router.push(item.href as Parameters<typeof router.push>[0])}
    >
      <View style={shared.rowStart}>
        <View style={[shared.iconCircle, { backgroundColor: item.bg || colors.primarySoft }]}>
          <AppIcon name={item.icon} size={18} color={item.color || colors.primary} />
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={[shared.value, { fontSize: 15 }]}>{item.label}</Text>
          <Text style={[shared.label, { fontSize: 12 }]}>{item.desc}</Text>
        </View>
      </View>
      <AppIcon name="chevron-back" size={16} color={colors.faint} />
    </Pressable>
  );
}
