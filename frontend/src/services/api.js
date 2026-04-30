const API_BASE_URL = "https://localbite-rogb.onrender.com";
const AUTH_TOKEN_KEY = "localbite_auth_token";
const AUTH_USER_KEY = "localbite_auth_user";

export function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  notifyAuthChanged();
}

export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  notifyAuthChanged();
}

export function getStoredUser() {
  const userJson = localStorage.getItem(AUTH_USER_KEY);
  if (!userJson) {
    return null;
  }

  try {
    return JSON.parse(userJson);
  } catch {
    clearAuthToken();
    return null;
  }
}

export function setStoredUser(user) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  notifyAuthChanged();
}

export function getCurrentAuth() {
  return {
    token: getAuthToken(),
    user: getStoredUser(),
  };
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("Cannot reach the LocalBite backend. Make sure FastAPI is running on http://localhost:8000.");
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(formatApiError(errorBody?.detail));
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function getHealth() {
  return apiRequest("/health");
}

export async function getRestaurants() {
  return apiRequest("/restaurants");
}

export async function getRestaurant(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}`);
}

export async function getRestaurantMenuItems(restaurantId) {
  return apiRequest(`/restaurants/${restaurantId}/menu-items`);
}

export async function getMenuItem(menuItemId) {
  return apiRequest(`/menu-items/${menuItemId}`);
}

export async function getMenuItemSubmissions(menuItemId) {
  return apiRequest(`/menu-items/${menuItemId}/submissions`);
}

export async function getMenuItemBestEstimate(menuItemId) {
  return apiRequest(`/menu-items/${menuItemId}/best-estimate`);
}

export async function createSubmission(menuItemId, payload) {
  return apiRequest(`/menu-items/${menuItemId}/submissions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function voteOnSubmission(submissionId, voteType) {
  return apiRequest(`/submissions/${submissionId}/vote`, {
    method: "POST",
    body: JSON.stringify({ vote_type: voteType }),
  });
}

export async function reportSubmission(submissionId, reason) {
  return apiRequest(`/submissions/${submissionId}/report`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getPendingReports() {
  return apiRequest("/admin/reports");
}

export async function getReport(reportId) {
  return apiRequest(`/admin/reports/${reportId}`);
}

export async function updateReportStatus(reportId, status) {
  return apiRequest(`/admin/reports/${reportId}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteReportedSubmission(submissionId) {
  return apiRequest(`/admin/submissions/${submissionId}`, {
    method: "DELETE",
  });
}

export async function registerUser(payload) {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveAuthResponse(data);
  return data;
}

export async function loginUser(payload) {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  saveAuthResponse(data);
  return data;
}

export async function getCurrentUser() {
  const user = await apiRequest("/auth/me");
  setStoredUser(user);
  return user;
}

export async function getCurrentUserSubmissions() {
  return apiRequest("/auth/me/submissions");
}

function saveAuthResponse(data) {
  if (data?.access_token) {
    setAuthToken(data.access_token);
  }

  if (data?.user) {
    setStoredUser(data.user);
  }
}

function notifyAuthChanged() {
  window.dispatchEvent(new Event("localbite-auth-changed"));
}

function formatApiError(detail) {
  if (typeof detail === "string") {
    return detail;
  }

  if (Array.isArray(detail)) {
    return detail
      .map((item) => item?.msg || "Please check the form and try again.")
      .join(" ");
  }

  return "LocalBite API request failed. Please try again.";
}
