import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

// Axios instance
const api = axios.create({ baseURL: API_BASE_URL });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ---- AUTH ----
export async function signup(email, password) {
  const { data } = await api.post("/api/auth/register", { email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post("/api/auth/login", { email, password });
  return data;
}

export function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

// ---- EVENTS ----
export async function getEvents() {
  const { data } = await api.get("/api/events");
  return Array.isArray(data) ? data : (data.events || []);
}

export async function getEvent(id) {
  const { data } = await api.get(`/api/events/${id}`);
  return data.event || data;
}

export async function createEvent(payload) {
  const { data } = await api.post("/api/events", payload);
  return data.event || data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
}

// ---- RESERVATIONS ----
export async function reserveEvent({ event_id, nom, prenom, email }) {
  const { data } = await api.post("/api/reservations", { event_id, nom, prenom, email });
  return data;
}

export async function getReservations() {
  const { data } = await api.get("/api/reservations");
  return Array.isArray(data) ? data : (data.reservations || []);
}

export async function deleteReservation(id) {
  const { data } = await api.delete(`/api/reservations/${id}`);
  return data;
}
