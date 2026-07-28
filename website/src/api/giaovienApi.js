import axiosClient from "./axiosClient";

export const getGiaoVien = () => axiosClient.get("/giaovien", { skipCache: true });
export const getPublicTeachers = () => axiosClient.get("/giaovien/public", { skipCache: true });
export const getCurrentGiaoVien = () => axiosClient.get("/giaovien/me", { skipCache: true });
export const createGiaoVien = (data) => axiosClient.post("/giaovien", data);
export const updateGiaoVien = (id, data) => axiosClient.put(`/giaovien/${id}`, data);
export const deleteGiaoVien = (id) => axiosClient.delete(`/giaovien/${id}`);