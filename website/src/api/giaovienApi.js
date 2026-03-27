import axiosClient from "./axiosClient";

export const getGiaoVien = () => axiosClient.get("/giaovien");
export const createGiaoVien = (data) => axiosClient.post("/giaovien", data);
export const updateGiaoVien = (id, data) => axiosClient.put(`/giaovien/${id}`, data);
export const deleteGiaoVien = (id) => axiosClient.delete(`/giaovien/${id}`);