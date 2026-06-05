import React, { useEffect, useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { EventCard } from "../components/EventCard";
import { FormField } from "../components/FormField";
import { PrimaryButton } from "../components/PrimaryButton";
import { getEvents } from "../services/api";
import { colors } from "../theme";

export function EventsScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function load(page = 1, silent = false) {
    if (!silent) {
      setLoading(true);
    }

    setError("");

    try {
      const result = await getEvents({ page, limit: 30 });
      setEvents(result.data || []);
      setPagination(result.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load(1);
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const haystack = `${event.title || ""} ${event.description || ""}`.toLowerCase();
      const matchesQuery = !query || haystack.includes(query.toLowerCase());
      const matchesLocation =
        !location || (event.location || "").toLowerCase().includes(location.toLowerCase());
      const matchesDate = !date || String(event.date_start || event.date || "").includes(date);
      return matchesQuery && matchesLocation && matchesDate;
    });
  }, [date, events, location, query]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(pagination.page || 1, true);
          }}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Evenements</Text>
        <Text style={styles.subtitle}>
          {pagination.total > 0 ? `${pagination.total} evenement(s) disponibles` : "Explore le catalogue"}
        </Text>
      </View>

      <View style={styles.filters}>
        <FormField label="Recherche" value={query} onChangeText={setQuery} placeholder="Nom ou mot-cle" />
        <FormField label="Lieu" value={location} onChangeText={setLocation} placeholder="Paris, Lyon..." />
        <FormField label="Date" value={date} onChangeText={setDate} placeholder="2026-04-10" />
      </View>

      {loading ? <Text style={styles.message}>Chargement...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.list}>
        {filteredEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            onPress={() => navigation.navigate("EventDetails", { eventId: event.id })}
          />
        ))}
      </View>

      {!loading && filteredEvents.length === 0 ? (
        <Text style={styles.message}>Aucun evenement ne correspond a ta recherche.</Text>
      ) : null}

      <View style={styles.pagination}>
        <PrimaryButton
          title="Page precedente"
          variant="secondary"
          onPress={() => load(Math.max(1, (pagination.page || 1) - 1))}
          disabled={(pagination.page || 1) <= 1}
          style={styles.paginationButton}
        />
        <PrimaryButton
          title="Page suivante"
          variant="secondary"
          onPress={() => load(Math.min(pagination.totalPages || 1, (pagination.page || 1) + 1))}
          disabled={(pagination.page || 1) >= (pagination.totalPages || 1)}
          style={styles.paginationButton}
        />
      </View>
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
    gap: 18,
  },
  header: {
    gap: 4,
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
  },
  filters: {
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 24,
    padding: 16,
  },
  list: {
    gap: 14,
  },
  message: {
    color: colors.textMuted,
    fontSize: 15,
  },
  error: {
    color: colors.danger,
    fontSize: 15,
  },
  pagination: {
    flexDirection: "row",
    gap: 12,
  },
  paginationButton: {
    flex: 1,
  },
});
