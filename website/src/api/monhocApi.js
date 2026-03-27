import axiosClient from "./axiosClient";

export const getMonHoc = () => axiosClient.get("/monhoc");
export const createMonHoc = (data) => axiosClient.post("/monhoc", data);
export const updateMonHoc = (id, data) => axiosClient.put(`/monhoc/${id}`, data);
export const deleteMonHoc = (id) => axiosClient.delete(`/monhoc/${id}`);