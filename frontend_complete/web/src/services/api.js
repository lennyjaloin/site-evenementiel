import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({ baseURL: API_BASE_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 429) {
        const msg = data?.message || "Trop de requetes. Patiente un moment.";
        return Promise.reject(new Error(msg));
      }

      if (status === 400 && data?.errors) {
        const messages = data.errors.map(e => e.message).join(', ');
        return Promise.reject(new Error(messages));
      }

      if (status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return Promise.reject(new Error(data?.message || "Session expiree. Reconnecte-toi."));
      }

      return Promise.reject(new Error(data?.message || "Erreur serveur"));
    }
    return Promise.reject(new Error("Erreur reseau. Verifie ta connexion."));
  }
);

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

export async function getEvents({ page = 1, limit = 12 } = {}) {
  const { data } = await api.get(`/api/events?page=${page}&limit=${limit}`);
  if (data.pagination) {
    return data;
  }
  const events = Array.isArray(data) ? data : (data.events || []);
  return { data: events, pagination: { page: 1, limit: events.length, total: events.length, totalPages: 1 } };
}

export async function getEvent(id) {
  const { data } = await api.get(`/api/events/${id}`);
  return data.event || data;
}

export async function uploadImage(file) {
  const form = new FormData();
  form.append("image", file);
  const { data } = await api.post("/api/upload", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.url;
}

export async function createEvent(payload) {
  const { data } = await api.post("/api/events", payload);
  return data.event || data;
}

export async function deleteEvent(id) {
  const { data } = await api.delete(`/api/events/${id}`);
  return data;
}

export async function reserveEvent({ event_id, nom, prenom, email }) {
  const { data } = await api.post("/api/reservations", { event_id, nom, prenom, email });
  return data;
}

export async function getReservations() {
  const { data } = await api.get("/api/reservations");
  return Array.isArray(data) ? data : (data.reservations || []);
}

export async function cancelReservation(id) {
  const { data } = await api.patch(`/api/reservations/${id}/cancel`);
  return data;
}

export async function deleteReservation(id) {
  const { data } = await api.delete(`/api/reservations/${id}`);
  return data;
}
