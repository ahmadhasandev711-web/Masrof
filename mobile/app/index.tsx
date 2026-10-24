import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/lib/styles";

export default function Index() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/" />;
}
