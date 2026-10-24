import { Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, shared } from "@/lib/styles";

type FieldProps = TextInputProps & {
  label: string;
  error?: string | null;
  isRTL?: boolean;
};

export function Field({ label, error, isRTL = false, style, ...inputProps }: FieldProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <TextInput
        {...inputProps}
        style={[
          shared.input,
          { textAlign: isRTL ? "right" : "left" },
          error ? { borderColor: colors.danger } : null,
          style,
        ]}
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
