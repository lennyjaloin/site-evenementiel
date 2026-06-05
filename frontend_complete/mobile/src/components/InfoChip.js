import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function InfoChip({ label, tone = "default" }) {
  return (
    <View style={[styles.chip, tone === "success" && styles.success, tone === "danger" && styles.danger]}>
      <Text style={[styles.label, tone === "success" && styles.successLabel, tone === "danger" && styles.dangerLabel]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  success: {
    backgroundColor: "rgba(52, 211, 153, 0.14)",
    borderColor: "rgba(52, 211, 153, 0.4)",
  },
  successLabel: {
    color: colors.success,
  },
  danger: {
    backgroundColor: "rgba(251, 113, 133, 0.14)",
    borderColor: "rgba(251, 113, 133, 0.4)",
  },
  dangerLabel: {
    color: colors.danger,
  },
});
