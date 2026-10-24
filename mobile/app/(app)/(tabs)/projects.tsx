import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Platform,
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
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { createProject, fetchClients, fetchProjects } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";

type ProjectRow = {
  _id: string;
  name: string;
  clientName?: string;
  clientId?: string;
  status: string;
  expectedAmount?: number;
  paidTotal?: number;
};

export default function ProjectsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const [items, setItems] = useState<ProjectRow[]>([]);
  const [clients, setClients] = useState<{ _id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<string | null>(null);
  const [expected, setExpected] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const PROJECT_STATUS_MAP: Record<string, { label: string; bg: string; text: string }> = {
    active: { label: isRTL ? "قيد التنفيذ" : "Active", bg: colors.primarySoft, text: colors.primary },
    completed: { label: isRTL ? "مكتمل" : "Completed", bg: colors.incomeSoft, text: colors.incomeText },
    on_hold: { label: isRTL ? "متوقف مؤقتاً" : "On Hold", bg: colors.warningSoft, text: colors.warningText },
    cancelled: { label: isRTL ? "ملغي" : "Cancelled", bg: colors.expenseSoft, text: colors.expenseText },
  };

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const [projects, clientData] = await Promise.all([
        fetchProjects(workspaceId, skipCache),
        fetchClients(workspaceId, skipCache),
      ]);
      setItems(projects.items as unknown as ProjectRow[]);
      setClients(clientData.items);
    } catch {
      setLoadError(
        isRTL
          ? "تعذر تحميل المشاريع. يرجى التحقق من الاتصال بالإنترنت."
          : "Failed to load projects. Please check your network connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  useFocusEffect(
    useCallback(() => {
      void load();
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

  async function onCreate() {
    if (!workspaceId || name.trim().length < 2) {
      setError(isRTL ? "يرجى إدخال اسم المشروع (حرفين على الأقل)" : "Enter project name (min 2 chars)");
      return;
    }
    const exp = expected ? Number(expected) : null;
    if (exp !== null && (!Number.isFinite(exp) || exp < 0)) {
      setError(isRTL ? "أدخل مبلغاً صحيحاً" : "Enter a valid amount");
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
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setExpected("");
      setClientId(null);
      await load(true);
    } catch {
      setError(isRTL ? "تعذر إنشاء المشروع" : "Failed to create project");
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
      title={isRTL ? "المشاريع" : "Projects"}
      actionLabel={isRTL ? "+ مشروع" : "+ Project"}
      actionIcon="add"
      onAction={() => {
        setError(null);
        setOpen(true);
      }}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={isRTL ? "بحث باسم المشروع أو العميل..." : "Search project or client..."}
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && items.length === 0 ? (
        <ListSkeleton count={4} />
      ) : loadError && items.length === 0 ? (
        <ErrorView
          message={loadError}
          onRetry={() => {
            setLoading(true);
            void load(true);
          }}
        />
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item._id)}
          removeClippedSubviews={Platform.OS === "android"}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          initialNumToRender={10}
          windowSize={7}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
          contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={shared.center}>
              <AppIcon name="briefcase-outline" size={44} color={colors.faint} />
              <Text style={[shared.empty, { paddingVertical: 12 }]}>
                {search ? (isRTL ? "لا توجد نتائج مطابقة للبحث" : "No matching projects found") : (isRTL ? "لا توجد مشاريع مضافة بعد" : "No projects added yet")}
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const statusConf = PROJECT_STATUS_MAP[item.status] ?? {
              label: item.status || (isRTL ? "نشط" : "Active"),
              bg: colors.primarySoft,
              text: colors.primary,
            };
            const exp = Number(item.expectedAmount ?? 0);
            const paid = Number(item.paidTotal ?? 0);
            const pct = exp > 0 ? Math.min(100, Math.round((paid / exp) * 100)) : 0;

            return (
              <View style={shared.card}>
                <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                    <View style={shared.iconCircle}>
                      <AppIcon name="briefcase" size={18} color={colors.primary} />
                    </View>
                    <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                      <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                      <View style={[shared.rowStart, { gap: 4, flexDirection: isRTL ? "row-reverse" : "row" }]}>
                        <AppIcon name="people-outline" size={12} color={colors.faint} />
                        <Text style={[shared.label, { fontSize: 12 }]}>
                          {item.clientName || (isRTL ? "بدون عميل مرتبط" : "No linked client")}
                        </Text>
                      </View>
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
                    <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                      <Text style={shared.label}>
                        {isRTL ? "المحصل" : "Collected"}: {formatMoney(paid, currency)}
                      </Text>
                      <Text style={shared.label}>
                        {isRTL ? "المتوقع" : "Expected"}: {formatMoney(exp, currency)} ({pct}%)
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
      )}

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
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[shared.value, { fontSize: 18 }]}>
                {isRTL ? "إضافة مشروع جديد" : "New Project"}
              </Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "اسم المشروع" : "Project Name"}
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder={isRTL ? "مثال: تطبيق متجر إلكتروني، حملة تسويقية..." : "e.g. Mobile App, Branding Campaign..."}
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {isRTL ? "المبلغ المتوقع / قيمة المشروع" : "Expected Budget"} ({currency})
            </Text>
            <TextInput
              style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
              placeholder="0.00"
              placeholderTextColor={colors.faint}
              keyboardType="numeric"
              value={expected}
              onChangeText={setExpected}
            />

            {clients.length > 0 ? (
              <View style={{ gap: 6 }}>
                <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
                  {isRTL ? "ربط بالعميل (اختياري)" : "Link Client (Optional)"}
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, flexDirection: isRTL ? "row-reverse" : "row" }}
                >
                  <Pressable
                    onPress={() => setClientId(null)}
                    style={[
                      shared.chip,
                      clientId === null && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                  >
                    <Text
                      style={[
                        shared.chipText,
                        clientId === null && { color: "#FFFFFF", fontWeight: "700" },
                      ]}
                    >
                      {isRTL ? "بدون عميل" : "No Client"}
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
                          { flexDirection: isRTL ? "row-reverse" : "row", alignItems: "center", gap: 6 },
                          active && { backgroundColor: colors.primary, borderColor: colors.primary },
                        ]}
                      >
                        <AppIcon
                          name="people-outline"
                          size={13}
                          color={active ? "#FFFFFF" : colors.primary}
                        />
                        <Text
                          style={[
                            shared.chipText,
                            active && { color: "#FFFFFF", fontWeight: "700" },
                          ]}
                        >
                          {c.name}
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
                <Text style={shared.buttonText}>{t.common.save}</Text>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
