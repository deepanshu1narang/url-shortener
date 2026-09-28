import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { deleteUser, fetchAllUsersExceptMe, updateUserRoles } from "../api/api";
import { useAuth } from "../context/useAuth";
import { useToast } from "../context/useToast";

const MANAGEABLE_ROLES = ["user", "premium_user", "analyst", "admin"];

export default function UsersAndAccess() {
  const { markSignedOut } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [userId, setUserId] = useState("");
  const [roles, setRoles] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function handleRequestError(err) {
    if (err.status === 401) {
      markSignedOut();
      return navigate("/login", { replace: true });
    }
    if (err.status === 403) {
      return showToast("You're not authorised to do that.");
    }
    setError(err.message);
  }

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const data = await fetchAllUsersExceptMe();
      setUsers(data.data);
    } catch (err) {
      handleRequestError(err);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    let ignore = false;
    fetchAllUsersExceptMe()
      .then((data) => {
        if (!ignore) setUsers(data.data);
      })
      .catch((err) => {
        if (!ignore) handleRequestError(err);
      })
      .finally(() => {
        if (!ignore) setUsersLoading(false);
      });
    return () => {
      ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSelectUser(id) {
    setUserId(id);
    const selected = users.find((u) => u._id === id);
    setRoles(selected ? selected.roles : []);
  }

  function toggleRole(role) {
    setRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  }

  async function handleUpdateRoles(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!userId) {
      setError("Pick a user.");
      return;
    }
    setUpdating(true);
    try {
      const data = await updateUserRoles(userId, roles);
      setMessage(`Roles updated: ${data.roles.join(", ") || "(none)"}`);
      await loadUsers();
    } catch (err) {
      handleRequestError(err);
    } finally {
      setUpdating(false);
    }
  }

  async function handleDeleteUser() {
    setError("");
    setMessage("");
    if (!userId) {
      setError("Pick a user.");
      return;
    }
    setDeleting(true);
    try {
      await deleteUser(userId);
      setMessage("User deleted.");
      setUserId("");
      setRoles([]);
      await loadUsers();
    } catch (err) {
      handleRequestError(err);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="shortener-page">
      <header>
        <h1>Users &amp; Access</h1>
        <div className="header-actions">
          <Link to="/home">Back to shortener</Link>
        </div>
      </header>

      <form className="url-form" onSubmit={handleUpdateRoles}>
        <select value={userId} onChange={(e) => handleSelectUser(e.target.value)}>
          <option value="">
            {usersLoading ? "Loading users..." : "Select a user"}
          </option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>
              {u.name} ({u.email})
            </option>
          ))}
        </select>
      </form>

      {userId && <fieldset className="role-fieldset">
        <legend>Roles to set</legend>
        {MANAGEABLE_ROLES.map((role) => (
          <label key={role} className="role-checkbox">
            <input
              type="checkbox"
              checked={roles.includes(role)}
              onChange={() => toggleRole(role)}
            />
            {role}
          </label>
        ))}
      </fieldset>}

      <div className="view-toggle">
        <button type="button" onClick={handleUpdateRoles} disabled={updating}>
          {updating ? "Updating..." : "Update roles"}
        </button>
        <button type="button" className="danger" onClick={handleDeleteUser} disabled={deleting}>
          {deleting ? "Deleting..." : "Delete user"}
        </button>
      </div>

      {message && <p>{message}</p>}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
