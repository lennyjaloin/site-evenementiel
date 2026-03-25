import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("token"));

  useEffect(() => {
    if (token) localStorage.setItem("token", token);
    else localStorage.removeItem("token");
  }, [token]);

  useEffect(() => {
    if (user) localStorage.setItem("user", JSON.stringify(user));
    else localStorage.removeItem("user");
  }, [user]);

  const value = useMemo(() => ({
    user,
    token,
    isAuthed: !!token,
    async login(email, password) {
      const res = await api.login(email, password);
      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user);
      return res;
    },
    async signup(email, password) {
      const res = await api.signup(email, password);
      if (res.token) setToken(res.token);
      if (res.user) setUser(res.user);
      return res;
    },
    logout() {
      setToken(null);
      setUser(null);
      api.logout();
    }
  }), [user, token]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
