import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { FormField } from "./FormField";
import { PrimaryButton } from "./PrimaryButton";
import { reserveEvent } from "../services/api";
import { colors } from "../theme";

export function ReservationModal({ eventId, onClose, onSuccess, visible }) {
  const [nom, setNom] = useState("");
  const [prenom, setPrenom] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);

    try {
      await reserveEvent({ event_id: eventId, nom, prenom, email });
      setNom("");
      setPrenom("");
      setEmail("");
      onSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Reserver</Text>
            <Pressable onPress={onClose}>
              <Text style={styles.close}>Fermer</Text>
            </Pressable>
          </View>

          <View style={styles.form}>
            <FormField label="Nom" value={nom} onChangeText={setNom} autoCapitalize="words" />
            <FormField label="Prenom" value={prenom} onChangeText={setPrenom} autoCapitalize="words" />
            <FormField label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <PrimaryButton title="Confirmer la reservation" onPress={handleSubmit} loading={loading} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: colors.backgroundSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    gap: 18,
    borderTopWidth: 1,
    borderColor: colors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800",
  },
  close: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: "700",
  },
  form: {
    gap: 14,
  },
  error: {
    color: colors.danger,
    fontSize: 14,
  },
});
