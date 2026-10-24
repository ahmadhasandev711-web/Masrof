import { Text, TextInput, View } from "react-native";
import { colors, fonts, shared } from "@/lib/styles";

type AmountFieldProps = {
  label: string;
  currency: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string | null;
  isRTL?: boolean;
  accentColor?: string;
};

export function AmountField({
  label,
  currency,
  value,
  onChangeText,
  error,
  isRTL = false,
  accentColor = colors.primary,
}: AmountFieldProps) {
  function handleChange(text: string) {
    const normalized = text.replace(/,/g, ".").replace(/[^\d.]/g, "");
    const parts = normalized.split(".");
    const safe = parts.length > 2 ? `${parts[0]}.${parts.slice(1).join("")}` : normalized;
    onChangeText(safe);
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>
        {label} ({currency})
      </Text>
      <TextInput
        keyboardType="decimal-pad"
        value={value}
        onChangeText={handleChange}
        style={[
          shared.input,
          {
            fontSize: 22,
            fontFamily: fonts.bold,
            fontWeight: "700",
            color: accentColor,
            textAlign: isRTL ? "right" : "left",
          },
          error ? { borderColor: colors.danger } : null,
        ]}
        placeholder="0"
        placeholderTextColor={colors.faint}
      />
      {error ? (
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.danger, textAlign: isRTL ? "right" : "left" }}>
          {error}
        </Text>
      ) : null}
    </View>
  );
}
