const TOKEN_KEY = "httt_token";
const ROLE_KEY = "httt_role";

export const setAuth = (token, role) => {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(ROLE_KEY, role);
};

export const clearAuth = () => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
};

export const getToken = () => sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
export const getRole = () => sessionStorage.getItem(ROLE_KEY) || localStorage.getItem(ROLE_KEY);