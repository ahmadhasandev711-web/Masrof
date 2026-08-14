import { useCallback, useState } from "react";
import { FlatList, RefreshControl, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { fetchTeam } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

const ROLE_MAP: Record<string, { label: string; bg: string; text: string }> = {
  owner: { label: "المالك", bg: colors.primarySoft, text: colors.primary },
  admin: { label: "مدير", bg: colors.infoSoft, text: colors.infoText },
  member: { label: "عضو", bg: "#F3F4F6", text: colors.muted },
  viewer: { label: "مشاهد", bg: "#F3F4F6", text: colors.muted },
};

export default function TeamScreen() {
  const { workspaceId } = useWorkspace();
  const [members, setMembers] = useState<
    { userId: string; name: string; email: string; role: string }[]
  >([]);
  const [invitations, setInvitations] = useState<{ id: string; email: string; role: string }[]>(
    [],
  );
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchTeam(workspaceId);
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
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Screen title="فريق العمل" showBack>
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
            <Text style={[shared.empty, { paddingVertical: 12 }]}>لا يوجد أعضاء مضافين</Text>
          </View>
        }
        ListHeaderComponent={
          invitations.length > 0 ? (
            <View style={[shared.card, { backgroundColor: colors.warningSoft, borderColor: "#FDE68A", marginBottom: 6 }]}>
              <View style={shared.rowStart}>
                <AppIcon name="mail" size={18} color={colors.warning} />
                <Text style={[shared.value, { fontSize: 13, color: colors.warningText }]}>
                  توجد {invitations.length} دعوات بانتظار القبول من المدعوين
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
              <View style={shared.row}>
                <View style={shared.rowStart}>
                  <View style={shared.iconCircle}>
                    <AppIcon name="people" size={18} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
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
            إرسال دعوات جديدة وإدارة الصلاحيات متاحة بالكامل عبر لوحة الويب.
          </Text>
        }
      />
    </Screen>
  );
}
