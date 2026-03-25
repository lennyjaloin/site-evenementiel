import React, { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import {
  createEvent,
  deleteEvent,
  deleteReservation,
  getEvents,
  getReservations,
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";
import { formatDate, toApiDateTime } from "../utils/format";

export function AdminScreen() {
  const { user } = useAuth();
  const [tab, setTab] = useState("events");
  const [events, setEvents] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [capacity, setCapacity] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user?.role]);

  async function loadData() {
    setLoading(true);
    setError("");

    try {
      const [eventsResult, reservationsResult] = await Promise.all([
        getEvents({ page: 1, limit: 50 }),
        getReservations(),
      ]);
      setEvents(eventsResult.data || []);
      setReservations(reservationsResult || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const reservationRows = useMemo(() => {
    return reservations.map((item) => ({
      ...item,
      eventTitle: events.find((event) => event.id === item.event_id)?.title || `#${item.event_id}`,
    }));
  }, [events, reservations]);

  async function handleCreateEvent() {
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const created = await createEvent({
        title,
        description,
        location,
        date_start: toApiDateTime(dateStart),
        date_end: toApiDateTime(dateEnd),
        capacity: capacity ? Number(capacity) : null,
        image_url: imageUrl || null,
        is_public: isPublic ? 1 : 0,
      });

      setEvents((current) => [created, ...current]);
      setTitle("");
      setDescription("");
      setLocation("");
      setDateStart("");
      setDateEnd("");
      setCapacity("");
      setImageUrl("");
      setIsPublic(true);
      setMessage("Evenement cree avec succes.");
      setTab("events");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function confirmDeleteEvent(id) {
    Alert.alert("Supprimer l'evenement", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(id);
            setEvents((current) => current.filter((event) => event.id !== id));
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  }

  function confirmDeleteReservation(id) {
    Alert.alert("Supprimer la reservation", "Confirmer la suppression ?", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteReservation(id);
            setReservations((current) => current.filter((item) => item.id !== id));
          } catch (err) {
            setError(err.message);
          }
        },
      },
    ]);
  }

  if (user?.role !== "admin") {
    return (
      <View style={styles.locked}>
        <Text style={styles.title}>Admin</Text>
        <Text style={styles.subtitle}>Cette section est reservee aux comptes administrateur.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin mobile</Text>
        <Text style={styles.subtitle}>Publie un evenement ou gere les reservations depuis Expo Go.</Text>
      </View>

      <View style={styles.tabRow}>
        <PrimaryButton
          title="Evenements"
          variant={tab === "events" ? "primary" : "secondary"}
          onPress={() => setTab("events")}
          style={styles.tabButton}
        />
        <PrimaryButton
          title="Reservations"
          variant={tab === "reservations" ? "primary" : "secondary"}
          onPress={() => setTab("reservations")}
          style={styles.tabButton}
        />
      </View>

      <PrimaryButton title="Rafraichir" variant="ghost" onPress={loadData} />

      {loading ? <Text style={styles.hint}>Chargement...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}

      {tab === "events" ? (
        <>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Creer un evenement</Text>
            <View style={styles.form}>
              <FormField label="Titre" value={title} onChangeText={setTitle} />
              <FormField label="Description" value={description} onChangeText={setDescription} multiline />
              <FormField label="Lieu" value={location} onChangeText={setLocation} />
              <FormField label="Debut" value={dateStart} onChangeText={setDateStart} placeholder="2026-04-10 18:30" />
              <FormField label="Fin" value={dateEnd} onChangeText={setDateEnd} placeholder="2026-04-10 22:00" />
              <FormField label="Capacite" value={capacity} onChangeText={setCapacity} keyboardType="numeric" />
              <FormField label="Image URL" value={imageUrl} onChangeText={setImageUrl} autoCapitalize="none" />

              <View style={styles.switchRow}>
                <Text style={styles.switchLabel}>Evenement public</Text>
                <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ true: colors.primary, false: colors.border }} />
              </View>

              <PrimaryButton title="Publier l'evenement" onPress={handleCreateEvent} loading={submitting} />
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Evenements existants</Text>
            <View style={styles.list}>
              {events.map((event) => (
                <View key={event.id} style={styles.row}>
                  <View style={styles.rowContent}>
                    <Text style={styles.rowTitle}>{event.title}</Text>
                    <Text style={styles.rowMeta}>
                      {event.location || "Lieu a definir"} | {formatDate(event.date_start || event.date)}
                    </Text>
                  </View>
                  <PrimaryButton title="Supprimer" variant="ghost" onPress={() => confirmDeleteEvent(event.id)} style={styles.rowButton} />
                </View>
              ))}
              {events.length === 0 ? <Text style={styles.hint}>Aucun evenement.</Text> : null}
            </View>
          </View>
        </>
      ) : (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Reservations</Text>
          <View style={styles.list}>
            {reservationRows.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowContent}>
                  <Text style={styles.rowTitle}>{item.eventTitle}</Text>
                  <Text style={styles.rowMeta}>
                    {item.prenom} {item.nom} | {item.email}
                  </Text>
                </View>
                <PrimaryButton
                  title="Supprimer"
                  variant="ghost"
                  onPress={() => confirmDeleteReservation(item.id)}
                  style={styles.rowButton}
                />
              </View>
            ))}
            {reservationRows.length === 0 ? <Text style={styles.hint}>Aucune reservation.</Text> : null}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  locked: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  header: {
    gap: 6,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 22,
  },
  tabRow: {
    flexDirection: "row",
    gap: 12,
  },
  tabButton: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 16,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  form: {
    gap: 12,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  switchLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  list: {
    gap: 12,
  },
  row: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  rowContent: {
    gap: 6,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
  },
  rowMeta: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  rowButton: {
    alignSelf: "flex-start",
  },
  hint: {
    color: colors.textMuted,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
  success: {
    color: colors.success,
    fontSize: 14,
  },
});
