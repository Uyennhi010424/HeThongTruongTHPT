import axiosClient from "./axiosClient";

export const getDiem = (params = {}) => axiosClient.get("/diem", { params, skipCache: true });
export const getDiemSummary = (params = {}) => axiosClient.get("/diem/summary", { params, skipCache: true, timeout: 30000 });
export const getDiemAvgByGrade = (params = {}) => axiosClient.get("/diem/avg-by-grade", { params, skipCache: true });
export const getDiemDistribution = (params = {}) => axiosClient.get("/diem/distribution", { params, skipCache: true, timeout: 300000 });
export const createDiem = (data) => axiosClient.post("/diem", data);
export const updateDiem = (id, data) => axiosClient.put(`/diem/${id}`, data);
export const deleteDiem = (id) => axiosClient.delete(`/diem/${id}`);
export const deleteDiemBulk = (params) => axiosClient.delete("/diem/bulk", { params });
export const saveAllDiem = (diemList) => axiosClient.post("/diem/batch", diemList);