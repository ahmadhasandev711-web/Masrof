"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function CapacitorBridge() {
  const pathname = usePathname();

  useEffect(() => {
    // Only execute when running inside the native Capacitor iOS/Android shell
    const isNative =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((window as any).Capacitor?.isNativePlatform?.());

    if (!isNative) return;

    document.documentElement.classList.add("is-native-app");

    // In native app, never show the marketing landing page "/"
    if (pathname === "/" || pathname === "") {
      window.location.replace("/dashboard");
    }
  }, [pathname]);

  useEffect(() => {
    const isNative =
      typeof window !== "undefined" &&
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Boolean((window as any).Capacitor?.isNativePlatform?.());

    if (!isNative) return;

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

        // 3. Handle Android hardware/gesture back button smoothly:
        // If a bottom sheet or modal dialog is open, dismiss it first!
        const backHandler = await App.addListener("backButton", ({ canGoBack }) => {
          const openDialog = document.querySelector('[role="dialog"][aria-modal="true"]');
          if (openDialog) {
            window.dispatchEvent(
              new KeyboardEvent("keydown", {
                key: "Escape",
                code: "Escape",
                keyCode: 27,
                bubbles: true,
              }),
            );
            return;
          }

          if (canGoBack && window.history.length > 1) {
            window.history.back();
          } else {
            App.exitApp();
          }
        });

        // 4. Handle soft keyboard smoothly without WebView reflow:
        // Set --kb-height CSS variable so bottom sheets slide up smoothly via GPU-composited CSS
        const { Keyboard } = await import("@capacitor/keyboard");

        const updateKbHeight = (height: number) => {
          document.documentElement.style.setProperty("--kb-height", `${height}px`);
          if (height > 0) {
            document.documentElement.classList.add("keyboard-is-open");
          } else {
            document.documentElement.classList.remove("keyboard-is-open");
          }
        };

        const kbWillShow = await Keyboard.addListener("keyboardWillShow", (info) => {
          updateKbHeight(info.keyboardHeight);
        });

        const kbDidShow = await Keyboard.addListener("keyboardDidShow", (info) => {
          updateKbHeight(info.keyboardHeight);
          const active = document.activeElement as HTMLElement | null;
          if (
            active &&
            (active.tagName === "INPUT" ||
              active.tagName === "TEXTAREA" ||
              active.tagName === "SELECT")
          ) {
            setTimeout(() => {
              active.scrollIntoView({ behavior: "smooth", block: "center" });
            }, 50);
          }
        });

        const kbWillHide = await Keyboard.addListener("keyboardWillHide", () => {
          updateKbHeight(0);
        });

        const kbDidHide = await Keyboard.addListener("keyboardDidHide", () => {
          updateKbHeight(0);
        });

        cleanupBackButton = () => {
          backHandler.remove();
          kbWillShow.remove();
          kbDidShow.remove();
          kbWillHide.remove();
          kbDidHide.remove();
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
