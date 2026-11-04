const TOKEN_KEY = "listra_auth_token";
const USER_KEY = "listra_auth_user";

async function request(url, options = {}) {
  const token = getStoredToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 204) return null;

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.message ?? "Terjadi kesalahan. Coba lagi.");
  }
  return body;
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuthSession(token, user) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated() {
  return Boolean(getStoredToken());
}

export async function loginApi(email, password) {
  const res = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  if (res?.token && res?.user) {
    setAuthSession(res.token, res.user);
  }
  return res;
}

export async function getMeApi() {
  return request("/api/auth/me");
}

export async function logoutApi() {
  try {
    await request("/api/auth/logout", { method: "POST" });
  } finally {
    clearAuthSession();
  }
}