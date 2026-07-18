const TOKEN_KEY = "httt_token";
const REFRESH_KEY = "httt_refresh";
const ROLE_KEY = "httt_role";

export const setAuth = (token, role, refreshToken) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ROLE_KEY, role);
  if (refreshToken) {
    sessionStorage.setItem(REFRESH_KEY, refreshToken);
  }
  // Dispatch custom event so useAuth re-renders in the same tab
  window.dispatchEvent(new Event("auth-change"));
};

export const clearAuth = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  sessionStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(REFRESH_KEY);
};

export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const getRefreshToken = () => sessionStorage.getItem(REFRESH_KEY);
export const getRole = () => sessionStorage.getItem(ROLE_KEY);

export const updateToken = (newToken) => {
  sessionStorage.setItem(TOKEN_KEY, newToken);
};
