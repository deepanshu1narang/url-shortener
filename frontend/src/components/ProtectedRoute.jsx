import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

export default function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();

  // null = AuthProvider's /me check hasn't resolved yet — show a loading state
  // instead of guessing, now that a cheap dedicated check exists.
  if (isAuthenticated === null) {
    return <p>Loading...</p>;
  }

  if (isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
