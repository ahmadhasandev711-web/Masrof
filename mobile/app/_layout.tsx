import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: "#F3F0E8" } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
