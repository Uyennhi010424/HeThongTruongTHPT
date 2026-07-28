import axiosClient from "./axiosClient";

export const getUsers = (params = {}) => axiosClient.get("/users", { params, skipCache: true });
export const getUser = (id) => axiosClient.get(`/users/${id}`);
export const createUser = (data) => axiosClient.post("/users", data);
export const updateUser = (id, data) => axiosClient.put(`/users/${id}`, data);
export const deleteUser = (id) => axiosClient.delete(`/users/${id}`);
export const resetPassword = (id) => axiosClient.post(`/users/${id}/reset-password`);
export const changePassword = (id, oldPassword, newPassword) =>
	axiosClient.post(`/users/${id}/change-password`, { oldPassword, newPassword });
export const changePasswordMe = (oldPassword, newPassword) =>
	axiosClient.post(`/users/me/change-password`, { oldPassword, newPassword });

export const updateUserPermissions = (id, permissions) => axiosClient.put(`/users/${id}/permissions`, permissions);
export const lockUserAccount = (id, lockedUntil) => axiosClient.put(`/users/${id}/lock`, { lockedUntil });
export const getUserAuditLogs = (id) => axiosClient.get(`/users/${id}/logs`, { skipCache: true });