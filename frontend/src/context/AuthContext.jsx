import { useEffect, useState } from "react";
import { fetchMe, signout as signoutRequest } from "../api/api";
import { AuthContext } from "./authContextObject";

export function AuthProvider({ children }) {
  // Three states, not two: null = "checking" (httpOnly cookie can't be read by JS, so
  // on first load we genuinely don't know if a valid session exists until we ask the
  // server), true = known logged in, false = known logged out.
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    // One cheap call on app load resolves the unknown — this is /me's whole job,
    // decoupled from whatever the actual pages need to fetch.
    fetchMe()
      .then(() => setIsAuthenticated(true))
      .catch(() => setIsAuthenticated(false));
  }, []);

  function login() {
    setIsAuthenticated(true);
  }

  // Call this when a protected request comes back 401 mid-session (cookie expired,
  // or was revoked) — no API call, just stops treating the user as logged in.
  function markSignedOut() {
    setIsAuthenticated(false);
  }

  async function logout() {
    try {
      await signoutRequest();
    } catch (err) {
      console.error("Sign out request failed:", err);
    }
    // Clear local state either way, so the user isn't stuck looking logged in on
    // this device even if the request itself failed.
    setIsAuthenticated(false);
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, markSignedOut }}>
      {children}
    </AuthContext.Provider>
  );
}
