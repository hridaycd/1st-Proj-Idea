import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login as apiLogin, register as apiRegister, getMe } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem('auth_token');
        if (saved) {
          setToken(saved);
          try {
            const me = await getMe();
            setUser(me);
          } catch {
            await AsyncStorage.removeItem('auth_token');
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const signIn = useCallback(async (email, password) => {
    const data = await apiLogin(email, password);
    const newToken = data?.access_token;
    if (newToken) {
      await AsyncStorage.setItem('auth_token', newToken);
      setToken(newToken);
      setUser(data?.user || null);
    }
    return data;
  }, []);

  const signUp = useCallback(async ({ name, email, phone, password, user_type = 'CUSTOMER' }) => {
    const created = await apiRegister({ name, email, phone, password, user_type });
    return created;
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem('auth_token');
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ token, user, isBootstrapping, signIn, signUp, signOut }), [token, user, isBootstrapping, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

