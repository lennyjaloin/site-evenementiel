import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as api from "../services/api";
import { clearSession, readSession, saveSession } from "../services/storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const session = await readSession();

      if (!mounted) {
        return;
      }

      setUser(session.user);
      setToken(session.token);
      setIsReady(true);
    }

    bootstrap();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isReady,
      isAuthed: Boolean(token),
      async login(email, password) {
        const result = await api.login(email, password);
        setUser(result.user || null);
        setToken(result.token || null);
        await saveSession(result.token || null, result.user || null);
        return result;
      },
      async signup(email, password) {
        const result = await api.signup(email, password);
        setUser(result.user || null);
        setToken(result.token || null);
        await saveSession(result.token || null, result.user || null);
        return result;
      },
      async logout() {
        setUser(null);
        setToken(null);
        await clearSession();
      },
    }),
    [isReady, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
