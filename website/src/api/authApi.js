import axiosClient from "./axiosClient";

export const login = (payload) => axiosClient.post("/auth/login", payload);
export const refreshToken = (refreshTokenValue) => axiosClient.post("/auth/refresh", { refreshToken: refreshTokenValue });
export const forgotPassword = (username) => axiosClient.post("/auth/forgot-password", { username });
export const resetPassword = (token, newPassword) => axiosClient.post("/auth/reset-password", { token, newPassword });