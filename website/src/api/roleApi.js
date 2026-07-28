import axiosClient from "./axiosClient";

export const getRoleConfigs = () => axiosClient.get("/roles/configs", { skipCache: true });
export const updateRolePermissions = (role, permissions) => axiosClient.put(`/roles/${role}/permissions`, permissions);
