import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createShortUrl,
  deleteUrl,
  fetchAllUrls,
  fetchAnalytics,
  fetchMyUrls,
} from "../api/api";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";
import Modal from "../components/Modal";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export default function Shortener() {
  const { logout, markSignedOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("mine"); // "mine" | "all"
  const [urls, setUrls] = useState([]);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [deletingShortId, setDeletingShortId] = useState(null);
  const isFirstLoad = useRef(true);

  const [selectedShortId, setSelectedShortId] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsError, setAnalyticsError] = useState("");
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    // no need to reset loggingOut — ProtectedRoute redirects away once isAuthenticated clears
  }

  // A httpOnly cookie can't be checked from JS up front, so this fetch doubles as the
  // "is there actually a valid session" check on first load (see ProtectedRoute).
  function handleAuthFailure() {
    markSignedOut();
    navigate("/login", { replace: true });
  }

  // Only the page's very first load (does this account have any business here at all)
  // takes over the whole screen. Every action after that — generate, details, delete,
  // switching tabs — is a feature on an already-usable page, so a 403 there is just a
  // toast, not a full navigation away.
  function handleInitialLoadError(err) {
    if (err.status === 401) return handleAuthFailure();
    if (err.status === 403) return navigate("/unauthorized");
    setError(err.message);
  }

  function handleActionError(err, setLocalError) {
    if (err.status === 401) return handleAuthFailure();
    if (err.status === 403) return showToast("You're not authorised to do that.");
    setLocalError(err.message);
  }

  function fetchForMode(mode) {
    return mode === "all" ? fetchAllUrls() : fetchMyUrls();
  }

  async function loadUrls() {
    try {
      const data = await fetchForMode(viewMode);
      setUrls(data.data);
    } catch (err) {
      handleActionError(err, setError);
    }
  }

  useEffect(() => {
    let ignore = false;

    async function load() {
      // Captured per-call, and isFirstLoad only actually flips once a non-ignored
      // result lands — otherwise React StrictMode's dev-only double-invoke (mount,
      // cleanup, mount) would consume the "first load" flag on its throwaway pass,
      // and the real load would be misclassified as an action-level fetch.
      const wasFirstLoad = isFirstLoad.current;
      try {
        const data = await fetchForMode(viewMode);
        if (!ignore) {
          isFirstLoad.current = false;
          setUrls(data.data);
        }
      } catch (err) {
        if (ignore) return;
        isFirstLoad.current = false;
        if (wasFirstLoad) {
          handleInitialLoadError(err);
        } else {
          handleActionError(err, setError);
        }
      }
    }

    load();

    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await createShortUrl(url);
      setUrl("");
      await loadUrls();
    } catch (err) {
      handleActionError(err, setError);
    } finally {
      setLoading(false);
    }
  }

  async function handleShowDetails(shortId) {
    setSelectedShortId(shortId);
    setAnalytics(null);
    setAnalyticsError("");
    setAnalyticsLoading(true);
    try {
      const data = await fetchAnalytics(shortId);
      setAnalytics(data);
    } catch (err) {
      handleActionError(err, setAnalyticsError);
    } finally {
      setAnalyticsLoading(false);
    }
  }

  function closeDetails() {
    setSelectedShortId(null);
  }

  async function handleDelete(shortId) {
    setError("");
    setDeletingShortId(shortId);
    try {
      await deleteUrl(shortId);
      await loadUrls();
    } catch (err) {
      handleActionError(err, setError);
    } finally {
      setDeletingShortId(null);
    }
  }

  return (
    <div className="shortener-page">
      <header>
        <h1>URL shortener</h1>
        <div className="header-actions">
          <Link to="/users_and_access">Users &amp; Access</Link>
          <button type="button" className="logout" onClick={handleLogout} disabled={loggingOut}>
            {loggingOut ? "Logging out..." : "Log out"}
          </button>
        </div>
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

      <div className="view-toggle">
        <button
          type="button"
          className={viewMode === "mine" ? "active" : ""}
          onClick={() => setViewMode("mine")}
        >
          My URLs
        </button>
        <button
          type="button"
          className={viewMode === "all" ? "active" : ""}
          onClick={() => setViewMode("all")}
        >
          All URLs
        </button>
      </div>

      <h2>{viewMode === "all" ? "All URLs" : "Generated URLs"}</h2>
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
              <th></th>
              <th></th>
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
                  <td>
                    <button type="button" onClick={() => handleShowDetails(entry.shortId)}>
                      Details
                    </button>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="danger"
                      onClick={() => handleDelete(entry.shortId)}
                      disabled={deletingShortId === entry.shortId}
                    >
                      {deletingShortId === entry.shortId ? "Deleting..." : "Delete"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {selectedShortId && (
        <Modal onClose={closeDetails}>
          <h2>Details for {selectedShortId}</h2>
          {analyticsLoading && <p>Loading...</p>}
          {analyticsError && <p className="error">{analyticsError}</p>}
          {analytics && (
            <>
              <p>Total clicks: {analytics.totalClicks}</p>
              {analytics.analytics.length === 0 ? (
                <p>No visits yet.</p>
              ) : (
                <ul>
                  {analytics.analytics.map((visit, index) => (
                    <li key={index}>{new Date(visit.timestamp).toLocaleString()}</li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Modal>
      )}
    </div>
  );
}
