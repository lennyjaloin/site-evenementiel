import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, shadow } from "../theme";

export function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  variant = "primary",
  style,
  textStyle,
}) {
  const content = (
    <View style={[styles.content, variant === "ghost" && styles.ghostContent]}>
      {loading ? (
        <ActivityIndicator color={variant === "secondary" ? colors.text : colors.white} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "secondary" && styles.secondaryLabel,
            variant === "ghost" && styles.ghostLabel,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </View>
  );

  return (
    <Pressable onPress={onPress} disabled={disabled || loading} style={[styles.wrapper, style]}>
      {variant === "primary" ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.button, disabled && styles.disabled, shadow]}
        >
          {content}
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.button,
            variant === "secondary" ? styles.secondaryButton : styles.ghostButton,
            disabled && styles.disabled,
          ]}
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
  button: {
    minHeight: 52,
    borderRadius: 18,
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghostButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.6,
  },
  content: {
    alignItems: "center",
    justifyContent: "center",
  },
  ghostContent: {
    alignItems: "flex-start",
  },
  label: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryLabel: {
    color: colors.text,
  },
  ghostLabel: {
    color: colors.textMuted,
    fontWeight: "600",
  },
});
