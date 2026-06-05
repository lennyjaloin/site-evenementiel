import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { colors, shadow } from "../theme";
import { apiBaseUrl } from "../services/api";

export function HomeScreen({ navigation }) {
  const { isAuthed, user } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <LinearGradient
        colors={["#18324B", "#0E1827", "#331F1A"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, shadow]}
      >
        <Text style={styles.kicker}>Application mobile native</Text>
        <Text style={styles.title}>Trouve, reserve et gere tes evenements depuis Expo Go.</Text>
        <Text style={styles.subtitle}>
          L'app mobile parle directement avec ton backend sur {apiBaseUrl}.
        </Text>

        <View style={styles.actions}>
          <PrimaryButton title="Voir les evenements" onPress={() => navigation.navigate("Evenements")} />
          {isAuthed ? (
            <PrimaryButton
              title={user?.role === "admin" ? "Ouvrir l'espace admin" : "Voir mon profil"}
              variant="secondary"
              onPress={() => navigation.navigate(user?.role === "admin" ? "Admin" : "Profil")}
            />
          ) : (
            <PrimaryButton title="Me connecter" variant="secondary" onPress={() => navigation.navigate("Login")} />
          )}
        </View>
      </LinearGradient>

      <View style={styles.grid}>
        {[
          ["Reservation rapide", "Reserve un evenement en quelques champs depuis ton telephone."],
          ["Session persistante", "Le token et le profil restent disponibles dans l'app mobile."],
          ["Admin mobile", "Les comptes admin peuvent publier et supprimer des contenus depuis l'app."],
        ].map(([heading, copy]) => (
          <View key={heading} style={styles.card}>
            <Text style={styles.cardTitle}>{heading}</Text>
            <Text style={styles.cardText}>{copy}</Text>
          </View>
        ))}
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
    gap: 20,
  },
  hero: {
    borderRadius: 28,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  kicker: {
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    fontWeight: "800",
  },
  title: {
    color: colors.text,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "900",
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 24,
  },
  actions: {
    gap: 12,
  },
  grid: {
    gap: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "800",
  },
  cardText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
