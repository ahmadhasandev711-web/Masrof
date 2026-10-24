"use client";

import { useEffect } from "react";

export function CapacitorBridge() {
  useEffect(() => {
    // Only execute when running inside the native Capacitor iOS/Android shell
    const isNative =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((window as any).Capacitor?.isNativePlatform?.());

    if (!isNative) return;

    document.documentElement.classList.add("is-native-app");

    // In native app, never show the marketing landing page "/"
    if (window.location.pathname === "/" || window.location.pathname === "") {
      window.location.replace("/dashboard");
      return;
    }

    let cleanupBackButton: (() => void) | undefined;

    async function initNativePlugins() {
      try {
        const { App } = await import("@capacitor/app");
        const { StatusBar, Style } = await import("@capacitor/status-bar");
        const { SplashScreen } = await import("@capacitor/splash-screen");

        // 1. Hide splash screen smoothly once the web client is mounted
        await SplashScreen.hide().catch(() => {});

        // 2. Configure native Status Bar: dark icons on light cream background (#FBF9F4)
        await StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
        await StatusBar.setStyle({ style: Style.Light }).catch(() => {});
        await StatusBar.setBackgroundColor({ color: "#FBF9F4" }).catch(() => {});

        // 3. Handle Android hardware/gesture back button smoothly
        const backHandler = await App.addListener("backButton", ({ canGoBack }) => {
          if (canGoBack && window.history.length > 1) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        cleanupBackButton = () => {
          backHandler.remove();
        };
      } catch (err) {
        console.warn("[CapacitorBridge] Native plugins init error:", err);
      }
    }

    void initNativePlugins();

    return () => {
      cleanupBackButton?.();
    };
  }, []);

  return null;
}
