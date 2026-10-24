import { Pressable, StyleSheet, Text, View } from "react-native";
import { AppIcon } from "@/components/icon";
import { colors, fonts, shared } from "@/lib/styles";
import { useI18n } from "@/lib/i18n";

export function ErrorView({
  message,
  onRetry,
}: {
  message?: string | null;
  onRetry?: () => void;
}) {
  const { isRTL } = useI18n();

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <AppIcon name="alert-circle" size={32} color={colors.danger} />
      </View>
      <Text style={[styles.title, { textAlign: "center" }]}>
        {isRTL ? "تعذر تحميل البيانات" : "Failed to load data"}
      </Text>
      <Text style={[styles.message, { textAlign: "center" }]}>
        {message ?? (isRTL ? "يرجى التحقق من اتصال الإنترنت والمحاولة مرة أخرى" : "Please check your connection and try again.")}
      </Text>
      {onRetry ? (
        <Pressable
          style={[shared.button, styles.retryButton, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={onRetry}
          hitSlop={8}
        >
          <AppIcon name="repeat" size={16} color="#FFFFFF" />
          <Text style={shared.buttonText}>{isRTL ? "إعادة المحاولة" : "Try Again"}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.expenseSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.muted,
    lineHeight: 20,
    maxWidth: 280,
  },
  retryButton: {
    marginTop: 12,
    minHeight: 44,
    paddingHorizontal: 24,
  },
});
