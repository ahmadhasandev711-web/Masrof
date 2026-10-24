import { Text, View } from "react-native";
import { AppIcon, type IconName } from "@/components/icon";
import { colors, shared } from "@/lib/styles";

type EmptyStateProps = {
  icon: IconName;
  message: string;
  isRTL?: boolean;
};

export function EmptyState({ icon, message, isRTL = false }: EmptyStateProps) {
  return (
    <View style={shared.center}>
      <AppIcon name={icon} size={44} color={colors.faint} />
      <Text
        style={[
          shared.empty,
          { paddingVertical: 12, textAlign: isRTL ? "right" : "center", width: "100%" },
        ]}
      >
        {message}
      </Text>
    </View>
  );
}
