import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { InfoChip } from "./InfoChip";
import { colors, shadow } from "../theme";
import { formatShortDate } from "../utils/format";

export function EventCard({ event, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.card, shadow]}>
      <View style={styles.header}>
        <Text style={styles.title}>{event.title}</Text>
        {event.capacity != null ? (
          <InfoChip label={`${event.reservationsCount || 0}/${event.capacity}`} />
        ) : null}
      </View>

      <Text style={styles.description} numberOfLines={3}>
        {event.description}
      </Text>

      <View style={styles.footer}>
        {event.location ? <InfoChip label={event.location} /> : null}
        <InfoChip label={formatShortDate(event.date_start || event.date)} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "flex-start",
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
