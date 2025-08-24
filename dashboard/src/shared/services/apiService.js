// Lightweight ApiService adapted from consumer frontend
const API_BASE =
  import.meta.env.VITE_API_BASE_URL || window.location.origin + "/api";
const REQUEST_TIMEOUT = 30_000;

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    method: options.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  };

  // Body handling: if FormData, let fetch set content-type
  if (config.body && ["POST", "PUT", "PATCH"].includes(config.method)) {
    if (config.body instanceof FormData) {
      if (config.headers && config.headers["Content-Type"])
        delete config.headers["Content-Type"];
    } else {
      config.body = JSON.stringify(config.body);
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  config.signal = controller.signal;

  try {
    const res = await fetch(url, config);
    clearTimeout(timeoutId);

    const contentType = res.headers.get("content-type") || "";
    let data;
    if (contentType.includes("application/json")) data = await res.json();
    else data = await res.text();

    if (!res.ok) {
      const message =
        data?.message || data?.error || `HTTP ${res.status}: ${res.statusText}`;
      throw new ApiError(message, res.status, data);
    }

    return data;
  } catch (err) {
    if (err.name === "AbortError") throw new ApiError("Request timeout", 503);
    if (err instanceof ApiError) throw err;
    throw new ApiError("Network error", 503, err);
  }
}

export default {
  get: (path, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = qs ? `${path}?${qs}` : path;
    return request(url, { method: "GET" });
  },
  post: (path, body, options = {}) =>
    request(path, { method: "POST", body, ...options }),
  put: (path, body, options = {}) =>
    request(path, { method: "PUT", body, ...options }),
  patch: (path, body, options = {}) =>
    request(path, { method: "PATCH", body, ...options }),
  del: (path, options = {}) => request(path, { method: "DELETE", ...options }),
};
