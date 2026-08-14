import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchTeam } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

export default function TeamScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId } = useWorkspace();
  const [members, setMembers] = useState<
    { userId: string; name: string; email: string; role: string }[]
  >([]);
  const [invitations, setInvitations] = useState<{ id: string; email: string; role: string }[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);

  const ROLE_MAP: Record<string, { label: string; bg: string; text: string }> = {
    owner: { label: isRTL ? "المالك" : "Owner", bg: colors.primarySoft, text: colors.primary },
    admin: { label: isRTL ? "مدير" : "Admin", bg: colors.infoSoft, text: colors.infoText },
    member: { label: isRTL ? "عضو" : "Member", bg: "#F3F4F6", text: colors.muted },
    viewer: { label: isRTL ? "مشاهد" : "Viewer", bg: "#F3F4F6", text: colors.muted },
  };

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    const data = await fetchTeam(workspaceId, skipCache);
    setMembers(data.members);
    setInvitations(data.invitations ?? []);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {
        setMembers([]);
        setInvitations([]);
      });
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

  return (
    <Screen title={t.team.title} showBack>
      <FlatList
        data={members}
        keyExtractor={(item) => item.userId}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 10, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="people-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {isRTL ? "لا يوجد أعضاء مضافين" : "No team members found"}
            </Text>
          </View>
        }
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View style={[shared.card, { backgroundColor: colors.warningSoft, borderColor: "#FDE68A", marginBottom: 6 }]}>
              <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <AppIcon name="mail" size={18} color={colors.warning} />
                <Text style={[shared.value, { fontSize: 13, color: colors.warningText }]}>
                  {isRTL ? `توجد ${invitations.length} دعوات بانتظار القبول` : `${invitations.length} pending invitations`}
                </Text>
              </View>
            </View>
          ) : null
        }
        renderItem={({ item }) => {
          const roleConf = ROLE_MAP[item.role] ?? {
            label: item.role,
            bg: colors.primarySoft,
            text: colors.primary,
          };
          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={shared.iconCircle}>
                    <AppIcon name="people" size={18} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>
                      {item.name || item.email.split("@")[0]}
                    </Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>{item.email}</Text>
                  </View>
                </View>

                <View style={[shared.badge, { backgroundColor: roleConf.bg }]}>
                  <Text style={[shared.badgeText, { color: roleConf.text }]}>
                    {roleConf.label}
                  </Text>
                </View>
              </View>
            </View>
          );
        }}
        ListFooterComponent={
          <Text style={[shared.label, { textAlign: "center", marginTop: 8 }]}>
            {isRTL ? "إرسال دعوات جديدة وإدارة الصلاحيات متاحة بالكامل عبر لوحة الويب." : "Sending invites and permission management are available on the web portal."}
          </Text>
        }
      />
    </Screen>
  );
}
