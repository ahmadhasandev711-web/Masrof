import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { colors } from "@/lib/styles";

export type IconName =
  | "home"
  | "home-outline"
  | "receipt"
  | "receipt-outline"
  | "list"
  | "wallet"
  | "wallet-outline"
  | "card"
  | "card-outline"
  | "pie-chart"
  | "pie-chart-outline"
  | "bar-chart"
  | "swap-horizontal"
  | "repeat"
  | "flag"
  | "people"
  | "people-outline"
  | "briefcase"
  | "briefcase-outline"
  | "settings"
  | "settings-outline"
  | "star"
  | "star-outline"
  | "add"
  | "close"
  | "checkmark"
  | "arrow-back"
  | "chevron-forward"
  | "chevron-back"
  | "trending-up"
  | "trending-down"
  | "alert-circle"
  | "document-text"
  | "print"
  | "share-social"
  | "log-out"
  | "pricetag"
  | "business"
  | "call"
  | "mail"
  | "globe"
  | "menu";

export function AppIcon({
  name,
  size = 20,
  color = colors.text,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  switch (name) {
    case "home":
      return <Ionicons name="home" size={size} color={color} />;
    case "home-outline":
      return <Ionicons name="home-outline" size={size} color={color} />;
    case "receipt":
      return <Ionicons name="receipt" size={size} color={color} />;
    case "receipt-outline":
      return <Ionicons name="receipt-outline" size={size} color={color} />;
    case "list":
      return <Ionicons name="list" size={size} color={color} />;
    case "wallet":
      return <Ionicons name="wallet" size={size} color={color} />;
    case "wallet-outline":
      return <Ionicons name="wallet-outline" size={size} color={color} />;
    case "card":
      return <Ionicons name="card" size={size} color={color} />;
    case "card-outline":
      return <Ionicons name="card-outline" size={size} color={color} />;
    case "pie-chart":
      return <Ionicons name="pie-chart" size={size} color={color} />;
    case "pie-chart-outline":
      return <Ionicons name="pie-chart-outline" size={size} color={color} />;
    case "bar-chart":
      return <Ionicons name="bar-chart" size={size} color={color} />;
    case "swap-horizontal":
      return <Ionicons name="swap-horizontal" size={size} color={color} />;
    case "repeat":
      return <Ionicons name="repeat" size={size} color={color} />;
    case "flag":
      return <Ionicons name="flag" size={size} color={color} />;
    case "people":
      return <Ionicons name="people" size={size} color={color} />;
    case "people-outline":
      return <Ionicons name="people-outline" size={size} color={color} />;
    case "briefcase":
      return <Ionicons name="briefcase" size={size} color={color} />;
    case "briefcase-outline":
      return <Ionicons name="briefcase-outline" size={size} color={color} />;
    case "settings":
      return <Ionicons name="settings-sharp" size={size} color={color} />;
    case "settings-outline":
      return <Ionicons name="settings-outline" size={size} color={color} />;
    case "star":
      return <Ionicons name="star" size={size} color={color} />;
    case "star-outline":
      return <Ionicons name="star-outline" size={size} color={color} />;
    case "add":
      return <Ionicons name="add" size={size} color={color} />;
    case "close":
      return <Ionicons name="close" size={size} color={color} />;
    case "checkmark":
      return <Ionicons name="checkmark" size={size} color={color} />;
    case "arrow-back":
      return <Ionicons name="arrow-back" size={size} color={color} />;
    case "chevron-forward":
      return <Ionicons name="chevron-forward" size={size} color={color} />;
    case "chevron-back":
      return <Ionicons name="chevron-back" size={size} color={color} />;
    case "trending-up":
      return <Ionicons name="trending-up" size={size} color={color} />;
    case "trending-down":
      return <Ionicons name="trending-down" size={size} color={color} />;
    case "alert-circle":
      return <Ionicons name="alert-circle" size={size} color={color} />;
    case "document-text":
      return <Ionicons name="document-text" size={size} color={color} />;
    case "print":
      return <Ionicons name="print-outline" size={size} color={color} />;
    case "share-social":
      return <Ionicons name="share-social-outline" size={size} color={color} />;
    case "log-out":
      return <Ionicons name="log-out-outline" size={size} color={color} />;
    case "pricetag":
      return <Ionicons name="pricetag-outline" size={size} color={color} />;
    case "business":
      return <Ionicons name="business-outline" size={size} color={color} />;
    case "call":
      return <Ionicons name="call-outline" size={size} color={color} />;
    case "mail":
      return <Ionicons name="mail-outline" size={size} color={color} />;
    case "globe":
      return <Ionicons name="globe-outline" size={size} color={color} />;
    case "menu":
      return <Ionicons name="menu" size={size} color={color} />;
    default:
      return <Ionicons name="ellipse" size={size} color={color} />;
  }
}
