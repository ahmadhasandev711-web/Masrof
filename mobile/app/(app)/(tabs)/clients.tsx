import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { FlatList, Linking, Modal, Platform, Pressable, RefreshControl, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { Field, FormBanner, PrimaryButton } from "@/components/forms";
import { createClient, fetchClients } from "@/lib/api";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { useWriteAccess } from "@/lib/write-access";

type ClientRow = {
  _id: string;
  name: string;
  email: string | null;
  phone: string | null;
  projectCount: number;
};

export default function ClientsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId } = useWorkspace();
  const { headerAction } = useWriteAccess();
  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const data = await fetchClients(workspaceId, skipCache);
      setItems(data.items);
    } catch (err) {
      setLoadError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL ? "تعذر تحميل العملاء. تحقق من الاتصال." : "Failed to load clients. Check your connection.",
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

  async function onCreate() {
    if (!workspaceId || name.trim().length < 2) {
      setError(isRTL ? "يرجى إدخال اسم العميل (حرفين على الأقل)" : "Enter client name (min 2 chars)");
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
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setPhone("");
      setEmail("");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر إضافة العميل" : "Failed to add client"));
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
      title={t.clients.title}
      {...headerAction(t.clients.add, "add", () => {
        setError(null);
        setOpen(true);
      })}
    >
      {/* Search Input */}
      <View style={{ marginBottom: 6 }}>
        <TextInput
          style={[shared.input, { textAlign: isRTL ? "right" : "left" }]}
          placeholder={t.clients.searchPlaceholder}
          placeholderTextColor={colors.faint}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {loading && items.length === 0 ? (
        <ListSkeleton count={5} />
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
          keyExtractor={(item) => item._id}
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
            <AppIcon name="people-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>
              {search ? (isRTL ? "لا توجد نتائج مطابقة للبحث" : "No matching clients found") : t.clients.noClients}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={shared.card}>
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={shared.iconCircle}>
                  <AppIcon name="people" size={18} color={colors.primary} />
                </View>
                <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                  <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                  <Text style={[shared.label, { fontSize: 12 }]}>
                    {[item.phone, item.email].filter(Boolean).join(" · ") || (isRTL ? "بدون بيانات اتصال" : "No contact info")}
                  </Text>
                </View>
              </View>

              <View style={[shared.badge, { backgroundColor: colors.primarySoft }]}>
                <Text style={[shared.badgeText, { color: colors.primary }]}>
                  {item.projectCount} {isRTL ? "مشاريع" : "projects"}
                </Text>
              </View>
            </View>

            {/* Quick Contact Actions */}
            {(item.phone || item.email) && (
              <View
                style={{
                  flexDirection: isRTL ? "row-reverse" : "row",
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
                      style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                      onPress={() => Linking.openURL(`tel:${item.phone}`)}
                    >
                      <AppIcon name="call" size={14} color={colors.primary} />
                      <Text style={shared.buttonSecondaryText}>{t.clients.call}</Text>
                    </Pressable>
                    <Pressable
                      style={[shared.buttonSecondary, { backgroundColor: colors.incomeSoft, borderColor: "#A7F3D0", flexDirection: isRTL ? "row-reverse" : "row" }]}
                      onPress={() =>
                        Linking.openURL(
                          `https://wa.me/${item.phone?.replace(/[^0-9]/g, "")}`
                        )
                      }
                    >
                      <Text style={[shared.buttonSecondaryText, { color: colors.incomeText }]}>
                        {t.clients.whatsapp}
                      </Text>
                    </Pressable>
                  </>
                ) : null}

                {item.email ? (
                  <Pressable
                    style={[shared.buttonSecondary, { flexDirection: isRTL ? "row-reverse" : "row" }]}
                    onPress={() => Linking.openURL(`mailto:${item.email}`)}
                  >
                    <AppIcon name="mail" size={14} color={colors.primary} />
                    <Text style={shared.buttonSecondaryText}>{t.clients.email}</Text>
                  </Pressable>
                ) : null}
              </View>
            )}
          </View>
        )}
      />
      )}

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
            <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Text style={[shared.value, { fontSize: 18 }]}>{t.clients.newTitle}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Field
              label={t.clients.namePlaceholder}
              placeholder={isRTL ? "مثال: شركة النور، أحمد علي..." : "e.g. Acme Corp, John Doe..."}
              value={name}
              onChangeText={setName}
              isRTL={isRTL}
            />

            <Field
              label={t.clients.phonePlaceholder}
              placeholder="01000000000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              isRTL={isRTL}
            />

            <Field
              label={t.clients.emailPlaceholder}
              placeholder="client@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              isRTL={isRTL}
            />

            {error ? <FormBanner message={error} isRTL={isRTL} /> : null}

            <PrimaryButton label={t.common.save} onPress={onCreate} loading={busy} disabled={busy} isRTL={isRTL} />
          </Pressable>
        </Pressable>
      </Modal>
    </Screen>
  );
}
