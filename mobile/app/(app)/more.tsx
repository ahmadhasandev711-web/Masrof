import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon, type IconName } from "@/components/icon";
import { colors, shared } from "@/lib/styles";
import { authClient } from "@/lib/auth-client";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

type MenuItem = {
  href: `/(app)/${string}`;
  label: string;
  desc: string;
  icon: IconName;
  color?: string;
  bg?: string;
};

export default function MoreScreen() {
  const { t, locale, toggleLocale, isRTL } = useI18n();
  const { data: session } = authClient.useSession();
  const { workspace, entitlements } = useWorkspace();

  const planLabel =
    entitlements?.plan === "pro"
      ? t.plan.pro
      : entitlements?.plan === "plus"
        ? t.plan.plus
        : t.plan.free;

  const FINANCIAL_SECTION: MenuItem[] = [
    {
      href: "/(app)/accounts",
      label: t.accounts.title,
      desc: t.more.accountsDesc,
      icon: "wallet",
      color: colors.primary,
      bg: colors.primarySoft,
    },
    {
      href: "/(app)/invoices",
      label: t.invoices.title,
      desc: t.more.reportsDesc,
      icon: "receipt",
      color: colors.info,
      bg: colors.infoSoft,
    },
    {
      href: "/(app)/transfers",
      label: t.transfers.title,
      desc: t.more.transfersDesc,
      icon: "swap-horizontal",
      color: colors.warning,
      bg: colors.warningSoft,
    },
    {
      href: "/(app)/recurring",
      label: t.recurring.title,
      desc: t.more.recurringDesc,
      icon: "repeat",
      color: colors.income,
      bg: colors.incomeSoft,
    },
    {
      href: "/(app)/categories",
      label: isRTL ? "التصنيفات" : "Categories",
      desc: t.more.categoriesDesc,
      icon: "pricetag",
      color: colors.primary,
      bg: colors.primarySoft,
    },
  ];

  const PLANNING_SECTION: MenuItem[] = [
    {
      href: "/(app)/budgets",
      label: t.budgets.title,
      desc: t.more.budgetsDesc,
      icon: "pie-chart",
      color: colors.income,
      bg: colors.incomeSoft,
    },
    {
      href: "/(app)/goals",
      label: t.goals.title,
      desc: t.more.goalsDesc,
      icon: "flag",
      color: colors.primary,
      bg: colors.primarySoft,
    },
    {
      href: "/(app)/reports",
      label: t.reports.title,
      desc: t.more.reportsDesc,
      icon: "bar-chart",
      color: colors.info,
      bg: colors.infoSoft,
    },
  ];

  const SETTINGS_SECTION: MenuItem[] = [
    {
      href: "/(app)/settings",
      label: t.settings.title,
      desc: t.more.settingsDesc,
      icon: "business",
      color: colors.muted,
      bg: "#F3F4F6",
    },
    {
      href: "/(app)/plan",
      label: t.plan.title,
      desc: t.more.planDesc,
      icon: "star",
      color: colors.warning,
      bg: colors.warningSoft,
    },
    {
      href: "/(app)/team",
      label: t.team.title,
      desc: t.more.teamDesc,
      icon: "people",
      color: colors.primary,
      bg: colors.primarySoft,
    },
  ];

  return (
    <Screen title={t.more.title}>
      <ScrollView
        contentContainerStyle={{ gap: 14, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* User Card */}
        <View style={shared.card}>
          <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={shared.iconCircle}>
                <AppIcon name="people" size={20} color={colors.primary} />
              </View>
              <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                <Text style={[shared.value, { fontSize: 16 }]}>
                  {session?.user.name || session?.user.email}
                </Text>
                <Text style={[shared.label, { fontSize: 12 }]}>
                  {workspace?.name} · {planLabel}
                </Text>
              </View>
            </View>
            <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
              <Text style={[shared.badgeText, { color: colors.primary }]}>{planLabel}</Text>
            </View>
          </View>
        </View>

        {/* Language Switcher Card */}
        <Pressable
          style={[
            shared.card,
            shared.row,
            {
              backgroundColor: colors.primarySoft,
              borderColor: colors.primaryBorder,
              flexDirection: isRTL ? "row-reverse" : "row",
            },
          ]}
          onPress={() => toggleLocale()}
        >
          <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[shared.iconCircle, { backgroundColor: "#FFFFFF" }]}>
              <AppIcon name="globe" size={18} color={colors.primary} />
            </View>
            <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
              <Text style={[shared.value, { fontSize: 15, color: colors.primary }]}>
                {t.more.language}
              </Text>
              <Text style={[shared.label, { fontSize: 12, color: colors.primary }]}>
                {locale === "ar" ? "اللغة الحالية: العربية (اضغط للتحويل إلى English)" : "Current: English (Tap to switch to العربية)"}
              </Text>
            </View>
          </View>
          <View
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: "#FFFFFF", fontWeight: "700", fontSize: 12 }}>
              {t.more.changeLang}
            </Text>
          </View>
        </Pressable>

        {/* Financial Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
            {t.more.financialSection}
          </Text>
          {FINANCIAL_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} isRTL={isRTL} />
          ))}
        </View>

        {/* Planning Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
            {t.reports.title} & {t.budgets.title}
          </Text>
          {PLANNING_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} isRTL={isRTL} />
          ))}
        </View>

        {/* Settings Section */}
        <View style={{ gap: 8 }}>
          <Text style={[shared.label, { fontWeight: "700", textAlign: isRTL ? "right" : "left" }]}>
            {t.more.managementSection}
          </Text>
          {SETTINGS_SECTION.map((item) => (
            <MenuCard key={item.href} item={item} isRTL={isRTL} />
          ))}
        </View>

        {/* Sign Out Button */}
        <Pressable
          style={[
            shared.card,
            shared.row,
            { borderColor: "#FECACA", marginTop: 4, flexDirection: isRTL ? "row-reverse" : "row" },
          ]}
          onPress={() => {
            Alert.alert(t.more.logout, t.more.confirmLogout, [
              { text: t.common.cancel, style: "cancel" },
              { text: t.more.logout, style: "destructive", onPress: () => authClient.signOut() },
            ]);
          }}
        >
          <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
            <View style={[shared.iconCircle, { backgroundColor: colors.expenseSoft }]}>
              <AppIcon name="log-out" size={18} color={colors.expense} />
            </View>
            <Text style={[shared.value, { color: colors.expenseText, fontSize: 15 }]}>
              {t.more.logout}
            </Text>
          </View>
          <AppIcon
            name={isRTL ? "chevron-back" : "chevron-forward"}
            size={16}
            color={colors.expense}
          />
        </Pressable>

        <Text style={[shared.label, { textAlign: "center", fontSize: 11, marginTop: 4 }]}>
          Masrofaty Mobile v1.0.0
        </Text>
      </ScrollView>
    </Screen>
  );
}

function MenuCard({ item, isRTL }: { item: MenuItem; isRTL: boolean }) {
  return (
    <Pressable
      style={[shared.card, shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}
      onPress={() => router.push(item.href as Parameters<typeof router.push>[0])}
    >
      <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
        <View style={[shared.iconCircle, { backgroundColor: item.bg || colors.primarySoft }]}>
          <AppIcon name={item.icon} size={18} color={item.color || colors.primary} />
        </View>
        <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
          <Text style={[shared.value, { fontSize: 15 }]}>{item.label}</Text>
          <Text style={[shared.label, { fontSize: 12 }]}>{item.desc}</Text>
        </View>
      </View>
      <AppIcon
        name={isRTL ? "chevron-back" : "chevron-forward"}
        size={16}
        color={colors.faint}
      />
    </Pressable>
  );
}
