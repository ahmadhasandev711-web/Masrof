import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "site.sanadat.app",
  appName: "سندات | Sanadat",
  webDir: "public",
  backgroundColor: "#FBF9F4",
  server: {
    url: "https://sanadat.site/dashboard",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: ["sanadat.site", "*.sanadat.site"],
    errorPath: "offline.html",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide: true,
      backgroundColor: "#FBF9F4",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
    },
    SystemBars: {
      insetsHandling: "native",
      style: "LIGHT",
      hidden: false,
    },
    StatusBar: {
      overlaysWebView: false,
      style: "LIGHT",
      backgroundColor: "#FBF9F4",
    },
    Keyboard: {
      resize: "body",
    },
  },
};

export default config;
