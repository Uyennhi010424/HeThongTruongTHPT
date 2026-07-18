import axios from "axios";
import { getToken, getRefreshToken, updateToken, clearAuth } from "../store/authStore";

const GET_CACHE_TTL_MS = 60 * 1000; // 60s (tăng từ 30s)

/**
 * Recursively normalize all strings in an object/array to NFC form.
 * Fixes Vietnamese characters stored in NFD (decomposed) form in the database.
 */
const normalizeNFC = (value) => {
  if (typeof value === "string") return value.normalize("NFC");
  if (Array.isArray(value)) return value.map(normalizeNFC);
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const result = {};
    for (const key of Object.keys(value)) {
      result[key] = normalizeNFC(value[key]);
    }
    return result;
  }
  return value;
};

const responseCache = new Map();
const inFlightGets = new Map();

const serializeParams = (params) => {
  if (!params || typeof params !== "object") return "";
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([a], [b]) => a.localeCompare(b));

  return entries
    .map(([key, value]) => {
      if (Array.isArray(value)) {
        return `${encodeURIComponent(key)}=${value
          .map((item) => encodeURIComponent(String(item)))
          .join(",")}`;
      }
      if (typeof value === "object") {
        return `${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`;
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
    })
    .join("&");
};

const buildCacheKey = (url, config = {}) => {
  const token = getToken() || "";
  const tokenTail = token.slice(-16);
  const params = serializeParams(config?.params);
  return `${url || ""}::${params}::${tokenTail}`;
};

const MAX_CACHE_SIZE = 100;

const cloneCachedResponse = (cached, config) => ({
  data: JSON.parse(JSON.stringify(cached.data)),
  status: cached.status,
  statusText: cached.statusText,
  headers: cached.headers,
  config,
  request: { fromCache: true }
});

/**
 * Xóa cache theo URL pattern thay vì nuclear clear.
 * Ví dụ: invalidateCache("/hocsinh") sẽ xóa mọi cache chứa "/hocsinh" trong key.
 */
const invalidateCache = (urlPattern) => {
  if (!urlPattern) {
    responseCache.clear();
    inFlightGets.clear();
    return;
  }
  const basePath = urlPattern.split("?")[0]; // bỏ query params
  for (const key of responseCache.keys()) {
    // Match exact path segment: "/hocsinh" matches "/hocsinh/123" but not "/hocsinhApi"
    if (key.startsWith(basePath + "/") || key.startsWith(basePath + "?") || key.startsWith(basePath + "::")) {
      responseCache.delete(key);
    }
  }
  for (const key of inFlightGets.keys()) {
    if (key.startsWith(basePath + "/") || key.startsWith(basePath + "?") || key.startsWith(basePath + "::")) {
      inFlightGets.delete(key);
    }
  }
};

const axiosClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  headers: { "Content-Type": "application/json" },
  timeout: 10000 // 10s (giảm từ 30s)
});

// Normalize Vietnamese text (NFD → NFC) in all API responses
// Skip for blob responses (file downloads)
axiosClient.interceptors.response.use((response) => {
  if (response.config?.responseType === "blob") return response;
  if (response.data && typeof response.data === "object") {
    response.data = normalizeNFC(response.data);
  }
  return response;
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Increase timeout for file uploads
  if (config.data instanceof FormData) {
    config.timeout = 60000; // 60s for uploads
  }
  return config;
});

let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token) => {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  refreshQueue = [];
};

axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 403 Forbidden: token invalid hoặc không có quyền → clear auth, redirect login
    if (error?.response?.status === 403) {
      clearAuth();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }

    if (error?.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axiosClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshTokenValue = getRefreshToken();
      if (!refreshTokenValue) {
        clearAuth();
        isRefreshing = false;
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
        return Promise.reject(error);
      }

      try {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";
        const res = await axios.post(`${baseURL}/auth/refresh`, { refreshToken: refreshTokenValue });
        const data = res?.data?.data;
        if (data?.token) {
          updateToken(data.token);
          if (data.refreshToken) {
            sessionStorage.setItem("httt_refresh", data.refreshToken);
          }
          processQueue(null, data.token);
          originalRequest.headers.Authorization = `Bearer ${data.token}`;
          return axiosClient(originalRequest);
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearAuth();
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.href = "/login";
        }
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

const originalGet = axiosClient.get.bind(axiosClient);
const originalPost = axiosClient.post.bind(axiosClient);
const originalPut = axiosClient.put.bind(axiosClient);
const originalPatch = axiosClient.patch.bind(axiosClient);
const originalDelete = axiosClient.delete.bind(axiosClient);

axiosClient.get = (url, config = {}) => {
  if (config?.skipCache || config?.responseType === "blob") {
    return originalGet(url, config);
  }

  const cacheKey = buildCacheKey(url, config);
  const now = Date.now();
  const cached = responseCache.get(cacheKey);

  if (cached && now - cached.timestamp < GET_CACHE_TTL_MS) {
    return Promise.resolve(cloneCachedResponse(cached.response, config));
  }

  if (inFlightGets.has(cacheKey)) {
    return inFlightGets.get(cacheKey);
  }

  const requestPromise = originalGet(url, config)
    .then((response) => {
      // NFC đã được normalize trong response interceptor, không cần normalize lần 2
      // Evict oldest entries if cache exceeds max size
      if (responseCache.size >= MAX_CACHE_SIZE) {
        const oldestKey = responseCache.keys().next().value;
        responseCache.delete(oldestKey);
      }
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        response: {
          data: response.data,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        }
      });
      return response;
    })
    .finally(() => {
      inFlightGets.delete(cacheKey);
    });

  inFlightGets.set(cacheKey, requestPromise);
  return requestPromise;
};

// Targeted invalidation: chỉ xóa cache liên quan đến URL bị mutate
axiosClient.post = (url, ...rest) => {
  invalidateCache(url);
  return originalPost(url, ...rest);
};

axiosClient.put = (url, ...rest) => {
  invalidateCache(url);
  return originalPut(url, ...rest);
};

axiosClient.patch = (url, ...rest) => {
  invalidateCache(url);
  return originalPatch(url, ...rest);
};

axiosClient.delete = (url, ...rest) => {
  invalidateCache(url);
  return originalDelete(url, ...rest);
};

axiosClient.invalidateCache = invalidateCache;

export default axiosClient;
