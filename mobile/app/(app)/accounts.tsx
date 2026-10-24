import { useCallback, useRef, useState } from "react";
import { newIdempotencyKey } from "@/lib/idempotency";
import { FlatList, Modal, Platform, Pressable, RefreshControl, Text, View } from "react-native";
import { useFocusEffect, router } from "expo-router";
import { Screen } from "@/components/screen";
import { AppIcon, type IconName } from "@/components/icon";
import { ListSkeleton } from "@/components/skeleton";
import { ErrorView } from "@/components/error-view";
import { AmountField, Field, FormBanner, PrimaryButton } from "@/components/forms";
import { createAccount, fetchAccounts, type AccountItem } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { colors, shared } from "@/lib/styles";
import { useWorkspace } from "@/lib/workspace";
import { useI18n } from "@/lib/i18n";
import { resolveApiErrorMessage } from "@/lib/api-errors";
import { useWriteAccess } from "@/lib/write-access";

export default function AccountsScreen() {
  const { t, isRTL } = useI18n();
  const { workspaceId, currency } = useWorkspace();
  const { headerAction } = useWriteAccess();
  const [items, setItems] = useState<AccountItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("cash");
  const [balance, setBalance] = useState("0");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const idempotencyRef = useRef(newIdempotencyKey());

  const ACCOUNT_TYPES: { value: string; label: string; icon: IconName }[] = [
    { value: "cash", label: t.accounts.cash, icon: "wallet" },
    { value: "bank", label: t.accounts.bank, icon: "card" },
    { value: "mobile_wallet", label: t.accounts.wallet, icon: "wallet" },
    { value: "savings", label: t.accounts.savings, icon: "star" },
    { value: "other", label: isRTL ? "أخرى" : "Other", icon: "list" },
  ];

  const load = useCallback(async (skipCache = false) => {
    if (!workspaceId) return;
    try {
      setLoadError(null);
      const data = await fetchAccounts(workspaceId, skipCache);
      setItems(data.items);
    } catch (err) {
      setLoadError(
        resolveApiErrorMessage(
          err,
          isRTL,
          isRTL ? "تعذر تحميل الحسابات. تحقق من الاتصال." : "Failed to load accounts. Check your connection.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [workspaceId, isRTL]);

  useFocusEffect(
    useCallback(() => {
      void load(true).catch(() => setItems([]));
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
      setError(isRTL ? "يرجى إدخال اسم الحساب (حرفين على الأقل)" : "Please enter account name (min 2 characters)");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createAccount({
        workspaceId,
        name: name.trim(),
        type,
        openingBalance: Number(balance) || 0,
        idempotencyKey: idempotencyRef.current,
      });
      idempotencyRef.current = newIdempotencyKey();
      setOpen(false);
      setName("");
      setBalance("0");
      await load(true);
    } catch (err) {
      setError(resolveApiErrorMessage(err, isRTL, isRTL ? "تعذر إنشاء الحساب" : "Failed to create account"));
    } finally {
      setBusy(false);
    }
  }

  const totalBalance = items.reduce((sum, a) => sum + (a.balance || 0), 0);

  return (
    <Screen
      title={t.accounts.title}
      showBack
      {...headerAction(t.accounts.add, "add", () => {
        setError(null);
        setOpen(true);
      })}
    >
      {/* Total Accounts Balance Header */}
      <View style={[shared.cardHighlighted, { marginBottom: 6 }]}>
        <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
          <Text style={shared.label}>{t.accounts.totalBalances}</Text>
          <Pressable
            style={[
              shared.buttonSecondary,
              { paddingVertical: 6, paddingHorizontal: 10, flexDirection: isRTL ? "row-reverse" : "row" },
            ]}
            onPress={() => router.push("/transfers")}
          >
            <AppIcon name="swap-horizontal" size={14} color={colors.primary} />
            <Text style={[shared.buttonSecondaryText, { fontSize: 12 }]}>{t.accounts.transfer}</Text>
          </Pressable>
        </View>
        <Text
          style={[
            shared.value,
            {
              fontSize: 24,
              color: colors.primary,
              fontWeight: "800",
              textAlign: isRTL ? "right" : "left",
            },
          ]}
        >
          {formatMoney(totalBalance, currency)}
        </Text>
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
          data={items}
          keyExtractor={(item) => item.id}
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
          <View style={shared.center}>
            <AppIcon name="wallet-outline" size={44} color={colors.faint} />
            <Text style={[shared.empty, { paddingVertical: 12 }]}>{t.accounts.noAccounts}</Text>
          </View>
        }
        renderItem={({ item }) => {
          const typeObj = ACCOUNT_TYPES.find((typeItem) => typeItem.value === item.type) ?? {
            label: item.type,
            icon: "wallet" as IconName,
          };
          return (
            <View style={shared.card}>
              <View style={[shared.row, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                <View style={[shared.rowStart, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
                  <View style={shared.iconCircle}>
                    <AppIcon name={typeObj.icon} size={20} color={colors.primary} />
                  </View>
                  <View style={{ alignItems: isRTL ? "flex-end" : "flex-start" }}>
                    <Text style={[shared.value, { fontSize: 16 }]}>{item.name}</Text>
                    <Text style={[shared.label, { fontSize: 12 }]}>{typeObj.label}</Text>
                  </View>
                </View>

                <Text
                  style={[
                    shared.value,
                    {
                      fontSize: 18,
                      color: item.balance >= 0 ? colors.income : colors.expense,
                      fontWeight: "800",
                    },
                  ]}
                >
                  {formatMoney(item.balance, item.currency || currency)}
                </Text>
              </View>
            </View>
          );
        }}
      />
      )}

      {/* Add Account Modal */}
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
              <Text style={[shared.value, { fontSize: 18 }]}>{t.accounts.newTitle}</Text>
              <Pressable onPress={() => setOpen(false)}>
                <AppIcon name="close" size={22} color={colors.text} />
              </Pressable>
            </View>

            <Field
              label={t.accounts.accountName}
              placeholder={isRTL ? "مثال: البنك الأهلي، كاش، فودافون كاش" : "e.g. Bank Account, Cash, Wallet"}
              value={name}
              onChangeText={setName}
              isRTL={isRTL}
            />

            <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
              {t.accounts.accountType}
            </Text>
            <View style={{ flexDirection: isRTL ? "row-reverse" : "row", flexWrap: "wrap", gap: 8 }}>
              {ACCOUNT_TYPES.map((typeItem) => (
                <Pressable
                  key={typeItem.value}
                  onPress={() => setType(typeItem.value)}
                  style={[
                    shared.chip,
                    type === typeItem.value && { backgroundColor: colors.primary, borderColor: colors.primary },
                  ]}
                >
                  <Text
                    style={[
                      shared.chipText,
                      type === typeItem.value && { color: "#FFFFFF", fontWeight: "700" },
                    ]}
                  >
                    {typeItem.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <AmountField
              label={t.accounts.openingBalance}
              currency={currency}
              value={balance}
              onChangeText={setBalance}
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
