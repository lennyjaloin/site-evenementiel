import React from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import { HomeScreen } from "../screens/HomeScreen";
import { EventsScreen } from "../screens/EventsScreen";
import { EventDetailsScreen } from "../screens/EventDetailsScreen";
import { LoginScreen } from "../screens/LoginScreen";
import { SignupScreen } from "../screens/SignupScreen";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ReservationSuccessScreen } from "../screens/ReservationSuccessScreen";
import { AdminScreen } from "../screens/AdminScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.backgroundSoft,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
  },
};

function MainTabs() {
  const { user } = useAuth();

  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen name="Accueil" component={HomeScreen} />
      <Tabs.Screen name="Evenements" component={EventsScreen} />
      <Tabs.Screen name="Profil" component={ProfileScreen} />
      {user?.role === "admin" ? <Tabs.Screen name="Admin" component={AdminScreen} /> : null}
    </Tabs.Navigator>
  );
}

export function RootNavigator() {
  const { isReady } = useAuth();

  if (!isReady) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement de la session...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.backgroundSoft },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: "Detail evenement" }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ title: "Connexion" }} />
        <Stack.Screen name="Signup" component={SignupScreen} options={{ title: "Inscription" }} />
        <Stack.Screen
          name="ReservationSuccess"
          component={ReservationSuccessScreen}
          options={{ title: "Reservation confirmee" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 15,
  },
  tabBar: {
    backgroundColor: colors.backgroundSoft,
    borderTopColor: colors.border,
    height: 72,
    paddingTop: 8,
    paddingBottom: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
});
