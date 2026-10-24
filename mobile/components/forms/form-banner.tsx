import { Text, View } from "react-native";
import { colors, fonts } from "@/lib/styles";

export function FormBanner({ message, tone = "error", isRTL = false }: { message: string; tone?: "error" | "info"; isRTL?: boolean }) {
  const bg = tone === "error" ? colors.expenseSoft : colors.infoSoft;
  const color = tone === "error" ? colors.expenseText : colors.infoText;

  return (
    <View style={{ backgroundColor: bg, borderRadius: 12, padding: 12 }}>
      <Text style={{ fontFamily: fonts.medium, fontSize: 13, color, textAlign: isRTL ? "right" : "left" }}>
        {message}
      </Text>
    </View>
  );
}
