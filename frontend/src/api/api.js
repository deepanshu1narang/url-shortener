const BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, { method = "GET", body, token } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `Request failed with ${res.status}`);
  }

  return data;
}

export function signup({ name, email, password }) {
  return request("/sign_up", { method: "POST", body: { name, email, password } });
}

export function signin({ email, password }) {
  return request("/sign_in", { method: "POST", body: { email, password } });
}

export function fetchMyUrls(token) {
  return request("/url/my_urls", { token });
}

export function createShortUrl(url, token) {
  return request("/url", { method: "POST", body: { url }, token });
}

export function signout(token) {
  return request("/sign_out", { method: "POST", token });
}
