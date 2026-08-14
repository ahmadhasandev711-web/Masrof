import { useEffect } from "react";
import { I18nManager } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "react-native-reanimated";
import { WorkspaceProvider } from "@/lib/workspace";
import { LanguageProvider } from "@/lib/i18n";
import { colors } from "@/lib/styles";

I18nManager.allowRTL(true);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <WorkspaceProvider>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="login" />
            <Stack.Screen name="(app)" />
          </Stack>
          <StatusBar style="dark" />
        </WorkspaceProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
