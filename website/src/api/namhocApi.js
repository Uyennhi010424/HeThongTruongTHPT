import axiosClient from "./axiosClient";

export const getNamHoc = () => axiosClient.get("/namhoc", { skipCache: true });
export const createNamHoc = (data) => axiosClient.post("/namhoc", data);
export const updateNamHoc = (id, data) => axiosClient.put(`/namhoc/${id}`, data);
export const deleteNamHoc = (id) => axiosClient.delete(`/namhoc/${id}`);
