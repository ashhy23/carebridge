/**
 * Auth state and actions for CareBridge.
 * Keeps user and accessToken in React state; refresh token lives in an httpOnly cookie.
 */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import api, { setAccessToken, setOnAccessTokenChange } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Keep the Axios client in sync with React state
  const syncToken = useCallback((token) => {
    setAccessTokenState(token);
    setAccessToken(token);
  }, []);

  useEffect(() => {
    setOnAccessTokenChange((token) => {
      setAccessTokenState(token);
      if (!token) setUser(null);
    });
    return () => setOnAccessTokenChange(null);
  }, []);

  // Restore session on mount using the httpOnly refresh cookie
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      try {
        const { data } = await api.post('/auth/refresh');
        if (cancelled) return;

        syncToken(data.accessToken);

        const { data: me } = await api.get('/auth/me');
        if (cancelled) return;

        setUser(me);
      } catch {
        if (!cancelled) {
          syncToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, [syncToken]);

  const login = useCallback(
    async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      syncToken(data.accessToken);
      setUser(data.user);
      return data.user;
    },
    [syncToken]
  );

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      syncToken(null);
      setUser(null);
    }
  }, [syncToken]);

  const value = useMemo(
    () => ({ user, accessToken, login, logout, isLoading }),
    [user, accessToken, login, logout, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Context is internal; components use useAuth from ./useAuth.js
export { AuthContext };
