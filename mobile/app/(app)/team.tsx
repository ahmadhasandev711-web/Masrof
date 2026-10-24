import { useCallback, useState } from "react";
import { FlatList, Platform, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { PlanGate } from "@/components/plan-gate";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { EmptyState } from "@/components/empty-state";
import { fetchTeam } from "@/lib/api";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

const ROLE_HELP: Record<string, { ar: string; en: string }> = {
  owner: {
    ar: "صلاحيات كاملة بما فيها الفوترة وإدارة الأعضاء.",
    en: "Full access including billing and member management.",
  },
  admin: {
    ar: "إدارة البيانات المالية دون حذف المساحة.",
    en: "Manage financial data without deleting the workspace.",
  },
  member: {
    ar: "إضافة وتعديل المعاملات والفواتير.",
    en: "Create and edit transactions and invoices.",
  },
  viewer: {
    ar: "عرض التقارير فقط دون تعديل.",
    en: "View reports only; cannot edit data.",
  },
};

export default function TeamScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, hasFeature } = useWorkspace();
  const [members, setMembers] = useState<
    { userId: string; name: string; email: string; role: string }[]
  >([]);
  const [invitations, setInvitations] = useState<{ id: string; email: string; role: string }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const ROLE_MAP: Record<string, { label: string; bg: string; text: string }> = {
    owner: { label: isRTL ? "المالك" : "Owner", bg: colors.primarySoft, text: colors.primary },
    admin: { label: isRTL ? "مدير" : "Admin", bg: colors.infoSoft, text: colors.infoText },
    member: { label: isRTL ? "عضو" : "Member", bg: "#F3F4F6", text: colors.muted },
    viewer: { label: isRTL ? "مشاهد" : "Viewer", bg: "#F3F4F6", text: colors.muted },
  };

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const data = await fetchTeam(workspaceId, skipCache);
      setMembers(data.members);
      setInvitations(data.invitations ?? []);
    } catch (err) {
      setLoadError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL
            ? "تعذر تحميل الفريق. تحقق من الاتصال."
            : "Failed to load team. Check your connection.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  useFocusEffect(
    useCallback(() => {
      void load(true);
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load(true);
    } finally {
      setRefreshing(false);
    }
  }

  if (!hasFeature("teamWorkspace")) {
    return (
      <Screen title={t.team.title} showBack>
        <PlanGate
          title={isRTL ? "مساحة فريق العمل" : "Team Workspace"}
          description={
            isRTL
              ? "إضافة أعضاء لفريق العمل، وتوزيع الصلاحيات (مدير / محاسب / مشاهد) متاح لمشتركي باقة PRO."
              : "Invite team members and assign roles (admin / member / viewer) on the PRO plan."
          }
        />
      </Screen>
    );
  }

  if (loading && members.length === 0 && !loadError) {
    return (
      <Screen title={t.team.title} showBack>
        <ListSkeleton count={4} />
      </Screen>
    );
  }

  if (loadError && members.length === 0) {
    return (
      <Screen title={t.team.title} showBack>
        <ErrorView
          message={loadError}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
      </Screen>
    );
  }

  return (
    <Screen title={t.team.title} showBack>
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        removeClippedSubviews={Platform.OS === "android"}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={10}
        windowSize={7}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            message={isRTL ? "لا يوجد أعضاء مضافين بعد" : "No team members yet"}
            isRTL={isRTL}
          />
        }
        ListHeaderComponent={
          <>
            {invitations.length > 0 ? (
              <View
                style={[
                  shared.card,
                  { backgroundColor: colors.warningSoft, borderColor: "#FDE68A", marginBottom: 6 },
                ]}
              >
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <AppIcon name="mail" size={18} color={colors.warning} />
                  <Text style={[shared.value, { fontSize: 13, color: colors.warningText }]}>
                    {isRTL
                      ? `توجد ${invitations.length} دعوات بانتظار القبول`
                      : `${invitations.length} pending invitations`}
                  </Text>
                </View>
                {invitations.map((inv) => {
                  const roleLabel = ROLE_MAP[inv.role]?.label ?? inv.role;
                  const help = ROLE_HELP[inv.role];
                  return (
                    <Text
                      key={inv.id}
                      style={[shared.label, { marginTop: 6, textAlign: isRTL ? "right" : "left" }]}
                    >
                      {inv.email} · {roleLabel}
                      {help ? ` — ${isRTL ? help.ar : help.en}` : ""}
                    </Text>
                  );
                })}
              </View>
            ) : null}
            <View style={[shared.card, { marginBottom: 6, backgroundColor: colors.infoSoft }]}>
              <Text style={[shared.label, { textAlign: isRTL ? "right" : "left", color: colors.infoText }]}>
                {isRTL
                  ? "الأدوار: المالك (كامل) · المدير (إدارة) · العضو (كتابة) · المشاهد (عرض فقط)."
                  : "Roles: Owner (full) · Admin (manage) · Member (write) · Viewer (read-only)."}
              </Text>
            </View>
          </>
        }
        renderItem={({ item }) => {
          const roleConf = ROLE_MAP[item.role] ?? {
            label: item.role,
            bg: colors.primarySoft,
            text: colors.primary,
          };
          const help = ROLE_HELP[item.role];
          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={shared.iconCircle}>
                    <AppIcon name="people" size={18} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start", flex: 1 }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>
                      {item.name || item.email.split("@")[0]}
                    </Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>{item.email}</Text>
                    {help ? (
                      <Text style={[shared.label, { fontSize: 11, marginTop: 4 }]}>
                        {isRTL ? help.ar : help.en}
                      </Text>
                    ) : null}
                  </View>
                </View>

                <View style={[shared.badge, { backgroundColor: roleConf.bg }]}>
                  <Text style={[shared.badgeText, { color: roleConf.text }]}>{roleConf.label}</Text>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={[shared.label, { textAlign: "center", marginTop: 8 }]}>
            {isRTL
              ? "إرسال دعوات جديدة وإدارة الصلاحيات متاحة بالكامل عبر لوحة الويب."
              : "Sending invites and permission management are available on the web portal."}
          </Text>
        }
      />
    </Screen>
  );
}
