import { useEffect, useState } from "react";
import { Animated, type DimensionValue, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { colors, shared } from "@/lib/styles";

export function Skeleton({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}: {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.borderLight,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function CardSkeleton({
  height,
  style,
}: {
  height?: DimensionValue;
  style?: StyleProp<ViewStyle>;
} = {}) {
  return (
    <View style={[shared.card, { paddingVertical: 14, gap: 10 }, height !== undefined && { height }, style]}>
      <View style={[shared.row, { justifyContent: "space-between" }]}>
        <View style={[shared.rowStart, { gap: 10 }]}>
          <Skeleton width={38} height={38} borderRadius={19} />
          <View style={{ gap: 6 }}>
            <Skeleton width={120} height={16} />
            <Skeleton width={80} height={12} />
          </View>
        </View>
        <Skeleton width={70} height={20} borderRadius={6} />
      </View>
    </View>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <CardSkeleton key={index} />
      ))}
    </View>
  );
}

export function DashboardSkeleton() {
  return (
    <View style={{ gap: 14 }}>
      {/* Top Total Balance Card */}
      <View style={[shared.card, { padding: 18, gap: 12 }]}>
        <Skeleton width={140} height={14} />
        <Skeleton width={200} height={32} />
        <View style={[shared.row, { gap: 10, marginTop: 4 }]}>
          <Skeleton width="48%" height={16} />
          <Skeleton width="48%" height={16} />
        </View>
      </View>

      {/* Metrics Row */}
      <View style={[shared.row, { gap: 10 }]}>
        <View style={[shared.card, { flex: 1, padding: 14, gap: 8 }]}>
          <Skeleton width={80} height={12} />
          <Skeleton width={100} height={22} />
        </View>
        <View style={[shared.card, { flex: 1, padding: 14, gap: 8 }]}>
          <Skeleton width={80} height={12} />
          <Skeleton width={100} height={22} />
        </View>
      </View>

      {/* Recent List */}
      <View style={{ gap: 8, marginTop: 6 }}>
        <Skeleton width={120} height={18} />
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
});
