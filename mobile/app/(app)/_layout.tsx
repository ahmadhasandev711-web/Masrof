import { Stack, Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { authClient } from "@/lib/auth-client";
import { useWorkspace } from "@/lib/workspace";
import { colors } from "@/lib/styles";

export default function AppLayout() {
  const { data: session, isPending } = authClient.useSession();
  const { workspaces, loading: wsLoading, workspaceId } = useWorkspace();

  if (isPending || wsLoading || (workspaces.length > 0 && !workspaceId)) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  if (workspaces.length === 0) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="transaction-new" options={{ presentation: "modal" }} />
      <Stack.Screen name="invoice-new" options={{ presentation: "modal" }} />
      <Stack.Screen name="debt-new" options={{ presentation: "modal" }} />
      <Stack.Screen name="debts" />
      <Stack.Screen name="accounts" />
      <Stack.Screen name="invoices" />
      <Stack.Screen name="transfers" />
      <Stack.Screen name="categories" />
      <Stack.Screen name="budgets" />
      <Stack.Screen name="goals" />
      <Stack.Screen name="reports" />
      <Stack.Screen name="plan" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="team" />
      <Stack.Screen name="recurring" />
    </Stack>
  );
}
