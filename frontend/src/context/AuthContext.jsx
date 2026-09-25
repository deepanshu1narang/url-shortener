import { createContext, useContext, useState } from "react";
import { signout as signoutRequest } from "../api/api";

const AuthContext = createContext(null);

const STORAGE_KEY = "token";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));

  function login(newToken) {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  }

  async function logout() {
    if (token) {
      try {
        // Tell the backend to blocklist this token so it stops working immediately,
        // not just once it naturally expires. Clear local state either way, so the
        // user isn't stuck logged in on this device if the request fails.
        await signoutRequest(token);
      } catch (err) {
        console.error("Sign out request failed:", err);
      }
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: Boolean(token), login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
