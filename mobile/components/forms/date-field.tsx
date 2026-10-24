import { useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { colors, fonts, shared } from "@/lib/styles";

function parseIsoDate(value: string): Date {
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DateFieldProps = {
  label: string;
  value: string;
  onChange: (iso: string) => void;
  error?: string | null;
  isRTL?: boolean;
  optional?: boolean;
  emptyLabel?: string;
};

export function DateField({
  label,
  value,
  onChange,
  error,
  isRTL = false,
  optional = false,
  emptyLabel,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = value ? parseIsoDate(value) : new Date();
  const emptyText =
    emptyLabel ?? (isRTL ? "بدون تاريخ" : "No date");

  function onPickerChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === "android") {
      setOpen(false);
    }
    if (event.type === "dismissed" || !selected) return;
    onChange(toIsoDate(selected));
  }

  return (
    <View style={{ gap: 6 }}>
      <Text style={[shared.label, { textAlign: isRTL ? "right" : "left" }]}>{label}</Text>
      <Pressable
        onPress={() => setOpen(true)}
        style={[
          shared.input,
          {
            justifyContent: "center",
            borderColor: error ? colors.danger : colors.border,
          },
        ]}
      >
        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 16,
            color: value ? colors.text : colors.faint,
            textAlign: isRTL ? "right" : "left",
          }}
        >
          {value || (optional ? emptyText : value)}
        </Text>
      </Pressable>
      {error ? (
        <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: colors.danger, textAlign: isRTL ? "right" : "left" }}>
          {error}
        </Text>
      ) : null}
      {open ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickerChange}
        />
      ) : null}
    </View>
  );
}
