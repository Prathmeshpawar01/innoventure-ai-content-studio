import React, { createContext, useContext, useState } from 'react';
import api, { tokenStore } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [authed, setAuthed] = useState(Boolean(tokenStore.get()));

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    tokenStore.set(data.token);
    setAuthed(true);
  }
  function logout() {
    tokenStore.clear();
    setAuthed(false);
  }
  return <AuthContext.Provider value={{ authed, login, logout }}>{children}</AuthContext.Provider>;
}
