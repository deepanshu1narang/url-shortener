import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/useAuth";

export default function Unauthorized() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="auth-page">
      <div className="auth-form">
        <h1>Not authorized</h1>
        <p>Your account doesn't have permission to do that.</p>
        <p>
          <Link to="/home">Back to the shortener</Link>
        </p>
        <button type="button" className="logout" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </div>
  );
}
