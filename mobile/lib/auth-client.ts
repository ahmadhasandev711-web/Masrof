import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "@/lib/config";

export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    // expoClient types are slightly behind better-auth's client plugin type.
    expoClient({
      scheme: "masrofaty",
      storagePrefix: "masrofaty",
      storage: SecureStore,
    }) as never,
  ],
});

export function getAuthCookie(): string {
  return (authClient as typeof authClient & { getCookie: () => string }).getCookie();
}
