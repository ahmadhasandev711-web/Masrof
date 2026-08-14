import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { createClient, fetchClients } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";

type ClientRow = {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  projectCount: number;
};

export default function ClientsScreen() {
  const { workspaceId } = useWorkspace();
  const [items, setItems] = useState<ClientRow[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workspaceId) return;
    const data = await fetchClients(workspaceId);
    setItems(data.items);
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
      setError("يرجى إدخال اسم العميل (حرفين على الأقل)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createClient({
        workspaceId,
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
      });
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      await load();
    } catch {
      setError("تعذر إضافة العميل");
    } finally {
      setBusy(false);
    }
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      (item.phone || "").toLowerCase().includes(q) ||
      (item.email || "").toLowerCase().includes(q)
    );
  });

  return (
    <Screen
      title="العملاء"
      actionLabel="+ عميل"
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
          placeholder="بحث باسم العميل، الهاتف، أو البريد..."
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
        contentContainerStyle={{ gap: 12, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={shared.center}>
            <AppIcon name="people-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {search ? "لا توجد نتائج مطابقة للبحث" : "لا يوجد عملاء مضافين بعد"}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={shared.card}>
            <View style={shared.row}>
              <View style={shared.rowStart}>
                <View style={shared.iconCircle}>
                  <AppIcon name="people" size={18} color={colors.primary} />
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    {[item.phone, item.email].filter(Boolean).join(" · ") || "بدون بيانات اتصال"}
                  </Text>
                </View>
              </View>

              <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[shared.badgeText, { color: colors.primary }]}>
                  {item.projectCount} مشاريع
                </Text>
              </View>
            </View>

            {/* Quick Contact Actions */}
            {(item.phone || item.email) && (
              <View
                style={{
                  flexDirection: "row-reverse",
                  gap: 8,
                  marginTop: 6,
                  borderTopWidth: 1,
                  borderTopColor: colors.borderLight,
                  paddingTop: 8,
                }}
              >
                {item.phone ? (
                  <>
                    <Pressable
                      style={shared.buttonSecondary}
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                    >
                      <AppIcon name="call" size={14} color={colors.primary} />
                      <Text style={shared.buttonSecondaryText}>اتصال</Text>
                    </Pressable>
                    <Pressable
                      style={[shared.buttonSecondary, { backgroundColor: colors.incomeSoft, borderColor: "#A7F3D0" }]}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${item.phone?.replace(/[^0-9]/g, "")}`
                        )
                      }
                    >
                      <Text style={[shared.buttonSecondaryText, { color: colors.incomeText }]}>
                        واتساب
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                {item.email ? (
                  <Pressable
                    style={shared.buttonSecondary}
                    onPress={() => Linking.openURL(`mailto:${item.email}`)}
                  >
                    <AppIcon name="mail" size={14} color={colors.primary} />
                    <Text style={shared.buttonSecondaryText}>إيميل</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        )}
      />

      {/* Add Client Modal */}
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
              <Text style={shared.title}>إضافة عميل جديد</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.muted} />
              </Pressable>
            </View>

            <Text style={shared.label}>اسم العميل / الشركة</Text>
            <TextInput
              style={shared.input}
              placeholder="مثال: شركة النور، أحمد علي..."
              placeholderTextColor={colors.faint}
              value={name}
              onChangeText={setName}
            />

            <Text style={shared.label}>رقم الهاتف / الواتساب (اختياري)</Text>
            <TextInput
              style={shared.input}
              placeholder="01000000000"
              placeholderTextColor={colors.faint}
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />

            <Text style={shared.label}>البريد الإلكتروني (اختياري)</Text>
            <TextInput
              style={shared.input}
              placeholder="client@example.com"
              placeholderTextColor={colors.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

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
                  <Text style={shared.buttonText}>حفظ العميل</Text>
                </>
              )}
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
