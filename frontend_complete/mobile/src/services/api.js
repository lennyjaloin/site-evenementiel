import axios from "axios";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { clearSession, readToken } from "./storage";

function getExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoClient?.hostUri ||
    Constants.manifest?.debuggerHost;

  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
}

export function getApiBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:4000`;
  }

  if (Platform.OS === "android") {
    return "http://10.0.2.2:4000";
  }

  return "http://localhost:4000";
}

export const apiBaseUrl = getApiBaseUrl();

const api = axios.create({
  baseURL: apiBaseUrl,
});

api.interceptors.request.use(async (config) => {
  const token = await readToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 429) {
        return Promise.reject(
          new Error(data?.message || "Trop de requetes. Reessaie dans un instant."),
        );
      }

      if (status === 400 && data?.errors) {
        const messages = data.errors.map((item) => item.message).join(", ");
        return Promise.reject(new Error(messages));
      }

      if (status === 401) {
        await clearSession();
        return Promise.reject(
          new Error(data?.message || "Session expiree. Connecte-toi de nouveau."),
        );
      }

      return Promise.reject(new Error(data?.message || "Erreur serveur"));
    }

    return Promise.reject(
      new Error(`Impossible de joindre l'API (${apiBaseUrl}). Verifie le backend.`),
    );
  },
);

export async function signup(email, password) {
  const { data } = await api.post("/api/auth/register", { email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export async function getEvents({ page = 1, limit = 30 } = {}) {
  const { data } = await api.get(`/api/events?page=${page}&limit=${limit}`);

  if (data?.data && data?.pagination) {
    return data;
  }

  const events = Array.isArray(data) ? data : data?.events || [];
  return {
    data: events,
    pagination: {
      page: 1,
      totalPages: 1,
      total: events.length,
      limit: events.length,
    },
  };
}

export async function getEvent(id) {
  const { data } = await api.get(`/api/events/${id}`);
  return data?.event || data;
}

export async function reserveEvent(payload) {
  const { data } = await api.post("/api/reservations", payload);
  return data;
}

export async function createEvent(payload) {
  const { data } = await api.post("/api/events", payload);
  return data?.event || data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
}

export async function getReservations() {
  const { data } = await api.get("/api/reservations");
  return Array.isArray(data) ? data : data?.reservations || [];
}

export async function deleteReservation(id) {
  const { data } = await api.delete(`/api/reservations/${id}`);
  return data;
}
