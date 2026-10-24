import { Tabs } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/lib/i18n";
import { colors, fonts } from "@/lib/styles";
import { AppIcon } from "@/components/icon";

function CustomTabBar(props: any) {
  const insets = useSafeAreaInsets();
  const { isRTL } = useI18n();
  const { state, descriptors, emitter, navigateToTab, navigation } = props;

  // On Android devices with 3-button navigation, the system navigation bar is ~48dp.
  // We guarantee at least 48dp + 16dp spacing so labels and touch targets breathe comfortably.
  const bottomPadding =
    Platform.OS === "android"
      ? Math.max(insets.bottom, 48) + 16
      : Math.max(insets.bottom, 16);

  const tabHeight = 56 + bottomPadding;

  return (
    <View
      style={[
        styles.tabBar,
        {
          height: tabHeight,
          paddingBottom: bottomPadding,
          flexDirection: isRTL ? "row-reverse" : "row",
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const descriptor = descriptors[route.key];
        const options = descriptor?.options ?? {};
        const isFocused = state.index === index;
        const color = isFocused ? colors.primary : colors.faint;
        const label =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const onPress = () => {
          const event = emitter?.emit?.({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          }) ?? navigation?.emit?.({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event?.defaultPrevented) {
            if (navigateToTab) {
              navigateToTab(route.key);
            } else if (navigation) {
              navigation.navigate(route.name, route.params);
            }
          }
        };

        const onLongPress = () => {
          emitter?.emit?.({
            type: "tabLongPress",
            target: route.key,
          }) ?? navigation?.emit?.({
            type: "tabLongPress",
            target: route.key,
          });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabButton}
          >
            <View style={[styles.iconWrapper, isFocused && styles.iconWrapperFocused]}>
              {options.tabBarIcon
                ? options.tabBarIcon({ focused: isFocused, color, size: 22 })
                : null}
            </View>
            <Text
              style={[
                styles.tabLabel,
                { color },
                isFocused && styles.tabLabelFocused,
              ]}
              numberOfLines={1}
            >
              {typeof label === "string" ? label : route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      tabBar={(props: any) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? "home" : "home-outline"} size={22} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: t.tabs.transactions,
          tabBarIcon: ({ color }) => (
            <AppIcon name="list" size={22} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="clients"
        options={{
          title: t.tabs.clients,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? "people" : "people-outline"} size={22} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="projects"
        options={{
          title: t.tabs.projects,
          tabBarIcon: ({ color, focused }) => (
            <AppIcon name={focused ? "briefcase" : "briefcase-outline"} size={22} color={String(color)} />
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: t.tabs.more,
          tabBarIcon: ({ color }) => (
            <AppIcon name="menu" size={22} color={String(color)} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    alignItems: "center",
    justifyContent: "space-around",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    minHeight: 48,
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
    height: 26,
  },
  iconWrapperFocused: {
    transform: [{ scale: 1.05 }],
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    marginTop: 2,
    textAlign: "center",
  },
  tabLabelFocused: {
    fontFamily: fonts.bold,
    fontWeight: "700",
  },
});
