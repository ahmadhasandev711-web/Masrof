import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { createProject, fetchClients, fetchProjects } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

type ProjectRow = {
  _id: string;
  name: string;
  clientName?: string;
  clientId?: string;
  status: string;
  expectedAmount?: number;
  paidTotal?: number;
};

const PROJECT_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "قيد التنفيذ", bg: colors.primarySoft, text: colors.primary },
  completed: { label: "مكتمل", bg: colors.incomeSoft, text: colors.incomeText },
  on_hold: { label: "متوقف مؤقتاً", bg: colors.warningSoft, text: colors.warningText },
  cancelled: { label: "ملغي", bg: colors.expenseSoft, text: colors.expenseText },
};

export default function ProjectsScreen() {
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [expected, setExpected] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const [projects, clientData] = await Promise.all([
      fetchProjects(workspaceId),
      fetchClients(workspaceId),
    ]);
    setItems(projects.items as unknown as ProjectRow[]);
    setClients(clientData.items);
  }, [workspaceId]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => setItems([]));
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

  async function onCreate() {
    if (!workspaceId || name.trim().length < 2) {
      setError("يرجى إدخال اسم المشروع (حرفين على الأقل)");
      return;
    }
    const exp = expected ? Number(expected) : null;
    if (exp !== null && (!Number.isFinite(exp) || exp < 0)) {
      setError("أدخل مبلغاً صحيحاً");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await createProject({
        workspaceId,
        name: name.trim(),
        clientId: clientId ?? undefined,
        expectedAmount: exp,
        status: "active",
      });
      setOpen(false);
      setName("");
      setExpected("");
      setClientId(null);
      await load();
    } catch {
      setError("تعذر إنشاء المشروع");
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.name || "").toLowerCase().includes(q) ||
      (item.clientName || "").toLowerCase().includes(q)
    );
  });

  return (
    <Screen
      title="المشاريع"
      actionLabel="+ مشروع"
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={shared.input}
          placeholder="بحث باسم المشروع أو العميل..."
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => String(item._id)}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="briefcase-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {search ? "لا توجد نتائج مطابقة للبحث" : "لا توجد مشاريع مضافة بعد"}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const statusConf = PROJECT_STATUS_MAP[item.status] ?? {
            label: item.status || "نشط",
            bg: colors.primarySoft,
            text: colors.primary,
          };
          const exp = Number(item.expectedAmount ?? 0);
          const paid = Number(item.paidTotal ?? 0);
          const pct = exp > 0 ? Math.min(100, Math.round((paid / exp) * 100)) : 0;

          return (
            <View style={shared.card}>
              <View style={shared.row}>
                <View style={shared.rowStart}>
                  <View style={shared.iconCircle}>
                    <AppIcon name="briefcase" size={18} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>
                      👤 {item.clientName || "بدون عميل مرتبط"}
                    </Text>
                  </View>
                </View>

                <View style={[shared.badge, { backgroundColor: statusConf.bg }]}>
                  <Text style={[shared.badgeText, { color: statusConf.text }]}>
                    {statusConf.label}
                  </Text>
                </View>
              </View>

              {exp > 0 ? (
                <View style={{ gap: 4, marginTop: 4 }}>
                  <View style={shared.row}>
                    <Text style={shared.label}>
                      المحصل: {formatMoney(paid, currency)}
                    </Text>
                    <Text style={shared.label}>
                      المتوقع: {formatMoney(exp, currency)} ({pct}%)
                    </Text>
                  </View>
                  <View style={shared.progressBarBg}>
                    <View
                      style={[
                        shared.progressBarFill,
                        {
                          width: `${pct}%`,
                          backgroundColor: pct >= 100 ? colors.income : colors.primary,
                        },
                      ]}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          );
        }}
      />

      {/* Add Project Modal */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "#00000066" }}
          onPress={() => setOpen(false)}
        >
          <Pressable
            style={[
              shared.card,
              {
                borderBottomLeftRadius: 0,
                borderBottomRightRadius: 0,
                paddingBottom: 36,
                gap: 12,
              },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={shared.row}>
              <Text style={shared.title}>إضافة مشروع جديد</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>اسم المشروع</Text>
            <TextInput
              style={shared.input}
              placeholder="مثال: تطبيق متجر إلكتروني، حملة تسويقية..."
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={shared.label}>المبلغ المتوقع / قيمة المشروع ({currency})</Text>
            <TextInput
              style={[shared.input, { fontSize: 18, fontWeight: "700", color: colors.primary }]}
              placeholder="0.00 (اختياري)"
              placeholderTextColor={colors.faint}
              keyboardType="decimal-pad"
              value={expected}
              onChangeText={setExpected}
            />

            {clients.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={shared.label}>ربط بالعميل (اختياري)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  <Pressable
                    onPress={() => setClientId(null)}
                    style={[
                      shared.chip,
                      clientId === null && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text style={[shared.chipText, clientId === null && { color: "#FFFFFF" }]}>
                      بدون عميل
                    </Text>
                  </Pressable>
                  {clients.map((c) => {
                    const active = clientId === c._id;
                    return (
                      <Pressable
                        key={c._id}
                        onPress={() => setClientId(c._id)}
                        style={[
                          shared.chip,
                          active && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        <Text style={[shared.chipText, active && { color: "#FFFFFF" }]}>
                          👤 {c.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {error ? <Text style={shared.error}>{error}</Text> : null}

            <Pressable
              style={[shared.button, busy && { opacity: 0.7 }]}
              onPress={onCreate}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <AppIcon name="checkmark" size={18} color="#FFFFFF" />
                  <Text style={shared.buttonText}>حفظ المشروع</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
