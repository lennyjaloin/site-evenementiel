import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/PrimaryButton";
import { useAuth } from "../context/AuthContext";
import { colors } from "../theme";

export function ProfileScreen({ navigation }) {
  const { isAuthed, logout, user } = useAuth();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {!isAuthed ? (
        <View style={styles.card}>
          <Text style={styles.title}>Profil</Text>
          <Text style={styles.subtitle}>Connecte-toi pour retrouver ton compte et tes droits d'administration.</Text>
          <View style={styles.actions}>
            <PrimaryButton title="Connexion" onPress={() => navigation.navigate("Login")} />
            <PrimaryButton title="Inscription" variant="secondary" onPress={() => navigation.navigate("Signup")} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.title}>Mon profil</Text>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.value}>{user?.email || "-"}</Text>
          </View>
          <View style={styles.infoBlock}>
            <Text style={styles.label}>Role</Text>
            <Text style={styles.value}>{user?.role || "user"}</Text>
          </View>
          {user?.username ? (
            <View style={styles.infoBlock}>
              <Text style={styles.label}>Pseudo</Text>
              <Text style={styles.value}>{user.username}</Text>
            </View>
          ) : null}
          <PrimaryButton title="Me deconnecter" variant="secondary" onPress={logout} />
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
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    gap: 18,
  },
  title: {
    color: colors.text,
    fontSize: 30,
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
  infoBlock: {
    gap: 6,
  },
  label: {
    color: colors.textMuted,
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  value: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
});
