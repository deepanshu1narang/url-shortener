const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = "GET", body } = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    credentials: "include", // send/receive the httpOnly cookie cross-origin
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return data;
}

export function signup({ name, email, password, roles }) {
  return request("/sign_up", { method: "POST", body: { name, email, password, roles } });
}

export function signin({ email, password }) {
  return request("/sign_in", { method: "POST", body: { email, password } });
}

export function fetchMyUrls() {
  return request("/url/my_urls");
}

export function fetchAllUrls() {
  return request("/url/all_urls");
}

export function createShortUrl(url) {
  return request("/url", { method: "POST", body: { url } });
}

export function signout() {
  return request("/sign_out", { method: "POST" });
}

export function fetchMe() {
  return request("/me");
}

export function fetchAnalytics(shortId) {
  return request(`/url/analytics/${shortId}`);
}

export function deleteUrl(shortId) {
  return request(`/url/delete/${shortId}`, { method: "DELETE" });
}

export function updateUserRoles(id, roles) {
  return request(`/update/${id}`, { method: "PATCH", body: { roles } });
}

export function deleteUser(id) {
  return request(`/delete/${id}`, { method: "DELETE" });
}

export function fetchAllUsersExceptMe() {
  return request("/all_users");
}
