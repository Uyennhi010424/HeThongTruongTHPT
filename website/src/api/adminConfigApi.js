import axiosClient from "./axiosClient";

export const getAdminConfigs = () => axiosClient.get("/admin-config");
export const getAdminConfig = (key) => axiosClient.get(`/admin-config/${key}`);
export const upsertAdminConfig = (key, data) => axiosClient.put(`/admin-config/${key}`, data);
export const batchUpsertConfig = (configs) => axiosClient.put("/admin-config", configs);
export const deleteAdminConfig = (key) => axiosClient.delete(`/admin-config/${key}`);
export const testSmsConnection = () => axiosClient.post("/admin-config/test-sms");
