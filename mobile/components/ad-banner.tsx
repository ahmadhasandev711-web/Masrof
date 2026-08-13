import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import mobileAds, { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

export function AdBanner({ showAds }: { showAds: boolean }) {
  useEffect(() => {
    if (!showAds) return;
    mobileAds().initialize().catch(() => {});
  }, [showAds]);

  if (!showAds) return null;

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
