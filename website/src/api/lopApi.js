import axiosClient from "./axiosClient";

export const getLop = () => axiosClient.get("/lophoc", { skipCache: true });
export const getLopById = (id) => axiosClient.get(`/lophoc/${id}`);
export const createLop = (data) => axiosClient.post("/lophoc", data);
export const createLopBulk = (data) => axiosClient.post("/lophoc/bulk", data);
export const updateLop = (id, data) => axiosClient.put(`/lophoc/${id}`, data);
export const deleteLop = (id) => axiosClient.delete(`/lophoc/${id}`);
export const promoteStudents = (data) => axiosClient.post("/lophoc/promote", data, { timeout: 120000 });
export const syncSiSo = () => axiosClient.post("/lophoc/sync-siso", {}, { timeout: 60000 });
export const assignGvcn = (id, data) => axiosClient.put(`/lophoc/${id}/gvcn`, data);