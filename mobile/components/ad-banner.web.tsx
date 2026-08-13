import { StyleSheet, Text, View } from "react-native";

export function AdBanner({ showAds }: { showAds: boolean }) {
  if (!showAds) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.text}>مساحة إعلان — AdMob يظهر على تطبيق أندرويد</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    margin: 12,
    borderRadius: 12,
    backgroundColor: "#E4DFD3",
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  text: {
    color: "#5C574C",
    fontSize: 13,
    textAlign: "center",
  },
});
