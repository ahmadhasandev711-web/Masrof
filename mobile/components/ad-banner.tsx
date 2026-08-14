import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let GoogleMobileAds: any = null;
if (!isExpoGo) {
  try {
    GoogleMobileAds = require("react-native-google-mobile-ads");
  } catch {
    GoogleMobileAds = null;
  }
}

export function AdBanner({ showAds }: { showAds: boolean }) {
  useEffect(() => {
    if (!showAds || !GoogleMobileAds?.default) return;
    try {
      GoogleMobileAds.default().initialize().catch(() => {});
    } catch {}
  }, [showAds]);

  if (!showAds || !GoogleMobileAds?.BannerAd) {
    return null;
  }

  const { BannerAd, BannerAdSize, TestIds } = GoogleMobileAds;

  return (
    <View style={styles.wrap}>
      <BannerAd
        unitId={TestIds.BANNER}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    width: "100%",
  },
});
