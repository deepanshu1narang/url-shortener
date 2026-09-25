import { useEffect, useState } from "react";
import { createShortUrl, fetchMyUrls } from "../api/api";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Shortener() {
  const { token, logout } = useAuth();
  const [urls, setUrls] = useState([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    // no need to reset loggingOut — ProtectedRoute redirects away once token clears
  }

  async function loadUrls() {
    try {
      const data = await fetchMyUrls(token);
      setUrls(data.data);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadUrls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createShortUrl(url, token);
      setUrl("");
      await loadUrls();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shortener-page">
      <header>
        <h1>URL shortener</h1>
        <button type="button" className="logout" onClick={handleLogout} disabled={loggingOut}>
          {loggingOut ? "Logging out..." : "Log out"}
        </button>
      </header>

      <form className="url-form" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="www.example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Generated URLs</h2>
      {urls.length === 0 ? (
        <p>No URLs generated yet.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>S. No.</th>
              <th>shortId</th>
              <th>redirects</th>
              <th>Number of clicks</th>
            </tr>
          </thead>
          <tbody>
            {urls.map((entry, index) => {
              const fullUrl = `${API_BASE_URL}/url/${entry.shortId}`;
              return (
                <tr key={entry._id}>
                  <td>{index + 1}</td>
                  <td>{entry.shortId}</td>
                  <td>
                    <a href={fullUrl} target="_blank" rel="noreferrer">
                      {fullUrl}
                    </a>
                  </td>
                  <td>{entry.visitHistory.length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
