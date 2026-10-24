import { ActivityIndicator, Pressable, Text, type PressableProps } from "react-native";
import { colors, shared } from "@/lib/styles";

type PrimaryButtonProps = PressableProps & {
  label: string;
  loading?: boolean;
  isRTL?: boolean;
};

export function PrimaryButton({ label, loading, isRTL = false, disabled, style, ...rest }: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...rest}
      disabled={isDisabled}
      style={(state) => [
        shared.button,
        { flexDirection: isRTL ? "row-reverse" : "row", gap: 8, opacity: isDisabled ? 0.65 : 1 },
        typeof style === "function" ? style(state) : style,
      ]}
    >
      {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
      <Text style={shared.buttonText}>{label}</Text>
    </Pressable>
  );
}
