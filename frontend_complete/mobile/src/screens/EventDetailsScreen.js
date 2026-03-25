import React, { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { InfoChip } from "../components/InfoChip";
import { PrimaryButton } from "../components/PrimaryButton";
import { ReservationModal } from "../components/ReservationModal";
import { getEvent } from "../services/api";
import { colors, shadow } from "../theme";
import { formatDate } from "../utils/format";

export function EventDetailsScreen({ navigation, route }) {
  const { eventId } = route.params;
  const { height: windowHeight } = useWindowDimensions();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const result = await getEvent(eventId);
        if (mounted) {
          setEvent(result);
        }
      } catch (err) {
        if (mounted) {
          setError(err.message);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Chargement...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  if (!event) {
    return null;
  }

  const isFull =
    event.capacity != null &&
    event.placesRestantes != null &&
    Number(event.placesRestantes) <= 0;
  const imageHeight = Math.max(220, Math.min(windowHeight * 0.38, 420));

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
        {event.image_url ? (
          <Image source={{ uri: event.image_url }} style={[styles.image, { height: imageHeight }]} />
        ) : null}

        <View style={[styles.card, shadow]}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.chips}>
            {event.location ? <InfoChip label={event.location} /> : null}
            <InfoChip label={formatDate(event.date_start || event.date)} />
            {event.capacity != null ? (
              <InfoChip
                label={
                  isFull
                    ? "Complet"
                    : `${event.reservationsCount || 0}/${event.capacity} places`
                }
                tone={isFull ? "danger" : "success"}
              />
            ) : null}
          </View>

          <Text style={styles.description}>{event.description}</Text>

          {event.placesRestantes != null && !isFull ? (
            <Text style={styles.remaining}>
              {event.placesRestantes} place(s) restante(s)
            </Text>
          ) : null}

          <PrimaryButton
            title={isFull ? "Evenement complet" : "Reserver"}
            onPress={() => setModalVisible(true)}
            disabled={isFull}
          />
          <PrimaryButton title="Retour a la liste" variant="ghost" onPress={() => navigation.goBack()} />
        </View>
      </ScrollView>

      <ReservationModal
        visible={modalVisible}
        eventId={event.id}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          navigation.replace("ReservationSuccess", { eventId: event.id });
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 18,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
    textAlign: "center",
  },
  image: {
    width: "100%",
    borderRadius: 24,
    backgroundColor: colors.surfaceAlt,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    padding: 20,
    gap: 16,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "900",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  description: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  remaining: {
    color: colors.success,
    fontSize: 14,
    fontWeight: "700",
  },
});
