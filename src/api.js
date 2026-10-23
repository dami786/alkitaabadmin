const TOKEN_KEY = "alkitab_admin_token";
const USER_KEY = "alkitab_admin_username";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUsername() {
  return localStorage.getItem(USER_KEY) || "admin";
}

export function saveSession(token, username) {
  localStorage.setItem(TOKEN_KEY, token);
  if (username) localStorage.setItem(USER_KEY, username);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function authHeader() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function request(url, options = {}) {
  const response = await fetch(url, options);
  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const error = new Error(data?.error || "Something went wrong. Please try again.");
    error.status = response.status;
    throw error;
  }
  return data;
}

export async function adminRequest(url, options = {}) {
  const headers = { ...authHeader(), ...(options.headers || {}) };
  try {
    return await request(url, { ...options, headers });
  } catch (error) {
    if (error.status === 401) {
      clearSession();
      error.unauthorized = true;
    }
    throw error;
  }
}

export async function downloadExport() {
  const response = await fetch("/api/admin/export", { headers: authHeader() });
  if (!response.ok) {
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : null;
    const error = new Error(data?.error || "Could not download the Excel file.");
    error.status = response.status;
    if (error.status === 401) {
      clearSession();
      error.unauthorized = true;
    }
    throw error;
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "alkitab-registrations.xlsx";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
